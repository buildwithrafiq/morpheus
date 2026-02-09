import { describe, it, expect, beforeEach } from "vitest";
import {
  checkAgentCreationLimit,
  checkApiQuota,
  getTierDefinition,
  getUserTier,
  hasFeatureAccess,
  resetTierManager,
  setAgentCount,
  setApiCallCount,
  setUserTier,
} from "./tier-manager";

describe("tier-manager", () => {
  beforeEach(() => {
    resetTierManager();
  });

  it("defaults to free tier", () => {
    expect(getUserTier("user-1")).toBe("free");
  });

  it("returns correct tier definitions", () => {
    const free = getTierDefinition("free");
    expect(free.agentLimit).toBe(3);
    expect(free.apiCallQuota).toBe(1000);

    const pro = getTierDefinition("pro");
    expect(pro.agentLimit).toBe(25);
  });

  it("allows agent creation when under limit", () => {
    setAgentCount("user-1", 2);
    const result = checkAgentCreationLimit("user-1");
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("blocks agent creation at limit with upgrade prompt", () => {
    setAgentCount("user-1", 3);
    const result = checkAgentCreationLimit("user-1");
    expect(result.allowed).toBe(false);
    expect(result.upgradePrompt).toBeDefined();
    expect(result.upgradePrompt).toContain("pro");
  });

  it("allows creation on pro tier with higher limit", () => {
    setUserTier("user-1", "pro");
    setAgentCount("user-1", 10);
    const result = checkAgentCreationLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("enterprise tier has unlimited agents", () => {
    setUserTier("user-1", "enterprise");
    setAgentCount("user-1", 1000);
    const result = checkAgentCreationLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("checks API quota correctly", () => {
    setApiCallCount("user-1", 999);
    expect(checkApiQuota("user-1").allowed).toBe(true);

    setApiCallCount("user-1", 1000);
    expect(checkApiQuota("user-1").allowed).toBe(false);
  });

  it("checks feature access by tier", () => {
    expect(hasFeatureAccess("user-1", "basic-agents")).toBe(true);
    expect(hasFeatureAccess("user-1", "sso")).toBe(false);

    setUserTier("user-1", "enterprise");
    expect(hasFeatureAccess("user-1", "sso")).toBe(true);
  });
});
