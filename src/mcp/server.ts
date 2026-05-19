// MCP server entry. Exported as `startMcpServer` so the CLI can invoke it
// in-process via `oth mcp`. Also runnable directly (the `oth-mcp` bin).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getConfig } from "./api.js";
import { allTools } from "./tools/index.js";

export async function startMcpServer(): Promise<void> {
  // Load and cache config eagerly so a misconfigured repo fails fast at
  // startup, before the agent tries to call a tool.
  try {
    await getConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[oth-mcp] ${message}`);
    process.exit(1);
  }

  const server = new McpServer({
    name: "@oth/tasks",
    version: "0.1.0",
  });

  for (const tool of allTools) {
    // Cast through `any` because each tool has its own zod input shape;
    // `registerTool` is heavily overloaded and we iterate a heterogeneous array.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server.registerTool as any)(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: unknown) => tool.handler(args as never),
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[oth-mcp] listening on stdio");
}
