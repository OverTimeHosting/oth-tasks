#!/usr/bin/env node
// oth-tasks — CLI entry point.

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLogin } from "./commands/login.js";
import { runStatus } from "./commands/status.js";
import { runMcp } from "./commands/mcp.js";
import { runProjectCreate, runProjectUse } from "./commands/project.js";

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
  .version("0.1.0")
  .option(
    "--api-base <url>",
    "Override the OTHCanva API base URL (default: https://canva.oth.zone or $OTH_API_BASE)",
  );

program
  .command("init")
  .description("Connect the current repo to OTHCanva.")
  .action(async (_args, cmd: Command) => {
    await runInit(globalOpts(cmd));
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
