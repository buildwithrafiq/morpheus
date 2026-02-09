import type {
  Agent,
  AgentSpec,
  ArchitectureDoc,
  CodeBundle,
  DeploymentResult,
  AdvancedOptions,
  InputField,
  OutputField,
} from "@/types/agent";
import type { PipelineEvent, PipelineStage, StreamChunk } from "@/types/pipeline";

// --- Gemini API Service ---

export interface IGeminiService {
  analyzeRequirements(
    description: string,
    options?: AdvancedOptions
  ): AsyncGenerator<StreamChunk>;
  designArchitecture(spec: AgentSpec): AsyncGenerator<StreamChunk>;
  generateCode(arch: ArchitectureDoc): AsyncGenerator<StreamChunk>;
  generateUI(schema: {
    inputs: InputField[];
    outputs: OutputField[];
  }): AsyncGenerator<StreamChunk>;
  executeAgent(
    agent: Agent,
    params: { input: string }
  ): AsyncGenerator<StreamChunk>;
}

// --- Pipeline Orchestrator ---

export interface IPipelineOrchestrator {
  startBuild(
    description: string,
    options?: AdvancedOptions
  ): AsyncGenerator<PipelineEvent>;
  retryStage(
    buildId: string,
    stage: PipelineStage
  ): AsyncGenerator<PipelineEvent>;
  cancelBuild(buildId: string): void;
}

// --- Storage Service ---

export interface AgentQuery {
  search?: string;
  status?: Agent["status"];
  category?: string;
  tags?: string[];
  sortBy?: "createdAt" | "updatedAt" | "usageCount";
  limit?: number;
  offset?: number;
}

export interface EncryptedKey {
  id: string;
  name: string;
  encryptedValue: string;
  createdAt: string;
  lastUsed: string;
  rateLimit: number;
}

export interface IStorageService {
  saveAgent(agent: Agent): Promise<void>;
  getAgent(id: string): Promise<Agent | null>;
  listAgents(query?: AgentQuery): Promise<Agent[]>;
  deleteAgent(id: string): Promise<void>;
  saveApiKey(key: EncryptedKey): Promise<void>;
  getApiKeys(): Promise<EncryptedKey[]>;
  saveSetting(key: string, value: unknown): Promise<void>;
  getSetting<T = unknown>(key: string): Promise<T | null>;
}

// --- Deployment Service ---

export interface IDeployService {
  deploy(
    bundle: CodeBundle,
    provider: "railway" | "render"
  ): Promise<DeploymentResult>;
  healthCheck(endpoint: string): Promise<boolean>;
  teardown(deploymentId: string): Promise<void>;
}

// --- Schema Validation ---

export interface ValidationError {
  path: string;
  message: string;
  expected: string;
  received: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ISchemaValidator {
  validateAgentSpec(data: unknown): ValidationResult<AgentSpec>;
  validateArchitectureDoc(data: unknown): ValidationResult<ArchitectureDoc>;
  validateDeploymentResult(data: unknown): ValidationResult<DeploymentResult>;
}
