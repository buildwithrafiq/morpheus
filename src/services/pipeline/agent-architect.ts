import type { IGeminiService, ISchemaValidator } from "@/services/interfaces";
import type { AgentSpec, ArchitectureDoc, Tradeoff } from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

const MAX_VALIDATION_RETRIES = 2;
const HIGH_COMPLEXITY_THRESHOLD = 7;

// Feasibility constraint thresholds
const MAX_FEASIBLE_LATENCY_MS = 30000;
const MAX_FEASIBLE_INTEGRATIONS = 10;
const HIGH_COST_COMPLEXITY_THRESHOLD = 8;

/**
 * Validates that an ArchitectureDoc has the required conditional fields
 * based on the AgentSpec that produced it.
 *
 * - complexityScore > 7 requires multiAgentStrategy
 * - non-empty integrations requires integrationSpecs with at least one entry per integration
 */
export function validateConditionalFields(
  spec: AgentSpec,
  doc: ArchitectureDoc
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (spec.complexityScore > HIGH_COMPLEXITY_THRESHOLD) {
    if (!doc.multiAgentStrategy) {
      errors.push("multiAgentStrategy is required when complexityScore > 7");
    } else if (!doc.multiAgentStrategy.agents || doc.multiAgentStrategy.agents.length === 0) {
      errors.push("multiAgentStrategy must have at least one agent");
    }
  }

  if (spec.integrations.length > 0) {
    if (!doc.integrationSpecs || doc.integrationSpecs.length === 0) {
      errors.push("integrationSpecs is required when agent has integrations");
    } else if (doc.integrationSpecs.length < spec.integrations.length) {
      errors.push(
        `integrationSpecs must have at least one entry per integration (expected >= ${spec.integrations.length}, got ${doc.integrationSpecs.length})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generates a default multi-agent strategy for high-complexity agents.
 * Used as a fallback when Gemini doesn't produce one.
 */
export function generateDefaultMultiAgentStrategy(spec: AgentSpec) {
  return {
    agents: [
      { role: "coordinator", model: "gemini-3-pro" },
      { role: "specialist", model: "gemini-3-flash" },
    ],
    coordinationPattern: `Sequential coordination for ${spec.corePurpose}`,
  };
}

/**
 * Generates default integration specs from the AgentSpec's integrations.
 * Used as a fallback when Gemini doesn't produce them.
 */
export function generateDefaultIntegrationSpecs(spec: AgentSpec) {
  return spec.integrations.map((integration) => ({
    name: integration.name,
    endpoint: `https://api.${integration.name.toLowerCase().replace(/\s+/g, "-")}.com/v1`,
    authFlow: integration.authType || "api_key",
    rateLimit: 100,
  }));
}

/**
 * Checks whether the architecture design exceeds feasibility constraints
 * based on cost, latency, or capability concerns derived from the AgentSpec.
 *
 * Returns a list of constraint violations found.
 */
export function checkFeasibilityConstraints(
  spec: AgentSpec,
  doc: ArchitectureDoc
): string[] {
  const violations: string[] = [];

  // Cost constraint: high complexity with Pro model is expensive
  if (spec.complexityScore >= HIGH_COST_COMPLEXITY_THRESHOLD && doc.selectedModel === "gemini-3-pro") {
    violations.push("cost");
  }

  // Latency constraint: check if advanced options specify a max response time
  if (spec.advancedOptions?.maxResponseTime && spec.advancedOptions.maxResponseTime < MAX_FEASIBLE_LATENCY_MS) {
    if (spec.complexityScore > HIGH_COMPLEXITY_THRESHOLD && doc.multiAgentStrategy) {
      violations.push("latency");
    }
  }

  // Capability constraint: too many integrations may exceed feasibility
  if (spec.integrations.length > MAX_FEASIBLE_INTEGRATIONS) {
    violations.push("capability");
  }

  // Cost constraint from advanced options
  if (spec.advancedOptions?.costConstraint && spec.complexityScore > HIGH_COMPLEXITY_THRESHOLD) {
    violations.push("cost_budget");
  }

  return violations;
}

/**
 * Generates trade-off entries for feasibility constraint violations.
 * Suggests alternative approaches when the design exceeds constraints.
 */
export function generateTradeoffs(
  _spec: AgentSpec,
  doc: ArchitectureDoc,
  violations: string[]
): Tradeoff[] {
  const tradeoffs: Tradeoff[] = doc.tradeoffs ? [...doc.tradeoffs] : [];

  for (const violation of violations) {
    switch (violation) {
      case "cost":
        tradeoffs.push({
          decision: "Use Gemini Flash instead of Pro to reduce cost",
          pros: ["Lower API cost per request", "Faster response times"],
          cons: ["Reduced reasoning depth", "May miss complex edge cases"],
        });
        break;
      case "latency":
        tradeoffs.push({
          decision: "Simplify multi-agent coordination to reduce latency",
          pros: ["Faster end-to-end response time", "Simpler error handling"],
          cons: ["Less sophisticated task decomposition", "May reduce output quality for complex queries"],
        });
        break;
      case "capability":
        tradeoffs.push({
          decision: "Reduce number of integrations or use an integration hub",
          pros: ["Simpler architecture", "Fewer points of failure", "Easier maintenance"],
          cons: ["Reduced functionality", "May require manual steps for some integrations"],
        });
        break;
      case "cost_budget":
        tradeoffs.push({
          decision: "Optimize token usage to stay within cost budget",
          pros: ["Stays within user's cost constraint", "More predictable billing"],
          cons: ["Shorter context windows", "May need to truncate inputs or outputs"],
        });
        break;
    }
  }

  return tradeoffs;
}

/**
 * Ensures the ArchitectureDoc has all required conditional fields,
 * applying defaults where Gemini output was incomplete.
 */
export function ensureConditionalFields(
  spec: AgentSpec,
  doc: ArchitectureDoc
): ArchitectureDoc {
  let result = { ...doc };

  // Ensure multiAgentStrategy for high-complexity agents
  if (spec.complexityScore > HIGH_COMPLEXITY_THRESHOLD && !result.multiAgentStrategy) {
    result = { ...result, multiAgentStrategy: generateDefaultMultiAgentStrategy(spec) };
  }

  // Ensure integrationSpecs for agents with integrations
  if (spec.integrations.length > 0) {
    if (!result.integrationSpecs || result.integrationSpecs.length < spec.integrations.length) {
      result = { ...result, integrationSpecs: generateDefaultIntegrationSpecs(spec) };
    }
  }

  // Check feasibility constraints and add tradeoffs if needed (Req 3.5)
  const violations = checkFeasibilityConstraints(spec, result);
  if (violations.length > 0) {
    const tradeoffs = generateTradeoffs(spec, result, violations);
    result = { ...result, tradeoffs };
  }

  return result;
}

/**
 * Agent Architect - Takes an AgentSpec and produces a validated ArchitectureDoc
 * using Gemini Pro with extended thinking.
 *
 * Implements:
 * - Gemini Pro call for architecture design (30K token thinking budget)
 * - Multi-agent strategy generation when complexityScore > 7
 * - Integration spec generation for agents with integrations
 * - Feasibility constraint checking with trade-off suggestions
 * - Output validation against ArchitectureDocSchema
 */
export class AgentArchitect {
  constructor(
    private gemini: IGeminiService,
    private validator: ISchemaValidator
  ) {}

  /**
   * Designs architecture for the given AgentSpec.
   * Yields StreamChunks for progress tracking.
   */
  async *design(spec: AgentSpec): AsyncGenerator<StreamChunk> {
    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      yield { type: "thinking", content: `Designing architecture (attempt ${attempt + 1})...` };

      const stream = this.gemini.designArchitecture(spec);
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
      const validation = this.validator.validateArchitectureDoc(rawResult);

      if (validation.success && validation.data) {
        // Post-process: ensure conditional fields are present
        let doc = ensureConditionalFields(spec, validation.data);

        // Validate conditional fields
        const conditionalCheck = validateConditionalFields(spec, doc);
        if (!conditionalCheck.valid) {
          yield {
            type: "thinking",
            content: `Conditional field validation issues: ${conditionalCheck.errors.join(", ")}. Applying defaults...`,
          };
          doc = ensureConditionalFields(spec, doc);
        }

        // Final re-validation after post-processing
        const finalValidation = this.validator.validateArchitectureDoc(doc);
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
          content: `Schema validation failed for ArchitectureDoc after ${MAX_VALIDATION_RETRIES + 1} attempts`,
        };
      }
    }
  }
}
