import { describe, it, expect } from "vitest";
import { estimateComplexity } from "./complexity-estimator";

describe("estimateComplexity", () => {
  it("returns non-negative values and a valid score for a simple description", () => {
    const result = estimateComplexity("A simple chatbot that answers questions.");
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.buildTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.costPerExecution).toBeGreaterThanOrEqual(0);
    expect(result.apiQuotaUsage).toBeGreaterThanOrEqual(0);
  });

  it("gives a low score for simple descriptions", () => {
    const result = estimateComplexity("A chatbot for customer support tasks.");
    expect(result.score).toBeLessThanOrEqual(3);
  });

  it("gives a higher score when complexity keywords are present", () => {
    const result = estimateComplexity(
      "A chatbot with database integration, real-time streaming, and OAuth auth."
    );
    expect(result.score).toBeGreaterThan(3);
  });

  it("increases estimates when integration keywords are present", () => {
    const simple = estimateComplexity("A chatbot for customer support tasks.");
    const complex = estimateComplexity(
      "A chatbot with database integration, real-time streaming, and OAuth auth."
    );
    expect(complex.buildTimeMinutes).toBeGreaterThan(simple.buildTimeMinutes);
    expect(complex.apiQuotaUsage).toBeGreaterThan(simple.apiQuotaUsage);
    expect(complex.score).toBeGreaterThan(simple.score);
  });

  it("increases estimates for longer descriptions", () => {
    const short = estimateComplexity("A basic helper bot.");
    const long = estimateComplexity("A ".repeat(500) + "helper bot.");
    expect(long.buildTimeMinutes).toBeGreaterThan(short.buildTimeMinutes);
    expect(long.apiQuotaUsage).toBeGreaterThan(short.apiQuotaUsage);
  });

  it("caps score at 10", () => {
    const result = estimateComplexity(
      "Build a multi-agent orchestration pipeline with database storage, real-time streaming, OAuth authentication, Stripe integration, GraphQL API, webhook endpoints, and Kubernetes deployment with cron scheduling."
    );
    expect(result.score).toBeLessThanOrEqual(10);
  });
});
