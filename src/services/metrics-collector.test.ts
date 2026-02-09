import { describe, it, expect, beforeEach } from "vitest";
import {
  recordRequest,
  getMetrics,
  getAggregatedMetrics,
  getRollingErrorRate,
  onAlert,
  resetMetricsCollector,
  type RequestEvent,
  type AlertNotification,
} from "./metrics-collector";

beforeEach(() => {
  resetMetricsCollector();
});

function makeEvent(
  overrides: Partial<RequestEvent> = {}
): RequestEvent {
  return {
    agentId: "agent-1",
    timestamp: 1000000,
    statusCode: 200,
    latency: 50,
    tokenCount: 100,
    ...overrides,
  };
}

describe("metrics-collector", () => {
  describe("recordRequest / getMetrics", () => {
    it("stores and retrieves request events for an agent", () => {
      recordRequest(makeEvent());
      recordRequest(makeEvent({ agentId: "agent-2" }));

      const metrics = getMetrics("agent-1");
      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.agentId).toBe("agent-1");
    });

    it("filters by time range", () => {
      recordRequest(makeEvent({ timestamp: 100 }));
      recordRequest(makeEvent({ timestamp: 200 }));
      recordRequest(makeEvent({ timestamp: 300 }));

      const metrics = getMetrics("agent-1", 150, 250);
      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.timestamp).toBe(200);
    });
  });

  describe("getAggregatedMetrics", () => {
    it("returns zeroed metrics when no events exist", () => {
      const agg = getAggregatedMetrics("agent-1", 0, 999999);
      expect(agg.requestCount).toBe(0);
      expect(agg.avgResponseTime).toBe(0);
      expect(agg.errorRate).toBe(0);
      expect(agg.totalTokens).toBe(0);
    });

    it("computes correct request count and average response time", () => {
      recordRequest(makeEvent({ timestamp: 100, latency: 40 }));
      recordRequest(makeEvent({ timestamp: 200, latency: 60 }));

      const agg = getAggregatedMetrics("agent-1", 0, 300);
      expect(agg.requestCount).toBe(2);
      expect(agg.avgResponseTime).toBe(50);
    });

    it("computes error rate from status codes >= 400", () => {
      recordRequest(makeEvent({ timestamp: 100, statusCode: 200 }));
      recordRequest(makeEvent({ timestamp: 200, statusCode: 500 }));
      recordRequest(makeEvent({ timestamp: 300, statusCode: 404 }));
      recordRequest(makeEvent({ timestamp: 400, statusCode: 200 }));

      const agg = getAggregatedMetrics("agent-1", 0, 500);
      expect(agg.errorRate).toBe(0.5);
    });

    it("computes total token consumption", () => {
      recordRequest(makeEvent({ timestamp: 100, tokenCount: 50 }));
      recordRequest(makeEvent({ timestamp: 200, tokenCount: 150 }));

      const agg = getAggregatedMetrics("agent-1", 0, 300);
      expect(agg.totalTokens).toBe(200);
    });

    it("computes latency percentiles", () => {
      // 10 events with latencies 10, 20, ..., 100
      for (let i = 1; i <= 10; i++) {
        recordRequest(makeEvent({ timestamp: i * 100, latency: i * 10 }));
      }

      const agg = getAggregatedMetrics("agent-1", 0, 1100);
      expect(agg.latencyP50).toBe(50);
      expect(agg.latencyP95).toBeGreaterThanOrEqual(90);
      expect(agg.latencyP99).toBeGreaterThanOrEqual(90);
    });
  });

  describe("getRollingErrorRate", () => {
    it("returns 0 when no events exist", () => {
      expect(getRollingErrorRate("agent-1", Date.now())).toBe(0);
    });

    it("computes error rate within the 5-minute window", () => {
      const now = 1_000_000;
      const windowMs = 5 * 60 * 1000;

      // 2 successes, 1 error within window
      recordRequest(makeEvent({ timestamp: now - 1000, statusCode: 200 }));
      recordRequest(makeEvent({ timestamp: now - 500, statusCode: 200 }));
      recordRequest(makeEvent({ timestamp: now - 100, statusCode: 500 }));

      // 1 error outside window (should be excluded)
      recordRequest(makeEvent({ timestamp: now - windowMs - 1000, statusCode: 500 }));

      const rate = getRollingErrorRate("agent-1", now);
      expect(rate).toBeCloseTo(1 / 3);
    });
  });

  describe("alerting", () => {
    it("fires alert when error rate exceeds 10%", () => {
      const alerts: AlertNotification[] = [];
      onAlert((a) => alerts.push(a));

      const now = 1_000_000;
      // Record 1 success, then 2 errors -> 66% error rate
      recordRequest(makeEvent({ timestamp: now - 200, statusCode: 200 }));
      recordRequest(makeEvent({ timestamp: now - 100, statusCode: 500 }));
      recordRequest(makeEvent({ timestamp: now, statusCode: 500 }));

      // Alert should have fired on the last event
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const last = alerts[alerts.length - 1]!;
      expect(last.agentId).toBe("agent-1");
      expect(last.type).toBe("error_rate");
      expect(last.errorRate).toBeGreaterThan(0.10);
    });

    it("does not fire alert when error rate is at or below 10%", () => {
      const alerts: AlertNotification[] = [];
      onAlert((a) => alerts.push(a));

      const now = 1_000_000;
      // 10 successes, 1 error -> ~9% error rate
      for (let i = 0; i < 10; i++) {
        recordRequest(makeEvent({ timestamp: now - (10 - i) * 100, statusCode: 200 }));
      }
      recordRequest(makeEvent({ timestamp: now, statusCode: 500 }));

      // Filter to only alerts triggered by the last event
      const relevantAlerts = alerts.filter((a) => a.triggeredAt === now);
      expect(relevantAlerts).toHaveLength(0);
    });
  });
});
