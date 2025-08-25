# Type Inference Evaluation Framework

A modular framework for evaluating different type inference approaches on JavaScript/TypeScript code.

## Overview

This framework provides a standardized way to:

- Implement and test different type inference approaches
- Evaluate approaches against ground truth data
- Compare performance and accuracy metrics
- Add new approaches in a modular way

## Architecture

### Core Components

1. **TypeInferenceApproach Interface** - Define new type inference methods
2. **TypeInferenceEvaluator** - Main evaluation engine
3. **TestCase & TestCaseLoader** - Manage test data with ground truth
4. **EvaluationMetrics** - Calculate accuracy, precision, recall, F1 scores
5. **Approaches** - Implementations of different type inference methods

### Current Approaches

- **RandomTypeInferenceApproach**: Baseline approach that randomly assigns types from a predefined set

## Usage

### Basic Example

```typescript
import {
  TypeInferenceEvaluator,
  RandomTypeInferenceApproach,
  TestCaseLoader,
} from "@syntest/type-inference-evaluation";

// Create evaluator
const evaluator = new TypeInferenceEvaluator();

// Register approaches
evaluator.registerApproach(new RandomTypeInferenceApproach());

// Load test cases
const testCases = TestCaseLoader.getSampleTestCases();

// Configure approach
const config = new Map();
config.set("Random Type Inference", {
  availableTypes: ["boolean", "string", "number", "object"],
  randomTypeProbability: 1.0,
});

// Evaluate
const results = await evaluator.evaluateAllApproaches(testCases, config);
evaluator.printResults(results);
```

### Running the Demo

```bash
# Build the project
npm run build

# Run the demo
npm run evaluate
```

## Adding New Approaches

To add a new type inference approach:

1. Implement the `TypeInferenceApproach` interface:

```typescript
export class MyTypeInferenceApproach implements TypeInferenceApproach {
  readonly name = "My Approach";
  readonly description = "Description of my approach";

  async initialize(config: Record<string, unknown>): Promise<void> {
    // Setup logic
  }

  async predict(
    sourceCode: string,
    filePath?: string,
  ): Promise<TypePrediction[]> {
    // Type inference logic
    return predictions;
  }

  async dispose(): Promise<void> {
    // Cleanup logic
  }
}
```

2. Register it with the evaluator:

```typescript
evaluator.registerApproach(new MyTypeInferenceApproach());
```

## Test Cases

### Sample Test Cases

The framework includes sample test cases covering:

- Basic variable declarations (primitives, objects, arrays)
- Class definitions with methods
- Function parameters and return types

### Custom Test Cases

Create custom test cases by implementing the `TestCase` interface:

```typescript
const customTestCase: TestCase = {
  id: "custom-001",
  name: "Custom test",
  sourceCode: "const x = 42;",
  groundTruth: [
    {
      identifier: "x",
      actualType: "number",
      position: { line: 1, column: 7 },
      scope: "global",
    },
  ],
  metadata: {
    category: "custom",
    difficulty: "easy",
    tags: ["numbers"],
  },
};
```

## Evaluation Metrics

The framework calculates:

- **Overall Accuracy**: Percentage of correct type predictions
- **Precision by Type**: True positives / (True positives + False positives)
- **Recall by Type**: True positives / (True positives + False negatives)
- **F1 Score by Type**: Harmonic mean of precision and recall
- **Execution Time**: Time taken to make predictions

## Integration with SynTest

This framework integrates with the existing SynTest infrastructure:

- Uses `@syntest/ast-visitor-javascript` for AST traversal
- Uses `@syntest/prng` for random number generation
- Compatible with SynTest's logging and diagnostic systems

## Future Extensions

The modular design allows for easy addition of:

- Machine learning-based approaches
- Static analysis approaches
- Hybrid symbolic/ML approaches
- Different evaluation datasets
- Additional metrics (confidence scores, type complexity, etc.)

## Example Output

```
======================================
TYPE INFERENCE EVALUATION RESULTS
======================================

Best Accuracy: Random Type Inference (16.67%)
Fastest Execution: Random Type Inference (45ms)
Total Test Cases: 6

Detailed Results:
----------------------------------------
Random Type Inference:
  Accuracy: 16.67%
  Correct: 1/6
  Time: 45ms
```

This shows the random baseline performance, which other approaches should aim to exceed.
