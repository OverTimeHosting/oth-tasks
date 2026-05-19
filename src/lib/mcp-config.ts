// Patch the repo's .mcp.json so Claude Code knows how to launch our MCP server.
// Preserves any other `mcpServers` entries the user already configured.

import { promises as fs } from "node:fs";
import * as path from "node:path";

export const MCP_SERVER_KEY = "othcanva";
// Old key from the `oth-tasks`-named release. patchMcpConfig clears
// this on write so users upgrading from 0.1.x don't end up with two
// entries pointing at the same server.
const LEGACY_KEYS = ["oth-tasks"];

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

  // Resolve the MCP server through npx so the entry works on any machine
  // that has the published `othcanva` package available — no global install
  // required. `-y` auto-accepts the package fetch prompt.
  servers[MCP_SERVER_KEY] = {
    command: "npx",
    args: ["-y", "othcanva", "mcp"],
  };
  for (const k of LEGACY_KEYS) delete servers[k];

  const next: McpConfigFile = {
    ...existing,
    mcpServers: servers,
  };

  await fs.writeFile(p, JSON.stringify(next, null, 2) + "\n", "utf8");
}
