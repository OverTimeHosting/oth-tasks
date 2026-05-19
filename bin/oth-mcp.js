#!/usr/bin/env node
// Direct entry point for the bundled OTH MCP server.
import { startMcpServer } from "../dist/mcp/server.js";

startMcpServer().catch((err) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(`[oth-mcp] fatal: ${message}`);
  process.exit(1);
});
