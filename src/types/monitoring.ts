import type { CostEntry } from "./sharing";

export interface UsageMetrics {
  agentId: string;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  tokenUsage: { input: number; output: number };
  costBreakdown: CostEntry[];
}

export interface RequestLog {
  id: string;
  agentId: string;
  timestamp: string;
  statusCode: number;
  latency: number;
  tokenCount: number;
  request: string;
  response: string;
}
