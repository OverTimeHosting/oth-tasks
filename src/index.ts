#!/usr/bin/env node
// oth-tasks — CLI entry point.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLogin } from "./commands/login.js";
import { runStatus } from "./commands/status.js";
import { runMcp } from "./commands/mcp.js";
import { runProjectCreate, runProjectUse } from "./commands/project.js";

// Read the real package version at runtime so `oth --version` always
// matches the installed package (instead of a hardcoded literal that
// drifts every release).
function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // dist/index.js → ../package.json
    const pkgPath = join(here, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

interface GlobalOpts {
  apiBase?: string;
}

function globalOpts(cmd: Command): GlobalOpts {
  // commander merges parent options into the leaf command; walk up just in case.
  let c: Command | null = cmd;
  while (c) {
    const o = c.opts<GlobalOpts>();
    if (o.apiBase) return { apiBase: o.apiBase };
    c = c.parent;
  }
  return {};
}

const program = new Command();

program
  .name("oth")
  .description("Connect your repo to OTHCanva and run the MCP server.")
  .version(readPackageVersion())
  .option(
    "--api-base <url>",
    "Override the OTHCanva API base URL (default: https://canva-app.oth.zone or $OTH_API_BASE)",
  );

program
  .command("init")
  .description("Connect the current repo to OTHCanva.")
  .option("--force", "Re-link even if .othcanva.json already exists")
  .action(async (args: { force?: boolean }, cmd: Command) => {
    await runInit({ ...globalOpts(cmd), force: args.force });
  });

program
  .command("login")
  .description("Refresh the OTHCanva token for this repo.")
  .action(async (_args, cmd: Command) => {
    await runLogin(globalOpts(cmd));
  });

program
  .command("status")
  .description("Show the current OTHCanva connection details.")
  .action(async (_args, cmd: Command) => {
    await runStatus(globalOpts(cmd));
  });

program
  .command("mcp")
  .description("Run the bundled OTH MCP server over stdio.")
  .action(async () => {
    await runMcp();
  });

const projectCmd = program
  .command("project")
  .description("Manage which OTHCanva project this repo is bound to.");

projectCmd
  .command("create <name>")
  .description("Create a new OTHCanva project and bind this repo to it.")
  .action(async (name: string, _args, cmd: Command) => {
    await runProjectCreate(name, globalOpts(cmd));
  });

projectCmd
  .command("use <projectId>")
  .description("Point this repo at an existing OTHCanva project.")
  .action(async (projectId: string, _args, cmd: Command) => {
    await runProjectUse(projectId, globalOpts(cmd));
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
