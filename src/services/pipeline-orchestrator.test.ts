import { describe, it, expect, vi } from "vitest";
import { PipelineOrchestrator } from "./pipeline-orchestrator";
import type { IGeminiService, IDeployService, ISchemaValidator } from "./interfaces";
import type { PipelineEvent, PipelineStage, StreamChunk } from "@/types/pipeline";
import type { AgentSpec, ArchitectureDoc, CodeBundle, DeploymentResult, AdvancedOptions } from "@/types/agent";

// --- Helpers ---

function makeAgentSpec(overrides?: Partial<AgentSpec>): AgentSpec {
  return {
    id: "spec-1",
    corePurpose: "Test agent",
    inputRequirements: [{ name: "query", type: "text", required: true, description: "User query" }],
    outputRequirements: [{ name: "answer", type: "string", description: "Response" }],
    dataSources: [],
    integrations: [],
    edgeCases: [{ description: "empty input", mitigation: "return default" }],
    personality: { tone: "friendly", formality: "neutral", verbosity: "balanced" },
    communicationStyle: "conversational",
    complexityScore: 5,
    inferredFields: [],
    ...overrides,
  };
}

function makeArchDoc(overrides?: Partial<ArchitectureDoc>): ArchitectureDoc {
  return {
    id: "arch-1",
    agentSpecId: "spec-1",
    selectedModel: "gemini-3-flash",
    promptStrategy: { systemPrompt: "You are helpful", fewShotExamples: [], outputFormat: "json" },
    dataFlow: [{ step: 1, name: "process", input: "query", output: "answer", description: "Process query" }],
    stateManagement: { type: "stateless", storage: "none" },
    tools: [],
    conversationFlow: [{ id: "start", type: "start", next: ["end"] }, { id: "end", type: "end", next: [] }],
    errorHandling: { retryPolicy: { maxRetries: 2, backoffMs: 1000 }, fallbackBehavior: "return error" },
    ...overrides,
  };
}

function makeCodeBundle(): CodeBundle {
  return {
    id: "bundle-1",
    architectureDocId: "arch-1",
    files: [{ path: "index.ts", content: "console.log('hi')", language: "typescript" }],
    dependencies: {},
    testResults: [{ name: "basic", passed: true }],
    debugIterations: 0,
    validated: true,
  };
}

function makeDeployResult(): DeploymentResult {
  return {
    id: "deploy-1",
    codeBundleId: "bundle-1",
    provider: "railway",
    status: "running",
    endpoint: "https://agent.railway.app",
    healthCheckPassed: true,
    envVars: ["API_KEY"],
    deploymentTime: 30000,
    fallbackUsed: false,
  };
}

function makeGeneratedUI() {
  return {
    id: "ui-1",
    deploymentResultId: "deploy-1",
    publicUrl: "https://ui.example.com",
    components: [],
    accessibilityScore: 95,
    responsive: true,
  };
}

async function* fakeStream(...chunks: StreamChunk[]): AsyncGenerator<StreamChunk> {
  for (const c of chunks) yield c;
}

async function collectEvents(gen: AsyncGenerator<PipelineEvent>): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

// --- Mock factories ---

function createMockGemini(): IGeminiService {
  const spec = makeAgentSpec();
  const arch = makeArchDoc();
  const bundle = makeCodeBundle();
  const ui = makeGeneratedUI();

  return {
    analyzeRequirements: vi.fn().mockImplementation(() =>
      fakeStream({ type: "thinking", content: "analyzing..." }, { type: "result", content: spec })
    ),
    designArchitecture: vi.fn().mockImplementation(() =>
      fakeStream({ type: "thinking", content: "designing..." }, { type: "result", content: arch })
    ),
    generateCode: vi.fn().mockImplementation(() =>
      fakeStream({ type: "code", content: "code..." }, { type: "result", content: bundle })
    ),
    generateUI: vi.fn().mockImplementation(() =>
      fakeStream({ type: "code", content: "ui code..." }, { type: "result", content: ui })
    ),
    executeAgent: vi.fn().mockImplementation(() =>
      fakeStream({ type: "result", content: "executed" })
    ),
  };
}

function createMockDeployer(): IDeployService {
  return {
    deploy: vi.fn().mockResolvedValue(makeDeployResult()),
    healthCheck: vi.fn().mockResolvedValue(true),
    teardown: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockValidator(): ISchemaValidator {
  return {
    validateAgentSpec: vi.fn().mockImplementation((data: unknown) => ({
      success: true,
      data: data as AgentSpec,
    })),
    validateArchitectureDoc: vi.fn().mockImplementation((data: unknown) => ({
      success: true,
      data: data as ArchitectureDoc,
    })),
    validateDeploymentResult: vi.fn().mockImplementation((data: unknown) => ({
      success: true,
      data: data as DeploymentResult,
    })),
  };
}

// --- Tests ---

describe("PipelineOrchestrator", () => {
  describe("startBuild", () => {
    it("executes all 5 stages in order", async () => {
      const orchestrator = new PipelineOrchestrator(
        createMockGemini(),
        createMockDeployer(),
        createMockValidator()
      );

      const events = await collectEvents(orchestrator.startBuild("Build a chatbot"));

      // Extract stage progression (progress started + complete pairs)
      const stageEvents = events.filter(
        (e) => (e.type === "progress" && (e.data as Record<string, unknown>).status === "started") || e.type === "complete"
      );

      const stages = stageEvents.map((e) => e.stage);
      const expectedOrder: PipelineStage[] = [
        "analyzing", "analyzing",
        "designing", "designing",
        "generating", "generating",
        "deploying", "deploying",
        "creating-ui", "creating-ui",
      ];
      expect(stages).toEqual(expectedOrder);
    });

    it("yields thinking events from Gemini streams", async () => {
      const orchestrator = new PipelineOrchestrator(
        createMockGemini(),
        createMockDeployer(),
        createMockValidator()
      );

      const events = await collectEvents(orchestrator.startBuild("Build a chatbot"));
      const thinkingEvents = events.filter((e) => e.type === "thinking");
      expect(thinkingEvents.length).toBeGreaterThan(0);
      expect(thinkingEvents[0]!.stage).toBe("analyzing");
    });

    it("passes advanced options to analyzeRequirements", async () => {
      const gemini = createMockGemini();
      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), createMockValidator());
      const opts: AdvancedOptions = { modelPreference: "pro", costConstraint: 0.5 };

      await collectEvents(orchestrator.startBuild("Build a chatbot", opts));

      expect(gemini.analyzeRequirements).toHaveBeenCalledWith("Build a chatbot", opts);
    });

    it("halts pipeline and emits error when a stage fails", async () => {
      const gemini = createMockGemini();
      (gemini.designArchitecture as ReturnType<typeof vi.fn>).mockImplementation(() =>
        fakeStream({ type: "error", content: "Architecture design failed" })
      );

      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), createMockValidator());
      const events = await collectEvents(orchestrator.startBuild("Build a chatbot"));

      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.stage).toBe("designing");

      // No events for stages after "designing"
      const postDesignStages = events.filter(
        (e) => e.stage === "generating" || e.stage === "deploying" || e.stage === "creating-ui"
      );
      expect(postDesignStages).toHaveLength(0);
    });
  });

  describe("schema validation with retry", () => {
    it("retries up to 2 times on validation failure then throws", async () => {
      const gemini = createMockGemini();
      const validator = createMockValidator();
      (validator.validateAgentSpec as ReturnType<typeof vi.fn>).mockReturnValue({
        success: false,
        errors: [{ path: "id", message: "invalid", expected: "uuid", received: "bad" }],
      });

      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), validator);
      const events = await collectEvents(orchestrator.startBuild("Build a chatbot"));

      // Should have called analyzeRequirements 3 times (1 initial + 2 retries)
      expect(gemini.analyzeRequirements).toHaveBeenCalledTimes(3);

      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.stage).toBe("analyzing");
    });

    it("succeeds on second validation attempt", async () => {
      const gemini = createMockGemini();
      const validator = createMockValidator();
      const spec = makeAgentSpec();

      (validator.validateAgentSpec as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ success: false, errors: [{ path: "id", message: "bad", expected: "uuid", received: "x" }] })
        .mockReturnValueOnce({ success: true, data: spec });

      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), validator);
      const events = await collectEvents(orchestrator.startBuild("Build a chatbot"));

      expect(gemini.analyzeRequirements).toHaveBeenCalledTimes(2);

      // Pipeline should complete successfully (no error events)
      const errorEvents = events.filter((e) => e.type === "error");
      expect(errorEvents).toHaveLength(0);

      // Should have validation retry progress event
      const retryEvent = events.find(
        (e) => e.type === "progress" && (e.data as Record<string, unknown>).status === "validation_failed_retrying"
      );
      expect(retryEvent).toBeDefined();
    });
  });

  describe("cancelBuild", () => {
    it("stops pipeline execution when cancelled", async () => {
      const gemini = createMockGemini();
      // Make analyzeRequirements slow enough to cancel
      (gemini.analyzeRequirements as ReturnType<typeof vi.fn>).mockImplementation(function* () {
        yield { type: "thinking" as const, content: "thinking..." };
        yield { type: "result" as const, content: makeAgentSpec() };
      });

      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), createMockValidator());
      const gen = orchestrator.startBuild("Build a chatbot");

      // Consume first event, then cancel
      const first = await gen.next();
      expect(first.done).toBe(false);

      // We need the buildId to cancel - extract from event data
      const buildId = (first.value.data as Record<string, unknown>).buildId as string;
      orchestrator.cancelBuild(buildId);

      // Drain remaining events
      const remaining: PipelineEvent[] = [];
      let next = await gen.next();
      while (!next.done) {
        remaining.push(next.value);
        next = await gen.next();
      }

      // Should not have reached all 5 stages
      const completedStages = new Set(remaining.filter((e) => e.type === "complete").map((e) => e.stage));
      expect(completedStages.size).toBeLessThan(5);
    });
  });

  describe("retryStage", () => {
    it("retries a failed stage and continues with remaining stages", async () => {
      const gemini = createMockGemini();
      const validator = createMockValidator();

      // First run: designing fails
      let designCallCount = 0;
      (gemini.designArchitecture as ReturnType<typeof vi.fn>).mockImplementation(() => {
        designCallCount++;
        if (designCallCount === 1) {
          return fakeStream({ type: "error", content: "fail" });
        }
        return fakeStream({ type: "thinking", content: "ok" }, { type: "result", content: makeArchDoc() });
      });

      const orchestrator = new PipelineOrchestrator(gemini, createMockDeployer(), validator);

      // Run initial build - it will fail at designing
      const initialEvents = await collectEvents(orchestrator.startBuild("Build a chatbot"));
      const errorEvent = initialEvents.find((e) => e.type === "error");
      expect(errorEvent).toBeDefined();
      const buildId = (errorEvent!.data as Record<string, unknown>).buildId as string;

      // Retry from designing stage
      const retryEvents = await collectEvents(orchestrator.retryStage(buildId, "designing"));

      // Should have events for designing + generating + deploying + creating-ui
      const completedStages = retryEvents.filter((e) => e.type === "complete").map((e) => e.stage);
      expect(completedStages).toContain("designing");
      expect(completedStages).toContain("generating");
      expect(completedStages).toContain("deploying");
      expect(completedStages).toContain("creating-ui");
    });

    it("emits error for unknown buildId", async () => {
      const orchestrator = new PipelineOrchestrator(
        createMockGemini(),
        createMockDeployer(),
        createMockValidator()
      );

      const events = await collectEvents(orchestrator.retryStage("nonexistent", "analyzing"));
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("error");
      expect((events[0]!.data as Record<string, unknown>).message).toBe("Build not found");
    });
  });
});
