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

/**
 * Represents ground truth type information for an identifier
 */
export interface GroundTruthType {
  identifier: string;
  actualType: string;
  position: {
    line: number;
    column: number;
  };
  scope: string;
}

/**
 * Represents a test case for type inference evaluation
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;

  /** Name/description of the test case */
  name: string;

  /** Untyped JavaScript source code */
  sourceCode: string;

  /** Ground truth type annotations */
  groundTruth: GroundTruthType[];

  /** Optional metadata */
  metadata?: {
    category: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
    description?: string;
  };
}
