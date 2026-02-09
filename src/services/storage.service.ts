import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { IStorageService, AgentQuery, EncryptedKey } from "@/services/interfaces";
import type { Agent } from "@/types/agent";

// --- IndexedDB Schema ---

interface MorpheusDB extends DBSchema {
  agents: {
    key: string;
    value: Agent;
    indexes: {
      "by-name": string;
      "by-status": string;
      "by-category": string;
      "by-createdAt": string;
      "by-updatedAt": string;
    };
  };
  apiKeys: {
    key: string;
    value: EncryptedKey;
  };
  userSettings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = "morpheus-platform";
const DB_VERSION = 1;

function initDB(): Promise<IDBPDatabase<MorpheusDB>> {
  return openDB<MorpheusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("agents")) {
        const agentStore = db.createObjectStore("agents", { keyPath: "id" });
        agentStore.createIndex("by-name", "name");
        agentStore.createIndex("by-status", "status");
        agentStore.createIndex("by-category", "category");
        agentStore.createIndex("by-createdAt", "createdAt");
        agentStore.createIndex("by-updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("apiKeys")) {
        db.createObjectStore("apiKeys", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("userSettings")) {
        db.createObjectStore("userSettings", { keyPath: "key" });
      }
    },
  });
}

// --- In-Memory Fallback ---

class InMemoryStorageService implements IStorageService {
  private agents = new Map<string, Agent>();
  private keys: EncryptedKey[] = [];
  private settings = new Map<string, unknown>();

  async saveAgent(agent: Agent): Promise<void> {
    this.agents.set(agent.id, structuredClone(agent));
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = this.agents.get(id);
    return agent ? structuredClone(agent) : null;
  }

  async listAgents(query?: AgentQuery): Promise<Agent[]> {
    let results = Array.from(this.agents.values());
    results = applyQueryFilters(results, query);
    return results.map((a) => structuredClone(a));
  }

  async deleteAgent(id: string): Promise<void> {
    this.agents.delete(id);
  }

  async saveApiKey(key: EncryptedKey): Promise<void> {
    const idx = this.keys.findIndex((k) => k.id === key.id);
    if (idx >= 0) {
      this.keys[idx] = structuredClone(key);
    } else {
      this.keys.push(structuredClone(key));
    }
  }

  async getApiKeys(): Promise<EncryptedKey[]> {
    return this.keys.map((k) => structuredClone(k));
  }

  async saveSetting(key: string, value: unknown): Promise<void> {
    this.settings.set(key, structuredClone(value));
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const val = this.settings.get(key);
    return val !== undefined ? (structuredClone(val) as T) : null;
  }
}

// --- Shared query logic ---

function applyQueryFilters(agents: Agent[], query?: AgentQuery): Agent[] {
  let results = agents;

  if (query?.search) {
    const q = query.search.toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (query?.status) {
    results = results.filter((a) => a.status === query.status);
  }

  if (query?.category) {
    results = results.filter((a) => a.category === query.category);
  }

  if (query?.tags?.length) {
    results = results.filter((a) =>
      query.tags!.some((t) => a.tags.includes(t))
    );
  }

  if (query?.sortBy) {
    results.sort((a, b) => {
      if (query.sortBy === "usageCount") return b.usageCount - a.usageCount;
      const aVal = a[query.sortBy!] as string;
      const bVal = b[query.sortBy!] as string;
      return bVal.localeCompare(aVal);
    });
  }

  const offset = query?.offset ?? 0;
  const limit = query?.limit ?? results.length;
  results = results.slice(offset, offset + limit);

  return results;
}

// --- IndexedDB Storage Service ---

class IndexedDBStorageService implements IStorageService {
  private dbPromise: Promise<IDBPDatabase<MorpheusDB>>;

  constructor() {
    this.dbPromise = initDB();
  }

  async saveAgent(agent: Agent): Promise<void> {
    const db = await this.dbPromise;
    await db.put("agents", structuredClone(agent));
  }

  async getAgent(id: string): Promise<Agent | null> {
    const db = await this.dbPromise;
    const agent = await db.get("agents", id);
    return agent ?? null;
  }

  async listAgents(query?: AgentQuery): Promise<Agent[]> {
    const db = await this.dbPromise;
    const all = await db.getAll("agents");
    return applyQueryFilters(all, query);
  }

  async deleteAgent(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete("agents", id);
  }

  async saveApiKey(key: EncryptedKey): Promise<void> {
    const db = await this.dbPromise;
    await db.put("apiKeys", structuredClone(key));
  }

  async getApiKeys(): Promise<EncryptedKey[]> {
    const db = await this.dbPromise;
    return db.getAll("apiKeys");
  }

  async saveSetting(key: string, value: unknown): Promise<void> {
    const db = await this.dbPromise;
    await db.put("userSettings", { key, value });
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const db = await this.dbPromise;
    const entry = await db.get("userSettings", key);
    return entry ? (entry.value as T) : null;
  }
}

// --- Factory ---

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

export function createStorageService(): IStorageService {
  if (isIndexedDBAvailable()) {
    return new IndexedDBStorageService();
  }
  console.warn(
    "IndexedDB is not available. Falling back to in-memory storage. Data will be lost on page refresh."
  );
  return new InMemoryStorageService();
}
