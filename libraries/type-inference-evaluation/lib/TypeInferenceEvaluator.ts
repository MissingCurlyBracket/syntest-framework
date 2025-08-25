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

import { EvaluationResult } from "./interfaces/EvaluationResult";
import { TypeInferenceApproach } from "./interfaces/TypeInferenceApproach";
import { EvaluationMetrics } from "./metrics/EvaluationMetrics";
import { TestCase } from "./test-cases/TestCase";

/**
 * Main evaluator for type inference approaches
 */
export class TypeInferenceEvaluator {
  private _approaches: Map<string, TypeInferenceApproach> = new Map();

  /**
   * Register a type inference approach for evaluation
   * @param approach The approach to register
   */
  registerApproach(approach: TypeInferenceApproach): void {
    this._approaches.set(approach.name, approach);
  }

  /**
   * Get all registered approaches
   * @returns Array of registered approach names
   */
  getRegisteredApproaches(): string[] {
    return [...this._approaches.keys()];
  }

  /**
   * Evaluate a single approach on given test cases
   * @param approachName Name of the approach to evaluate
   * @param testCases Test cases to evaluate on
   * @param config Configuration for the approach
   * @returns Evaluation result
   */
  async evaluateApproach(
    approachName: string,
    testCases: TestCase[],
    config: Record<string, unknown> = {},
  ): Promise<EvaluationResult> {
    const approach = this._approaches.get(approachName);
    if (!approach) {
      throw new Error(`Approach '${approachName}' is not registered`);
    }

    console.log(`Evaluating approach: ${approachName}`);

    // Initialize the approach
    await approach.initialize(config);

    const startTime = Date.now();
    const allPredictions = [];
    const allGroundTruth = [];

    try {
      // Process each test case
      for (const testCase of testCases) {
        console.log(`  Processing test case: ${testCase.name}`);

        const predictions = await approach.predict(
          testCase.sourceCode,
          testCase.id,
        );
        allPredictions.push(...predictions);
        allGroundTruth.push(...testCase.groundTruth);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate metrics
      const result = EvaluationMetrics.generateEvaluationResult(
        approachName,
        allPredictions,
        allGroundTruth,
        executionTime,
      );

      console.log(
        `  Completed evaluation. Accuracy: ${(result.accuracy * 100).toFixed(2)}%`,
      );

      return result;
    } finally {
      // Clean up
      await approach.dispose();
    }
  }

  /**
   * Evaluate all registered approaches on given test cases
   * @param testCases Test cases to evaluate on
   * @param configByApproach Configuration for each approach
   * @returns Map of approach name to evaluation result
   */
  async evaluateAllApproaches(
    testCases: TestCase[],
    configByApproach: Map<string, Record<string, unknown>> = new Map(),
  ): Promise<Map<string, EvaluationResult>> {
    const results = new Map<string, EvaluationResult>();

    for (const approachName of this._approaches.keys()) {
      const config = configByApproach.get(approachName) || {};

      try {
        const result = await this.evaluateApproach(
          approachName,
          testCases,
          config,
        );
        results.set(approachName, result);
      } catch (error) {
        console.error(`Failed to evaluate approach '${approachName}':`, error);
      }
    }

    return results;
  }

  /**
   * Compare evaluation results and generate a summary
   * @param results Map of approach name to evaluation result
   * @returns Comparison summary
   */
  compareResults(results: Map<string, EvaluationResult>): {
    summary: {
      bestAccuracy: { approach: string; score: number };
      fastestExecution: { approach: string; time: number };
      totalTestCases: number;
    };
    detailedComparison: Array<{
      approach: string;
      accuracy: number;
      executionTime: number;
      correctPredictions: number;
      totalPredictions: number;
    }>;
  } {
    const comparison = [...results.entries()].map(([approach, result]) => ({
      approach,
      accuracy: result.accuracy,
      executionTime: result.executionTime,
      correctPredictions: result.correctPredictions,
      totalPredictions: result.totalPredictions,
    }));

    let bestAccuracy = { approach: "", score: -1 };
    let fastestExecution = { approach: "", time: Number.POSITIVE_INFINITY };

    for (const current of comparison) {
      if (current.accuracy > bestAccuracy.score) {
        bestAccuracy = { approach: current.approach, score: current.accuracy };
      }
      if (current.executionTime < fastestExecution.time) {
        fastestExecution = {
          approach: current.approach,
          time: current.executionTime,
        };
      }
    }

    const totalTestCases =
      comparison.length > 0 ? comparison[0].totalPredictions : 0;

    return {
      summary: {
        bestAccuracy,
        fastestExecution,
        totalTestCases,
      },
      detailedComparison: comparison.sort((a, b) => b.accuracy - a.accuracy),
    };
  }

  /**
   * Print evaluation results in a formatted way
   * @param results Map of approach name to evaluation result
   */
  printResults(results: Map<string, EvaluationResult>): void {
    const comparison = this.compareResults(results);

    console.log("\n" + "=".repeat(60));
    console.log("TYPE INFERENCE EVALUATION RESULTS");
    console.log("=".repeat(60));

    console.log(
      `\nBest Accuracy: ${comparison.summary.bestAccuracy.approach} (${(comparison.summary.bestAccuracy.score * 100).toFixed(2)}%)`,
    );
    console.log(
      `Fastest Execution: ${comparison.summary.fastestExecution.approach} (${comparison.summary.fastestExecution.time}ms)`,
    );
    console.log(`Total Test Cases: ${comparison.summary.totalTestCases}`);

    console.log("\nDetailed Results:");
    console.log("-".repeat(40));

    for (const result of comparison.detailedComparison) {
      console.log(`${result.approach}:`);
      console.log(`  Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
      console.log(
        `  Correct: ${result.correctPredictions}/${result.totalPredictions}`,
      );
      console.log(`  Time: ${result.executionTime}ms`);
      console.log("");
    }
  }
}
