// `othcanva mcp` — run the bundled MCP server in-process over stdio.

import { startMcpServer } from "../mcp/server.js";

export async function runMcp(): Promise<void> {
  await startMcpServer();
}
