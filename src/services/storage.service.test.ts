import { describe, it, expect, beforeEach } from "vitest";
import { createStorageService } from "./storage.service";
import type { Agent } from "@/types/agent";
import type { EncryptedKey, IStorageService } from "@/services/interfaces";

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Test Agent",
    description: overrides.description ?? "A test agent",
    tags: overrides.tags ?? ["test"],
    category: overrides.category ?? "general",
    status: overrides.status ?? "running",
    currentVersion: 1,
    versions: [],
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2025-01-01T00:00:00Z",
    usageCount: overrides.usageCount ?? 0,
    ownerId: "user-1",
    sharing: { isPublic: false, permissions: "view" },
  };
}

describe("StorageService (in-memory fallback)", () => {
  let storage: IStorageService;

  beforeEach(() => {
    storage = createStorageService();
  });

  describe("Agent CRUD", () => {
    it("saves and retrieves an agent", async () => {
      const agent = makeAgent({ id: "a1", name: "Alpha" });
      await storage.saveAgent(agent);
      const result = await storage.getAgent("a1");
      expect(result).toEqual(agent);
    });

    it("returns null for non-existent agent", async () => {
      expect(await storage.getAgent("nope")).toBeNull();
    });

    it("overwrites agent on save with same id", async () => {
      const agent = makeAgent({ id: "a1", name: "V1" });
      await storage.saveAgent(agent);
      await storage.saveAgent({ ...agent, name: "V2" });
      const result = await storage.getAgent("a1");
      expect(result?.name).toBe("V2");
    });

    it("deletes an agent", async () => {
      const agent = makeAgent({ id: "a1" });
      await storage.saveAgent(agent);
      await storage.deleteAgent("a1");
      expect(await storage.getAgent("a1")).toBeNull();
    });

    it("lists all agents", async () => {
      await storage.saveAgent(makeAgent({ id: "a1" }));
      await storage.saveAgent(makeAgent({ id: "a2" }));
      const list = await storage.listAgents();
      expect(list).toHaveLength(2);
    });
  });

  describe("Search and filtering", () => {
    beforeEach(async () => {
      await storage.saveAgent(makeAgent({ id: "a1", name: "Weather Bot", description: "Forecasts weather", tags: ["weather", "api"], category: "utility", status: "running", usageCount: 100 }));
      await storage.saveAgent(makeAgent({ id: "a2", name: "Chat Assistant", description: "General chat", tags: ["chat"], category: "assistant", status: "stopped", usageCount: 50 }));
      await storage.saveAgent(makeAgent({ id: "a3", name: "Code Reviewer", description: "Reviews code quality", tags: ["code", "dev"], category: "utility", status: "running", usageCount: 200 }));
    });

    it("filters by search query on name", async () => {
      const results = await storage.listAgents({ search: "weather" });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a1");
    });

    it("filters by search query on description", async () => {
      const results = await storage.listAgents({ search: "chat" });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a2");
    });

    it("filters by search query on tags", async () => {
      const results = await storage.listAgents({ search: "dev" });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a3");
    });

    it("filters by status", async () => {
      const results = await storage.listAgents({ status: "running" });
      expect(results).toHaveLength(2);
    });

    it("filters by category", async () => {
      const results = await storage.listAgents({ category: "assistant" });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a2");
    });

    it("filters by tags", async () => {
      const results = await storage.listAgents({ tags: ["code"] });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a3");
    });

    it("sorts by usageCount descending", async () => {
      const results = await storage.listAgents({ sortBy: "usageCount" });
      expect(results.map((a) => a.id)).toEqual(["a3", "a1", "a2"]);
    });

    it("applies limit and offset", async () => {
      const results = await storage.listAgents({ sortBy: "usageCount", limit: 1, offset: 1 });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe("a1");
    });
  });

  describe("API Key storage", () => {
    it("saves and retrieves API keys", async () => {
      const key: EncryptedKey = {
        id: "k1",
        name: "My Key",
        encryptedValue: "enc-abc123",
        createdAt: "2025-01-01T00:00:00Z",
        lastUsed: "2025-01-01T00:00:00Z",
        rateLimit: 100,
      };
      await storage.saveApiKey(key);
      const keys = await storage.getApiKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toEqual(key);
    });
  });

  describe("User settings storage", () => {
    it("saves and retrieves a setting", async () => {
      await storage.saveSetting("theme", { mode: "dark" });
      const result = await storage.getSetting<{ mode: string }>("theme");
      expect(result).toEqual({ mode: "dark" });
    });

    it("returns null for non-existent setting", async () => {
      expect(await storage.getSetting("nope")).toBeNull();
    });

    it("overwrites a setting", async () => {
      await storage.saveSetting("theme", "dark");
      await storage.saveSetting("theme", "light");
      expect(await storage.getSetting("theme")).toBe("light");
    });
  });

  describe("Isolation (structuredClone)", () => {
    it("mutations to saved agent do not affect stored copy", async () => {
      const agent = makeAgent({ id: "a1", name: "Original" });
      await storage.saveAgent(agent);
      agent.name = "Mutated";
      const result = await storage.getAgent("a1");
      expect(result?.name).toBe("Original");
    });

    it("mutations to retrieved agent do not affect stored copy", async () => {
      await storage.saveAgent(makeAgent({ id: "a1", name: "Original" }));
      const result = await storage.getAgent("a1");
      result!.name = "Mutated";
      const fresh = await storage.getAgent("a1");
      expect(fresh?.name).toBe("Original");
    });
  });
});
