import type { ZodRawShape, ZodTypeAny } from "zod";

export interface ToolHandlerResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export interface ToolDefinition<Schema extends ZodRawShape = ZodRawShape> {
  name: string;
  description: string;
  inputSchema: Schema;
  handler: (args: { [K in keyof Schema]: Schema[K] extends ZodTypeAny ? ReturnType<Schema[K]["parse"]> : never }) => Promise<ToolHandlerResult>;
}

export function defineTool<Schema extends ZodRawShape>(
  def: ToolDefinition<Schema>,
): ToolDefinition<Schema> {
  return def;
}

export function jsonResult(payload: unknown): ToolHandlerResult {
  return {
    content: [
      {
        type: "text",
        text:
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function errorResult(message: string): ToolHandlerResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
