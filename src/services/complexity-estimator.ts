export interface ComplexityEstimate {
  score: number; // 1-10 complexity score
  buildTimeMinutes: number;
  costPerExecution: number;
  apiQuotaUsage: number;
  buildTokens: number;   // estimated tokens consumed during build
  buildCost: number;      // estimated dollar cost for the build
}

const INTEGRATION_KEYWORDS = [
  "integration",
  "api",
  "database",
  "multi",
  "complex",
  "real-time",
  "streaming",
  "auth",
  "oauth",
  "webhook",
  "slack",
  "stripe",
  "twilio",
  "firebase",
  "graphql",
  "websocket",
  "mqtt",
];

const COMPLEXITY_SIGNALS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(integration|api|endpoint)\b/i, weight: 2 },
  { pattern: /\b(real-time|streaming|websocket|mqtt)\b/i, weight: 2 },
  { pattern: /\b(database|storage|persist|sqlite|postgres|mongo)\b/i, weight: 2 },
  { pattern: /\b(auth|oauth|jwt|login|session)\b/i, weight: 1 },
  { pattern: /\b(multi-agent|orchestrat|coordinat|pipeline)\b/i, weight: 2 },
  { pattern: /\b(deploy|docker|container|kubernetes)\b/i, weight: 1 },
  { pattern: /\b(test|validation|error.handling|retry)\b/i, weight: 1 },
  { pattern: /\b(webhook|slack|stripe|twilio|firebase)\b/i, weight: 1 },
  { pattern: /\b(graphql|grpc|rest)\b/i, weight: 1 },
  { pattern: /\b(schedule|cron|queue|worker)\b/i, weight: 1 },
];

/**
 * Estimates build complexity from a valid description string.
 * Uses heuristics based on description length, keyword detection,
 * and integration mentions to produce non-negative estimates.
 */
export function estimateComplexity(description: string): ComplexityEstimate {
  const len = description.length;
  const lower = description.toLowerCase();

  // Keyword match count for build time / cost estimation
  const matchCount = INTEGRATION_KEYWORDS.filter((k) => lower.includes(k)).length;

  // Complexity score (1-10) from weighted signal matching
  let rawScore = 1;
  for (const signal of COMPLEXITY_SIGNALS) {
    if (signal.pattern.test(description)) {
      rawScore += signal.weight;
    }
  }
  if (len > 500) rawScore += 1;
  if (len > 1500) rawScore += 1;
  const score = Math.min(Math.max(rawScore, 1), 10);

  const baseMinutes = 2;
  const lengthFactor = Math.min(len / 2000, 2);
  const keywordFactor = matchCount * 0.5;

  const buildTimeMinutes =
    Math.round((baseMinutes + lengthFactor + keywordFactor) * 10) / 10;

  const costPerExecution =
    Math.round((0.01 + lengthFactor * 0.02 + keywordFactor * 0.01) * 1000) / 1000;

  const apiQuotaUsage = Math.round(1000 + len * 2 + matchCount * 500);

  // Build cost: tokens used during the multi-step build pipeline
  const buildTokens = Math.round(10_000 + len * 15 + matchCount * 8_000 + (score > 7 ? 20_000 : 0));
  const COST_PER_1K_TOKENS = 0.0005; // blended input/output rate
  const buildCost = Math.round(buildTokens * COST_PER_1K_TOKENS) / 1000;

  return { score, buildTimeMinutes, costPerExecution, apiQuotaUsage, buildTokens, buildCost };
}
