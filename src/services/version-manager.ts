import type { Agent, AgentVersion, AgentSpec } from "@/types/agent";

const MAX_VERSIONS = 20;

/**
 * Creates a new version for an agent, preserving all previous versions.
 * Returns the updated agent with the new version appended.
 */
export function createVersion(
  agent: Agent,
  versionData: Omit<AgentVersion, "version" | "createdAt">
): Agent {
  const nextVersion = agent.versions.length > 0
    ? Math.max(...agent.versions.map((v) => v.version)) + 1
    : 1;

  const newVersion: AgentVersion = {
    ...versionData,
    version: nextVersion,
    createdAt: new Date().toISOString(),
  };

  return {
    ...agent,
    currentVersion: nextVersion,
    versions: [...agent.versions, newVersion],
    updatedAt: newVersion.createdAt,
  };
}

/**
 * Returns all versions for an agent in chronological order (oldest first).
 */
export function listVersions(agent: Agent): AgentVersion[] {
  return [...agent.versions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Rolls back an agent to a specific version number.
 * Sets currentVersion to the target and preserves all versions.
 */
export function rollback(agent: Agent, targetVersion: number): Agent {
  const version = agent.versions.find((v) => v.version === targetVersion);
  if (!version) {
    throw new Error(`Version ${targetVersion} not found for agent ${agent.id}`);
  }

  return {
    ...agent,
    currentVersion: targetVersion,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Forks an agent's current version spec into a new AgentSpec with a new id.
 * Returns a deep copy of the spec with only the id replaced.
 */
export function fork(agent: Agent, newSpecId: string): AgentSpec {
  const currentVer = agent.versions.find(
    (v) => v.version === agent.currentVersion
  );
  if (!currentVer) {
    throw new Error(
      `Current version ${agent.currentVersion} not found for agent ${agent.id}`
    );
  }

  const cloned: AgentSpec = JSON.parse(JSON.stringify(currentVer.agentSpec));
  cloned.id = newSpecId;
  return cloned;
}

/**
 * Cleans up old versions when count exceeds MAX_VERSIONS (20).
 * Removes oldest versions first, always keeping the current version.
 * Returns the updated agent.
 */
export function cleanup(agent: Agent): Agent {
  if (agent.versions.length <= MAX_VERSIONS) {
    return agent;
  }

  const sorted = [...agent.versions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const toRemove = sorted.length - MAX_VERSIONS;
  const removable = sorted.filter((v) => v.version !== agent.currentVersion);
  const removeSet = new Set(
    removable.slice(0, toRemove).map((v) => v.version)
  );

  const remaining = agent.versions.filter((v) => !removeSet.has(v.version));

  return {
    ...agent,
    versions: remaining,
    updatedAt: new Date().toISOString(),
  };
}
