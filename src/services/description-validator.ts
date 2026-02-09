const MIN_LENGTH = 10;
const MAX_LENGTH = 10_000;

export interface DescriptionValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates a natural language agent description.
 * Accepts strings between 10 and 10,000 characters (inclusive).
 */
export function validateDescription(input: string): DescriptionValidationResult {
  if (input.length < MIN_LENGTH) {
    return {
      valid: false,
      message: `Description is too short. Please add more detail (minimum ${MIN_LENGTH} characters).`,
    };
  }

  if (input.length > MAX_LENGTH) {
    return {
      valid: false,
      message: `Description exceeds the maximum length of ${MAX_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true };
}
