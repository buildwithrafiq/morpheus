import { describe, it, expect, beforeEach } from "vitest";
import {
  publishAgent,
  listMarketplaceAgents,
  forkMarketplaceAgent,
  unpublishAgent,
  calculateRevenueShare,
  getMarketplaceListing,
  clearMarketplace,
} from "./marketplace.service";
import type { Agent } from "@/types/agent";

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-1",
    name: "Test Agent",
    description: "A test agent for unit testing",
    tags: ["test", "demo"],
    category: "utility",
    status: "running",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        agentSpec: {
          id: "spec-1",
          corePurpose: "testing",
          inputRequirements: [{ name: "query", type: "text", required: true, description: "input" }],
          outputRequirements: [{ name: "result", type: "string", description: "output" }],
          dataSources: [],
          integrations: [],
          edgeCases: [],
          personality: { tone: "friendly", formality: "neutral", verbosity: "concise" },
          communicationStyle: "direct",
          complexityScore: 3,
          inferredFields: [],
        },
        architectureDoc: {} as any,
        codeBundle: {} as any,
        deploymentResult: {} as any,
        generatedUI: {} as any,
        createdAt: "2025-01-01T00:00:00.000Z",
        descriptionSummary: "test",
      },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    usageCount: 42,
    ownerId: "owner-1",
    sharing: { isPublic: true, permissions: "view" },
    ...overrides,
  };
}

describe("marketplace.service", () => {
  beforeEach(() => {
    clearMarketplace();
  });

  it("publishes an agent with complete listing info", () => {
    const agent = makeAgent();
    const listing = publishAgent(agent, "Alice");

    expect(listing.name).toBe("Test Agent");
    expect(listing.description).toBe("A test agent for unit testing");
    expect(listing.category).toBe("utility");
    expect(listing.usageCount).toBe(42);
    expect(listing.authorId).toBe("owner-1");
    expect(listing.authorName).toBe("Alice");
  });

  it("lists and filters marketplace agents", () => {
    publishAgent(makeAgent({ id: "a1", name: "Weather Bot", category: "weather" }), "Alice");
    publishAgent(makeAgent({ id: "a2", name: "Code Helper", category: "dev" }), "Bob");

    expect(listMarketplaceAgents()).toHaveLength(2);
    expect(listMarketplaceAgents({ category: "weather" })).toHaveLength(1);
    expect(listMarketplaceAgents({ search: "code" })).toHaveLength(1);
  });

  it("forks a marketplace agent spec with new id", () => {
    const agent = makeAgent();
    const forked = forkMarketplaceAgent(agent, "new-spec-id");

    expect(forked.id).toBe("new-spec-id");
    expect(forked.corePurpose).toBe("testing");
  });

  it("unpublishes an agent", () => {
    publishAgent(makeAgent(), "Alice");
    expect(getMarketplaceListing("agent-1")).not.toBeNull();

    unpublishAgent("agent-1");
    expect(getMarketplaceListing("agent-1")).toBeNull();
  });

  describe("calculateRevenueShare", () => {
    it("splits revenue with default 30/70", () => {
      const result = calculateRevenueShare(100);
      expect(result.platformShare).toBe(30);
      expect(result.authorShare).toBe(70);
      expect(result.platformShare + result.authorShare).toBe(100);
    });

    it("handles custom split", () => {
      const result = calculateRevenueShare(100, 20);
      expect(result.platformShare).toBe(20);
      expect(result.authorShare).toBe(80);
    });

    it("shares sum to total revenue (no rounding loss beyond 1 cent)", () => {
      const result = calculateRevenueShare(33.33, 30);
      const diff = Math.abs(result.totalRevenue - (result.platformShare + result.authorShare));
      expect(diff).toBeLessThanOrEqual(0.01);
    });

    it("rejects negative revenue", () => {
      expect(() => calculateRevenueShare(-10)).toThrow();
    });
  });
});
