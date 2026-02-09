import type { IDeployService } from "@/services/interfaces";
import type { CodeBundle, DeploymentResult } from "@/types/agent";

export class LocalDeployService implements IDeployService {
  async deploy(
    bundle: CodeBundle,
    _provider: "railway" | "render"
  ): Promise<DeploymentResult> {
    return {
      id: crypto.randomUUID(),
      codeBundleId: bundle.id,
      provider: "local",
      status: "stopped",
      endpoint: "http://localhost:3000",
      healthCheckPassed: false,
      envVars: [],
      deploymentTime: 0,
      fallbackUsed: true,
      localInstructions:
        "No cloud provider configured. Run the agent locally with: npm start",
    };
  }

  async healthCheck(_endpoint: string): Promise<boolean> {
    return false;
  }

  async teardown(_deploymentId: string): Promise<void> {
    // no-op — nothing to tear down for local deployments
  }
}
