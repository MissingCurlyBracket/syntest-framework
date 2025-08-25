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
 * Base interface for type inference approaches
 */
export interface TypeInferenceApproach {
  /** Name of the approach */
  readonly name: string;

  /** Description of the approach */
  readonly description: string;

  /**
   * Initialize the approach with configuration
   * @param config Configuration object specific to the approach
   */
  initialize(config: Record<string, unknown>): Promise<void>;

  /**
   * Make type predictions for the given source code
   * @param sourceCode JavaScript/TypeScript source code
   * @param filePath Optional file path for context
   * @returns Array of type predictions
   */
  predict(sourceCode: string, filePath?: string): Promise<TypePrediction[]>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}
