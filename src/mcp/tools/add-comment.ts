import { z } from "zod";
import { apiFetch } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
  body: z.string().min(1).describe("Comment text."),
};

export const addCommentTool = defineTool({
  name: "oth_add_comment",
  description:
    "Add a comment to a task. The comment is marked as authored by an AI agent.",
  inputSchema,
  handler: async (args) => {
    try {
      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ body: args.body, is_agent: true }),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
