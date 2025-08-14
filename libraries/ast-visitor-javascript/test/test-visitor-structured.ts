/*
 * Copyright 2020-2025 SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { setupLogger } from "@syntest/logging";

import { AbstractSyntaxTreeVisitor } from "../lib/AbstractSyntaxTreeVisitor";

interface TypePredictionContext {
  identifier: string;
  context: string;
  syntacticContext: string;
  semanticHints: string[];
  usage: string[];
  position: {
    line: number;
    column: number;
  };
  scope: string;
  predictedType?: string; // For training data
}

class TypePredictionVisitor extends AbstractSyntaxTreeVisitor {
  private _contexts: TypePredictionContext[] = [];
  private _scopeStack: string[] = ["global"];

  constructor() {
    super("type-prediction.ts", true);
  }

  private get _currentScope(): string {
    return this._scopeStack.at(-1);
  }

  private _enterScope(scope: string) {
    this._scopeStack.push(scope);
  }

  private _exitScope() {
    if (this._scopeStack.length > 1) {
      this._scopeStack.pop();
    }
  }

  // Use a method name that won't be confused with Babel visitor methods
  public getCollectedContexts(): TypePredictionContext[] {
    return this._contexts;
  }

  private extractContext(path: NodePath): string {
    const parent = path.parent;
    const grandParent = path.parentPath?.parent;

    let context = "";

    // Add immediate context
    if (t.isAssignmentExpression(parent)) {
      context += `assignment-${parent.operator}`;
    } else if (t.isVariableDeclarator(parent)) {
      context += "variable-declaration";
    } else if (t.isClassMethod(parent)) {
      context += `method-${parent.kind}`;
    } else if (t.isMemberExpression(parent)) {
      context += "property-access";
    } else if (t.isCallExpression(parent)) {
      context += "function-call";
    } else if (t.isReturnStatement(parent)) {
      context += "return-value";
    }

    // Add broader context
    if (grandParent) {
      context += `-in-${grandParent.type}`;
    }

    return context || parent?.type || "unknown";
  }

  private extractSemanticHints(path: NodePath<t.Identifier>): string[] {
    const hints: string[] = [];
    const name = path.node.name;

    // Name-based hints
    if (
      name.includes("count") ||
      name.includes("length") ||
      name.includes("size")
    ) {
      hints.push("likely-number");
    }
    if (
      name.includes("name") ||
      name.includes("title") ||
      name.includes("text")
    ) {
      hints.push("likely-string");
    }
    if (name.includes("is") || name.includes("has") || name.includes("can")) {
      hints.push("likely-boolean");
    }
    if (
      name.includes("list") ||
      name.includes("array") ||
      name.includes("items")
    ) {
      hints.push("likely-array");
    }

    // Context-based hints
    const parent = path.parent;
    if (
      t.isNumericLiteral(parent) ||
      (t.isBinaryExpression(parent) &&
        ["+", "-", "*", "/", "%"].includes(parent.operator))
    ) {
      hints.push("numeric-context");
    }
    if (
      t.isStringLiteral(parent) ||
      (t.isBinaryExpression(parent) && parent.operator === "+")
    ) {
      hints.push("string-context");
    }
    if (
      t.isBooleanLiteral(parent) ||
      (t.isUnaryExpression(parent) && parent.operator === "!") ||
      (t.isBinaryExpression(parent) &&
        ["==", "===", "!=", "!==", "<", ">", "<=", ">="].includes(
          parent.operator,
        ))
    ) {
      hints.push("boolean-context");
    }

    return hints;
  }

  private extractUsagePatterns(path: NodePath<t.Identifier>): string[] {
    const usage: string[] = [];
    const binding = path.scope.getBinding(path.node.name);

    if (binding) {
      for (const referencePath of binding.referencePaths) {
        const parent = referencePath.parent;
        if (
          t.isMemberExpression(parent) &&
          parent.object === referencePath.node
        ) {
          const property = parent.property;
          if (t.isIdentifier(property)) {
            usage.push(`property-access:${property.name}`);
          }
        } else if (
          t.isCallExpression(parent) &&
          parent.callee === referencePath.node
        ) {
          usage.push(`function-call:${parent.arguments.length}-args`);
        } else if (
          t.isAssignmentExpression(parent) &&
          parent.left === referencePath.node
        ) {
          usage.push("assignment-target");
        }
      }
    }

    return usage;
  }

  // Babel visitor methods - these must match exact AST node types
  Identifier = (path: NodePath<t.Identifier>) => {
    const builtins = new Set([
      "console",
      "Object",
      "Array",
      "String",
      "Number",
      "Boolean",
      "undefined",
      "null",
    ]);
    const name = path.node.name;

    if (!builtins.has(name) && path.scope.hasBinding(name)) {
      const context: TypePredictionContext = {
        identifier: path.node.name,
        context: this.extractContext(path),
        syntacticContext: `${path.parent?.type || "unknown"}`,
        semanticHints: this.extractSemanticHints(path),
        usage: this.extractUsagePatterns(path),
        position: {
          line: path.node.loc?.start.line || 0,
          column: path.node.loc?.start.column || 0,
        },
        scope: this._currentScope,
      };

      this._contexts.push(context);
    }
  };

  ClassDeclaration = {
    enter: (path: NodePath<t.ClassDeclaration>) => {
      const className = path.node.id?.name || "anonymous";
      this._enterScope(`class:${className}`);
    },
    exit: () => {
      this._exitScope();
    },
  };

  FunctionDeclaration = {
    enter: (path: NodePath<t.FunctionDeclaration>) => {
      const functionName = path.node.id?.name || "anonymous";
      this._enterScope(`function:${functionName}`);
    },
    exit: () => {
      this._exitScope();
    },
  };

  ClassMethod = {
    enter: (path: NodePath<t.ClassMethod>) => {
      const key = path.node.key;
      const methodName = t.isIdentifier(key) ? key.name : "anonymous";
      this._enterScope(`${this._currentScope}.${methodName}`);
    },
    exit: () => {
      this._exitScope();
    },
  };

  ArrowFunctionExpression = {
    enter: () => {
      this._enterScope(`${this._currentScope}.arrow-function`);
    },
    exit: () => {
      this._exitScope();
    },
  };

  FunctionExpression = {
    enter: (path: NodePath<t.FunctionExpression>) => {
      const functionName = path.node.id?.name || "anonymous";
      this._enterScope(`${this._currentScope}.${functionName}`);
    },
    exit: () => {
      this._exitScope();
    },
  };
}

// Example usage
const codeToAnalyze = `
class DataProcessor {
    private itemCount = 0;
    private userName = "default";
    private isActive = true;
    
    constructor(initialCount) {
        this.itemCount = initialCount;
    }
    
    processItems(items) {
        const totalItems = items.length;
        this.itemCount += totalItems;
        return this.itemCount;
    }
    
    getUserName() {
        return this.userName;
    }
    
    setActive(status) {
        this.isActive = status;
    }
}

const processor = new DataProcessor(10);
const result = processor.processItems([1, 2, 3]);
const name = processor.getUserName();
`;

function generateLLMTrainingData() {
  try {
    setupLogger("", [], "silly");

    const ast = parse(codeToAnalyze, {
      sourceType: "module",
      plugins: ["typescript", "classProperties", "decorators-legacy"],
    });

    const visitor = new TypePredictionVisitor();
    traverse(ast, visitor);

    const contexts = visitor.getCollectedContexts();

    // Format for LLM training
    const trainingData = contexts.map((context_) => ({
      prompt: `Given the identifier '${context_.identifier}' in context '${context_.context}' with syntactic context '${context_.syntacticContext}', semantic hints: [${context_.semanticHints.join(", ")}], and usage patterns: [${context_.usage.join(", ")}], what is the most likely TypeScript type?`,
      completion: context_.predictedType || "unknown", // You'd need to annotate this manually or extract from TypeScript
      metadata: {
        scope: context_.scope,
        position: context_.position,
        identifier: context_.identifier,
      },
    }));

    // Output as JSON for LLM consumption
    console.log(JSON.stringify(trainingData, undefined, 2));
    console.log(`\nGenerated ${trainingData.length} training examples`);

    return trainingData;
  } catch (error) {
    console.error("Error generating training data:", error);
    return [];
  }
}

// Alternative: Format for few-shot prompting
// function generateFewShotPrompt(identifier: string, context: TypePredictionContext): string {
//     return `
// Context: ${context.context}
// Identifier: ${identifier}
// Semantic hints: ${context.semanticHints.join(', ')}
// Usage patterns: ${context.usage.join(', ')}
// Scope: ${context.scope}

// Based on the above context, predict the TypeScript type for "${identifier}":
// `;
// }

generateLLMTrainingData();
