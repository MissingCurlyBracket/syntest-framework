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

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { AbstractSyntaxTreeVisitor } from "../../../ast-visitor-javascript/lib/AbstractSyntaxTreeVisitor";
import { prng } from "../../../prng/lib/prng";
import { TypeInferenceApproach } from "../interfaces/TypeInferenceApproach";
import { TypePrediction } from "../interfaces/TypePrediction";

/**
 * Random type inference approach - randomly assigns types to identifiers
 * This serves as a baseline for comparison with other approaches
 */
export class RandomTypeInferenceApproach implements TypeInferenceApproach {
  readonly name = "Random Type Inference";
  readonly description =
    "Randomly assigns types from a predefined set to identifiers";

  private _availableTypes: string[] = [
    "boolean",
    "string",
    "number",
    "object",
    "array",
    "function",
    "null",
    "undefined",
  ];

  private _randomTypeProbability = 1; // Always use random types for this approach

  initialize(config: Record<string, unknown>): Promise<void> {
    if (config["availableTypes"] && Array.isArray(config["availableTypes"])) {
      this._availableTypes = config["availableTypes"] as string[];
    }

    if (typeof config["randomTypeProbability"] === "number") {
      this._randomTypeProbability = config["randomTypeProbability"];
    }

    return Promise.resolve();
  }

  predict(sourceCode: string, filePath?: string): Promise<TypePrediction[]> {
    const visitor = new RandomTypeVisitor(
      this._availableTypes,
      this._randomTypeProbability,
    );

    // Use the visit method from AbstractSyntaxTreeVisitor
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (visitor as any).visit(sourceCode, filePath || "unknown.js");
    } catch (error) {
      console.warn("Error during AST visiting:", error);
    }

    return Promise.resolve(visitor.getPredictions());
  }

  async dispose(): Promise<void> {
    // No cleanup needed for this approach
  }
}

/**
 * Visitor that randomly assigns types to identifiers
 */
class RandomTypeVisitor extends AbstractSyntaxTreeVisitor {
  private _predictions: TypePrediction[] = [];
  private _availableTypes: string[];
  private _randomTypeProbability: number;
  private _scopeStack: string[] = ["global"];

  constructor(availableTypes: string[], randomTypeProbability: number) {
    super("random-type-visitor.js", true);
    this._availableTypes = availableTypes;
    this._randomTypeProbability = randomTypeProbability;
  }

  private get _currentScope(): string {
    return this._scopeStack.at(-1) || "global";
  }

  private _enterScope(scope: string): void {
    this._scopeStack.push(scope);
  }

  private _exitScope(): void {
    if (this._scopeStack.length > 1) {
      this._scopeStack.pop();
    }
  }

  getPredictions(): TypePrediction[] {
    return this._predictions;
  }

  private _getRandomType(): string {
    return prng.pickOne(this._availableTypes);
  }

  private _shouldMakePrediction(): boolean {
    return prng.nextBoolean(this._randomTypeProbability);
  }

  private _extractContext(path: NodePath): string {
    const parent = path.parent;

    if (t.isAssignmentExpression(parent)) {
      return "assignment";
    } else if (t.isVariableDeclarator(parent)) {
      return "variable-declaration";
    } else if (t.isClassMethod(parent)) {
      return "method-parameter";
    } else if (t.isMemberExpression(parent)) {
      return "member-access";
    } else if (t.isCallExpression(parent)) {
      return "function-call";
    } else if (t.isReturnStatement(parent)) {
      return "return-statement";
    }

    return parent?.type || "unknown";
  }

  private _extractSemanticHints(path: NodePath<t.Identifier>): string[] {
    const hints: string[] = [];
    const name = path.node.name;

    // Simple name-based heuristics
    if (
      name.includes("count") ||
      name.includes("length") ||
      name.includes("size") ||
      name.includes("index")
    ) {
      hints.push("likely-number");
    }
    if (
      name.includes("name") ||
      name.includes("title") ||
      name.includes("text") ||
      name.includes("message")
    ) {
      hints.push("likely-string");
    }
    if (
      name.includes("is") ||
      name.includes("has") ||
      name.includes("can") ||
      name.includes("should")
    ) {
      hints.push("likely-boolean");
    }
    if (
      name.includes("list") ||
      name.includes("array") ||
      name.includes("items") ||
      name.endsWith("s")
    ) {
      hints.push("likely-array");
    }

    return hints;
  }

  Identifier = (path: NodePath<t.Identifier>): void => {
    // Skip certain identifiers
    if (
      (t.isMemberExpression(path.parent) &&
        path.parent.property === path.node) ||
      (t.isProperty(path.parent) && path.parent.key === path.node) ||
      (t.isClassMethod(path.parent) && path.parent.key === path.node) ||
      (t.isFunctionDeclaration(path.parent) && path.parent.id === path.node) ||
      (t.isClassDeclaration(path.parent) && path.parent.id === path.node)
    ) {
      return;
    }

    if (this._shouldMakePrediction()) {
      const prediction: TypePrediction = {
        identifier: path.node.name,
        predictedType: this._getRandomType(),
        position: {
          line: path.node.loc?.start.line || 0,
          column: path.node.loc?.start.column || 0,
        },
        context: {
          scope: this._currentScope,
          syntacticContext: this._extractContext(path),
          semanticHints: this._extractSemanticHints(path),
        },
      };

      this._predictions.push(prediction);
    }
  };

  ClassDeclaration = {
    enter: (path: NodePath<t.ClassDeclaration>): void => {
      if (path.node.id) {
        this._enterScope(`class:${path.node.id.name}`);
      }
    },
    exit: (): void => {
      this._exitScope();
    },
  };

  FunctionDeclaration = {
    enter: (path: NodePath<t.FunctionDeclaration>): void => {
      if (path.node.id) {
        this._enterScope(`function:${path.node.id.name}`);
      }
    },
    exit: (): void => {
      this._exitScope();
    },
  };

  ClassMethod = {
    enter: (path: NodePath<t.ClassMethod>): void => {
      if (t.isIdentifier(path.node.key)) {
        this._enterScope(`${this._currentScope}.${path.node.key.name}`);
      }
    },
    exit: (): void => {
      this._exitScope();
    },
  };

  ArrowFunctionExpression = {
    enter: (): void => {
      this._enterScope(`${this._currentScope}.arrow`);
    },
    exit: (): void => {
      this._exitScope();
    },
  };

  FunctionExpression = {
    enter: (path: NodePath<t.FunctionExpression>): void => {
      const name = path.node.id?.name || "anonymous";
      this._enterScope(`${this._currentScope}.${name}`);
    },
    exit: (): void => {
      this._exitScope();
    },
  };
}
