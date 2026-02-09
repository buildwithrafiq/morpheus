import { z } from "zod";

// Gemini often returns non-UUID ids; accept any string and coerce to UUID if needed
const flexId = z.string().transform(v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : crypto.randomUUID()
);

export const DeploymentResultSchema = z.object({
  id: flexId,
  codeBundleId: flexId,
  provider: z.string().transform(v => {
    const valid = ["railway", "render", "local"];
    return valid.includes(v) ? v : "local";
  }),
  status: z.string().transform(v => {
    const valid = ["running", "stopped", "error"];
    return valid.includes(v) ? v : "stopped";
  }),
  endpoint: z.string(),
  healthCheckPassed: z.boolean(),
  containerImage: z.string().optional(),
  envVars: z.array(z.string()),
  deploymentTime: z.number().nonnegative(),
  fallbackUsed: z.boolean(),
  localInstructions: z.string().optional(),
});

export type DeploymentResultInput = z.input<typeof DeploymentResultSchema>;
export type DeploymentResultOutput = z.output<typeof DeploymentResultSchema>;
