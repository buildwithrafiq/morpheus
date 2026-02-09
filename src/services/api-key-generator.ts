/**
 * Cryptographically secure API key generation.
 * Uses crypto.getRandomValues for entropy.
 */

const KEY_LENGTH = 40; // characters (well above the 32-char minimum)
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a cryptographically secure API key of at least 32 characters.
 * Uses crypto.getRandomValues for sufficient entropy.
 */
export function generateApiKey(length: number = KEY_LENGTH): string {
  if (length < 32) {
    throw new Error("API key length must be at least 32 characters");
  }

  const values = new Uint8Array(length);
  crypto.getRandomValues(values);

  let key = "";
  for (let i = 0; i < length; i++) {
    key += CHARSET[values[i]! % CHARSET.length];
  }

  return `mk_${key}`;
}

/**
 * Validates that a key meets minimum security requirements:
 * - At least 32 characters long (excluding prefix)
 * - Starts with the expected prefix
 */
export function isValidApiKey(key: string): boolean {
  if (!key.startsWith("mk_")) return false;
  const body = key.slice(3);
  return body.length >= 32;
}
