export interface SharingConfig {
  isPublic: boolean;
  shareLink?: string;
  permissions: "view" | "use" | "fork";
  teamId?: string;
}

export interface PricingTier {
  name: "free" | "pro" | "enterprise";
  agentLimit: number;
  apiCallQuota: number;
  features: string[];
}

export interface CostEntry {
  category: "api_tokens" | "compute" | "deployment";
  amount: number;
  currency: "USD";
}
