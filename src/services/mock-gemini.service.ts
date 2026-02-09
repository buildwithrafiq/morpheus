import type { IGeminiService } from "./interfaces";
import type { StreamChunk } from "@/types/pipeline";
import type {
  AgentSpec, ArchitectureDoc, AdvancedOptions, Agent,
  DataSource, Integration, InputField, OutputField, EdgeCase,
} from "@/types/agent";

/* ── Domain profiles for description-aware generation ──────────────────── */

interface DomainProfile {
  keywords: string[];
  inputs: InputField[];
  outputs: OutputField[];
  dataSources: DataSource[];
  integrations: Integration[];
  edgeCases: EdgeCase[];
  sampleEndpoint: string;
  sampleImports: string;
  sampleLogic: string;
}

const DOMAIN_PROFILES: DomainProfile[] = [
  {
    keywords: ["customer support", "support bot", "helpdesk", "ticket", "faq"],
    inputs: [
      { name: "customer_message", type: "text", required: true, description: "Customer support message" },
      { name: "ticket_id", type: "text", required: false, description: "Existing ticket ID" },
      { name: "priority", type: "select", required: false, description: "Ticket priority" },
    ],
    outputs: [
      { name: "response", type: "string", description: "Support response" },
      { name: "sentiment", type: "string", description: "Customer sentiment" },
      { name: "should_escalate", type: "boolean", description: "Escalate to human" },
    ],
    dataSources: [
      { name: "FAQ Knowledge Base", type: "knowledge", config: {} },
      { name: "Ticket History", type: "database", config: {} },
    ],
    integrations: [
      { name: "Zendesk", type: "ticketing", authType: "oauth", config: {} },
      { name: "Slack Notifications", type: "messaging", authType: "webhook", config: {} },
    ],
    edgeCases: [
      { description: "Angry or abusive customer", mitigation: "Auto-escalate to human agent" },
      { description: "Question outside knowledge base", mitigation: "Create ticket for follow-up" },
      { description: "Multiple issues in one message", mitigation: "Address each issue separately" },
    ],
    sampleEndpoint: "/api/support",
    sampleImports: "import { searchFAQ } from './knowledge-base';",
    sampleLogic: "    const faqResults = await searchFAQ(input);",
  },
  {
    keywords: ["sql", "data analyst", "database", "query", "analytics"],
    inputs: [
      { name: "question", type: "text", required: true, description: "Natural language data question" },
      { name: "schema_context", type: "text", required: false, description: "Database schema" },
      { name: "dialect", type: "select", required: false, description: "SQL dialect" },
    ],
    outputs: [
      { name: "sql_query", type: "string", description: "Generated SQL query" },
      { name: "explanation", type: "string", description: "Query explanation" },
      { name: "results_preview", type: "string", description: "Sample results" },
    ],
    dataSources: [{ name: "Database Schema", type: "database", config: {} }],
    integrations: [{ name: "PostgreSQL", type: "database", authType: "connection_string", config: {} }],
    edgeCases: [
      { description: "Ambiguous column references", mitigation: "Ask clarifying question" },
      { description: "Destructive queries (DELETE/DROP)", mitigation: "Block mutations" },
    ],
    sampleEndpoint: "/api/query",
    sampleImports: "import { Pool } from 'pg';",
    sampleLogic: "    const sqlQuery = await generateSQL(input, schemaContext);",
  },
  {
    keywords: ["email", "draft", "compose", "outreach", "cold email"],
    inputs: [
      { name: "context", type: "text", required: true, description: "Key points for the email" },
      { name: "tone", type: "select", required: false, description: "Email tone" },
      { name: "recipient_role", type: "text", required: false, description: "Recipient role" },
    ],
    outputs: [
      { name: "subject_line", type: "string", description: "Email subject" },
      { name: "body", type: "string", description: "Email body" },
      { name: "follow_up_suggestion", type: "string", description: "Follow-up suggestion" },
    ],
    dataSources: [{ name: "Email Templates", type: "knowledge", config: {} }],
    integrations: [{ name: "Gmail API", type: "email", authType: "oauth", config: {} }],
    edgeCases: [
      { description: "Sensitive content", mitigation: "Flag for review" },
      { description: "Missing recipient context", mitigation: "Use neutral professional tone" },
    ],
    sampleEndpoint: "/api/draft-email",
    sampleImports: "import { getTemplates } from './email-templates';",
    sampleLogic: "    const draft = await composeDraft(context, tone);",
  },
  {
    keywords: ["code review", "pr review", "pull request", "lint", "security scan"],
    inputs: [
      { name: "code_diff", type: "text", required: true, description: "Code diff to review" },
      { name: "language", type: "select", required: false, description: "Programming language" },
      { name: "review_focus", type: "text", required: false, description: "Review focus areas" },
    ],
    outputs: [
      { name: "issues", type: "string", description: "Issues found with severity" },
      { name: "suggestions", type: "string", description: "Improvement suggestions" },
      { name: "score", type: "number", description: "Code quality score 0-100" },
    ],
    dataSources: [{ name: "Coding Standards", type: "knowledge", config: {} }],
    integrations: [{ name: "GitHub API", type: "vcs", authType: "token", config: {} }],
    edgeCases: [
      { description: "Very large diffs", mitigation: "Chunk and prioritize critical files" },
      { description: "Unfamiliar framework", mitigation: "Focus on universal patterns" },
    ],
    sampleEndpoint: "/api/review",
    sampleImports: "import { parseDiff } from './diff-parser';",
    sampleLogic: "    const parsed = parseDiff(codeDiff);",
  },
  {
    keywords: ["slack", "chat", "chatbot", "conversational", "messaging"],
    inputs: [
      { name: "message", type: "text", required: true, description: "User chat message" },
      { name: "channel_id", type: "text", required: false, description: "Channel ID" },
      { name: "user_id", type: "text", required: false, description: "User ID" },
    ],
    outputs: [
      { name: "reply", type: "string", description: "Bot reply" },
      { name: "actions", type: "string", description: "Quick-reply actions" },
    ],
    dataSources: [{ name: "Conversation History", type: "cache", config: {} }],
    integrations: [{ name: "Slack", type: "messaging", authType: "oauth", config: {} }],
    edgeCases: [
      { description: "Unsupported language", mitigation: "Respond in English with note" },
      { description: "Spam or repeated messages", mitigation: "Rate limit per user" },
    ],
    sampleEndpoint: "/api/chat",
    sampleImports: "import { WebClient } from '@slack/web-api';",
    sampleLogic: "    const history = await getConversationHistory(channelId);",
  },
];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function rDelay(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * baseMs * 0.6);
}

function matchDomain(description: string): DomainProfile | null {
  const lower = description.toLowerCase();
  for (const p of DOMAIN_PROFILES) {
    if (p.keywords.some(kw => lower.includes(kw))) return p;
  }
  return null;
}

/* ── Mock Gemini Service ───────────────────────────────────────────────── */

export class MockGeminiService implements IGeminiService {
  onRateLimitHit?: ((seconds: number) => void) | undefined;
  stopRateLimitCountdown?: (() => void) | undefined;

  private failStage = (typeof import.meta !== "undefined" ? import.meta.env.VITE_MOCK_FAIL_STAGE : "") ?? "";

  private wait(ms: number) { return new Promise(r => setTimeout(r, rDelay(ms))); }

  /* Stage 1 ─ Analyze Requirements */
  async *analyzeRequirements(description: string, _options?: AdvancedOptions): AsyncGenerator<StreamChunk> {
    if (this.failStage === "analyzing") throw new Error("Simulated failure (VITE_MOCK_FAIL_STAGE=analyzing)");
    const domain = matchDomain(description);

    yield { type: "thinking", content: "🧠 Analyzing requirements with extended thinking..." }; await this.wait(500);
    yield { type: "thinking", content: "📋 Identifying core purpose and use cases..." }; await this.wait(400);
    yield { type: "thinking", content: "🔍 Extracting input and output requirements..." }; await this.wait(450);
    yield { type: "thinking", content: "⚡ Determining complexity and integration needs..." }; await this.wait(350);
    yield { type: "thinking", content: "✨ Finalizing agent specification..." }; await this.wait(300);

    const spec: AgentSpec = {
      id: crypto.randomUUID(),
      corePurpose: domain ? `Provide intelligent ${domain.keywords[0]} capabilities: ${description.slice(0, 80)}` : `Process and respond to user requests about ${description.slice(0, 60)}`,
      inputRequirements: domain?.inputs ?? [
        { name: "input", type: "text", required: true, description: "User input or query" },
        { name: "context", type: "text", required: false, description: "Additional context" },
      ],
      outputRequirements: domain?.outputs ?? [
        { name: "response", type: "string", description: "AI-generated response" },
        { name: "confidence", type: "number", description: "Confidence score 0-1" },
      ],
      dataSources: domain?.dataSources ?? [{ name: "User input", type: "direct", config: {} }],
      integrations: domain?.integrations ?? [],
      edgeCases: domain?.edgeCases ?? [
        { description: "Empty or invalid input", mitigation: "Return validation error" },
        { description: "Unexpected data format", mitigation: "Fallback to raw text" },
      ],
      personality: { tone: "helpful", formality: "formal", verbosity: "balanced" },
      communicationStyle: "Clear and concise",
      complexityScore: Math.min(10, (domain ? 5 : 3) + (description.length > 200 ? 1 : 0) + (description.toLowerCase().includes("api") ? 2 : 0)),
      inferredFields: [],
    };

    yield { type: "result", content: spec, tokenMetadata: { promptTokenCount: 450, candidatesTokenCount: 1200, thoughtsTokenCount: 15000, totalTokenCount: 16650 } };
  }

  /* Stage 2 ─ Design Architecture */
  async *designArchitecture(spec: AgentSpec): AsyncGenerator<StreamChunk> {
    if (this.failStage === "designing") throw new Error("Simulated failure (VITE_MOCK_FAIL_STAGE=designing)");

    yield { type: "thinking", content: "🏗️ Designing architecture with deep reasoning..." }; await this.wait(550);
    yield { type: "thinking", content: "🤖 Selecting optimal model..." }; await this.wait(500);
    yield { type: "thinking", content: "💬 Planning prompt strategy..." }; await this.wait(500);
    yield { type: "thinking", content: "🔄 Designing data flow..." }; await this.wait(450);
    yield { type: "thinking", content: "🛠️ Configuring error handling..." }; await this.wait(400);

    const arch: ArchitectureDoc = {
      id: crypto.randomUUID(),
      agentSpecId: spec.id,
      selectedModel: spec.complexityScore > 7 ? "gemini-3-pro" : "gemini-3-flash",
      promptStrategy: {
        systemPrompt: `You are an AI agent designed to ${spec.corePurpose}.\nStyle: ${spec.communicationStyle}. Tone: ${spec.personality.tone}.`,
        fewShotExamples: [{ input: "Hello, can you help me?", output: `Of course! I'm here to ${spec.corePurpose}. How can I assist?` }],
        outputFormat: "json",
      },
      dataFlow: spec.complexityScore > 5
        ? [
            { step: 1, name: "validate_input", input: "user_input", output: "validated_data", description: "Validate and sanitize" },
            { step: 2, name: "enrich_context", input: "validated_data", output: "enriched_data", description: "Enrich with data sources" },
            { step: 3, name: "process", input: "enriched_data", output: "result", description: "Core AI processing" },
            { step: 4, name: "format_output", input: "result", output: "response", description: "Format response" },
          ]
        : [
            { step: 1, name: "validate_input", input: "user_input", output: "validated_data", description: "Validate input" },
            { step: 2, name: "process", input: "validated_data", output: "result", description: "Core processing" },
            { step: 3, name: "format_output", input: "result", output: "response", description: "Format response" },
          ],
      stateManagement: { type: spec.complexityScore > 6 ? "session" : "stateless", storage: "redis" },
      tools: [],
      conversationFlow: [
        { id: "start", type: "start", next: ["validate"] },
        { id: "validate", type: "process", next: ["process"] },
        { id: "process", type: "process", next: ["end"] },
        { id: "end", type: "end", next: [] },
      ],
      errorHandling: { retryPolicy: { maxRetries: 3, backoffMs: 1000 }, fallbackBehavior: "Return helpful error message" },
    };

    yield { type: "result", content: arch, tokenMetadata: { promptTokenCount: 1200, candidatesTokenCount: 1800, thoughtsTokenCount: 22000, totalTokenCount: 25000 } };
  }

  /* Stage 3 ─ Generate Code */
  async *generateCode(arch: ArchitectureDoc): AsyncGenerator<StreamChunk> {
    if (this.failStage === "generating") throw new Error("Simulated failure (VITE_MOCK_FAIL_STAGE=generating)");

    yield { type: "thinking", content: "⚡ Generating production-ready code..." }; await this.wait(600);
    yield { type: "code", content: "// Creating Express server..." }; await this.wait(350);
    yield { type: "code", content: "// Implementing core logic..." }; await this.wait(400);
    yield { type: "code", content: "// Writing test suite..." }; await this.wait(300);

    // Find matching domain for context-aware code
    const domain = DOMAIN_PROFILES.find(p => p.keywords.some(kw => arch.promptStrategy.systemPrompt.toLowerCase().includes(kw)));
    const endpoint = domain?.sampleEndpoint ?? "/api/chat";
    const extraImports = domain?.sampleImports ?? "";
    const extraLogic = domain?.sampleLogic ?? "    // Process input with AI";

    yield {
      type: "result",
      content: {
        id: crypto.randomUUID(),
        architectureDocId: arch.id,
        files: [
          { path: "src/agent.ts", content: this.buildAgentCode(arch, endpoint, extraImports, extraLogic), language: "typescript" },
          { path: "src/server.ts", content: "export * from './agent';", language: "typescript" },
          { path: "tests/agent.test.ts", content: `import { describe, test, expect } from 'vitest';\n\ndescribe('Agent', () => {\n  test('handles valid input', async () => {\n    const res = await fetch('http://localhost:3000${endpoint}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: 'Hello' }) });\n    expect((await res.json()).response).toBeDefined();\n  });\n});`, language: "typescript" },
          { path: "README.md", content: `# AI Agent\\n\\nPowered by ${arch.selectedModel}.\\n\\n## Setup\\n\\n\`\`\`bash\\nnpm install && npm start\\n\`\`\``, language: "markdown" },
        ],
        dependencies: { express: "^4.18.0", "@google/generative-ai": "^0.1.0", zod: "^3.22.0", cors: "^2.8.5" },
        testResults: [
          { name: "Input validation", passed: true },
          { name: "Core logic", passed: true },
          { name: "Error handling", passed: true },
          { name: "Integration", passed: true },
        ],
        debugIterations: 1,
        validated: true,
      },
      tokenMetadata: { promptTokenCount: 1800, candidatesTokenCount: 4500, thoughtsTokenCount: 12000, totalTokenCount: 18300 },
    };
  }

  /* Stage 4 ─ Generate UI */
  async *generateUI(_schema: { inputs: any[]; outputs: any[] }): AsyncGenerator<StreamChunk> {
    if (this.failStage === "creating-ui") throw new Error("Simulated failure (VITE_MOCK_FAIL_STAGE=creating-ui)");

    yield { type: "thinking", content: "🎨 Designing user interface..." }; await this.wait(400);
    yield { type: "code", content: "// Creating React components..." }; await this.wait(300);

    yield {
      type: "result",
      content: {
        id: crypto.randomUUID(),
        deploymentResultId: crypto.randomUUID(),
        publicUrl: "http://localhost:5173",
        components: [{ name: "AgentUI", type: "form", props: {} }, { name: "ResponseDisplay", type: "display", props: {} }],
        accessibilityScore: 92,
        responsive: true,
      },
      tokenMetadata: { promptTokenCount: 300, candidatesTokenCount: 1200, thoughtsTokenCount: 3000, totalTokenCount: 4500 },
    };
  }

  /* Execute Agent (demo tab) */
  async *executeAgent(agent: Agent, params: { input: string }): AsyncGenerator<StreamChunk> {
    yield { type: "thinking", content: "🤔 Processing your request..." }; await this.wait(500);

    const responses = [
      `Based on "${params.input}": As ${agent.name} (${agent.description}), here's my analysis. In production this would use full AI reasoning.`,
      `I understand you're asking about "${params.input}". ${agent.name} is designed for exactly this. In a live deployment, I'd provide detailed, actionable insights.`,
      `Processing "${params.input}" — ${agent.name} would leverage ${agent.description} to deliver comprehensive results in production.`,
    ];
    const response = responses[Math.floor(Math.random() * responses.length)]!;

    yield { type: "text", content: response };
    yield { type: "result", content: response, tokenMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, thoughtsTokenCount: 1500, totalTokenCount: 1800 } };
  }

  /* ── Private: context-aware code generation ──────────────────────────── */

  private buildAgentCode(arch: ArchitectureDoc, endpoint: string, extraImports: string, extraLogic: string): string {
    return [
      "import { GoogleGenerativeAI } from '@google/generative-ai';",
      "import express from 'express';",
      "import cors from 'cors';",
      extraImports,
      "",
      `const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');`,
      `const model = genAI.getGenerativeModel({ model: '${arch.selectedModel}' });`,
      "",
      "const app = express();",
      "app.use(cors());",
      "app.use(express.json());",
      "",
      `const SYSTEM_PROMPT = ${JSON.stringify(arch.promptStrategy.systemPrompt)};`,
      "",
      `app.post('${endpoint}', async (req, res) => {`,
      "  try {",
      "    const { input, context } = req.body;",
      "    if (!input) return res.status(400).json({ error: 'Input is required' });",
      "",
      extraLogic,
      "",
      "    const prompt = context",
      "      ? SYSTEM_PROMPT + '\\n\\nContext: ' + context + '\\n\\nUser: ' + input",
      "      : SYSTEM_PROMPT + '\\n\\nUser: ' + input;",
      "",
      "    const result = await model.generateContent(prompt);",
      "    res.json({ response: result.response.text(), confidence: 0.85, timestamp: new Date().toISOString() });",
      "  } catch (error) {",
      "    console.error('Error:', error);",
      "    res.status(500).json({ error: 'Internal server error' });",
      "  }",
      "});",
      "",
      `app.get('/health', (_req, res) => res.json({ status: 'healthy', model: '${arch.selectedModel}' }));`,
      "",
      "const PORT = process.env.PORT || 3000;",
      "app.listen(PORT, () => console.log('Agent running on port ' + PORT));",
    ].join("\n");
  }
}
