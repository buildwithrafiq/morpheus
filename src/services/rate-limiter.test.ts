// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  configureRateLimit,
  checkRateLimit,
  getRateLimitConfig,
  resetRateLimiter,
} from "./rate-limiter";

beforeEach(() => {
  resetRateLimiter();
});

describe("rate-limiter", () => {
  describe("configureRateLimit", () => {
    it("stores config for a key", () => {
      configureRateLimit("key-1", { maxRequests: 5, windowMs: 10_000 });
      expect(getRateLimitConfig("key-1")).toEqual({ maxRequests: 5, windowMs: 10_000 });
    });

    it("throws for invalid maxRequests", () => {
      expect(() => configureRateLimit("k", { maxRequests: 0, windowMs: 1000 })).toThrow();
    });

    it("throws for invalid windowMs", () => {
      expect(() => configureRateLimit("k", { maxRequests: 10, windowMs: 0 })).toThrow();
    });
  });

  describe("checkRateLimit", () => {
    it("allows requests under the limit", () => {
      configureRateLimit("key-1", { maxRequests: 3, windowMs: 10_000 });
      const result = checkRateLimit("key-1", 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("blocks the (N+1)th request within the window", () => {
      configureRateLimit("key-1", { maxRequests: 3, windowMs: 10_000 });

      checkRateLimit("key-1", 1000);
      checkRateLimit("key-1", 2000);
      checkRateLimit("key-1", 3000);

      const blocked = checkRateLimit("key-1", 4000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it("provides a valid retryAfterMs when blocked", () => {
      configureRateLimit("key-1", { maxRequests: 2, windowMs: 5000 });

      checkRateLimit("key-1", 1000);
      checkRateLimit("key-1", 2000);

      const blocked = checkRateLimit("key-1", 3000);
      // Oldest request at 1000, window is 5000, so retry after 1000 + 5000 - 3000 = 3000ms
      expect(blocked.retryAfterMs).toBe(3000);
    });

    it("allows requests again after the window expires", () => {
      configureRateLimit("key-1", { maxRequests: 2, windowMs: 5000 });

      checkRateLimit("key-1", 1000);
      checkRateLimit("key-1", 2000);

      // Window expires for the first request at 6001
      const result = checkRateLimit("key-1", 6001);
      expect(result.allowed).toBe(true);
    });

    it("uses default config when none is set", () => {
      const result = checkRateLimit("unknown-key", 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // default is 100
    });

    it("tracks keys independently", () => {
      configureRateLimit("key-1", { maxRequests: 1, windowMs: 10_000 });
      configureRateLimit("key-2", { maxRequests: 1, windowMs: 10_000 });

      checkRateLimit("key-1", 1000);
      const blocked = checkRateLimit("key-1", 2000);
      const allowed = checkRateLimit("key-2", 2000);

      expect(blocked.allowed).toBe(false);
      expect(allowed.allowed).toBe(true);
    });
  });
});
