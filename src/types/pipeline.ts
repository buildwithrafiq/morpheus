export type PipelineStage = "analyzing" | "designing" | "generating" | "deploying" | "creating-ui";

export interface TokenMetadata {
  thoughtsTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  promptTokenCount: number;
}

export interface PipelineEvent {
  stage: PipelineStage;
  type: "progress" | "thinking" | "code" | "test-result" | "complete" | "error";
  data: unknown;
  timestamp: string;
  tokenMetadata?: TokenMetadata;
}

export interface StreamChunk {
  type: "thinking" | "code" | "result" | "error" | "text";
  content: unknown;
  tokenMetadata?: TokenMetadata;
}
