// Patch the repo's .mcp.json so Claude Code knows how to launch our MCP server.
// Preserves any other `mcpServers` entries the user already configured.

import { promises as fs } from "node:fs";
import * as path from "node:path";

export const MCP_SERVER_KEY = "oth-tasks";

export interface McpServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpConfigFile {
  mcpServers?: Record<string, McpServerEntry>;
  [k: string]: unknown;
}

async function readJsonIfExists(p: string): Promise<McpConfigFile | null> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as McpConfigFile;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    // If the file exists but is unparseable, refuse to clobber it.
    throw err;
  }
}

export async function patchMcpConfig(repoRoot: string): Promise<void> {
  const p = path.join(repoRoot, ".mcp.json");
  const existing = (await readJsonIfExists(p)) ?? {};
  const servers = existing.mcpServers ?? {};

  // Use the `oth` binary directly — it resolves @oth/mcp-server at runtime
  // via createRequire and spawns the stdio MCP. Requires `oth` to be on PATH
  // (npm link / pnpm setup + link / global install). Once @oth/tasks is
  // published to npm, swap this back to `npx -y @oth/tasks mcp`.
  servers[MCP_SERVER_KEY] = {
    command: "oth",
    args: ["mcp"],
  };

  const next: McpConfigFile = {
    ...existing,
    mcpServers: servers,
  };

  await fs.writeFile(p, JSON.stringify(next, null, 2) + "\n", "utf8");
}
