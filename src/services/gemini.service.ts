import { ZodSchema } from "zod";
import type { IGeminiService } from "@/services/interfaces";
import type {
  Agent,
  AgentSpec,
  ArchitectureDoc,
  AdvancedOptions,
  InputField,
  OutputField,
} from "@/types/agent";
import type { StreamChunk, TokenMetadata } from "@/types/pipeline";
import type { MorpheusError } from "@/types/errors";
import { AgentSpecSchema } from "@/schemas/agent-spec.schema";
import { ArchitectureDocSchema } from "@/schemas/architecture-doc.schema";

// --- Configuration ---

export type ThinkingLevel = "low" | "medium" | "high";

export interface GeminiServiceConfig {
  apiKey: string;
  baseUrl?: string;
  proThinkingLevel?: ThinkingLevel;
  flashThinkingLevel?: ThinkingLevel;
  maxRetries?: number;
  initialRetryDelayMs?: number;
  /** BYOK mode: paid key, no rate limits, higher thinking budget */
  byok?: boolean;
}

const DEFAULT_CONFIG = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  proThinkingLevel: "medium" as ThinkingLevel,
  flashThinkingLevel: "medium" as ThinkingLevel,
  maxRetries: 3,
  initialRetryDelayMs: 2000,
} as const;

// --- Error helpers ---

export class GeminiApiError extends Error {
  public readonly morpheusError: MorpheusError;

  constructor(morpheusError: MorpheusError) {
    const message =
      morpheusError.type === "api"
        ? morpheusError.message
        : morpheusError.type === "schema"
          ? `Schema validation failed at ${morpheusError.path}: ${morpheusError.expected}`
          : "Gemini API error";
    super(message);
    this.name = "GeminiApiError";
    this.morpheusError = morpheusError;
  }
}

function toApiError(
  statusCode: number,
  message: string,
  retryable: boolean
): MorpheusError {
  return { type: "api", statusCode, message, retryable };
}

function isRetryableStatus(status: number): boolean {
  // 429 is retried with server-specified delay; 5xx are retried with backoff
  return status === 429 || status === 500 || status === 502 || status === 503;
}

// --- Delay utility ---

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Retry logic ---

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  delayFn?: (ms: number) => Promise<void>;
  onRateLimit?: (waitSeconds: number) => void;
}

/**
 * Retries an async operation with exponential backoff.
 * Max 3 retries, starting at initialDelayMs, doubling each time.
 * Only retries on retryable errors (429, 5xx).
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const waitFn = options.delayFn ?? delay;
  let lastError: unknown;
  let currentDelay = options.initialDelayMs;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= options.maxRetries) {
        break;
      }

      // Only retry on retryable errors
      if (error instanceof GeminiApiError) {
        const me = error.morpheusError;
        if (me.type === "api" && !me.retryable) {
          throw error;
        }
        // Use server-specified retry delay for 429s
        const serverDelay = (error as GeminiApiError & { retryAfterMs?: number }).retryAfterMs;
        if (serverDelay && serverDelay > 0) {
          const waitSec = Math.ceil(serverDelay / 1000);
          console.log(`Rate limited — waiting ${waitSec}s before retry...`);
          options.onRateLimit?.(waitSec);
          await waitFn(serverDelay);
          continue;
        }
      }

      await waitFn(currentDelay);
      currentDelay *= 2;
    }
  }

  throw lastError;
}

// --- Structured output parsing ---

export function parseStructuredOutput<T>(
  raw: unknown,
  schema: ZodSchema<T>
): T {
  const result = schema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  const firstIssue = result.error.issues[0] ?? { path: [], code: "unknown", message: "Unknown error" };
  throw new GeminiApiError({
    type: "schema",
    path: firstIssue.path.join("."),
    expected: "expected" in firstIssue ? String(firstIssue.expected) : firstIssue.code,
    received: "received" in firstIssue ? String(firstIssue.received) : "invalid",
  });
}

// --- Request building ---

interface GeminiRequest {
  model: string;
  prompt: string;
  thinkingLevel: ThinkingLevel;
  enableCodeExecution?: boolean;
  enableSearchGrounding?: boolean;
  responseFormat?: "json" | "text";
  responseSchema?: Record<string, unknown>;
}

function buildRequestBody(req: GeminiRequest): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    thinkingConfig: {
      thinkingLevel: req.thinkingLevel,
      includeThoughts: true,
    },
  };

  // Only force JSON mime type for structured pipeline stages
  if (req.responseFormat !== "text") {
    generationConfig.responseMimeType = "application/json";
  }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: req.prompt }] }],
    generationConfig,
  };

  const tools: Record<string, unknown>[] = [];
  if (req.enableCodeExecution) {
    tools.push({ codeExecution: {} });
  }
  if (req.enableSearchGrounding) {
    tools.push({ googleSearch: {} });
  }
  if (tools.length > 0) {
    body.tools = tools;
  }

  return body;
}


// --- Prompt templates ---

function buildAnalyzePrompt(description: string, options?: AdvancedOptions): string {
  let prompt = `You are a requirements analyzer for an AI agent platform. Analyze the following natural language description and produce a structured AgentSpec JSON object.

Description: ${description}

The output must be a valid JSON object with these fields:
- id: a UUID
- corePurpose: string summarizing the agent's purpose
- inputRequirements: array of {name, type, required, description, validation?}
- outputRequirements: array of {name, type, description}
- dataSources: array of {name, type, config}
- integrations: array of {name, type, authType, config}
- edgeCases: array of {description, mitigation} (at least one mitigation per edge case)
- personality: {tone, formality: "casual"|"neutral"|"formal", verbosity: "concise"|"balanced"|"detailed"}
- communicationStyle: string
- complexityScore: integer 1-10
- inferredFields: array of field names that used default values`;

  if (options) {
    prompt += `\n\nAdvanced Options:\n${JSON.stringify(options, null, 2)}`;
    prompt += `\nInclude these constraints in the advancedOptions field of the output.`;
  }

  return prompt;
}

function buildArchitecturePrompt(spec: AgentSpec): string {
  return `You are an agent architect. Given the following AgentSpec, design a comprehensive architecture document.

AgentSpec: ${JSON.stringify(spec, null, 2)}

The output must be a valid JSON object with these fields:
- id: a UUID
- agentSpecId: "${spec.id}"
- selectedModel: "gemini-3-flash" or "gemini-3-pro"
- promptStrategy: {systemPrompt, fewShotExamples: [{input, output}], outputFormat}
- dataFlow: [{step, name, input, output, description}]
- stateManagement: {type: "stateless"|"session"|"persistent", storage}
- tools: [{name, description, parameters}]
- conversationFlow: [{id, type: "start"|"process"|"decision"|"end", next: []}]
- errorHandling: {retryPolicy: {maxRetries, backoffMs}, fallbackBehavior}
${spec.complexityScore > 7 ? '- multiAgentStrategy: {agents: [{role, model}], coordinationPattern} (REQUIRED for complexity > 7)' : '- multiAgentStrategy: optional'}
${spec.integrations.length > 0 ? '- integrationSpecs: [{name, endpoint, authFlow, rateLimit?}] (REQUIRED, one per integration)' : '- integrationSpecs: optional'}
- tradeoffs: optional [{decision, pros: [], cons: []}]`;
}

function buildCodeGenPrompt(arch: ArchitectureDoc): string {
  return `You are a code generator. Given the following ArchitectureDoc, generate all code files for the agent.

ArchitectureDoc: ${JSON.stringify(arch, null, 2)}

Generate: agent core logic, Express API endpoints, SQLite database schema, integration code, test suites, configuration files, and Markdown documentation.
Return as JSON with generated code content.`;
}

function buildUIGenPrompt(schema: { inputs: InputField[]; outputs: OutputField[] }): string {
  return `You are a UI generator. Given the following input/output schema, generate a React web interface.

Input Schema: ${JSON.stringify(schema.inputs, null, 2)}
Output Schema: ${JSON.stringify(schema.outputs, null, 2)}

Generate a production-quality React component with form handling, validation, streaming support, and responsive design.
Return as JSON with the generated UI component code.`;
}

function buildExecuteAgentPrompt(agent: Agent, userInput: string): string {
  const version = agent.versions[agent.currentVersion - 1];
  const spec = version?.agentSpec;
  const arch = version?.architectureDoc;

  const systemPrompt = arch?.promptStrategy?.systemPrompt ?? `You are an AI agent called "${agent.name}". ${agent.description}`;
  const personality = spec?.personality;
  const toneDirective = personality
    ? `Respond in a ${personality.tone} tone, ${personality.formality} formality, and ${personality.verbosity} verbosity.`
    : '';

  const fewShot = arch?.promptStrategy?.fewShotExamples ?? [];
  const examplesBlock = fewShot.length > 0
    ? `\n\nExamples:\n${fewShot.map(e => `User: ${e.input}\nAgent: ${e.output}`).join('\n\n')}`
    : '';

  return `${systemPrompt}\n${toneDirective}${examplesBlock}\n\nUser: ${userInput}`;
}

// --- Main Service ---

export class GeminiService implements IGeminiService {
  private readonly config: Required<GeminiServiceConfig>;
  private lastTokenMetadata: TokenMetadata | undefined;
  /** Seconds remaining on current rate limit wait. 0 = not waiting. */
  public rateLimitWaitSeconds = 0;
  private _rateLimitTimer: ReturnType<typeof setInterval> | null = null;
  /** BYOK mode — paid key, no rate limits, higher thinking budget */
  public readonly isByok: boolean;

  /** Start a visible countdown so the UI can poll rateLimitWaitSeconds and see it tick down. */
  private startRateLimitCountdown(seconds: number) {
    // BYOK users don't need countdown — they won't hit rate limits
    if (this.isByok) return;
    this.stopRateLimitCountdown();
    this.rateLimitWaitSeconds = seconds;
    this._rateLimitTimer = setInterval(() => {
      this.rateLimitWaitSeconds = Math.max(0, this.rateLimitWaitSeconds - 1);
      if (this.rateLimitWaitSeconds <= 0) this.stopRateLimitCountdown();
    }, 1000);
  }

  private stopRateLimitCountdown() {
    if (this._rateLimitTimer) {
      clearInterval(this._rateLimitTimer);
      this._rateLimitTimer = null;
    }
    this.rateLimitWaitSeconds = 0;
  }

  constructor(config: GeminiServiceConfig) {
    this.isByok = config.byok ?? false;

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      proThinkingLevel: config.proThinkingLevel ?? DEFAULT_CONFIG.proThinkingLevel,
      flashThinkingLevel: config.flashThinkingLevel ?? DEFAULT_CONFIG.flashThinkingLevel,
      maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
      initialRetryDelayMs: config.initialRetryDelayMs ?? DEFAULT_CONFIG.initialRetryDelayMs,
      byok: this.isByok,
    };

    if (this.isByok) {
      console.log("🔑 BYOK mode: paid key detected — no rate limits");
    }
  }

  async *analyzeRequirements(
      description: string,
      options?: AdvancedOptions
    ): AsyncGenerator<StreamChunk> {
      const prompt = buildAnalyzePrompt(description, options);
      const onRL = (secs: number) => { this.startRateLimitCountdown(secs); };

      yield { type: "thinking", content: "Analyzing requirements with Gemini Pro..." };

      const rawResult = await this.callGeminiWithRetry(
        "gemini-3-pro-preview", prompt, this.config.proThinkingLevel, false, undefined, onRL
      );
      this.stopRateLimitCountdown();

      yield { type: "thinking", content: "Validating agent specification..." };

      const agentSpec = parseStructuredOutput(rawResult, AgentSpecSchema);

      yield { type: "result", content: agentSpec, tokenMetadata: this.lastTokenMetadata };
    }


  async *designArchitecture(spec: AgentSpec): AsyncGenerator<StreamChunk> {
    const prompt = buildArchitecturePrompt(spec);
    const onRL = (secs: number) => { this.startRateLimitCountdown(secs); };

    yield { type: "thinking", content: "Designing architecture with Gemini Pro..." };

    const rawResult = await this.callGeminiWithRetry(
      "gemini-3-pro-preview", prompt, this.config.proThinkingLevel, false, undefined, onRL
    );
    this.stopRateLimitCountdown();

    yield { type: "thinking", content: "Validating architecture document..." };

    const architectureDoc = parseStructuredOutput(rawResult, ArchitectureDocSchema);

    yield { type: "result", content: architectureDoc, tokenMetadata: this.lastTokenMetadata };
  }

  async *generateCode(arch: ArchitectureDoc): AsyncGenerator<StreamChunk> {
    const prompt = buildCodeGenPrompt(arch);

    yield { type: "thinking", content: "Generating code with Gemini Flash..." };

    const onRL = (secs: number) => { this.startRateLimitCountdown(secs); };

    const rawResult = await this.callGeminiWithRetry(
      "gemini-3-flash-preview",
      prompt,
      this.config.flashThinkingLevel,
      true, // enable code execution for validation
      undefined,
      onRL
    );
    this.stopRateLimitCountdown();

    yield { type: "code", content: rawResult };
    yield { type: "result", content: rawResult, tokenMetadata: this.lastTokenMetadata };
  }

  async *generateUI(schema: {
    inputs: InputField[];
    outputs: OutputField[];
  }): AsyncGenerator<StreamChunk> {
    const prompt = buildUIGenPrompt(schema);
    const onRL = (secs: number) => { this.startRateLimitCountdown(secs); };

    yield { type: "thinking", content: "Generating UI with Gemini Flash..." };

    const rawResult = await this.callGeminiWithRetry(
      "gemini-3-flash-preview",
      prompt,
      this.config.flashThinkingLevel,
      true, // enable code execution for validation
      undefined,
      onRL
    );
    this.stopRateLimitCountdown();
    yield { type: "code", content: rawResult };
    yield { type: "result", content: rawResult, tokenMetadata: this.lastTokenMetadata };
  }

  async *executeAgent(
    agent: Agent,
    params: { input: string }
  ): AsyncGenerator<StreamChunk> {
    const prompt = buildExecuteAgentPrompt(agent, params.input);
    const version = agent.versions[agent.currentVersion - 1];
    const model = version?.architectureDoc?.selectedModel === "gemini-3-pro"
      ? "gemini-3-pro-preview"
      : "gemini-3-flash-preview";
    const thinkingLevel = model === "gemini-3-pro-preview"
      ? this.config.proThinkingLevel
      : this.config.flashThinkingLevel;

    // Check if agent uses tools that benefit from search grounding
    const hasSearchTool = version?.architectureDoc?.tools?.some(
      t => t.name.toLowerCase().includes("search") || t.name.toLowerCase().includes("web")
    ) ?? false;

    yield { type: "thinking", content: "Processing your message..." };

    const rawResult = await this.callGeminiWithRetry(
      model,
      prompt,
      thinkingLevel,
      false,
      { responseFormat: "text", enableSearchGrounding: hasSearchTool }
    );

    const text = typeof rawResult === "string"
      ? rawResult
      : JSON.stringify(rawResult);

    yield { type: "text", content: text };
    yield { type: "result", content: text, tokenMetadata: this.lastTokenMetadata };
  }

  // --- Internal API call with retry ---

  private async callGeminiWithRetry(
    model: string,
    prompt: string,
    thinkingLevel: ThinkingLevel,
    enableCodeExecution = false,
    options?: { responseFormat?: "json" | "text"; enableSearchGrounding?: boolean },
    onRateLimit?: (waitSeconds: number) => void
  ): Promise<unknown> {
    return retryWithBackoff(
      () => this.callGeminiApi(model, prompt, thinkingLevel, enableCodeExecution, options),
      {
        maxRetries: this.config.maxRetries,
        initialDelayMs: this.config.initialRetryDelayMs,
        onRateLimit,
      }
    );
  }

  private async callGeminiApi(
    model: string,
    prompt: string,
    thinkingLevel: ThinkingLevel,
    enableCodeExecution = false,
    options?: { responseFormat?: "json" | "text"; enableSearchGrounding?: boolean }
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;
    const body = buildRequestBody({
      model,
      prompt,
      thinkingLevel,
      enableCodeExecution,
      responseFormat: options?.responseFormat,
      enableSearchGrounding: options?.enableSearchGrounding,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new GeminiApiError(
        toApiError(0, `Network error: ${error instanceof Error ? error.message : "Unknown"}`, true)
      );
    }

    if (!response.ok) {
      const retryable = isRetryableStatus(response.status);
      let errorMessage: string;
      let retryAfterMs = 0;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.error?.message ?? response.statusText;
        // Parse "retry in Xs" from the error message for 429s
        if (response.status === 429) {
          const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)s/i);
          if (match?.[1]) retryAfterMs = Math.ceil(parseFloat(match[1]) * 1000);
        }
      } catch {
        errorMessage = response.statusText;
      }

      // For 429, also check Retry-After header
      if (response.status === 429 && !retryAfterMs) {
        const header = response.headers.get('Retry-After');
        if (header) retryAfterMs = parseInt(header, 10) * 1000;
      }

      const err = new GeminiApiError(
        toApiError(response.status, errorMessage, retryable)
      );
      (err as GeminiApiError & { retryAfterMs: number }).retryAfterMs = retryAfterMs || 0;
      throw err;
    }

    const data = await response.json();

    // Extract token usage metadata from Gemini response
    const usage = data?.usageMetadata;
    this.lastTokenMetadata = {
      thoughtsTokenCount: usage?.thoughtsTokenCount ?? 0,
      candidatesTokenCount: usage?.candidatesTokenCount ?? 0,
      totalTokenCount: usage?.totalTokenCount ?? 0,
      promptTokenCount: usage?.promptTokenCount ?? 0,
    };

    // Extract text content from Gemini response, separating thinking from answer
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const answerParts: string[] = [];

    for (const part of parts) {
      // Skip thinking summary parts (thought: true)
      if (part.thought) continue;
      // Skip code execution parts
      if (part.executableCode || part.codeExecutionResult) continue;
      if (part.text) {
        answerParts.push(part.text);
      }
    }

    const textContent = answerParts.join("");

    if (!textContent) {
      throw new GeminiApiError(
        toApiError(500, "Empty response from Gemini API", true)
      );
    }

    // For text-mode responses, return raw text without JSON parsing
    if (options?.responseFormat === "text") {
      return textContent;
    }

    // Parse the JSON from the text response
    try {
      return JSON.parse(textContent);
    } catch {
      throw new GeminiApiError({
        type: "schema",
        path: "",
        expected: "valid JSON",
        received: textContent.substring(0, 100),
      });
    }
  }
}
