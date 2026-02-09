import type { PricingTier } from "@/types/sharing";

export interface TierCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  tierName: PricingTier["name"];
  upgradePrompt?: string;
}

export interface ApiQuotaCheckResult {
  allowed: boolean;
  currentCalls: number;
  quota: number;
  tierName: PricingTier["name"];
}

const TIER_DEFINITIONS: Record<PricingTier["name"], PricingTier> = {
  free: {
    name: "free",
    agentLimit: 3,
    apiCallQuota: 1000,
    features: ["basic-agents", "community-support"],
  },
  pro: {
    name: "pro",
    agentLimit: 25,
    apiCallQuota: 50000,
    features: ["basic-agents", "advanced-agents", "priority-support", "custom-domains", "team-collaboration"],
  },
  enterprise: {
    name: "enterprise",
    agentLimit: Infinity,
    apiCallQuota: Infinity,
    features: ["basic-agents", "advanced-agents", "priority-support", "custom-domains", "team-collaboration", "sla", "dedicated-support", "sso"],
  },
};

// In-memory store for user tiers and usage
const userTiers: Map<string, PricingTier["name"]> = new Map();
const userAgentCounts: Map<string, number> = new Map();
const userApiCallCounts: Map<string, number> = new Map();

/**
 * Returns the tier definition for a given tier name.
 */
export function getTierDefinition(tierName: PricingTier["name"]): PricingTier {
  return { ...TIER_DEFINITIONS[tierName] };
}

/**
 * Sets the pricing tier for a user.
 */
export function setUserTier(userId: string, tierName: PricingTier["name"]): void {
  userTiers.set(userId, tierName);
}

/**
 * Gets the current tier for a user. Defaults to "free".
 */
export function getUserTier(userId: string): PricingTier["name"] {
  return userTiers.get(userId) ?? "free";
}

/**
 * Sets the current agent count for a user.
 */
export function setAgentCount(userId: string, count: number): void {
  userAgentCounts.set(userId, count);
}

/**
 * Sets the current API call count for a user.
 */
export function setApiCallCount(userId: string, count: number): void {
  userApiCallCounts.set(userId, count);
}

/**
 * Checks whether a user can create another agent based on their tier limit.
 * Returns allowed=false with an upgrade prompt when the limit is reached.
 */
export function checkAgentCreationLimit(userId: string): TierCheckResult {
  const tierName = getUserTier(userId);
  const tier = TIER_DEFINITIONS[tierName];
  const currentCount = userAgentCounts.get(userId) ?? 0;

  if (currentCount >= tier.agentLimit) {
    const nextTier = getNextTier(tierName);
    return {
      allowed: false,
      currentCount,
      limit: tier.agentLimit,
      tierName,
      upgradePrompt: nextTier
        ? `You've reached the ${tier.agentLimit}-agent limit on the ${tierName} plan. Upgrade to ${nextTier} for more agents.`
        : undefined,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit: tier.agentLimit,
    tierName,
  };
}

/**
 * Checks whether a user has remaining API call quota.
 */
export function checkApiQuota(userId: string): ApiQuotaCheckResult {
  const tierName = getUserTier(userId);
  const tier = TIER_DEFINITIONS[tierName];
  const currentCalls = userApiCallCounts.get(userId) ?? 0;

  return {
    allowed: currentCalls < tier.apiCallQuota,
    currentCalls,
    quota: tier.apiCallQuota,
    tierName,
  };
}

/**
 * Checks if a feature is available on the user's current tier.
 */
export function hasFeatureAccess(userId: string, feature: string): boolean {
  const tierName = getUserTier(userId);
  const tier = TIER_DEFINITIONS[tierName];
  return tier.features.includes(feature);
}

function getNextTier(current: PricingTier["name"]): PricingTier["name"] | null {
  if (current === "free") return "pro";
  if (current === "pro") return "enterprise";
  return null;
}

/**
 * Clears all tier data. Used for testing.
 */
export function resetTierManager(): void {
  userTiers.clear();
  userAgentCounts.clear();
  userApiCallCounts.clear();
}
