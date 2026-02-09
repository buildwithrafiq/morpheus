import type { PipelineStage } from "./pipeline";
import type { Agent } from "./agent";

export type MorpheusError =
  | { type: "validation"; field: string; message: string }
  | { type: "api"; statusCode: number; message: string; retryable: boolean }
  | { type: "pipeline"; stage: PipelineStage; message: string; partialResults?: Partial<Agent> }
  | { type: "schema"; path: string; expected: string; received: string }
  | { type: "deployment"; provider: string; message: string; fallbackAvailable: boolean }
  | { type: "storage"; operation: string; message: string }
  | { type: "rate_limit"; retryAfter: number }
  | { type: "quota"; limit: string; current: number; max: number };
