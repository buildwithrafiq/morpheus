import { describe, it, expect } from "vitest";
import { SchemaValidator } from "./schema-validator";

function uuid() {
  return crypto.randomUUID();
}

function makeValidAgentSpec() {
  return {
    id: uuid(),
    corePurpose: "Test agent",
    inputRequirements: [{ name: "query", type: "text" as const, required: true, description: "User query" }],
    outputRequirements: [{ name: "answer", type: "string", description: "Response" }],
    dataSources: [],
    integrations: [],
    edgeCases: [{ description: "Empty input", mitigation: "Return default response" }],
    personality: { tone: "friendly", formality: "neutral" as const, verbosity: "balanced" as const },
    communicationStyle: "conversational",
    complexityScore: 3,
    inferredFields: [],
  };
}

function makeValidArchitectureDoc(agentSpecId?: string) {
  return {
    id: uuid(),
    agentSpecId: agentSpecId ?? uuid(),
    selectedModel: "gemini-3-flash" as const,
    promptStrategy: { systemPrompt: "You are helpful", fewShotExamples: [], outputFormat: "json" },
    dataFlow: [{ step: 1, name: "input", input: "query", output: "response", description: "Process query" }],
    stateManagement: { type: "stateless" as const, storage: "none" },
    tools: [],
    conversationFlow: [{ id: "start", type: "start" as const, next: ["end"] }],
    errorHandling: { retryPolicy: { maxRetries: 3, backoffMs: 1000 }, fallbackBehavior: "return error" },
  };
}

function makeValidDeploymentResult(codeBundleId?: string) {
  return {
    id: uuid(),
    codeBundleId: codeBundleId ?? uuid(),
    provider: "railway" as const,
    status: "running" as const,
    endpoint: "https://my-agent.railway.app",
    healthCheckPassed: true,
    envVars: ["API_KEY", "NODE_ENV"],
    deploymentTime: 45000,
    fallbackUsed: false,
  };
}

describe("SchemaValidator", () => {
  const validator = new SchemaValidator();

  describe("validateAgentSpec", () => {
    it("accepts a valid AgentSpec", () => {
      const result = validator.validateAgentSpec(makeValidAgentSpec());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("rejects invalid data with error details", () => {
      const result = validator.validateAgentSpec({ id: "not-a-uuid" });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      const errors = result.errors ?? [];
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.path).toBeDefined();
      expect(errors[0]?.message).toBeDefined();
    });

    it("rejects when complexityScore is out of range", () => {
      const spec = { ...makeValidAgentSpec(), complexityScore: 11 };
      const result = validator.validateAgentSpec(spec);
      expect(result.success).toBe(false);
      expect((result.errors ?? []).some((e) => e.path === "complexityScore")).toBe(true);
    });
  });

  describe("validateArchitectureDoc", () => {
    it("accepts a valid ArchitectureDoc", () => {
      const result = validator.validateArchitectureDoc(makeValidArchitectureDoc());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("rejects invalid data", () => {
      const result = validator.validateArchitectureDoc({});
      expect(result.success).toBe(false);
      expect((result.errors ?? []).length).toBeGreaterThan(0);
    });
  });

  describe("validateDeploymentResult", () => {
    it("accepts a valid DeploymentResult", () => {
      const result = validator.validateDeploymentResult(makeValidDeploymentResult());
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("accepts any string as endpoint", () => {
      const dep = { ...makeValidDeploymentResult(), endpoint: "not-a-url" };
      const result = validator.validateDeploymentResult(dep);
      expect(result.success).toBe(true);
    });
  });
});
