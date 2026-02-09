// @vitest-environment node
import { describe, it, expect } from "vitest";
import { generateApiKey, isValidApiKey } from "./api-key-generator";

describe("api-key-generator", () => {
  describe("generateApiKey", () => {
    it("generates a key with the mk_ prefix", () => {
      const key = generateApiKey();
      expect(key.startsWith("mk_")).toBe(true);
    });

    it("generates a key body of at least 32 characters", () => {
      const key = generateApiKey();
      const body = key.slice(3);
      expect(body.length).toBeGreaterThanOrEqual(32);
    });

    it("generates unique keys on consecutive calls", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    it("respects custom length", () => {
      const key = generateApiKey(50);
      const body = key.slice(3);
      expect(body.length).toBe(50);
    });

    it("throws for length below 32", () => {
      expect(() => generateApiKey(31)).toThrow("at least 32");
    });
  });

  describe("isValidApiKey", () => {
    it("validates a properly generated key", () => {
      const key = generateApiKey();
      expect(isValidApiKey(key)).toBe(true);
    });

    it("rejects keys without the prefix", () => {
      expect(isValidApiKey("abcdefghijklmnopqrstuvwxyz123456")).toBe(false);
    });

    it("rejects keys with body shorter than 32 chars", () => {
      expect(isValidApiKey("mk_short")).toBe(false);
    });
  });
});
