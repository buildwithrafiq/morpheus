import type { Agent, GeneratedFile } from '@/types/agent'

function makeVersion(overrides: {
  corePurpose: string
  systemPrompt: string
  model: 'gemini-3-flash' | 'gemini-3-pro'
  summary: string
  files?: GeneratedFile[]
  dependencies?: Record<string, string>
}): Agent['versions'][number] {
  const specId = crypto.randomUUID()
  const archId = crypto.randomUUID()
  const codeId = crypto.randomUUID()
  const deployId = crypto.randomUUID()
  const uiId = crypto.randomUUID()

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    descriptionSummary: overrides.summary,
    agentSpec: {
      id: specId,
      corePurpose: overrides.corePurpose,
      inputRequirements: [{ name: 'input', type: 'text', required: true, description: 'User input' }],
      outputRequirements: [{ name: 'response', type: 'string', description: 'Agent response' }],
      dataSources: [],
      integrations: [],
      edgeCases: [{ description: 'Empty input', mitigation: 'Return helpful prompt' }],
      personality: { tone: 'professional', formality: 'neutral', verbosity: 'balanced' },
      communicationStyle: 'conversational',
      complexityScore: 5,
      inferredFields: [],
    },
    architectureDoc: {
      id: archId,
      agentSpecId: specId,
      selectedModel: overrides.model,
      promptStrategy: {
        systemPrompt: overrides.systemPrompt,
        fewShotExamples: [],
        outputFormat: 'text',
      },
      dataFlow: [{ step: 1, name: 'process', input: 'user_input', output: 'response', description: 'Process input' }],
      stateManagement: { type: 'stateless', storage: 'none' },
      tools: [],
      conversationFlow: [
        { id: 'start', type: 'start', next: ['process'] },
        { id: 'process', type: 'process', next: ['end'] },
        { id: 'end', type: 'end', next: [] },
      ],
      errorHandling: { retryPolicy: { maxRetries: 2, backoffMs: 1000 }, fallbackBehavior: 'Return error message' },
    },
    codeBundle: {
      id: codeId,
      architectureDocId: archId,
      files: overrides.files ?? [{ path: 'src/agent.ts', content: '// Agent code', language: 'typescript' }],
      dependencies: overrides.dependencies ?? { express: '^4.18.0', '@google/genai': '^1.0.0', dotenv: '^16.4.0', zod: '^3.23.0' },
      testResults: [{ name: 'unit-tests', passed: true }, { name: 'integration-test', passed: true }],
      debugIterations: 0,
      validated: true,
    },
    deploymentResult: {
      id: deployId,
      codeBundleId: codeId,
      provider: 'local',
      status: 'running',
      endpoint: 'http://localhost:3001',
      healthCheckPassed: true,
      envVars: [],
      deploymentTime: 2400,
      fallbackUsed: false,
    },
    generatedUI: {
      id: uiId,
      deploymentResultId: deployId,
      publicUrl: 'http://localhost:5173/demo',
      components: [],
      accessibilityScore: 92,
      responsive: true,
    },
  }
}

export const DEMO_AGENTS: Agent[] = [
  {
    id: 'demo-pitch-analyzer',
    name: 'Startup Pitch Analyzer',
    description: 'Analyzes pitch decks and provides scores on market fit, team strength, financials, and overall viability. Gives actionable feedback.',
    tags: ['startup', 'analysis', 'pitch'],
    category: 'Business',
    status: 'running',
    currentVersion: 1,
    versions: [
      makeVersion({
        corePurpose: 'Analyze startup pitch decks and score them',
        systemPrompt: 'You are a seasoned VC analyst. Evaluate startup pitches on market fit, team, financials, and traction. Be constructive but honest.',
        model: 'gemini-3-pro',
        summary: 'Startup pitch analysis agent',
        files: [
          {
            path: 'src/agent.ts',
            language: 'typescript',
            content: `import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const PitchScoreSchema = z.object({
  marketFit: z.number().min(1).max(10),
  teamStrength: z.number().min(1).max(10),
  financials: z.number().min(1).max(10),
  traction: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type PitchScore = z.infer<typeof PitchScoreSchema>;

const SYSTEM_PROMPT = \`You are a seasoned VC analyst with 15+ years of experience.
Evaluate startup pitches on these dimensions (1-10 scale):
- Market Fit: TAM/SAM/SOM, problem clarity, timing
- Team Strength: experience, domain expertise, completeness
- Financials: unit economics, runway, revenue model
- Traction: users, growth rate, retention

Return a JSON object with scores, summary, strengths, weaknesses, and recommendations.\`;

export async function analyzePitch(input: string): Promise<PitchScore> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: \`\${SYSTEM_PROMPT}\\n\\nPitch to analyze:\\n\${input}\`,
    config: {
      thinkingConfig: { thinkingLevel: "high" },
      responseMimeType: "application/json",
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return PitchScoreSchema.parse(parsed);
}`,
          },
          {
            path: 'src/server.ts',
            language: 'typescript',
            content: `import express from "express";
import cors from "cors";
import { analyzePitch } from "./agent";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const result = await analyzePitch(message);
    res.json({ response: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({ error: msg });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(\`Agent running on port \${PORT}\`));`,
          },
          {
            path: 'src/agent.test.ts',
            language: 'typescript',
            content: `import { describe, it, expect } from "vitest";
import { analyzePitch } from "./agent";

describe("analyzePitch", () => {
  it("returns valid scores for a pitch description", async () => {
    const result = await analyzePitch(
      "We are building an AI-powered CRM for SMBs. 50k users, 20% MoM growth."
    );
    expect(result.marketFit).toBeGreaterThanOrEqual(1);
    expect(result.marketFit).toBeLessThanOrEqual(10);
    expect(result.overall).toBeGreaterThanOrEqual(1);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});`,
          },
          {
            path: 'Dockerfile',
            language: 'dockerfile',
            content: `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/server.js"]`,
          },
        ],
        dependencies: {
          express: '^4.21.0',
          cors: '^2.8.5',
          '@google/genai': '^1.0.0',
          zod: '^3.23.0',
          dotenv: '^16.4.0',
        },
      }),
    ],
    createdAt: '2026-02-08T10:00:00Z',
    updatedAt: '2026-02-08T10:00:00Z',
    usageCount: 847,
    ownerId: 'demo-user',
    sharing: { isPublic: true, permissions: 'view' },
  },
  {
    id: 'demo-code-reviewer',
    name: 'Code Review Assistant',
    description: 'Reviews pull requests for bugs, security issues, performance problems, and style violations. Suggests fixes with explanations.',
    tags: ['code', 'review', 'security'],
    category: 'Developer Tools',
    status: 'running',
    currentVersion: 1,
    versions: [
      makeVersion({
        corePurpose: 'Review code for bugs, security, and style',
        systemPrompt: 'You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style. Provide specific, actionable suggestions.',
        model: 'gemini-3-flash',
        summary: 'Automated code review agent',
        files: [
          {
            path: 'src/agent.ts',
            language: 'typescript',
            content: `import { GoogleGenAI } from "@google/genai";

interface ReviewIssue {
  severity: "critical" | "warning" | "info";
  line?: number;
  category: "bug" | "security" | "performance" | "style";
  message: string;
  suggestion: string;
}

interface ReviewResult {
  issues: ReviewIssue[];
  summary: string;
  score: number;
}

const SYSTEM_PROMPT = \`You are an expert code reviewer. Analyze the provided code for:
1. Bugs: Logic errors, null references, race conditions
2. Security: Injection, XSS, auth issues, secrets in code
3. Performance: N+1 queries, memory leaks, unnecessary allocations
4. Style: Naming, complexity, dead code, missing error handling

Return JSON with issues array (severity, line, category, message, suggestion),
a summary string, and a quality score from 1-100.\`;

export async function reviewCode(code: string, language?: string): Promise<ReviewResult> {
  const ai = new GoogleGenAI({});
  const prompt = language
    ? \`\${SYSTEM_PROMPT}\\n\\nLanguage: \${language}\\n\\nCode:\\n\\\`\\\`\\\`\\n\${code}\\n\\\`\\\`\\\`\`
    : \`\${SYSTEM_PROMPT}\\n\\nCode:\\n\\\`\\\`\\\`\\n\${code}\\n\\\`\\\`\\\`\`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: "medium" },
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text ?? "{}");
}`,
          },
          {
            path: 'src/server.ts',
            language: 'typescript',
            content: `import express from "express";
import cors from "cors";
import { reviewCode } from "./agent";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/review", async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (code) is required" });
    }
    const result = await reviewCode(message, language);
    res.json({ response: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({ error: msg });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(\`Agent running on port \${PORT}\`));`,
          },
          {
            path: 'src/agent.test.ts',
            language: 'typescript',
            content: `import { describe, it, expect } from "vitest";
import { reviewCode } from "./agent";

describe("reviewCode", () => {
  it("detects issues in problematic code", async () => {
    const code = \`
      function getUser(id) {
        const query = "SELECT * FROM users WHERE id = " + id;
        return db.query(query);
      }
    \`;
    const result = await reviewCode(code, "javascript");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some(i => i.category === "security")).toBe(true);
    expect(result.score).toBeLessThan(80);
  });
});`,
          },
          {
            path: 'Dockerfile',
            language: 'dockerfile',
            content: `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/server.js"]`,
          },
        ],
        dependencies: {
          express: '^4.21.0',
          cors: '^2.8.5',
          '@google/genai': '^1.0.0',
          dotenv: '^16.4.0',
        },
      }),
    ],
    createdAt: '2026-02-07T14:30:00Z',
    updatedAt: '2026-02-09T08:15:00Z',
    usageCount: 1203,
    ownerId: 'demo-user',
    sharing: { isPublic: true, permissions: 'view' },
  },
  {
    id: 'demo-meeting-summarizer',
    name: 'Meeting Notes Summarizer',
    description: 'Turns messy meeting transcripts into structured summaries with action items, decisions made, and follow-up tasks assigned to people.',
    tags: ['meetings', 'productivity', 'summary'],
    category: 'Productivity',
    status: 'running',
    currentVersion: 1,
    versions: [
      makeVersion({
        corePurpose: 'Summarize meeting transcripts into structured notes',
        systemPrompt: 'You are a meeting assistant. Extract key decisions, action items with owners, and a concise summary from meeting transcripts. Use bullet points and clear formatting.',
        model: 'gemini-3-flash',
        summary: 'Meeting transcript summarizer',
        files: [
          {
            path: 'src/agent.ts',
            language: 'typescript',
            content: `import { GoogleGenAI } from "@google/genai";

interface ActionItem {
  task: string;
  owner: string;
  deadline?: string;
  priority: "high" | "medium" | "low";
}

interface MeetingSummary {
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  followUps: string[];
}

const SYSTEM_PROMPT = \`You are a meeting assistant. Given a meeting transcript, extract:
1. A concise title and date (infer if not stated)
2. List of attendees mentioned
3. A 2-3 sentence executive summary
4. Key decisions made
5. Action items with owner, deadline, and priority
6. Follow-up topics for next meeting

Return as structured JSON.\`;

export async function summarizeMeeting(transcript: string): Promise<MeetingSummary> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: \`\${SYSTEM_PROMPT}\\n\\nTranscript:\\n\${transcript}\`,
    config: {
      thinkingConfig: { thinkingLevel: "medium" },
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text ?? "{}");
}`,
          },
          {
            path: 'src/server.ts',
            language: 'typescript',
            content: `import express from "express";
import cors from "cors";
import { summarizeMeeting } from "./agent";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.post("/api/summarize", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (transcript) is required" });
    }
    const result = await summarizeMeeting(message);
    res.json({ response: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    res.status(500).json({ error: msg });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(\`Agent running on port \${PORT}\`));`,
          },
          {
            path: 'src/agent.test.ts',
            language: 'typescript',
            content: `import { describe, it, expect } from "vitest";
import { summarizeMeeting } from "./agent";

describe("summarizeMeeting", () => {
  it("extracts action items from a transcript", async () => {
    const transcript = \`
      Sarah: Let's finalize the Q2 roadmap. Mike, can you have the API docs ready by Friday?
      Mike: Sure, I'll also loop in the design team.
      Sarah: Great. Decision: we're going with option B for the pricing model.
      Mike: Agreed. I'll set up a follow-up for next Tuesday.
    \`;
    const result = await summarizeMeeting(transcript);
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.attendees).toContain("Sarah");
  });
});`,
          },
          {
            path: 'Dockerfile',
            language: 'dockerfile',
            content: `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/server.js"]`,
          },
        ],
        dependencies: {
          express: '^4.21.0',
          cors: '^2.8.5',
          '@google/genai': '^1.0.0',
          dotenv: '^16.4.0',
        },
      }),
    ],
    createdAt: '2026-02-06T09:00:00Z',
    updatedAt: '2026-02-08T16:45:00Z',
    usageCount: 562,
    ownerId: 'demo-user',
    sharing: { isPublic: true, permissions: 'view' },
  },
]
