import { describe, it, expect } from "vitest";
import { validateDescription } from "./description-validator";

describe("validateDescription", () => {
  it("rejects empty string", () => {
    const result = validateDescription("");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("too short");
  });

  it("rejects string shorter than 10 characters", () => {
    const result = validateDescription("short");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("too short");
  });

  it("accepts string of exactly 10 characters", () => {
    const result = validateDescription("a".repeat(10));
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("accepts string of exactly 10,000 characters", () => {
    const result = validateDescription("a".repeat(10_000));
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("rejects string longer than 10,000 characters", () => {
    const result = validateDescription("a".repeat(10_001));
    expect(result.valid).toBe(false);
    expect(result.message).toContain("exceeds");
  });
});
