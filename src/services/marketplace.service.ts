import type { Agent, AgentSpec } from "@/types/agent";
import { MARKETPLACE_SEED } from "@/constants/marketplace-agents";

export interface MarketplaceListing {
  agentId: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  authorId: string;
  authorName: string;
  publishedAt: string;
  tags: string[];
}

export interface RevenueShareResult {
  totalRevenue: number;
  platformShare: number;
  authorShare: number;
  platformPercentage: number;
  authorPercentage: number;
}

// Default platform/author split: 30/70
const DEFAULT_PLATFORM_PERCENTAGE = 30;

// In-memory store — seeded with pre-built agents
const listings: Map<string, MarketplaceListing> = new Map(
  MARKETPLACE_SEED.map((l) => [l.agentId, l])
);
const revenueRecords: Map<string, RevenueShareResult[]> = new Map();

/**
 * Publishes an agent to the marketplace.
 * The listing includes name, description, category, usage stats, and author attribution.
 */
export function publishAgent(
  agent: Agent,
  authorName: string
): MarketplaceListing {
  const listing: MarketplaceListing = {
    agentId: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    usageCount: agent.usageCount,
    authorId: agent.ownerId,
    authorName,
    publishedAt: new Date().toISOString(),
    tags: [...agent.tags],
  };

  listings.set(agent.id, listing);
  return listing;
}

/**
 * Lists all marketplace agents, optionally filtered by search query and/or category.
 */
export function listMarketplaceAgents(options?: {
  search?: string;
  category?: string;
}): MarketplaceListing[] {
  let results = Array.from(listings.values());

  if (options?.search) {
    const q = options.search.toLowerCase();
    results = results.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (options?.category) {
    results = results.filter((l) => l.category === options.category);
  }

  return results;
}

/**
 * Forks a marketplace agent's spec into a new private copy.
 * Returns a deep copy of the AgentSpec with a new id.
 */
export function forkMarketplaceAgent(
  agent: Agent,
  newSpecId: string
): AgentSpec {
  const currentVersion = agent.versions.find(
    (v) => v.version === agent.currentVersion
  );
  if (!currentVersion) {
    throw new Error(`Current version not found for agent ${agent.id}`);
  }

  const cloned: AgentSpec = JSON.parse(
    JSON.stringify(currentVersion.agentSpec)
  );
  cloned.id = newSpecId;
  return cloned;
}

/**
 * Removes an agent from the marketplace.
 */
export function unpublishAgent(agentId: string): boolean {
  return listings.delete(agentId);
}

/**
 * Calculates revenue share between the platform and the agent author.
 * Uses integer-cent math to avoid floating point rounding loss beyond 1 cent.
 */
export function calculateRevenueShare(
  revenue: number,
  platformPercentage: number = DEFAULT_PLATFORM_PERCENTAGE
): RevenueShareResult {
  if (revenue < 0) {
    throw new Error("Revenue must be non-negative");
  }
  if (platformPercentage < 0 || platformPercentage > 100) {
    throw new Error("Platform percentage must be between 0 and 100");
  }

  const authorPercentage = 100 - platformPercentage;

  // Use cent-based math to minimize rounding error
  const revenueCents = Math.round(revenue * 100);
  const platformCents = Math.round(revenueCents * platformPercentage / 100);
  const authorCents = revenueCents - platformCents;

  return {
    totalRevenue: revenue,
    platformShare: platformCents / 100,
    authorShare: authorCents / 100,
    platformPercentage,
    authorPercentage,
  };
}

/**
 * Records a revenue share event for an agent.
 */
export function recordRevenue(
  agentId: string,
  revenue: number,
  platformPercentage?: number
): RevenueShareResult {
  const result = calculateRevenueShare(revenue, platformPercentage);
  const records = revenueRecords.get(agentId) ?? [];
  records.push(result);
  revenueRecords.set(agentId, records);
  return result;
}

/**
 * Gets the listing for a specific agent.
 */
export function getMarketplaceListing(
  agentId: string
): MarketplaceListing | null {
  return listings.get(agentId) ?? null;
}

/**
 * Resets marketplace to the default seed data.
 */
export function resetMarketplace(): void {
  listings.clear();
  revenueRecords.clear();
  for (const l of MARKETPLACE_SEED) {
    listings.set(l.agentId, l);
  }
}

/**
 * Clears all marketplace data including seeds. Used for testing.
 */
export function clearMarketplace(): void {
  listings.clear();
  revenueRecords.clear();
}
