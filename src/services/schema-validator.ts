import { ZodError, type ZodSchema } from "zod";
import { AgentSpecSchema } from "@/schemas/agent-spec.schema";
import { ArchitectureDocSchema } from "@/schemas/architecture-doc.schema";
import { DeploymentResultSchema } from "@/schemas/deployment-result.schema";
import type { AgentSpec, ArchitectureDoc, DeploymentResult } from "@/types/agent";
import type { ISchemaValidator, ValidationResult, ValidationError } from "./interfaces";

function mapZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    expected: "expected" in issue ? String(issue.expected) : issue.code,
    received: "received" in issue ? String(issue.received) : "invalid",
  }));
}

function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: mapZodErrors(result.error) };
}

export class SchemaValidator implements ISchemaValidator {
  validateAgentSpec(data: unknown): ValidationResult<AgentSpec> {
    return validate(AgentSpecSchema, data) as ValidationResult<AgentSpec>;
  }

  validateArchitectureDoc(data: unknown): ValidationResult<ArchitectureDoc> {
    return validate(ArchitectureDocSchema, data) as ValidationResult<ArchitectureDoc>;
  }

  validateDeploymentResult(data: unknown): ValidationResult<DeploymentResult> {
    return validate(DeploymentResultSchema, data) as ValidationResult<DeploymentResult>;
  }
}
