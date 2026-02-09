import type { IGeminiService, ISchemaValidator } from "@/services/interfaces";
import type { AgentSpec, AdvancedOptions } from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

const MAX_VALIDATION_RETRIES = 2;
const MAX_CLARIFYING_QUESTIONS = 3;

export interface ClarifyingQuestion {
  question: string;
  exampleAnswer: string;
}

export interface RequirementsAnalysisResult {
  agentSpec: AgentSpec;
  clarifyingQuestions: ClarifyingQuestion[];
}

// Ambiguity detection keywords
const AMBIGUOUS_INDICATORS = [
  "maybe", "possibly", "or something", "not sure",
  "kind of", "sort of", "something like", "etc",
  "and more", "and stuff", "whatever", "idk",
];

/**
 * Detects ambiguous requirements in a description.
 * Returns true if the description contains ambiguity indicators
 * or is very short relative to the complexity implied.
 */
export function isAmbiguous(description: string): boolean {
  const lower = description.toLowerCase();
  return AMBIGUOUS_INDICATORS.some((indicator) => lower.includes(indicator))
    || description.length < 50;
}

/**
 * Generates clarifying questions for ambiguous descriptions.
 * Returns up to 3 questions with example answers.
 */
export function generateClarifyingQuestions(description: string): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];
  const lower = description.toLowerCase();

  if (!lower.includes("input") && !lower.includes("receive") && !lower.includes("accept")) {
    questions.push({
      question: "What type of input will your agent receive?",
      exampleAnswer: "Text messages from users asking questions about our product catalog",
    });
  }

  if (!lower.includes("output") && !lower.includes("return") && !lower.includes("respond") && !lower.includes("generate")) {
    questions.push({
      question: "What kind of output should your agent produce?",
      exampleAnswer: "Structured JSON responses with product recommendations and explanations",
    });
  }

  if (!lower.includes("integrat") && !lower.includes("connect") && !lower.includes("api")) {
    questions.push({
      question: "Does your agent need to connect to any external services or APIs?",
      exampleAnswer: "Yes, it should connect to our REST API for product data and Stripe for payments",
    });
  }

  if (questions.length < MAX_CLARIFYING_QUESTIONS && !lower.includes("tone") && !lower.includes("style") && !lower.includes("formal") && !lower.includes("casual")) {
    questions.push({
      question: "What communication style should your agent use?",
      exampleAnswer: "Professional but friendly, like a knowledgeable customer service representative",
    });
  }

  return questions.slice(0, MAX_CLARIFYING_QUESTIONS);
}


/**
 * Tracks which fields in an AgentSpec were inferred (used defaults)
 * rather than explicitly derived from the description.
 */
export function trackInferredFields(spec: AgentSpec, description: string): string[] {
  const inferred: string[] = [];
  const lower = description.toLowerCase();

  // Check if personality was likely inferred
  if (!lower.includes("tone") && !lower.includes("personality") && !lower.includes("style")) {
    inferred.push("personality");
  }

  if (!lower.includes("formal") && !lower.includes("casual")) {
    inferred.push("communicationStyle");
  }

  // Check if data sources were inferred
  if (spec.dataSources.length === 0 && !lower.includes("data") && !lower.includes("source") && !lower.includes("database")) {
    inferred.push("dataSources");
  }

  return inferred;
}

/**
 * Ensures every edge case has a non-empty mitigation strategy.
 * If a mitigation is missing, applies a default one.
 */
export function ensureEdgeCaseMitigations(spec: AgentSpec): AgentSpec {
  const edgeCases = spec.edgeCases.map((ec) => ({
    description: ec.description,
    mitigation: ec.mitigation || "Apply graceful error handling with user-friendly error message",
  }));

  // Ensure at least one edge case exists
  if (edgeCases.length === 0) {
    edgeCases.push({
      description: "Unexpected or malformed input",
      mitigation: "Validate all inputs and return descriptive error messages",
    });
  }

  return { ...spec, edgeCases };
}

/**
 * Requirements Analyzer - Takes a natural language description and produces
 * a validated AgentSpec using Gemini Pro with extended thinking.
 *
 * Implements:
 * - Gemini Pro call with extended thinking (30K-40K tokens)
 * - AgentSpec construction with edge case mitigations and inferred field tracking
 * - Clarifying question generation for ambiguous descriptions
 * - Output validation against AgentSpecSchema
 */
export class RequirementsAnalyzer {
  constructor(
    private gemini: IGeminiService,
    private validator: ISchemaValidator
  ) {}

  /**
   * Analyzes a description and produces a validated AgentSpec.
   * Yields StreamChunks for progress tracking.
   */
  async *analyze(
    description: string,
    options?: AdvancedOptions
  ): AsyncGenerator<StreamChunk> {
    // Generate clarifying questions if description is ambiguous
    const clarifyingQuestions = isAmbiguous(description)
      ? generateClarifyingQuestions(description)
      : [];

    if (clarifyingQuestions.length > 0) {
      yield {
        type: "thinking",
        content: { clarifyingQuestions, message: "Description may be ambiguous. Proceeding with basic version." },
      };
    }

    // Call Gemini Pro with extended thinking for requirements analysis
    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      yield { type: "thinking", content: `Analyzing requirements (attempt ${attempt + 1})...` };

      const stream = this.gemini.analyzeRequirements(description, options);
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

      // Validate against schema
      const validation = this.validator.validateAgentSpec(rawResult);

      if (validation.success && validation.data) {
        // Post-process: ensure edge case mitigations and track inferred fields
        let spec = ensureEdgeCaseMitigations(validation.data);
        const inferred = trackInferredFields(spec, description);
        spec = {
          ...spec,
          inferredFields: [...new Set([...spec.inferredFields, ...inferred])],
        };

        // Include advanced options if provided
        if (options) {
          spec = { ...spec, advancedOptions: options };
        }

        // Final re-validation after post-processing
        const finalValidation = this.validator.validateAgentSpec(spec);
        if (finalValidation.success && finalValidation.data) {
          yield { type: "result", content: finalValidation.data };
          return;
        }
      }

      if (attempt < MAX_VALIDATION_RETRIES) {
        yield {
          type: "thinking",
          content: `Validation failed, retrying (${attempt + 1}/${MAX_VALIDATION_RETRIES})...`,
        };
      } else {
        yield {
          type: "error",
          content: `Schema validation failed for AgentSpec after ${MAX_VALIDATION_RETRIES + 1} attempts`,
        };
      }
    }
  }
}
