import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  IGeminiService,
  IPipelineOrchestrator,
  IStorageService,
  IDeployService,
  ISchemaValidator,
} from "@/services/interfaces";
import { GeminiService } from "@/services/gemini.service";
import { MockGeminiService } from "@/services/mock-gemini.service";
import { LocalDeployService } from "@/services/local-deploy.service";
import { createStorageService } from "@/services/storage.service";
import { SchemaValidator } from "@/services/schema-validator";
import { PipelineOrchestrator } from "@/services/pipeline-orchestrator";
import { useToast } from "@/components/Toast";
import { useDemoMode } from "@/components/DemoMode";
import { DEMO_AGENTS } from "@/constants/demo-agents";

export type BuildMode = "mock" | "real" | "byok";

export interface Services {
  gemini: IGeminiService;
  pipeline: IPipelineOrchestrator;
  storage: IStorageService;
  deploy: IDeployService;
  schemaValidator: ISchemaValidator;
  isMockMode: boolean;
  buildMode: BuildMode;
  switchBuildMode: (mode: BuildMode) => void;
  toggleMockMode: () => void;
  setByokKey: (key: string) => void;
  byokKey: string;
}

const ServiceContext = createContext<Services | null>(null);

export interface ServiceProviderProps {
  children: ReactNode;
  overrides?: Partial<Services>;
}

function getInitialBuildMode(): BuildMode {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? "";
  const forceMock = import.meta.env.VITE_USE_MOCK === "true";
  if (forceMock || !apiKey || apiKey === "your_key_here") return "mock";
  return "real";
}

function looksLikeGeminiKey(key: string): boolean {
  return /^AIza[A-Za-z0-9_-]{30,}$/.test(key.trim());
}

const MODE_LABELS: Record<BuildMode, string> = {
  mock: "Switched to Mock Mode",
  real: "Switched to Real API Mode",
  byok: "Switched to BYOK Mode",
};

export function ServiceProvider({ children, overrides }: ServiceProviderProps) {
  const { addToast } = useToast();
  const { isDemoMode } = useDemoMode();
  const [buildMode, setBuildModeState] = useState<BuildMode>(getInitialBuildMode);
  const [byokKey, setByokKeyState] = useState<string>("");

  const coreServices = useMemo(() => {
    let gemini: IGeminiService;
    if (buildMode === "byok" && byokKey) {
      gemini = overrides?.gemini ?? new GeminiService({ apiKey: byokKey, byok: true });
    } else if (buildMode === "real") {
      gemini = overrides?.gemini ?? new GeminiService({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? "" });
    } else {
      gemini = overrides?.gemini ?? new MockGeminiService();
    }
    const deploy = overrides?.deploy ?? new LocalDeployService();
    const schemaValidator = overrides?.schemaValidator ?? new SchemaValidator();
    const storage = overrides?.storage ?? createStorageService();
    const pipeline = overrides?.pipeline ?? new PipelineOrchestrator(
      overrides?.gemini ?? gemini, deploy, schemaValidator
    );
    return { gemini, pipeline, storage, deploy, schemaValidator };
  }, [buildMode, byokKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchBuildMode = useCallback((mode: BuildMode) => {
    if (mode === "byok" && !byokKey) {
      addToast("warning", "Enter a Gemini API key first to activate BYOK mode");
      return;
    }
    setBuildModeState(prev => {
      if (prev === mode) return prev;
      return mode;
    });
    if (buildMode === "byok" && mode !== "byok") {
      setByokKeyState("");
    }
    if (mode !== buildMode) {
      addToast("info", MODE_LABELS[mode]);
    }
  }, [addToast, byokKey, buildMode]);

  const toggleMockMode = useCallback(() => {
    switchBuildMode(buildMode === "mock" ? "real" : "mock");
  }, [buildMode, switchBuildMode]);

  const setByokKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      setByokKeyState("");
      setBuildModeState("mock");
      addToast("info", "BYOK key cleared");
      return;
    }
    if (!looksLikeGeminiKey(trimmed)) {
      addToast("error", "Invalid API key format. Gemini keys start with AIza...");
      return;
    }
    setByokKeyState(trimmed);
    setBuildModeState("byok");
    addToast("success", "BYOK key set!");
  }, [addToast]);

  useEffect(() => {
    if (buildMode === "mock") {
      addToast("info", "Mock Mode Active");
    } else if (buildMode === "byok") {
      addToast("info", "BYOK Mode Active");
    } else {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if ((!apiKey || apiKey === "your_key_here") && !isDemoMode) {
        addToast("error", "Please set VITE_GEMINI_API_KEY in .env or add a BYOK key in Settings");
      }
    }
  }, [addToast, isDemoMode, buildMode]);

  useEffect(() => {
    if (isDemoMode) {
      const seedDemoAgents = async () => {
        for (const agent of DEMO_AGENTS) {
          const existing = await coreServices.storage.getAgent(agent.id);
          if (!existing) {
            await coreServices.storage.saveAgent(agent);
          }
        }
      };
      seedDemoAgents();
    }
  }, [isDemoMode, coreServices.storage]);

  const value = useMemo<Services>(
    () => ({
      ...coreServices,
      isMockMode: buildMode === "mock",
      buildMode,
      switchBuildMode,
      toggleMockMode,
      setByokKey,
      byokKey,
    }),
    [coreServices, buildMode, switchBuildMode, toggleMockMode, setByokKey, byokKey]
  );

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices(): Services {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return ctx;
}
