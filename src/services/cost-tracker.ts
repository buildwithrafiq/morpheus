import type { CostEntry } from "@/types/sharing";

export interface CostRecord {
  id: string;
  agentId: string;
  userId: string;
  entry: CostEntry;
  timestamp: string;
}

export interface CostBreakdown {
  agentId: string;
  totalCost: number;
  byCategory: Record<CostEntry["category"], number>;
  entries: CostRecord[];
}

export interface UserCostSummary {
  userId: string;
  totalCost: number;
  byAgent: Record<string, number>;
  projectedMonthlyCost: number;
}

export interface SpendingLimitResult {
  allowed: boolean;
  currentSpend: number;
  limit: number;
  remaining: number;
}

// In-memory store
const costRecords: CostRecord[] = [];
const spendingLimits: Map<string, number> = new Map();

/**
 * Records a cost event for a specific agent and user.
 */
export function recordCost(
  agentId: string,
  userId: string,
  entry: CostEntry
): CostRecord {
  const record: CostRecord = {
    id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    userId,
    entry,
    timestamp: new Date().toISOString(),
  };
  costRecords.push(record);
  return record;
}

/**
 * Returns cost breakdown for a specific agent.
 * Aggregates all cost records by category.
 */
export function getCostBreakdown(agentId: string): CostBreakdown {
  const entries = costRecords.filter((r) => r.agentId === agentId);
  const byCategory: Record<CostEntry["category"], number> = {
    api_tokens: 0,
    compute: 0,
    deployment: 0,
  };

  let totalCost = 0;
  for (const record of entries) {
    byCategory[record.entry.category] += record.entry.amount;
    totalCost += record.entry.amount;
  }

  // Round to avoid floating point drift
  totalCost = Math.round(totalCost * 100) / 100;
  byCategory.api_tokens = Math.round(byCategory.api_tokens * 100) / 100;
  byCategory.compute = Math.round(byCategory.compute * 100) / 100;
  byCategory.deployment = Math.round(byCategory.deployment * 100) / 100;

  return { agentId, totalCost, byCategory, entries };
}

/**
 * Returns a cost summary for a user across all their agents.
 * Includes projected monthly cost based on current billing period spend rate.
 */
export function getUserCostSummary(userId: string): UserCostSummary {
  const entries = costRecords.filter((r) => r.userId === userId);

  const byAgent: Record<string, number> = {};
  let totalCost = 0;

  for (const record of entries) {
    byAgent[record.agentId] = (byAgent[record.agentId] ?? 0) + record.entry.amount;
    totalCost += record.entry.amount;
  }

  totalCost = Math.round(totalCost * 100) / 100;
  for (const key of Object.keys(byAgent)) {
    byAgent[key] = Math.round(byAgent[key]! * 100) / 100;
  }

  // Project monthly cost: extrapolate from days elapsed this billing period
  const projectedMonthlyCost = getProjectedCost(userId);

  return { userId, totalCost, byAgent, projectedMonthlyCost };
}

/**
 * Projects monthly cost based on current spend rate.
 * Uses the span between the user's first cost record this month and now.
 */
export function getProjectedCost(userId: string): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthEntries = costRecords.filter(
    (r) => r.userId === userId && new Date(r.timestamp) >= monthStart
  );

  if (monthEntries.length === 0) return 0;

  const totalSpent = monthEntries.reduce((sum, r) => sum + r.entry.amount, 0);
  const daysElapsed = Math.max(
    1,
    (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const projected = (totalSpent / daysElapsed) * daysInMonth;
  return Math.round(projected * 100) / 100;
}

/**
 * Sets a spending limit for a user.
 */
export function setSpendingLimit(userId: string, limit: number): void {
  if (limit < 0) {
    throw new Error("Spending limit must be non-negative");
  }
  spendingLimits.set(userId, limit);
}

/**
 * Checks whether a user is within their spending limit.
 * Returns allowed=true if no limit is set or spend is below limit.
 */
export function checkSpendingLimit(userId: string): SpendingLimitResult {
  const limit = spendingLimits.get(userId);

  if (limit === undefined) {
    return { allowed: true, currentSpend: 0, limit: Infinity, remaining: Infinity };
  }

  const entries = costRecords.filter((r) => r.userId === userId);
  const currentSpend = Math.round(
    entries.reduce((sum, r) => sum + r.entry.amount, 0) * 100
  ) / 100;

  const remaining = Math.round((limit - currentSpend) * 100) / 100;

  return {
    allowed: currentSpend < limit,
    currentSpend,
    limit,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Clears all cost records and spending limits. Used for testing.
 */
export function resetCostTracker(): void {
  costRecords.length = 0;
  spendingLimits.clear();
}
