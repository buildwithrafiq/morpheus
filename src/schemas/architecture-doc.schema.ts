import { z } from "zod";

// Gemini often returns non-UUID ids; accept any string and coerce to UUID if needed
const flexId = z.string().transform(v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : crypto.randomUUID()
);

export const PromptStrategySchema = z.object({
  systemPrompt: z.string(),
  fewShotExamples: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })),
  outputFormat: z.string(),
});

export const DataFlowStepSchema = z.object({
  step: z.number(),
  name: z.string(),
  input: z.string(),
  output: z.string(),
  description: z.string(),
});

export const StateManagementSchema = z.object({
  type: z.string().transform(v => {
    const valid = ["stateless", "session", "persistent"];
    return valid.includes(v) ? v : "stateless";
  }),
  storage: z.string(),
});

export const ToolSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.any().transform(v => (typeof v === 'object' && v !== null ? v : {})),
});

export const ConversationNodeSchema = z.object({
  id: z.string(),
  type: z.string().transform(v => {
    const valid = ["start", "process", "decision", "end"];
    return valid.includes(v) ? v : "process";
  }),
  next: z.array(z.string()),
});

export const ErrorStrategySchema = z.object({
  retryPolicy: z.object({
    maxRetries: z.any().transform(v => typeof v === 'number' ? v : 3),
    backoffMs: z.any().transform(v => typeof v === 'number' && v > 0 ? v : 1000),
  }),
  fallbackBehavior: z.string(),
});

export const MultiAgentStrategySchema = z.object({
  agents: z.array(z.object({
    role: z.string(),
    model: z.string(),
  })),
  coordinationPattern: z.string(),
});

export const IntegrationSpecSchema = z.object({
  name: z.string(),
  endpoint: z.string(),
  authFlow: z.string(),
  rateLimit: z.any().transform(v => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') { const n = parseFloat(v); if (!isNaN(n)) return n; }
    return undefined;
  }).optional(),
});

export const TradeoffSchema = z.object({
  decision: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

export const ArchitectureDocSchema = z.object({
  id: flexId,
  agentSpecId: flexId,
  selectedModel: z.string().transform(v => {
    const valid = ["gemini-3-flash", "gemini-3-pro"];
    return valid.includes(v) ? v : "gemini-3-flash";
  }),
  promptStrategy: PromptStrategySchema,
  dataFlow: z.array(DataFlowStepSchema),
  stateManagement: StateManagementSchema,
  tools: z.array(ToolSpecSchema),
  conversationFlow: z.array(ConversationNodeSchema),
  errorHandling: ErrorStrategySchema,
  multiAgentStrategy: MultiAgentStrategySchema.optional(),
  integrationSpecs: z.array(IntegrationSpecSchema).optional(),
  tradeoffs: z.array(TradeoffSchema).optional(),
});

export type ArchitectureDocInput = z.input<typeof ArchitectureDocSchema>;
export type ArchitectureDocOutput = z.output<typeof ArchitectureDocSchema>;
