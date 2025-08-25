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

import { RandomTypeInferenceApproach } from "./approaches/RandomTypeInferenceApproach";
import { TestCaseLoader } from "./test-cases/TestCaseLoader";
import { TypeInferenceEvaluator } from "./TypeInferenceEvaluator";

/**
 * Demo script showing how to use the type inference evaluation framework
 */
async function runEvaluationDemo(): Promise<void> {
  console.log("Starting Type Inference Evaluation Demo");
  console.log("======================================\n");

  // Create evaluator
  const evaluator = new TypeInferenceEvaluator();

  // Register approaches
  const randomApproach = new RandomTypeInferenceApproach();
  evaluator.registerApproach(randomApproach);

  // TODO: Add more approaches here as they are implemented
  // evaluator.registerApproach(new MLBasedApproach());
  // evaluator.registerApproach(new SymbolicApproach());

  console.log("Registered approaches:", evaluator.getRegisteredApproaches());

  // Load test cases
  const testCases = TestCaseLoader.getSampleTestCases();
  console.log(`\nLoaded ${testCases.length} test cases:`);
  for (const testCase of testCases) {
    console.log(
      `  - ${testCase.name} (${testCase.metadata?.difficulty || "unknown"} difficulty)`,
    );
  }

  // Configure approaches
  const configByApproach = new Map<string, Record<string, unknown>>();
  configByApproach.set("Random Type Inference", {
    availableTypes: [
      "boolean",
      "string",
      "number",
      "object",
      "array",
      "function",
    ],
    randomTypeProbability: 1,
  });

  // Evaluate all approaches
  console.log("\nStarting evaluation...\n");
  const results = await evaluator.evaluateAllApproaches(
    testCases,
    configByApproach,
  );

  // Print results
  evaluator.printResults(results);

  // Show detailed metrics for the random approach
  const randomResult = results.get("Random Type Inference");
  if (randomResult) {
    console.log("\nDetailed metrics for Random Type Inference:");
    console.log("-".repeat(50));
    console.log(`Total predictions: ${randomResult.totalPredictions}`);
    console.log(`Correct predictions: ${randomResult.correctPredictions}`);
    console.log(
      `Overall accuracy: ${(randomResult.accuracy * 100).toFixed(2)}%`,
    );

    console.log("\nPrecision by type:");
    for (const [type, precision] of randomResult.precisionByType) {
      console.log(`  ${type}: ${(precision * 100).toFixed(2)}%`);
    }

    console.log("\nRecall by type:");
    for (const [type, recall] of randomResult.recallByType) {
      console.log(`  ${type}: ${(recall * 100).toFixed(2)}%`);
    }

    console.log("\nF1 Score by type:");
    for (const [type, f1] of randomResult.f1ScoreByType) {
      console.log(`  ${type}: ${(f1 * 100).toFixed(2)}%`);
    }

    console.log(`\nExecution time: ${randomResult.executionTime}ms`);
  }

  console.log("\nEvaluation complete!");
}

export { runEvaluationDemo };
