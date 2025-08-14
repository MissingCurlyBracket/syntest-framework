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

// Example TypeScript code to analyze
const codeToAnalyze = `
class MyClass {
  private value = 42;
  
  constructor(initialValue) {
    this.value = initialValue;
  }
  
  getValue() {
    return this.value;
  }
  
  setValue(newValue) {
    this.value = newValue;
  }
}

const instance = new MyClass(100);
const result = instance.getValue();
`;

// Create a custom visitor that extends the base visitor
class TestVisitor extends AbstractSyntaxTreeVisitor {
  constructor() {
    super("test.ts", true);
  }

  // Override or add specific visit methods
  ClassDeclaration = (path: NodePath<t.ClassDeclaration>) => {
    console.log(`Found class: ${path.node.id?.name}`);
    console.log(`Node ID: ${this._getNodeId(path)}`);
  };

  ClassMethod = (path: NodePath<t.ClassMethod>) => {
    const key = path.node.key;
    if (t.isIdentifier(key)) {
      console.log(`Found method: ${key.name}`);
    }
    console.log(`Node ID: ${this._getNodeId(path)}`);
  };

  Identifier = (path: NodePath<t.Identifier>) => {
    console.log(`Found identifier: ${path.node.name}`);
    console.log(`Binding ID: ${this._getBindingId(path)}`);
  };

  ThisExpression = (path: NodePath<t.ThisExpression>) => {
    console.log(`Found 'this' expression`);
    const thisParent = this._getThisParent(path);
    if (thisParent) {
      console.log(`This parent: ${thisParent.type}`);
    }
  };
}

function runVisitor() {
  try {
    setupLogger("", [], "silly");

    // Parse the TypeScript code
    const ast = parse(codeToAnalyze, {
      sourceType: "module",
      plugins: ["typescript", "classProperties", "decorators-legacy"],
    });

    if (!ast) {
      throw new Error("Failed to parse code");
    }

    // Create visitor instance
    const visitor = new TestVisitor();

    // Traverse the AST with the visitor
    traverse(ast, visitor);

    console.log("Visitor completed successfully!");
  } catch (error) {
    console.error("Error running visitor:", error);
  }
}

// Run the visitor
runVisitor();
