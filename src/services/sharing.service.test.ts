import { describe, it, expect } from "vitest";
import {
  generateShareLink,
  decodeShareLink,
  generateSocialShare,
  createSharingConfig,
} from "./sharing.service";

describe("sharing.service", () => {
  it("generates a share link with encoded permission", () => {
    const result = generateShareLink("agent-1", "view");
    expect(result.shareLink).toContain("agent-1");
    expect(result.shareLink).toContain("p=v");
    expect(result.permissions).toBe("view");
  });

  it("encodes all permission types correctly", () => {
    expect(generateShareLink("a", "view").shareLink).toContain("p=v");
    expect(generateShareLink("a", "use").shareLink).toContain("p=u");
    expect(generateShareLink("a", "fork").shareLink).toContain("p=f");
  });

  it("decodes a valid share link", () => {
    const { shareLink } = generateShareLink("agent-1", "fork");
    const decoded = decodeShareLink(shareLink);

    expect(decoded).not.toBeNull();
    expect(decoded!.agentId).toBe("agent-1");
    expect(decoded!.permissions).toBe("fork");
  });

  it("returns null for invalid share links", () => {
    expect(decodeShareLink("not-a-url")).toBeNull();
    expect(decodeShareLink("https://morpheus.ai/other")).toBeNull();
    expect(decodeShareLink("https://morpheus.ai/shared/agent-1?p=x")).toBeNull();
  });

  it("generates social share with attribution and signup link", () => {
    const share = generateSocialShare("agent-1", "My Bot", "use");

    expect(share.text).toContain("My Bot");
    expect(share.attribution).toContain("Morpheus");
    expect(share.signupLink).toContain("signup");
    expect(share.url).toContain("agent-1");
  });

  it("creates a full sharing config", () => {
    const config = createSharingConfig("agent-1", "fork", true, "team-1");

    expect(config.isPublic).toBe(true);
    expect(config.permissions).toBe("fork");
    expect(config.shareLink).toContain("agent-1");
    expect(config.teamId).toBe("team-1");
  });
});
