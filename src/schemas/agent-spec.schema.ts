import { z } from "zod";

// Gemini often returns non-UUID ids; accept any string and coerce to UUID if needed
const flexId = z.string().transform(v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : crypto.randomUUID()
);

export const InputFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().transform(v => {
    const valid = ["text", "number", "boolean", "file", "select"];
    return valid.includes(v) ? v : "text";
  }),
  required: z.boolean(),
  description: z.string(),
  validation: z.string().optional(),
});

export const OutputFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string(),
});

export const DataSourceSchema = z.object({
  name: z.string(),
  type: z.string(),
  config: z.any().transform(v => (typeof v === 'object' && v !== null ? v : {})),
});

export const IntegrationSchema = z.object({
  name: z.string(),
  type: z.string(),
  authType: z.string(),
  config: z.any().transform(v => (typeof v === 'object' && v !== null ? v : {})),
});

export const EdgeCaseSchema = z.object({
  description: z.string().min(1),
  mitigation: z.string().min(1),
});

export const AgentPersonalitySchema = z.object({
  tone: z.string(),
  formality: z.string().transform(v => {
    const valid = ["casual", "neutral", "formal"];
    return valid.includes(v) ? v : "neutral";
  }),
  verbosity: z.string().transform(v => {
    const valid = ["concise", "balanced", "detailed"];
    return valid.includes(v) ? v : "balanced";
  }),
});

export const AdvancedOptionsSchema = z.object({
  modelPreference: z.enum(["flash", "pro"]).optional(),
  maxResponseTime: z.number().positive().optional(),
  costConstraint: z.number().positive().optional(),
  integrationRequirements: z.array(z.string()).optional(),
});

export const AgentSpecSchema = z.object({
  id: flexId,
  corePurpose: z.string().min(1),
  inputRequirements: z.array(InputFieldSchema).min(1),
  outputRequirements: z.array(OutputFieldSchema).min(1),
  dataSources: z.array(DataSourceSchema),
  integrations: z.array(IntegrationSchema),
  edgeCases: z.array(EdgeCaseSchema),
  personality: AgentPersonalitySchema,
  communicationStyle: z.string(),
  complexityScore: z.number().int().min(1).max(10),
  inferredFields: z.array(z.string()),
  advancedOptions: AdvancedOptionsSchema.optional(),
});

export type AgentSpecInput = z.input<typeof AgentSpecSchema>;
export type AgentSpecOutput = z.output<typeof AgentSpecSchema>;
