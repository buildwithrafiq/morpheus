/**
 * Metrics collection and alerting service.
 *
 * Collects request logs, computes time-series aggregations
 * (request volume, latency percentiles, error rate, token consumption),
 * and triggers alerts when the rolling 5-minute error rate exceeds 10%.
 *
 * Requirements: 14.1, 14.2, 14.3
 */

export interface RequestEvent {
  agentId: string;
  timestamp: number; // epoch ms
  statusCode: number;
  latency: number; // ms
  tokenCount: number;
}

export interface AggregatedMetrics {
  agentId: string;
  startTime: number;
  endTime: number;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  totalTokens: number;
}

export interface AlertNotification {
  agentId: string;
  type: "error_rate";
  message: string;
  errorRate: number;
  windowStart: number;
  windowEnd: number;
  triggeredAt: number;
}

export type AlertCallback = (alert: AlertNotification) => void;

// --- Internal state ---

const requestEvents: RequestEvent[] = [];
const alertCallbacks: AlertCallback[] = [];

const ALERT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ALERT_THRESHOLD = 0.10; // 10%

// --- Public API ---

/**
 * Records a request event and checks the error-rate alert condition.
 */
export function recordRequest(event: RequestEvent): void {
  requestEvents.push(event);
  checkAlertCondition(event.agentId, event.timestamp);
}

/**
 * Returns all recorded request events for an agent within an optional time range.
 */
export function getMetrics(
  agentId: string,
  startTime?: number,
  endTime?: number
): RequestEvent[] {
  return requestEvents.filter((e) => {
    if (e.agentId !== agentId) return false;
    if (startTime !== undefined && e.timestamp < startTime) return false;
    if (endTime !== undefined && e.timestamp > endTime) return false;
    return true;
  });
}

/**
 * Computes aggregated metrics for an agent over a time range.
 */
export function getAggregatedMetrics(
  agentId: string,
  startTime: number,
  endTime: number
): AggregatedMetrics {
  const events = getMetrics(agentId, startTime, endTime);

  if (events.length === 0) {
    return {
      agentId,
      startTime,
      endTime,
      requestCount: 0,
      avgResponseTime: 0,
      errorRate: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      totalTokens: 0,
    };
  }

  const requestCount = events.length;
  const totalLatency = events.reduce((sum, e) => sum + e.latency, 0);
  const avgResponseTime = totalLatency / requestCount;

  const errorCount = events.filter((e) => e.statusCode >= 400).length;
  const errorRate = errorCount / requestCount;

  const totalTokens = events.reduce((sum, e) => sum + e.tokenCount, 0);

  // Latency percentiles
  const sortedLatencies = events.map((e) => e.latency).sort((a, b) => a - b);
  const latencyP50 = percentile(sortedLatencies, 0.50);
  const latencyP95 = percentile(sortedLatencies, 0.95);
  const latencyP99 = percentile(sortedLatencies, 0.99);

  return {
    agentId,
    startTime,
    endTime,
    requestCount,
    avgResponseTime,
    errorRate,
    latencyP50,
    latencyP95,
    latencyP99,
    totalTokens,
  };
}

/**
 * Computes the rolling 5-minute error rate for an agent at a given point in time.
 */
export function getRollingErrorRate(agentId: string, now: number): number {
  const windowStart = now - ALERT_WINDOW_MS;
  const windowEvents = getMetrics(agentId, windowStart, now);
  if (windowEvents.length === 0) return 0;
  const errors = windowEvents.filter((e) => e.statusCode >= 400).length;
  return errors / windowEvents.length;
}

/**
 * Registers a callback to be invoked when an alert fires.
 */
export function onAlert(callback: AlertCallback): void {
  alertCallbacks.push(callback);
}

/**
 * Clears all recorded events, callbacks, and state. Used for testing.
 */
export function resetMetricsCollector(): void {
  requestEvents.length = 0;
  alertCallbacks.length = 0;
}

// --- Internal helpers ---

/**
 * Checks the rolling 5-minute error rate and fires an alert if it exceeds 10%.
 */
function checkAlertCondition(agentId: string, now: number): void {
  const windowStart = now - ALERT_WINDOW_MS;
  const windowEvents = requestEvents.filter(
    (e) => e.agentId === agentId && e.timestamp >= windowStart && e.timestamp <= now
  );

  if (windowEvents.length === 0) return;

  const errors = windowEvents.filter((e) => e.statusCode >= 400).length;
  const errorRate = errors / windowEvents.length;

  if (errorRate > ALERT_THRESHOLD) {
    const alert: AlertNotification = {
      agentId,
      type: "error_rate",
      message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds 10% threshold over the last 5 minutes`,
      errorRate,
      windowStart,
      windowEnd: now,
      triggeredAt: now,
    };
    for (const cb of alertCallbacks) {
      cb(alert);
    }
  }
}

/**
 * Computes a percentile value from a sorted array using nearest-rank method.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, index)]!;
}
