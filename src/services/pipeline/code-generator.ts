import type { IGeminiService } from "@/services/interfaces";
import type {
  ArchitectureDoc,
  CodeBundle,
  GeneratedFile,
  TestResult,
  FailureReport,
} from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

const MAX_DEBUG_ITERATIONS = 5;

/**
 * Parses raw Gemini output into a structured CodeBundle.
 * Handles both well-structured JSON and raw code responses.
 */
export function parseCodeOutput(
  raw: unknown,
  architectureDocId: string
): Partial<CodeBundle> {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      id: (obj.id as string) || crypto.randomUUID(),
      architectureDocId,
      files: Array.isArray(obj.files)
        ? (obj.files as GeneratedFile[])
        : [],
      dependencies: (obj.dependencies as Record<string, string>) || {},
      testResults: Array.isArray(obj.testResults)
        ? (obj.testResults as TestResult[])
        : [],
      debugIterations: 0,
      validated: false,
    };
  }

  return {
    id: crypto.randomUUID(),
    architectureDocId,
    files: [],
    dependencies: {},
    testResults: [],
    debugIterations: 0,
    validated: false,
  };
}

/**
 * Checks if all tests in a CodeBundle pass.
 */
export function allTestsPassing(testResults: TestResult[]): boolean {
  return testResults.length > 0 && testResults.every((t) => t.passed);
}

/**
 * Creates a failure report from the current state of debugging.
 */
export function createFailureReport(
  testResults: TestResult[],
  debugIterations: number
): FailureReport {
  const failingTests = testResults.filter((t) => !t.passed);
  return {
    unresolvedIssues: failingTests.map(
      (t) => `${t.name}: ${t.error || "Unknown failure"}`
    ),
    debugIterations,
    lastError: failingTests[0]?.error || "Tests failed after maximum debug iterations",
  };
}

/**
 * Creates a validated CodeBundle when all tests pass.
 */
export function createValidatedBundle(
  partial: Partial<CodeBundle>,
  debugIterations: number
): CodeBundle {
  return {
    id: partial.id || crypto.randomUUID(),
    architectureDocId: partial.architectureDocId || "",
    files: partial.files || [],
    dependencies: partial.dependencies || {},
    testResults: partial.testResults || [],
    debugIterations,
    validated: true,
  };
}

/**
 * Creates a best-effort CodeBundle with a failure report.
 */
export function createFailedBundle(
  partial: Partial<CodeBundle>,
  debugIterations: number
): CodeBundle {
  return {
    id: partial.id || crypto.randomUUID(),
    architectureDocId: partial.architectureDocId || "",
    files: partial.files || [],
    dependencies: partial.dependencies || {},
    testResults: partial.testResults || [],
    debugIterations,
    failureReport: createFailureReport(partial.testResults || [], debugIterations),
    validated: false,
  };
}

/**
 * Code Generator - Takes an ArchitectureDoc and produces a validated CodeBundle
 * using Gemini Flash with code execution.
 *
 * Implements:
 * - Gemini Flash call with code execution for code generation
 * - Auto-debug loop (up to 5 iterations)
 * - Validated bundle creation on success, failure report on exhaustion
 */
export class CodeGenerator {
  constructor(private gemini: IGeminiService) {}

  /**
   * Generates code for the given ArchitectureDoc.
   * Implements auto-debug loop: generate → test → analyze failure → fix → re-test.
   * Yields StreamChunks for progress tracking.
   */
  async *generate(arch: ArchitectureDoc): AsyncGenerator<StreamChunk> {
    yield { type: "thinking", content: "Starting code generation with Gemini Flash..." };

    // Initial code generation
    const stream = this.gemini.generateCode(arch);
    let rawResult: unknown;

    for await (const chunk of stream) {
      if (chunk.type === "result") {
        rawResult = chunk.content;
      } else if (chunk.type === "error") {
        yield chunk;
        return;
      } else {
        yield chunk;
      }
    }

    let bundle = parseCodeOutput(rawResult, arch.id);
    let debugIteration = 0;

    // Auto-debug loop: retry up to MAX_DEBUG_ITERATIONS times if tests fail
    while (debugIteration < MAX_DEBUG_ITERATIONS) {
      if (allTestsPassing(bundle.testResults || [])) {
        // All tests pass - create validated bundle
        const validated = createValidatedBundle(bundle, debugIteration);
        yield { type: "result", content: validated };
        return;
      }

      // Tests failed - attempt debug iteration
      debugIteration++;
      yield {
        type: "thinking",
        content: `Debug iteration ${debugIteration}/${MAX_DEBUG_ITERATIONS}: analyzing test failures...`,
      };

      const failingTests = (bundle.testResults || []).filter((t) => !t.passed);
      yield {
        type: "code",
        content: {
          debugIteration,
          failingTests: failingTests.map((t) => ({ name: t.name, error: t.error })),
        },
      };

      // Re-generate with debug context
      const debugStream = this.gemini.generateCode(arch);
      let debugResult: unknown;

      for await (const chunk of debugStream) {
        if (chunk.type === "result") {
          debugResult = chunk.content;
        } else if (chunk.type === "error") {
          // Continue trying even if a debug iteration errors
          break;
        } else {
          yield chunk;
        }
      }

      if (debugResult) {
        bundle = parseCodeOutput(debugResult, arch.id);
      }
    }

    // Check one final time after the last iteration
    if (allTestsPassing(bundle.testResults || [])) {
      const validated = createValidatedBundle(bundle, debugIteration);
      yield { type: "result", content: validated };
    } else {
      // Exhausted all debug iterations - package best-effort with failure report
      const failed = createFailedBundle(bundle, debugIteration);
      yield {
        type: "thinking",
        content: `Auto-debug exhausted after ${MAX_DEBUG_ITERATIONS} iterations. Packaging best-effort bundle with failure report.`,
      };
      yield { type: "result", content: failed };
    }
  }
}
