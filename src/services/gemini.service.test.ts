// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GeminiService,
  GeminiApiError,
  retryWithBackoff,
  parseStructuredOutput,
} from "./gemini.service";
import { z } from "zod";
import type { StreamChunk } from "@/types/pipeline";

// Helper to collect all chunks from an async generator
async function collectChunks(gen: AsyncGenerator<StreamChunk>): Promise<StreamChunk[]> {
  const chunks: StreamChunk[] = [];
  for await (const chunk of gen) {
    chunks.push(chunk);
  }
  return chunks;
}

const noDelay = () => Promise.resolve();

// --- retryWithBackoff tests ---

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately on first success", async () => {
    const op = vi.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(op, { maxRetries: 3, initialDelayMs: 1000, delayFn: noDelay });
    expect(result).toBe("ok");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable error and succeeds", async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(
        new GeminiApiError({ type: "api", statusCode: 503, message: "unavailable", retryable: true })
      )
      .mockResolvedValue("recovered");

    const result = await retryWithBackoff(op, { maxRetries: 3, initialDelayMs: 1000, delayFn: noDelay });
    expect(result).toBe("recovered");
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("throws immediately on non-retryable error", async () => {
    const op = vi
      .fn()
      .mockRejectedValue(
        new GeminiApiError({ type: "api", statusCode: 401, message: "unauthorized", retryable: false })
      );

    await expect(
      retryWithBackoff(op, { maxRetries: 3, initialDelayMs: 1000, delayFn: noDelay })
    ).rejects.toThrow("unauthorized");
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("exhausts all retries and throws the last error", async () => {
    const op = vi
      .fn()
      .mockRejectedValue(
        new GeminiApiError({ type: "api", statusCode: 500, message: "server error", retryable: true })
      );

    await expect(
      retryWithBackoff(op, { maxRetries: 3, initialDelayMs: 1000, delayFn: noDelay })
    ).rejects.toThrow("server error");
    // 1 initial + 3 retries = 4 total calls
    expect(op).toHaveBeenCalledTimes(4);
  });

  it("retries non-GeminiApiError errors up to max", async () => {
    const op = vi.fn().mockRejectedValue(new Error("network failure"));

    await expect(
      retryWithBackoff(op, { maxRetries: 2, initialDelayMs: 100, delayFn: noDelay })
    ).rejects.toThrow("network failure");
    expect(op).toHaveBeenCalledTimes(3);
  });
});

// --- parseStructuredOutput tests ---

describe("parseStructuredOutput", () => {
  const TestSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  it("parses valid data", () => {
    const result = parseStructuredOutput({ name: "test", value: 42 }, TestSchema);
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("throws GeminiApiError with schema type on invalid data", () => {
    expect(() =>
      parseStructuredOutput({ name: 123, value: "bad" }, TestSchema)
    ).toThrow(GeminiApiError);

    try {
      parseStructuredOutput({ name: 123, value: "bad" }, TestSchema);
    } catch (e) {
      expect(e).toBeInstanceOf(GeminiApiError);
      expect((e as GeminiApiError).morpheusError.type).toBe("schema");
    }
  });
});

// --- GeminiApiError tests ---

describe("GeminiApiError", () => {
  it("creates error with api type", () => {
    const err = new GeminiApiError({
      type: "api",
      statusCode: 429,
      message: "rate limited",
      retryable: true,
    });
    expect(err.message).toBe("rate limited");
    expect(err.morpheusError.type).toBe("api");
  });

  it("creates error with schema type", () => {
    const err = new GeminiApiError({
      type: "schema",
      path: "id",
      expected: "uuid",
      received: "123",
    });
    expect(err.message).toContain("Schema validation failed");
    expect(err.morpheusError.type).toBe("schema");
  });
});


// --- GeminiService integration tests (with mocked fetch) ---

describe("GeminiService", () => {
  const mockConfig = {
    apiKey: "test-api-key",
    baseUrl: "https://test.api.com/v1beta",
    maxRetries: 1,
    initialRetryDelayMs: 1,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchResponse(data: unknown, ok = true, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok,
        status,
        statusText: ok ? "OK" : "Error",
        json: () => Promise.resolve(data),
      })
    );
  }

  function mockFetchWithGeminiResponse(content: unknown) {
    mockFetchResponse({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(content) }],
          },
        },
      ],
    });
  }

  describe("analyzeRequirements", () => {
    it("yields thinking and result chunks on success", async () => {
      const validSpec = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        corePurpose: "Test agent",
        inputRequirements: [{ name: "query", type: "text", required: true, description: "User query" }],
        outputRequirements: [{ name: "response", type: "string", description: "Agent response" }],
        dataSources: [],
        integrations: [],
        edgeCases: [{ description: "Empty input", mitigation: "Return default response" }],
        personality: { tone: "friendly", formality: "neutral", verbosity: "balanced" },
        communicationStyle: "conversational",
        complexityScore: 3,
        inferredFields: [],
      };

      mockFetchWithGeminiResponse(validSpec);

      const service = new GeminiService(mockConfig);
      const chunks = await collectChunks(service.analyzeRequirements("Build a chatbot"));

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.some((c) => c.type === "thinking")).toBe(true);
      const lastChunk = chunks[chunks.length - 1]!;
      expect(lastChunk.type).toBe("result");
    });

    it("throws on API error after retries exhausted", async () => {
      mockFetchResponse({ error: { message: "Internal error" } }, false, 500);

      const service = new GeminiService(mockConfig);
      await expect(
        collectChunks(service.analyzeRequirements("Build a chatbot"))
      ).rejects.toThrow(GeminiApiError);
    });
  });

  describe("designArchitecture", () => {
    it("yields thinking and result chunks on success", async () => {
      const validArch = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        agentSpecId: "550e8400-e29b-41d4-a716-446655440000",
        selectedModel: "gemini-3-pro",
        promptStrategy: { systemPrompt: "You are helpful", fewShotExamples: [], outputFormat: "json" },
        dataFlow: [{ step: 1, name: "input", input: "text", output: "response", description: "Process" }],
        stateManagement: { type: "stateless", storage: "none" },
        tools: [],
        conversationFlow: [{ id: "start", type: "start", next: ["end"] }],
        errorHandling: { retryPolicy: { maxRetries: 3, backoffMs: 1000 }, fallbackBehavior: "return error" },
      };

      mockFetchWithGeminiResponse(validArch);

      const service = new GeminiService(mockConfig);
      const spec = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        corePurpose: "Test",
        inputRequirements: [{ name: "q", type: "text" as const, required: true, description: "query" }],
        outputRequirements: [{ name: "r", type: "string", description: "response" }],
        dataSources: [],
        integrations: [],
        edgeCases: [],
        personality: { tone: "friendly", formality: "neutral" as const, verbosity: "balanced" as const },
        communicationStyle: "conversational",
        complexityScore: 3,
        inferredFields: [],
      };

      const chunks = await collectChunks(service.designArchitecture(spec));
      expect(chunks.some((c) => c.type === "thinking")).toBe(true);
      const lastChunk = chunks[chunks.length - 1]!;
      expect(lastChunk.type).toBe("result");
    });
  });

  describe("generateCode", () => {
    it("yields code and result chunks", async () => {
      const codeResult = { files: ["main.ts"], config: {} };
      mockFetchWithGeminiResponse(codeResult);

      const service = new GeminiService(mockConfig);
      const arch = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        agentSpecId: "550e8400-e29b-41d4-a716-446655440000",
        selectedModel: "gemini-3-pro" as const,
        promptStrategy: { systemPrompt: "", fewShotExamples: [], outputFormat: "json" },
        dataFlow: [],
        stateManagement: { type: "stateless" as const, storage: "none" },
        tools: [],
        conversationFlow: [],
        errorHandling: { retryPolicy: { maxRetries: 3, backoffMs: 1000 }, fallbackBehavior: "error" },
      };

      const chunks = await collectChunks(service.generateCode(arch));
      expect(chunks.some((c) => c.type === "code")).toBe(true);
      const lastChunk = chunks[chunks.length - 1]!;
      expect(lastChunk.type).toBe("result");
    });
  });

  describe("error handling", () => {
    it("transforms network errors to MorpheusError", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      const service = new GeminiService(mockConfig);
      try {
        await collectChunks(service.analyzeRequirements("test"));
        expect.unreachable("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(GeminiApiError);
        const err = e as GeminiApiError;
        expect(err.morpheusError.type).toBe("api");
      }
    });

    it("transforms non-retryable HTTP errors correctly", async () => {
      mockFetchResponse({ error: { message: "Bad request" } }, false, 400);

      const service = new GeminiService({ ...mockConfig, maxRetries: 0 });
      try {
        await collectChunks(service.analyzeRequirements("test"));
        expect.unreachable("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(GeminiApiError);
        const err = e as GeminiApiError;
        expect(err.morpheusError.type).toBe("api");
        if (err.morpheusError.type === "api") {
          expect(err.morpheusError.statusCode).toBe(400);
          expect(err.morpheusError.retryable).toBe(false);
        }
      }
    });

    it("handles empty Gemini response", async () => {
      mockFetchResponse({ candidates: [{ content: { parts: [] } }] });

      const service = new GeminiService(mockConfig);
      await expect(
        collectChunks(service.analyzeRequirements("test"))
      ).rejects.toThrow(GeminiApiError);
    });

    it("handles malformed JSON in response text", async () => {
      mockFetchResponse({
        candidates: [{ content: { parts: [{ text: "not valid json {{{" }] } }],
      });

      const service = new GeminiService(mockConfig);
      await expect(
        collectChunks(service.analyzeRequirements("test"))
      ).rejects.toThrow(GeminiApiError);
    });
  });
});
