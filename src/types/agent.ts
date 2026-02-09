// --- Supporting Types ---

export interface InputField {
  name: string;
  type: "text" | "number" | "boolean" | "file" | "select";
  required: boolean;
  description: string;
  validation?: string;
}

export interface OutputField {
  name: string;
  type: string;
  description: string;
}

export interface DataSource {
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export interface Integration {
  name: string;
  type: string;
  authType: string;
  config: Record<string, unknown>;
}

export interface EdgeCase {
  description: string;
  mitigation: string;
}

export interface AgentPersonality {
  tone: string;
  formality: "casual" | "neutral" | "formal";
  verbosity: "concise" | "balanced" | "detailed";
}

export interface AdvancedOptions {
  modelPreference?: "flash" | "pro";
  maxResponseTime?: number;
  costConstraint?: number;
  integrationRequirements?: string[];
}

// --- Pipeline Schema Types ---

export interface PromptStrategy {
  systemPrompt: string;
  fewShotExamples: { input: string; output: string }[];
  outputFormat: string;
}

export interface DataFlowStep {
  step: number;
  name: string;
  input: string;
  output: string;
  description: string;
}

export interface StateManagementPlan {
  type: "stateless" | "session" | "persistent";
  storage: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ConversationNode {
  id: string;
  type: "start" | "process" | "decision" | "end";
  next: string[];
}

export interface ErrorStrategy {
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  fallbackBehavior: string;
}

export interface MultiAgentStrategy {
  agents: { role: string; model: string }[];
  coordinationPattern: string;
}

export interface IntegrationSpec {
  name: string;
  endpoint: string;
  authFlow: string;
  rateLimit?: number;
}

export interface Tradeoff {
  decision: string;
  pros: string[];
  cons: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface FailureReport {
  unresolvedIssues: string[];
  debugIterations: number;
  lastError: string;
}

export interface UIComponent {
  name: string;
  type: string;
  props: Record<string, unknown>;
}

// --- Pipeline Artifacts ---

export interface AgentSpec {
  id: string;
  corePurpose: string;
  inputRequirements: InputField[];
  outputRequirements: OutputField[];
  dataSources: DataSource[];
  integrations: Integration[];
  edgeCases: EdgeCase[];
  personality: AgentPersonality;
  communicationStyle: string;
  complexityScore: number;
  inferredFields: string[];
  advancedOptions?: AdvancedOptions;
}

export interface ArchitectureDoc {
  id: string;
  agentSpecId: string;
  selectedModel: "gemini-3-flash" | "gemini-3-pro";
  promptStrategy: PromptStrategy;
  dataFlow: DataFlowStep[];
  stateManagement: StateManagementPlan;
  tools: ToolSpec[];
  conversationFlow: ConversationNode[];
  errorHandling: ErrorStrategy;
  multiAgentStrategy?: MultiAgentStrategy;
  integrationSpecs?: IntegrationSpec[];
  tradeoffs?: Tradeoff[];
}

export interface CodeBundle {
  id: string;
  architectureDocId: string;
  files: GeneratedFile[];
  dependencies: Record<string, string>;
  testResults: TestResult[];
  debugIterations: number;
  failureReport?: FailureReport;
  validated: boolean;
}

export interface DeploymentResult {
  id: string;
  codeBundleId: string;
  provider: "railway" | "render" | "local";
  status: "running" | "stopped" | "error";
  endpoint: string;
  healthCheckPassed: boolean;
  containerImage?: string;
  envVars: string[];
  deploymentTime: number;
  fallbackUsed: boolean;
  localInstructions?: string;
}

export interface GeneratedUI {
  id: string;
  deploymentResultId: string;
  publicUrl: string;
  components: UIComponent[];
  accessibilityScore: number;
  responsive: boolean;
}

// --- Agent Management ---

import type { SharingConfig } from "./sharing";

export interface AgentVersion {
  version: number;
  agentSpec: AgentSpec;
  architectureDoc: ArchitectureDoc;
  codeBundle: CodeBundle;
  deploymentResult: DeploymentResult;
  generatedUI: GeneratedUI;
  createdAt: string;
  descriptionSummary: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  status: "building" | "running" | "stopped" | "error";
  currentVersion: number;
  versions: AgentVersion[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  ownerId: string;
  sharing: SharingConfig;
}
