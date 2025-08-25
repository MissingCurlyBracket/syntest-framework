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

import { EvaluationResult } from "../interfaces/EvaluationResult";
import { TypePrediction } from "../interfaces/TypePrediction";
import { GroundTruthType } from "../test-cases/TestCase";

/**
 * Calculates evaluation metrics for type inference approaches
 */
export class EvaluationMetrics {
  /**
   * Calculate overall accuracy
   * @param predictions Type predictions
   * @param groundTruth Ground truth types
   * @returns Accuracy score (0-1)
   */
  static calculateAccuracy(
    predictions: TypePrediction[],
    groundTruth: GroundTruthType[],
  ): number {
    const matches = EvaluationMetrics.getMatches(predictions, groundTruth);
    const correctPredictions = matches.filter((match) => match.correct).length;
    return matches.length > 0 ? correctPredictions / matches.length : 0;
  }

  /**
   * Calculate precision for each type
   * @param predictions Type predictions
   * @param groundTruth Ground truth types
   * @returns Map of type to precision score
   */
  static calculatePrecisionByType(
    predictions: TypePrediction[],
    groundTruth: GroundTruthType[],
  ): Map<string, number> {
    const matches = EvaluationMetrics.getMatches(predictions, groundTruth);
    const precisionMap = new Map<string, number>();

    const typeGroups = EvaluationMetrics.groupByPredictedType(matches);

    for (const [type, typeMatches] of typeGroups) {
      const correctPredictions = typeMatches.filter(
        (match) => match.correct,
      ).length;
      const totalPredictions = typeMatches.length;
      precisionMap.set(
        type,
        totalPredictions > 0 ? correctPredictions / totalPredictions : 0,
      );
    }

    return precisionMap;
  }

  /**
   * Calculate recall for each type
   * @param predictions Type predictions
   * @param groundTruth Ground truth types
   * @returns Map of type to recall score
   */
  static calculateRecallByType(
    predictions: TypePrediction[],
    groundTruth: GroundTruthType[],
  ): Map<string, number> {
    const matches = EvaluationMetrics.getMatches(predictions, groundTruth);
    const recallMap = new Map<string, number>();

    const typeGroups = EvaluationMetrics.groupByActualType(
      groundTruth,
      matches,
    );

    for (const [type, actualTypeInstances] of typeGroups) {
      const correctPredictions = matches.filter(
        (match) => match.correct && match.actualType === type,
      ).length;
      recallMap.set(
        type,
        actualTypeInstances > 0 ? correctPredictions / actualTypeInstances : 0,
      );
    }

    return recallMap;
  }

  /**
   * Calculate F1 score for each type
   * @param precisionByType Precision scores by type
   * @param recallByType Recall scores by type
   * @returns Map of type to F1 score
   */
  static calculateF1ScoreByType(
    precisionByType: Map<string, number>,
    recallByType: Map<string, number>,
  ): Map<string, number> {
    const f1Map = new Map<string, number>();

    const allTypes = new Set([
      ...precisionByType.keys(),
      ...recallByType.keys(),
    ]);

    for (const type of allTypes) {
      const precision = precisionByType.get(type) || 0;
      const recall = recallByType.get(type) || 0;

      if (precision + recall === 0) {
        f1Map.set(type, 0);
      } else {
        f1Map.set(type, (2 * precision * recall) / (precision + recall));
      }
    }

    return f1Map;
  }

  /**
   * Generate a complete evaluation result
   * @param approachName Name of the evaluated approach
   * @param predictions Type predictions
   * @param groundTruth Ground truth types
   * @param executionTime Execution time in milliseconds
   * @returns Complete evaluation result
   */
  static generateEvaluationResult(
    approachName: string,
    predictions: TypePrediction[],
    groundTruth: GroundTruthType[],
    executionTime: number,
  ): EvaluationResult {
    const matches = EvaluationMetrics.getMatches(predictions, groundTruth);
    const correctPredictions = matches.filter((match) => match.correct).length;

    const accuracy = EvaluationMetrics.calculateAccuracy(
      predictions,
      groundTruth,
    );
    const precisionByType = EvaluationMetrics.calculatePrecisionByType(
      predictions,
      groundTruth,
    );
    const recallByType = EvaluationMetrics.calculateRecallByType(
      predictions,
      groundTruth,
    );
    const f1ScoreByType = EvaluationMetrics.calculateF1ScoreByType(
      precisionByType,
      recallByType,
    );

    return {
      approachName,
      predictions,
      accuracy,
      precisionByType,
      recallByType,
      f1ScoreByType,
      totalPredictions: matches.length,
      correctPredictions,
      executionTime,
    };
  }

  /**
   * Match predictions with ground truth based on position and identifier
   */
  private static getMatches(
    predictions: TypePrediction[],
    groundTruth: GroundTruthType[],
  ): Array<{
    prediction: TypePrediction;
    groundTruth: GroundTruthType;
    correct: boolean;
    predictedType: string;
    actualType: string;
  }> {
    const matches: Array<{
      prediction: TypePrediction;
      groundTruth: GroundTruthType;
      correct: boolean;
      predictedType: string;
      actualType: string;
    }> = [];

    for (const prediction of predictions) {
      const matchingGroundTruth = groundTruth.find(
        (gt) =>
          gt.identifier === prediction.identifier &&
          gt.position.line === prediction.position.line &&
          gt.position.column === prediction.position.column,
      );

      if (matchingGroundTruth) {
        matches.push({
          prediction,
          groundTruth: matchingGroundTruth,
          correct: prediction.predictedType === matchingGroundTruth.actualType,
          predictedType: prediction.predictedType,
          actualType: matchingGroundTruth.actualType,
        });
      }
    }

    return matches;
  }

  /**
   * Group matches by predicted type
   */
  private static groupByPredictedType(
    matches: Array<{
      prediction: TypePrediction;
      groundTruth: GroundTruthType;
      correct: boolean;
      predictedType: string;
      actualType: string;
    }>,
  ): Map<
    string,
    Array<{
      prediction: TypePrediction;
      groundTruth: GroundTruthType;
      correct: boolean;
      predictedType: string;
      actualType: string;
    }>
  > {
    const groups = new Map<
      string,
      Array<{
        prediction: TypePrediction;
        groundTruth: GroundTruthType;
        correct: boolean;
        predictedType: string;
        actualType: string;
      }>
    >();

    for (const match of matches) {
      if (!groups.has(match.predictedType)) {
        groups.set(match.predictedType, []);
      }
      const group = groups.get(match.predictedType);
      if (group) {
        group.push(match);
      }
    }

    return groups;
  }

  /**
   * Group ground truth by actual type and count instances
   */
  private static groupByActualType(
    groundTruth: GroundTruthType[],
    _matches: Array<{
      prediction: TypePrediction;
      groundTruth: GroundTruthType;
      correct: boolean;
      predictedType: string;
      actualType: string;
    }>,
  ): Map<string, number> {
    const groups = new Map<string, number>();

    for (const gt of groundTruth) {
      const count = groups.get(gt.actualType) || 0;
      groups.set(gt.actualType, count + 1);
    }

    return groups;
  }
}
