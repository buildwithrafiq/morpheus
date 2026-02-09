import type { IPipelineOrchestrator, IGeminiService, IDeployService, ISchemaValidator } from "./interfaces";
import type { PipelineEvent, PipelineStage, StreamChunk } from "@/types/pipeline";
import type { AgentSpec, ArchitectureDoc, CodeBundle, DeploymentResult, AdvancedOptions, GeneratedUI } from "@/types/agent";

const STAGE_ORDER: PipelineStage[] = ["analyzing", "designing", "generating", "deploying", "creating-ui"];
const MAX_VALIDATION_RETRIES = 2;

interface BuildState {
  id: string;
  description: string;
  options?: AdvancedOptions;
  currentStage: PipelineStage | null;
  cancelled: boolean;
  agentSpec?: AgentSpec;
  architectureDoc?: ArchitectureDoc;
  codeBundle?: CodeBundle;
  deploymentResult?: DeploymentResult;
  generatedUI?: GeneratedUI;
  error?: { stage: PipelineStage; message: string };
}

function makeEvent(stage: PipelineStage, type: PipelineEvent["type"], data: unknown): PipelineEvent {
  return { stage, type, data, timestamp: new Date().toISOString() };
}

/**
 * Collects the final "result" chunk from an AsyncGenerator<StreamChunk>,
 * yielding intermediate thinking/code chunks as PipelineEvents.
 */
async function* consumeStream(
  stream: AsyncGenerator<StreamChunk>,
  stage: PipelineStage
): AsyncGenerator<PipelineEvent, unknown, undefined> {
  let result: unknown = undefined;
  for await (const chunk of stream) {
    if (chunk.type === "result") {
      result = chunk.content;
      // Emit a token metadata event if available
      if (chunk.tokenMetadata) {
        yield { ...makeEvent(stage, "complete", null), tokenMetadata: chunk.tokenMetadata };
      }
    } else if (chunk.type === "error") {
      throw new Error(typeof chunk.content === "string" ? chunk.content : "Stage produced an error chunk");
    } else {
      const eventType = chunk.type === "thinking" ? "thinking" : "code";
      yield makeEvent(stage, eventType, chunk.content);
    }
  }
  return result;
}

export class PipelineOrchestrator implements IPipelineOrchestrator {
  private builds = new Map<string, BuildState>();

  constructor(
    private gemini: IGeminiService,
    private deployer: IDeployService,
    private validator: ISchemaValidator
  ) {}

  async *startBuild(description: string, options?: AdvancedOptions): AsyncGenerator<PipelineEvent> {
    const buildId = crypto.randomUUID();
    const state: BuildState = {
      id: buildId,
      description,
      options,
      currentStage: null,
      cancelled: false,
    };
    this.builds.set(buildId, state);

    try {
      for (const stage of STAGE_ORDER) {
        if (state.cancelled) return;
        state.currentStage = stage;
        yield makeEvent(stage, "progress", { buildId, status: "started" });

        yield* this.executeStage(state, stage);

        if (state.cancelled) return;
        yield makeEvent(stage, "complete", { buildId });
      }
    } catch (err) {
      const stage = state.currentStage ?? "analyzing";
      const message = err instanceof Error ? err.message : "Unknown pipeline error";
      state.error = { stage, message };
      yield makeEvent(stage, "error", { buildId, message });
    }
  }

  async *retryStage(buildId: string, stage: PipelineStage): AsyncGenerator<PipelineEvent> {
    const state = this.builds.get(buildId);
    if (!state) {
      yield makeEvent(stage, "error", { buildId, message: "Build not found" });
      return;
    }

    state.cancelled = false;
    state.error = undefined;
    state.currentStage = stage;

    try {
      yield makeEvent(stage, "progress", { buildId, status: "retrying" });
      yield* this.executeStage(state, stage);
      yield makeEvent(stage, "complete", { buildId });

      // Continue with remaining stages after the retried one
      const stageIndex = STAGE_ORDER.indexOf(stage);
      const remaining = STAGE_ORDER.slice(stageIndex + 1);
      for (const nextStage of remaining) {
        if (state.cancelled) return;
        state.currentStage = nextStage;
        yield makeEvent(nextStage, "progress", { buildId, status: "started" });
        yield* this.executeStage(state, nextStage);
        if (state.cancelled) return;
        yield makeEvent(nextStage, "complete", { buildId });
      }
    } catch (err) {
      const currentStage = state.currentStage ?? stage;
      const message = err instanceof Error ? err.message : "Unknown pipeline error";
      state.error = { stage: currentStage, message };
      yield makeEvent(currentStage, "error", { buildId, message });
    }
  }

  cancelBuild(buildId: string): void {
    const state = this.builds.get(buildId);
    if (state) {
      state.cancelled = true;
    }
  }

  // --- Stage execution with schema validation + retry ---

  private async *executeStage(state: BuildState, stage: PipelineStage): AsyncGenerator<PipelineEvent> {
    switch (stage) {
      case "analyzing":
        yield* this.runAnalyzing(state);
        break;
      case "designing":
        yield* this.runDesigning(state);
        break;
      case "generating":
        yield* this.runGenerating(state);
        break;
      case "deploying":
        yield* this.runDeploying(state);
        break;
      case "creating-ui":
        yield* this.runCreatingUI(state);
        break;
    }
  }

  private async *runAnalyzing(state: BuildState): AsyncGenerator<PipelineEvent> {
    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const stream = this.gemini.analyzeRequirements(state.description, state.options);
      const gen = consumeStream(stream, "analyzing");

      let rawResult: unknown;
      // Yield intermediate events and capture the return value
      let iterResult = await gen.next();
      while (!iterResult.done) {
        yield iterResult.value;
        iterResult = await gen.next();
      }
      rawResult = iterResult.value;

      const validation = this.validator.validateAgentSpec(rawResult);
      if (validation.success && validation.data) {
        state.agentSpec = validation.data;
        return;
      }

      if (attempt < MAX_VALIDATION_RETRIES) {
        yield makeEvent("analyzing", "progress", {
          status: "validation_failed_retrying",
          attempt: attempt + 1,
          errors: validation.errors,
        });
      } else {
        throw new Error(
          `Schema validation failed for AgentSpec after ${MAX_VALIDATION_RETRIES + 1} attempts: ${JSON.stringify(validation.errors)}`
        );
      }
    }
  }

  private async *runDesigning(state: BuildState): AsyncGenerator<PipelineEvent> {
    if (!state.agentSpec) throw new Error("Cannot design: no AgentSpec available");

    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const stream = this.gemini.designArchitecture(state.agentSpec);
      const gen = consumeStream(stream, "designing");

      let rawResult: unknown;
      let iterResult = await gen.next();
      while (!iterResult.done) {
        yield iterResult.value;
        iterResult = await gen.next();
      }
      rawResult = iterResult.value;

      const validation = this.validator.validateArchitectureDoc(rawResult);
      if (validation.success && validation.data) {
        state.architectureDoc = validation.data;
        return;
      }

      if (attempt < MAX_VALIDATION_RETRIES) {
        yield makeEvent("designing", "progress", {
          status: "validation_failed_retrying",
          attempt: attempt + 1,
          errors: validation.errors,
        });
      } else {
        throw new Error(
          `Schema validation failed for ArchitectureDoc after ${MAX_VALIDATION_RETRIES + 1} attempts: ${JSON.stringify(validation.errors)}`
        );
      }
    }
  }

  private async *runGenerating(state: BuildState): AsyncGenerator<PipelineEvent> {
    if (!state.architectureDoc) throw new Error("Cannot generate code: no ArchitectureDoc available");

    const stream = this.gemini.generateCode(state.architectureDoc);
    const gen = consumeStream(stream, "generating");

    let rawResult: unknown;
    let iterResult = await gen.next();
    while (!iterResult.done) {
      yield iterResult.value;
      iterResult = await gen.next();
    }
    rawResult = iterResult.value;

    // Code generation doesn't have a Zod schema in the validator,
    // so we do a basic structural check
    const bundle = rawResult as CodeBundle;
    if (!bundle || !bundle.id) {
      throw new Error("Code generation produced invalid output");
    }
    state.codeBundle = bundle;
  }

  private async *runDeploying(state: BuildState): AsyncGenerator<PipelineEvent> {
    if (!state.codeBundle) throw new Error("Cannot deploy: no CodeBundle available");

    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const result = await this.deployer.deploy(state.codeBundle, "railway");

      const validation = this.validator.validateDeploymentResult(result);
      if (validation.success && validation.data) {
        state.deploymentResult = validation.data;
        return;
      }

      if (attempt < MAX_VALIDATION_RETRIES) {
        yield makeEvent("deploying", "progress", {
          status: "validation_failed_retrying",
          attempt: attempt + 1,
          errors: validation.errors,
        });
      } else {
        throw new Error(
          `Schema validation failed for DeploymentResult after ${MAX_VALIDATION_RETRIES + 1} attempts: ${JSON.stringify(validation.errors)}`
        );
      }
    }
  }

  private async *runCreatingUI(state: BuildState): AsyncGenerator<PipelineEvent> {
    if (!state.agentSpec) throw new Error("Cannot create UI: no AgentSpec available");
    if (!state.deploymentResult) throw new Error("Cannot create UI: no DeploymentResult available");

    const stream = this.gemini.generateUI({
      inputs: state.agentSpec.inputRequirements,
      outputs: state.agentSpec.outputRequirements,
    });
    const gen = consumeStream(stream, "creating-ui");

    let rawResult: unknown;
    let iterResult = await gen.next();
    while (!iterResult.done) {
      yield iterResult.value;
      iterResult = await gen.next();
    }
    rawResult = iterResult.value;

    const ui = rawResult as GeneratedUI;
    if (!ui || !ui.id) {
      throw new Error("UI generation produced invalid output");
    }
    state.generatedUI = ui;
  }
}
