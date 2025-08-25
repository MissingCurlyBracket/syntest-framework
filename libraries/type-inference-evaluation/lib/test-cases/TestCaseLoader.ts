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

import { TestCase } from "./TestCase";

/**
 * Loads test cases for type inference evaluation
 */
export const TestCaseLoader = {
  /**
   * Load test cases from a directory
   * @param _directory Directory containing test case files
   * @returns Array of test cases
   */
  loadFromDirectory(_directory: string): Promise<TestCase[]> {
    // Implementation will load JSON files or parse TypeScript files
    // For now, return some sample test cases
    return Promise.resolve(TestCaseLoader.getSampleTestCases());
  },

  /**
   * Load test cases from JSON files
   * @param _filePaths Array of file paths to JSON test case files
   * @returns Array of test cases
   */
  loadFromFiles(_filePaths: string[]): Promise<TestCase[]> {
    // Implementation to load from specific files
    return Promise.resolve(TestCaseLoader.getSampleTestCases());
  },

  /**
   * Generate test cases from TypeScript files by stripping type annotations
   * @param _filePaths Array of TypeScript file paths
   * @returns Array of test cases with ground truth from original types
   */
  generateFromTypeScriptFiles(_filePaths: string[]): Promise<TestCase[]> {
    // Implementation to parse TS files and extract type info as ground truth
    return Promise.resolve(TestCaseLoader.getSampleTestCases());
  },

  /**
   * Get sample test cases for initial testing
   * @returns Array of sample test cases
   */
  getSampleTestCases(): TestCase[] {
    return [
      {
        id: "sample-001",
        name: "Basic variable declarations",
        sourceCode: `
const count = 42;
const message = "hello world";
const isActive = true;
const items = [1, 2, 3];
const user = { name: "John", age: 30 };

function processData(data) {
  const result = data.length;
  return result * 2;
}
        `.trim(),
        groundTruth: [
          {
            identifier: "count",
            actualType: "number",
            position: { line: 1, column: 7 },
            scope: "global",
          },
          {
            identifier: "message",
            actualType: "string",
            position: { line: 2, column: 7 },
            scope: "global",
          },
          {
            identifier: "isActive",
            actualType: "boolean",
            position: { line: 3, column: 7 },
            scope: "global",
          },
          {
            identifier: "items",
            actualType: "number[]",
            position: { line: 4, column: 7 },
            scope: "global",
          },
          {
            identifier: "user",
            actualType: "object",
            position: { line: 5, column: 7 },
            scope: "global",
          },
          {
            identifier: "data",
            actualType: "unknown",
            position: { line: 7, column: 21 },
            scope: "function:processData",
          },
          {
            identifier: "result",
            actualType: "number",
            position: { line: 8, column: 9 },
            scope: "function:processData",
          },
        ],
        metadata: {
          category: "basic-types",
          difficulty: "easy",
          tags: ["primitives", "objects", "arrays"],
        },
      },
      {
        id: "sample-002",
        name: "Class with methods",
        sourceCode: `
class Calculator {
  constructor(initialValue) {
    this.value = initialValue;
  }
  
  add(num) {
    this.value += num;
    return this;
  }
  
  getValue() {
    return this.value;
  }
}

const calc = new Calculator(10);
const result = calc.add(5).getValue();
        `.trim(),
        groundTruth: [
          {
            identifier: "initialValue",
            actualType: "unknown",
            position: { line: 2, column: 14 },
            scope: "class:Calculator.constructor",
          },
          {
            identifier: "num",
            actualType: "unknown",
            position: { line: 6, column: 7 },
            scope: "class:Calculator.add",
          },
          {
            identifier: "calc",
            actualType: "Calculator",
            position: { line: 15, column: 7 },
            scope: "global",
          },
          {
            identifier: "result",
            actualType: "number",
            position: { line: 16, column: 7 },
            scope: "global",
          },
        ],
        metadata: {
          category: "classes",
          difficulty: "medium",
          tags: ["classes", "methods", "this"],
        },
      },
    ];
  },
};
