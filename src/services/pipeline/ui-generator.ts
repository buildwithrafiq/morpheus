import type { IGeminiService } from "@/services/interfaces";
import type {
  InputField,
  OutputField,
  GeneratedUI,
  UIComponent,
  DeploymentResult,
} from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

/**
 * Parses raw Gemini output into a structured GeneratedUI.
 */
export function parseUIOutput(
  raw: unknown,
  deploymentResultId: string
): GeneratedUI {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      id: (obj.id as string) || crypto.randomUUID(),
      deploymentResultId,
      publicUrl: (obj.publicUrl as string) || "",
      components: Array.isArray(obj.components)
        ? (obj.components as UIComponent[])
        : [],
      accessibilityScore: typeof obj.accessibilityScore === "number"
        ? obj.accessibilityScore
        : 0,
      responsive: typeof obj.responsive === "boolean"
        ? obj.responsive
        : true,
    };
  }

  return {
    id: crypto.randomUUID(),
    deploymentResultId,
    publicUrl: "",
    components: [],
    accessibilityScore: 0,
    responsive: true,
  };
}

/**
 * Generates default UI components based on input/output schemas.
 * Used to ensure the UI has at least basic form and display components.
 */
export function generateDefaultComponents(
  inputs: InputField[],
  outputs: OutputField[]
): UIComponent[] {
  const components: UIComponent[] = [];

  // Form component for inputs
  if (inputs.length > 0) {
    components.push({
      name: "AgentInputForm",
      type: "form",
      props: {
        fields: inputs.map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          label: f.description,
        })),
      },
    });
  }

  // Response display component for outputs
  if (outputs.length > 0) {
    components.push({
      name: "AgentResponseDisplay",
      type: "display",
      props: {
        fields: outputs.map((f) => ({
          name: f.name,
          type: f.type,
          label: f.description,
        })),
        streaming: true,
      },
    });
  }

  // Loading state component
  components.push({
    name: "LoadingIndicator",
    type: "feedback",
    props: { message: "Processing your request..." },
  });

  // Error display component
  components.push({
    name: "ErrorDisplay",
    type: "feedback",
    props: { retryable: true },
  });

  return components;
}

/**
 * Generates a public URL for the deployed UI.
 */
export function generatePublicUrl(deploymentResult: DeploymentResult): string {
  const baseEndpoint = deploymentResult.endpoint.replace(/\/$/, "");
  return `${baseEndpoint}/ui`;
}

/**
 * UI Generator - Analyzes agent input/output schemas and generates a
 * production-quality React web interface.
 *
 * Implements:
 * - Gemini call to generate React UI based on agent input/output schemas
 * - UI deployment and public URL generation
 */
export class UIGenerator {
  constructor(private gemini: IGeminiService) {}

  /**
   * Generates a UI for the given agent schemas and deployment.
   * Yields StreamChunks for progress tracking.
   */
  async *generate(
    inputs: InputField[],
    outputs: OutputField[],
    deploymentResult: DeploymentResult
  ): AsyncGenerator<StreamChunk> {
    yield { type: "thinking", content: "Generating UI with Gemini Flash..." };

    const stream = this.gemini.generateUI({ inputs, outputs });
    let rawResult: unknown;

    for await (const chunk of stream) {
      if (chunk.type === "result") {
        rawResult = chunk.content;
      } else if (chunk.type === "error") {
        yield chunk;
        return;
      } else {
        yield chunk;
      }
    }

    // Parse the raw output into a GeneratedUI
    let ui = parseUIOutput(rawResult, deploymentResult.id);

    // Ensure we have at least default components
    if (ui.components.length === 0) {
      ui = {
        ...ui,
        components: generateDefaultComponents(inputs, outputs),
      };
    }

    // Generate public URL
    if (!ui.publicUrl) {
      ui = {
        ...ui,
        publicUrl: generatePublicUrl(deploymentResult),
      };
    }

    yield { type: "code", content: ui };
    yield { type: "result", content: ui };
  }
}
