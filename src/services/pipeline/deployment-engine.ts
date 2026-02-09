import type { IDeployService, ISchemaValidator } from "@/services/interfaces";
import type { CodeBundle, DeploymentResult } from "@/types/agent";
import type { StreamChunk } from "@/types/pipeline";

const PROVIDERS: Array<"railway" | "render"> = ["railway", "render"];

/**
 * Creates local deployment instructions when all cloud providers fail.
 */
export function createLocalDeploymentResult(
  bundle: CodeBundle
): DeploymentResult {
  return {
    id: crypto.randomUUID(),
    codeBundleId: bundle.id,
    provider: "local",
    status: "stopped",
    endpoint: "http://localhost:3000",
    healthCheckPassed: false,
    envVars: ["GEMINI_API_KEY"],
    deploymentTime: 0,
    fallbackUsed: true,
    localInstructions: [
      "All cloud deployments failed. To run locally:",
      "1. Extract the code bundle to a directory",
      "2. Run `npm install` to install dependencies",
      "3. Set environment variables (GEMINI_API_KEY)",
      "4. Run `npm start` to start the agent",
      "5. The agent will be available at http://localhost:3000",
    ].join("\n"),
  };
}

/**
 * Deployment Engine - Takes a validated CodeBundle and deploys it to a cloud
 * provider with health checks and fallback logic.
 *
 * Implements:
 * - Docker container creation and cloud deployment (Railway/Render)
 * - Health check against deployed endpoint
 * - Provider fallback logic
 * - Output validation against DeploymentResultSchema
 */
export class DeploymentEngine {
  constructor(
    private deployer: IDeployService,
    private validator: ISchemaValidator
  ) {}

  /**
   * Deploys a CodeBundle, trying providers in order with fallback.
   * Yields StreamChunks for progress tracking.
   */
  async *deploy(bundle: CodeBundle): AsyncGenerator<StreamChunk> {
    const errors: string[] = [];

    for (const provider of PROVIDERS) {
      yield {
        type: "thinking",
        content: `Deploying to ${provider}...`,
      };

      try {
        const result = await this.deployToProvider(bundle, provider);

        if (result) {
          // Validate against schema
          const validation = this.validator.validateDeploymentResult(result);
          if (validation.success && validation.data) {
            yield { type: "result", content: validation.data };
            return;
          }

          yield {
            type: "thinking",
            content: `Deployment to ${provider} produced invalid result, trying next provider...`,
          };
          errors.push(`${provider}: schema validation failed`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown deployment error";
        errors.push(`${provider}: ${message}`);
        yield {
          type: "thinking",
          content: `Deployment to ${provider} failed: ${message}`,
        };
      }
    }

    // All cloud providers failed - provide local deployment
    yield {
      type: "thinking",
      content: "All cloud deployments failed. Providing local deployment instructions.",
    };

    const localResult = createLocalDeploymentResult(bundle);
    const validation = this.validator.validateDeploymentResult(localResult);

    if (validation.success && validation.data) {
      yield { type: "result", content: validation.data };
    } else {
      // Even local result failed validation - return it unvalidated
      yield { type: "result", content: localResult };
    }
  }

  /**
   * Attempts deployment to a specific provider with health check.
   * Returns the DeploymentResult or null if health check fails.
   */
  private async deployToProvider(
    bundle: CodeBundle,
    provider: "railway" | "render"
  ): Promise<DeploymentResult | null> {
    const result = await this.deployer.deploy(bundle, provider);

    // Perform health check
    if (result.endpoint) {
      const healthy = await this.deployer.healthCheck(result.endpoint);
      if (!healthy) {
        return {
          ...result,
          status: "error",
          healthCheckPassed: false,
        };
      }
      return {
        ...result,
        healthCheckPassed: true,
      };
    }

    return result;
  }
}
