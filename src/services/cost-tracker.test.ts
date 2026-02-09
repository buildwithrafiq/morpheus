import { describe, it, expect, beforeEach } from "vitest";
import {
  recordCost,
  getCostBreakdown,
  getUserCostSummary,
  getProjectedCost,
  setSpendingLimit,
  checkSpendingLimit,
  resetCostTracker,
} from "./cost-tracker";
import type { CostEntry } from "@/types/sharing";

beforeEach(() => {
  resetCostTracker();
});

const tokenCost: CostEntry = { category: "api_tokens", amount: 0.05, currency: "USD" };
const computeCost: CostEntry = { category: "compute", amount: 0.10, currency: "USD" };
const deployCost: CostEntry = { category: "deployment", amount: 1.00, currency: "USD" };

describe("cost-tracker", () => {
  describe("recordCost", () => {
    it("records a cost entry and returns a record with id and timestamp", () => {
      const record = recordCost("agent-1", "user-1", tokenCost);
      expect(record.id).toBeTruthy();
      expect(record.agentId).toBe("agent-1");
      expect(record.userId).toBe("user-1");
      expect(record.entry).toEqual(tokenCost);
      expect(record.timestamp).toBeTruthy();
    });
  });

  describe("getCostBreakdown", () => {
    it("returns zero totals for an agent with no costs", () => {
      const breakdown = getCostBreakdown("agent-1");
      expect(breakdown.totalCost).toBe(0);
      expect(breakdown.byCategory.api_tokens).toBe(0);
      expect(breakdown.entries).toHaveLength(0);
    });

    it("aggregates costs by category for a single agent", () => {
      recordCost("agent-1", "user-1", tokenCost);
      recordCost("agent-1", "user-1", computeCost);
      recordCost("agent-1", "user-1", deployCost);

      const breakdown = getCostBreakdown("agent-1");
      expect(breakdown.totalCost).toBe(1.15);
      expect(breakdown.byCategory.api_tokens).toBe(0.05);
      expect(breakdown.byCategory.compute).toBe(0.10);
      expect(breakdown.byCategory.deployment).toBe(1.00);
      expect(breakdown.entries).toHaveLength(3);
    });

    it("only includes costs for the requested agent", () => {
      recordCost("agent-1", "user-1", tokenCost);
      recordCost("agent-2", "user-1", deployCost);

      const breakdown = getCostBreakdown("agent-1");
      expect(breakdown.totalCost).toBe(0.05);
      expect(breakdown.entries).toHaveLength(1);
    });
  });

  describe("getUserCostSummary", () => {
    it("returns zero totals for a user with no costs", () => {
      const summary = getUserCostSummary("user-1");
      expect(summary.totalCost).toBe(0);
      expect(Object.keys(summary.byAgent)).toHaveLength(0);
    });

    it("aggregates per-agent totals for a user", () => {
      recordCost("agent-1", "user-1", tokenCost);
      recordCost("agent-1", "user-1", computeCost);
      recordCost("agent-2", "user-1", deployCost);

      const summary = getUserCostSummary("user-1");
      expect(summary.totalCost).toBe(1.15);
      expect(summary.byAgent["agent-1"]).toBe(0.15);
      expect(summary.byAgent["agent-2"]).toBe(1.00);
    });

    it("only includes costs for the requested user", () => {
      recordCost("agent-1", "user-1", tokenCost);
      recordCost("agent-1", "user-2", deployCost);

      const summary = getUserCostSummary("user-1");
      expect(summary.totalCost).toBe(0.05);
    });
  });

  describe("getProjectedCost", () => {
    it("returns 0 when user has no costs this month", () => {
      expect(getProjectedCost("user-1")).toBe(0);
    });

    it("returns a non-negative projection", () => {
      recordCost("agent-1", "user-1", tokenCost);
      const projected = getProjectedCost("user-1");
      expect(projected).toBeGreaterThanOrEqual(0);
    });
  });

  describe("spending limits", () => {
    it("allows spending when no limit is set", () => {
      const result = checkSpendingLimit("user-1");
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it("allows spending when under the limit", () => {
      setSpendingLimit("user-1", 10.00);
      recordCost("agent-1", "user-1", tokenCost);

      const result = checkSpendingLimit("user-1");
      expect(result.allowed).toBe(true);
      expect(result.currentSpend).toBe(0.05);
      expect(result.remaining).toBe(9.95);
    });

    it("blocks spending when limit is reached", () => {
      setSpendingLimit("user-1", 1.00);
      recordCost("agent-1", "user-1", deployCost);

      const result = checkSpendingLimit("user-1");
      expect(result.allowed).toBe(false);
      expect(result.currentSpend).toBe(1.00);
      expect(result.remaining).toBe(0);
    });

    it("blocks spending when limit is exceeded", () => {
      setSpendingLimit("user-1", 0.50);
      recordCost("agent-1", "user-1", deployCost);

      const result = checkSpendingLimit("user-1");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("throws for negative spending limit", () => {
      expect(() => setSpendingLimit("user-1", -5)).toThrow(
        "Spending limit must be non-negative"
      );
    });
  });
});
