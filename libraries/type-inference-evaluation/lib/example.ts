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
 * Example showing how to use the type inference evaluation framework
 */
export async function runExample(): Promise<void> {
  console.log("Type Inference Evaluation Example");
  console.log("=================================\n");

  // 1. Create the evaluator
  const evaluator = new TypeInferenceEvaluator();

  // 2. Register type inference approaches
  const randomApproach = new RandomTypeInferenceApproach();
  evaluator.registerApproach(randomApproach);

  console.log("Registered approaches:", evaluator.getRegisteredApproaches());

  // 3. Load test cases
  const testCases = TestCaseLoader.getSampleTestCases();
  console.log(`\nLoaded ${testCases.length} test cases:`);

  for (const testCase of testCases) {
    console.log(
      `  - ${testCase.name}: ${testCase.groundTruth.length} identifiers to predict`,
    );
  }

  // 4. Configure the random approach
  const config = new Map<string, Record<string, unknown>>();
  config.set("Random Type Inference", {
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

  // 5. Run evaluation
  console.log("\nRunning evaluation...");
  const results = await evaluator.evaluateAllApproaches(testCases, config);

  // 6. Display results
  evaluator.printResults(results);

  // 7. Show some sample predictions
  const randomResult = results.get("Random Type Inference");
  if (randomResult && randomResult.predictions.length > 0) {
    console.log("\nSample predictions:");
    console.log("-".repeat(30));

    for (
      let index = 0;
      index < Math.min(5, randomResult.predictions.length);
      index++
    ) {
      const prediction = randomResult.predictions[index];
      console.log(
        `${prediction.identifier} -> ${prediction.predictedType} (line ${prediction.position.line})`,
      );
    }
  }

  console.log("\nExample complete!");
}
