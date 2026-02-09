import { describe, it, expect, vi } from "vitest";
import {
  AgentArchitect,
  validateConditionalFields,
  generateDefaultMultiAgentStrategy,
  generateDefaultIntegrationSpecs,
  ensureConditionalFields,
  checkFeasibilityConstraints,
  generateTradeoffs,
} from "./agent-architect";
import type { IGeminiService, ISchemaValidator } from "@/services/interfaces";
import type { AgentSpec, ArchitectureDoc } from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

// --- Helpers ---

function makeSpec(overrides?: Partial<AgentSpec>): AgentSpec {
  return {
    id: "spec-1",
    corePurpose: "Test agent",
    inputRequirements: [{ name: "query", type: "text", required: true, description: "User query" }],
    outputRequirements: [{ name: "answer", type: "string", description: "Response" }],
    dataSources: [],
    integrations: [],
    edgeCases: [{ description: "empty input", mitigation: "return default" }],
    personality: { tone: "friendly", formality: "neutral", verbosity: "balanced" },
    communicationStyle: "conversational",
    complexityScore: 5,
    inferredFields: [],
    ...overrides,
  };
}

function makeDoc(overrides?: Partial<ArchitectureDoc>): ArchitectureDoc {
  return {
    id: "arch-1",
    agentSpecId: "spec-1",
    selectedModel: "gemini-3-flash",
    promptStrategy: { systemPrompt: "You are helpful", fewShotExamples: [], outputFormat: "json" },
    dataFlow: [{ step: 1, name: "process", input: "query", output: "answer", description: "Process" }],
    stateManagement: { type: "stateless", storage: "none" },
    tools: [],
    conversationFlow: [{ id: "start", type: "start", next: ["end"] }, { id: "end", type: "end", next: [] }],
    errorHandling: { retryPolicy: { maxRetries: 2, backoffMs: 1000 }, fallbackBehavior: "return error" },
    ...overrides,
  };
}

async function* fakeStream(...chunks: StreamChunk[]): AsyncGenerator<StreamChunk> {
  for (const c of chunks) yield c;
}

async function collectChunks(gen: AsyncGenerator<StreamChunk>): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = [];
  for await (const c of gen) chunks.push(c);
  return chunks;
}

// --- Tests ---

describe("validateConditionalFields", () => {
  it("passes for low-complexity agent with no integrations", () => {
    const result = validateConditionalFields(makeSpec(), makeDoc());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when complexityScore > 7 and no multiAgentStrategy", () => {
    const spec = makeSpec({ complexityScore: 8 });
    const doc = makeDoc();
    const result = validateConditionalFields(spec, doc);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("multiAgentStrategy");
  });

  it("passes when complexityScore > 7 and multiAgentStrategy present", () => {
    const spec = makeSpec({ complexityScore: 9 });
    const doc = makeDoc({
      multiAgentStrategy: {
        agents: [{ role: "coordinator", model: "gemini-3-pro" }],
        coordinationPattern: "sequential",
      },
    });
    const result = validateConditionalFields(spec, doc);
    expect(result.valid).toBe(true);
  });

  it("fails when integrations present but no integrationSpecs", () => {
    const spec = makeSpec({
      integrations: [{ name: "Stripe", type: "payment", authType: "api_key", config: {} }],
    });
    const doc = makeDoc();
    const result = validateConditionalFields(spec, doc);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("integrationSpecs");
  });

  it("fails when integrationSpecs count < integrations count", () => {
    const spec = makeSpec({
      integrations: [
        { name: "Stripe", type: "payment", authType: "api_key", config: {} },
        { name: "Slack", type: "messaging", authType: "oauth", config: {} },
      ],
    });
    const doc = makeDoc({
      integrationSpecs: [{ name: "Stripe", endpoint: "https://api.stripe.com", authFlow: "api_key" }],
    });
    const result = validateConditionalFields(spec, doc);
    expect(result.valid).toBe(false);
  });
});

describe("generateDefaultMultiAgentStrategy", () => {
  it("produces a strategy with at least one agent", () => {
    const strategy = generateDefaultMultiAgentStrategy(makeSpec());
    expect(strategy.agents.length).toBeGreaterThanOrEqual(1);
    expect(strategy.coordinationPattern).toBeTruthy();
  });
});

describe("generateDefaultIntegrationSpecs", () => {
  it("produces one spec per integration", () => {
    const spec = makeSpec({
      integrations: [
        { name: "Stripe", type: "payment", authType: "api_key", config: {} },
        { name: "Slack", type: "messaging", authType: "oauth", config: {} },
      ],
    });
    const specs = generateDefaultIntegrationSpecs(spec);
    expect(specs).toHaveLength(2);
    expect(specs[0]!.name).toBe("Stripe");
    expect(specs[1]!.name).toBe("Slack");
  });
});

describe("ensureConditionalFields", () => {
  it("adds multiAgentStrategy for high-complexity agents", () => {
    const spec = makeSpec({ complexityScore: 9 });
    const doc = makeDoc();
    const result = ensureConditionalFields(spec, doc);
    expect(result.multiAgentStrategy).toBeDefined();
    expect(result.multiAgentStrategy!.agents.length).toBeGreaterThan(0);
  });

  it("adds integrationSpecs for agents with integrations", () => {
    const spec = makeSpec({
      integrations: [{ name: "Stripe", type: "payment", authType: "api_key", config: {} }],
    });
    const doc = makeDoc();
    const result = ensureConditionalFields(spec, doc);
    expect(result.integrationSpecs).toBeDefined();
    expect(result.integrationSpecs!.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves existing multiAgentStrategy", () => {
    const spec = makeSpec({ complexityScore: 9 });
    const existing = {
      agents: [{ role: "custom", model: "gemini-3-pro" }],
      coordinationPattern: "custom pattern",
    };
    const doc = makeDoc({ multiAgentStrategy: existing });
    const result = ensureConditionalFields(spec, doc);
    expect(result.multiAgentStrategy).toEqual(existing);
  });

  it("does not add multiAgentStrategy for low-complexity agents", () => {
    const spec = makeSpec({ complexityScore: 5 });
    const doc = makeDoc();
    const result = ensureConditionalFields(spec, doc);
    expect(result.multiAgentStrategy).toBeUndefined();
  });
});

describe("checkFeasibilityConstraints", () => {
  it("returns no violations for simple agents", () => {
    const violations = checkFeasibilityConstraints(makeSpec(), makeDoc());
    expect(violations).toHaveLength(0);
  });

  it("detects cost violation for high-complexity Pro model", () => {
    const spec = makeSpec({ complexityScore: 8 });
    const doc = makeDoc({ selectedModel: "gemini-3-pro" });
    const violations = checkFeasibilityConstraints(spec, doc);
    expect(violations).toContain("cost");
  });

  it("detects capability violation for too many integrations", () => {
    const integrations = Array.from({ length: 11 }, (_, i) => ({
      name: `Integration${i}`, type: "api", authType: "api_key", config: {},
    }));
    const spec = makeSpec({ integrations });
    const violations = checkFeasibilityConstraints(spec, makeDoc());
    expect(violations).toContain("capability");
  });

  it("detects latency violation for multi-agent with tight response time", () => {
    const spec = makeSpec({
      complexityScore: 8,
      advancedOptions: { maxResponseTime: 5000 },
    });
    const doc = makeDoc({
      multiAgentStrategy: {
        agents: [{ role: "coordinator", model: "gemini-3-pro" }],
        coordinationPattern: "sequential",
      },
    });
    const violations = checkFeasibilityConstraints(spec, doc);
    expect(violations).toContain("latency");
  });
});

describe("generateTradeoffs", () => {
  it("generates cost tradeoff for cost violation", () => {
    const tradeoffs = generateTradeoffs(makeSpec(), makeDoc(), ["cost"]);
    expect(tradeoffs).toHaveLength(1);
    expect(tradeoffs[0]!.decision).toContain("Flash");
  });

  it("preserves existing tradeoffs", () => {
    const existing = { decision: "existing", pros: ["a"], cons: ["b"] };
    const doc = makeDoc({ tradeoffs: [existing] });
    const tradeoffs = generateTradeoffs(makeSpec(), doc, ["cost"]);
    expect(tradeoffs).toHaveLength(2);
    expect(tradeoffs[0]).toEqual(existing);
  });
});

describe("AgentArchitect", () => {
  function createMockGemini(doc: ArchitectureDoc): IGeminiService {
    return {
      analyzeRequirements: vi.fn(),
      designArchitecture: vi.fn().mockImplementation(() =>
        fakeStream({ type: "thinking", content: "designing..." }, { type: "result", content: doc })
      ),
      generateCode: vi.fn(),
      generateUI: vi.fn(),
      executeAgent: vi.fn(),
    };
  }

  function createMockValidator(succeed = true): ISchemaValidator {
    return {
      validateAgentSpec: vi.fn(),
      validateArchitectureDoc: vi.fn().mockImplementation((data: unknown) =>
        succeed ? { success: true, data: data as ArchitectureDoc } : { success: false, errors: [{ path: "id", message: "invalid", expected: "uuid", received: "bad" }] }
      ),
      validateDeploymentResult: vi.fn(),
    };
  }

  it("yields a result chunk on successful design", async () => {
    const doc = makeDoc();
    const architect = new AgentArchitect(createMockGemini(doc), createMockValidator());
    const chunks = await collectChunks(architect.design(makeSpec()));
    const result = chunks.find((c) => c.type === "result");
    expect(result).toBeDefined();
    expect((result!.content as ArchitectureDoc).id).toBe("arch-1");
  });

  it("retries on validation failure and eventually errors", async () => {
    const doc = makeDoc();
    const architect = new AgentArchitect(createMockGemini(doc), createMockValidator(false));
    const chunks = await collectChunks(architect.design(makeSpec()));
    const error = chunks.find((c) => c.type === "error");
    expect(error).toBeDefined();
    expect(error!.content).toContain("Schema validation failed");
  });

  it("stops on Gemini error chunk", async () => {
    const gemini: IGeminiService = {
      analyzeRequirements: vi.fn(),
      designArchitecture: vi.fn().mockImplementation(() =>
        fakeStream({ type: "error", content: "API failure" })
      ),
      generateCode: vi.fn(),
      generateUI: vi.fn(),
      executeAgent: vi.fn(),
    };
    const architect = new AgentArchitect(gemini, createMockValidator());
    const chunks = await collectChunks(architect.design(makeSpec()));
    const error = chunks.find((c) => c.type === "error");
    expect(error).toBeDefined();
  });

  it("applies conditional fields for high-complexity spec", async () => {
    const spec = makeSpec({ complexityScore: 9 });
    const doc = makeDoc(); // no multiAgentStrategy
    const architect = new AgentArchitect(createMockGemini(doc), createMockValidator());
    const chunks = await collectChunks(architect.design(spec));
    const result = chunks.find((c) => c.type === "result");
    expect(result).toBeDefined();
    expect((result!.content as ArchitectureDoc).multiAgentStrategy).toBeDefined();
  });

  it("applies integration specs for spec with integrations", async () => {
    const spec = makeSpec({
      integrations: [{ name: "Stripe", type: "payment", authType: "api_key", config: {} }],
    });
    const doc = makeDoc();
    const architect = new AgentArchitect(createMockGemini(doc), createMockValidator());
    const chunks = await collectChunks(architect.design(spec));
    const result = chunks.find((c) => c.type === "result");
    expect(result).toBeDefined();
    expect((result!.content as ArchitectureDoc).integrationSpecs).toBeDefined();
    expect((result!.content as ArchitectureDoc).integrationSpecs!.length).toBeGreaterThanOrEqual(1);
  });
});
