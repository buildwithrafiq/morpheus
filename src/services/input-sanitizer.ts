/**
 * Input sanitizer for preventing HTML/script/SQL injection attacks.
 * Validates and sanitizes user input before processing.
 */

export interface SanitizeResult {
  sanitized: string;
  wasModified: boolean;
}

// Patterns that indicate potential injection attacks
const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;
const SCRIPT_TAG_RE = /<script[\s>][\s\S]*?<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;
const SQL_INJECTION_RE =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b\s+(FROM|INTO|TABLE|DATABASE|ALL|SET)|\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?|--\s|;\s*(DROP|DELETE|UPDATE|INSERT)|'\s*(OR|AND)\s+')/gi;

/**
 * Sanitizes input by removing HTML tags, script content,
 * event handlers, javascript: URIs, and SQL injection patterns.
 */
export function sanitize(input: string): SanitizeResult {
  let result = input;

  // Remove script tags and their content first (most dangerous)
  result = result.replace(SCRIPT_TAG_RE, "");

  // Remove event handler attributes
  result = result.replace(EVENT_HANDLER_RE, "");

  // Remove javascript: URIs
  result = result.replace(JAVASCRIPT_URI_RE, "");

  // Remove remaining HTML tags
  result = result.replace(HTML_TAG_RE, "");

  // Neutralize SQL injection patterns by escaping single quotes
  result = result.replace(/'/g, "''");

  // Escape remaining angle brackets that might not have been caught
  result = result.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return {
    sanitized: result,
    wasModified: result !== input,
  };
}

/**
 * Checks whether input contains potentially dangerous content
 * without modifying it. Useful for validation-only scenarios.
 */
export function containsDangerousContent(input: string): boolean {
  return (
    HTML_TAG_RE.test(input) ||
    SCRIPT_TAG_RE.test(input) ||
    EVENT_HANDLER_RE.test(input) ||
    JAVASCRIPT_URI_RE.test(input) ||
    SQL_INJECTION_RE.test(input)
  );
}

/**
 * Escapes HTML special characters for safe display.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
