import type { SharingConfig } from "@/types/sharing";

export interface ShareLinkResult {
  shareLink: string;
  permissions: SharingConfig["permissions"];
  agentId: string;
}

export interface SocialShareContent {
  text: string;
  url: string;
  attribution: string;
  signupLink: string;
}

function getPlatformBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

const PLATFORM_ATTRIBUTION = "Built with Morpheus AI Platform";

// Permission encoding map for share links
const PERMISSION_CODES: Record<SharingConfig["permissions"], string> = {
  view: "v",
  use: "u",
  fork: "f",
};

const CODE_TO_PERMISSION: Record<string, SharingConfig["permissions"]> = {
  v: "view",
  u: "use",
  f: "fork",
};

/**
 * Generates a shareable link with permission encoded in the URL.
 */
export function generateShareLink(
  agentId: string,
  permissions: SharingConfig["permissions"]
): ShareLinkResult {
  const baseUrl = getPlatformBaseUrl();
  const permCode = PERMISSION_CODES[permissions];
  const shareLink = `${baseUrl}/shared/${agentId}?p=${permCode}`;

  return {
    shareLink,
    permissions,
    agentId,
  };
}

/**
 * Decodes a share link to extract the agent ID and permissions.
 * Returns null if the link is invalid.
 */
export function decodeShareLink(
  shareLink: string
): { agentId: string; permissions: SharingConfig["permissions"] } | null {
  try {
    const url = new URL(shareLink);
    const pathParts = url.pathname.split("/");
    const sharedIdx = pathParts.indexOf("shared");
    if (sharedIdx === -1 || sharedIdx + 1 >= pathParts.length) return null;

    const agentId = pathParts[sharedIdx + 1];
    const permCode = url.searchParams.get("p");
    if (!agentId || !permCode || !CODE_TO_PERMISSION[permCode]) return null;

    return {
      agentId,
      permissions: CODE_TO_PERMISSION[permCode],
    };
  } catch {
    return null;
  }
}

/**
 * Generates social share content with platform attribution and signup link.
 */
export function generateSocialShare(
  agentId: string,
  agentName: string,
  permissions: SharingConfig["permissions"]
): SocialShareContent {
  const { shareLink } = generateShareLink(agentId, permissions);

  return {
    text: `Check out "${agentName}" — ${PLATFORM_ATTRIBUTION}`,
    url: shareLink,
    attribution: PLATFORM_ATTRIBUTION,
    signupLink: `${getPlatformBaseUrl()}/signup`,
  };
}

/**
 * Creates a full SharingConfig for an agent.
 */
export function createSharingConfig(
  agentId: string,
  permissions: SharingConfig["permissions"],
  isPublic: boolean,
  teamId?: string
): SharingConfig {
  const { shareLink } = generateShareLink(agentId, permissions);

  return {
    isPublic,
    shareLink,
    permissions,
    teamId,
  };
}
