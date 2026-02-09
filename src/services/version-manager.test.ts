import { describe, it, expect } from "vitest";
import {
  createVersion,
  listVersions,
  rollback,
  fork,
  cleanup,
} from "./version-manager";
import type { Agent, AgentVersion } from "@/types/agent";

function makeVersionData(
  overrides: Partial<AgentVersion> = {}
): Omit<AgentVersion, "version" | "createdAt"> {
  return {
    agentSpec: {
      id: "spec-1",
      corePurpose: "test",
      inputRequirements: [
        { name: "q", type: "text", required: true, description: "query" },
      ],
      outputRequirements: [{ name: "a", type: "string", description: "answer" }],
      dataSources: [],
      integrations: [],
      edgeCases: [{ description: "empty input", mitigation: "return default" }],
      personality: { tone: "friendly", formality: "neutral", verbosity: "concise" },
      communicationStyle: "direct",
      complexityScore: 3,
      inferredFields: [],
    },
    architectureDoc: {
      id: "arch-1",
      agentSpecId: "spec-1",
      selectedModel: "gemini-3-flash",
      promptStrategy: { systemPrompt: "You are helpful", fewShotExamples: [], outputFormat: "json" },
      dataFlow: [{ step: 1, name: "input", input: "query", output: "response", description: "process" }],
      stateManagement: { type: "stateless", storage: "none" },
      tools: [],
      conversationFlow: [{ id: "start", type: "start", next: ["end"] }, { id: "end", type: "end", next: [] }],
      errorHandling: { retryPolicy: { maxRetries: 3, backoffMs: 1000 }, fallbackBehavior: "return error" },
    },
    codeBundle: {
      id: "code-1",
      architectureDocId: "arch-1",
      files: [{ path: "index.ts", content: "console.log('hi')", language: "typescript" }],
      dependencies: {},
      testResults: [{ name: "basic", passed: true }],
      debugIterations: 0,
      validated: true,
    },
    deploymentResult: {
      id: "deploy-1",
      codeBundleId: "code-1",
      provider: "railway",
      status: "running",
      endpoint: "https://example.com/api",
      healthCheckPassed: true,
      envVars: ["API_KEY"],
      deploymentTime: 5000,
      fallbackUsed: false,
    },
    generatedUI: {
      id: "ui-1",
      deploymentResultId: "deploy-1",
      publicUrl: "https://example.com/ui",
      components: [],
      accessibilityScore: 95,
      responsive: true,
    },
    descriptionSummary: "Test agent",
    ...overrides,
  };
}

function makeAgent(versionCount = 0): Agent {
  const versions: AgentVersion[] = [];
  for (let i = 1; i <= versionCount; i++) {
    versions.push({
      ...makeVersionData(),
      version: i,
      createdAt: new Date(2025, 0, i).toISOString(),
    });
  }
  return {
    id: "agent-1",
    name: "Test Agent",
    description: "A test agent",
    tags: ["test"],
    category: "utility",
    status: "running",
    currentVersion: versionCount > 0 ? versionCount : 0,
    versions,
    createdAt: new Date(2025, 0, 1).toISOString(),
    updatedAt: new Date(2025, 0, 1).toISOString(),
    usageCount: 0,
    ownerId: "user-1",
    sharing: { isPublic: false, permissions: "view" },
  };
}

describe("version-manager", () => {
  describe("createVersion", () => {
    it("adds a new version to an agent with no versions", () => {
      const agent = makeAgent(0);
      const updated = createVersion(agent, makeVersionData());
      expect(updated.versions).toHaveLength(1);
      expect(updated.versions[0]!.version).toBe(1);
      expect(updated.currentVersion).toBe(1);
    });

    it("preserves all previous versions", () => {
      const agent = makeAgent(3);
      const updated = createVersion(agent, makeVersionData());
      expect(updated.versions).toHaveLength(4);
      expect(updated.versions[3]!.version).toBe(4);
      expect(updated.currentVersion).toBe(4);
    });

    it("does not mutate the original agent", () => {
      const agent = makeAgent(2);
      const originalLength = agent.versions.length;
      createVersion(agent, makeVersionData());
      expect(agent.versions).toHaveLength(originalLength);
    });
  });

  describe("listVersions", () => {
    it("returns versions in chronological order", () => {
      const agent = makeAgent(0);
      // Add versions with out-of-order dates
      agent.versions = [
        { ...makeVersionData(), version: 2, createdAt: new Date(2025, 5, 1).toISOString() } as AgentVersion,
        { ...makeVersionData(), version: 1, createdAt: new Date(2025, 0, 1).toISOString() } as AgentVersion,
        { ...makeVersionData(), version: 3, createdAt: new Date(2025, 2, 1).toISOString() } as AgentVersion,
      ];
      const sorted = listVersions(agent);
      expect(sorted[0]!.version).toBe(1);
      expect(sorted[1]!.version).toBe(3);
      expect(sorted[2]!.version).toBe(2);
    });

    it("does not mutate the original versions array", () => {
      const agent = makeAgent(3);
      const original = [...agent.versions];
      listVersions(agent);
      expect(agent.versions).toEqual(original);
    });
  });

  describe("rollback", () => {
    it("sets currentVersion to the target version", () => {
      const agent = makeAgent(5);
      const updated = rollback(agent, 2);
      expect(updated.currentVersion).toBe(2);
    });

    it("preserves all versions", () => {
      const agent = makeAgent(5);
      const updated = rollback(agent, 2);
      expect(updated.versions).toHaveLength(5);
    });

    it("throws for a non-existent version", () => {
      const agent = makeAgent(3);
      expect(() => rollback(agent, 99)).toThrow("Version 99 not found");
    });
  });

  describe("fork", () => {
    it("returns a deep copy of the current version spec with a new id", () => {
      const agent = makeAgent(2);
      const forked = fork(agent, "new-spec-id");
      expect(forked.id).toBe("new-spec-id");
      expect(forked.corePurpose).toBe(agent.versions[1]!.agentSpec.corePurpose);
    });

    it("produces a spec deeply equal to the original except for id", () => {
      const agent = makeAgent(2);
      const original = agent.versions[1]!.agentSpec;
      const forked = fork(agent, "new-id");
      const { id: _fId, ...forkedRest } = forked;
      const { id: _oId, ...originalRest } = original;
      expect(forkedRest).toEqual(originalRest);
    });

    it("throws when current version is not found", () => {
      const agent = makeAgent(2);
      agent.currentVersion = 99;
      expect(() => fork(agent, "x")).toThrow("Current version 99 not found");
    });
  });

  describe("cleanup", () => {
    it("does nothing when version count is at or below 20", () => {
      const agent = makeAgent(20);
      const cleaned = cleanup(agent);
      expect(cleaned.versions).toHaveLength(20);
    });

    it("removes oldest versions first when count exceeds 20", () => {
      const agent = makeAgent(23);
      agent.currentVersion = 23;
      const cleaned = cleanup(agent);
      expect(cleaned.versions).toHaveLength(20);
      // Oldest versions (1, 2, 3) should be removed
      const versionNumbers = cleaned.versions.map((v) => v.version);
      expect(versionNumbers).not.toContain(1);
      expect(versionNumbers).not.toContain(2);
      expect(versionNumbers).not.toContain(3);
    });

    it("always preserves the current version even if it is old", () => {
      const agent = makeAgent(22);
      agent.currentVersion = 1; // oldest version is current
      const cleaned = cleanup(agent);
      const versionNumbers = cleaned.versions.map((v) => v.version);
      expect(versionNumbers).toContain(1);
      expect(cleaned.versions).toHaveLength(20);
    });
  });
});
