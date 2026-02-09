// @vitest-environment node
import { describe, it, expect } from "vitest";
import { sanitize, containsDangerousContent, escapeHtml } from "./input-sanitizer";

describe("input-sanitizer", () => {
  describe("sanitize", () => {
    it("returns plain text unchanged (except single quotes)", () => {
      const result = sanitize("Hello world 123");
      expect(result.sanitized).toBe("Hello world 123");
      expect(result.wasModified).toBe(false);
    });

    it("strips HTML tags", () => {
      const result = sanitize("<b>bold</b> text");
      expect(result.sanitized).not.toContain("<b>");
      expect(result.sanitized).not.toContain("</b>");
      expect(result.wasModified).toBe(true);
    });

    it("strips script tags and their content", () => {
      const result = sanitize('before<script>alert("xss")</script>after');
      expect(result.sanitized).not.toContain("script");
      expect(result.sanitized).not.toContain("alert");
      expect(result.wasModified).toBe(true);
    });

    it("strips event handler attributes", () => {
      const result = sanitize('text onclick="evil()" more');
      expect(result.sanitized).not.toContain("onclick");
      expect(result.wasModified).toBe(true);
    });

    it("strips javascript: URIs", () => {
      const result = sanitize("javascript: void(0)");
      expect(result.sanitized).not.toContain("javascript:");
      expect(result.wasModified).toBe(true);
    });

    it("escapes angle brackets", () => {
      const result = sanitize("a < b > c");
      expect(result.sanitized).toContain("&lt;");
      expect(result.sanitized).toContain("&gt;");
    });

    it("escapes single quotes to prevent SQL injection", () => {
      const result = sanitize("O'Reilly");
      expect(result.sanitized).toContain("''");
      expect(result.wasModified).toBe(true);
    });
  });

  describe("containsDangerousContent", () => {
    it("returns false for safe input", () => {
      expect(containsDangerousContent("Hello world")).toBe(false);
    });

    it("detects HTML tags", () => {
      expect(containsDangerousContent("<div>test</div>")).toBe(true);
    });

    it("detects script tags", () => {
      expect(containsDangerousContent("<script>alert(1)</script>")).toBe(true);
    });
  });

  describe("escapeHtml", () => {
    it("escapes all HTML special characters", () => {
      const result = escapeHtml('<div class="a">b & c\'d</div>');
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
      expect(result).toContain("&#x27;");
    });
  });
});
