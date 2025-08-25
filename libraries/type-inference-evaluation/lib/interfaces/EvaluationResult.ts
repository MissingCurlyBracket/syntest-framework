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

import { TypePrediction } from "./TypePrediction";

/**
 * Represents the result of evaluating a type inference approach
 */
export interface EvaluationResult {
  /** Name of the approach that was evaluated */
  approachName: string;

  /** All predictions made by the approach */
  predictions: TypePrediction[];

  /** Overall accuracy (0-1) */
  accuracy: number;

  /** Precision by type */
  precisionByType: Map<string, number>;

  /** Recall by type */
  recallByType: Map<string, number>;

  /** F1 score by type */
  f1ScoreByType: Map<string, number>;

  /** Total number of predictions */
  totalPredictions: number;

  /** Number of correct predictions */
  correctPredictions: number;

  /** Execution time in milliseconds */
  executionTime: number;

  /** Additional metrics */
  additionalMetrics?: Map<string, number>;
}
