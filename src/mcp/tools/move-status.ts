import { z } from "zod";
import { apiFetch } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
  status: z.string().min(1).describe("New status for the task."),
};

export const moveStatusTool = defineTool({
  name: "oth_move_status",
  description: "Move a task to a different status column.",
  inputSchema,
  handler: async (args) => {
    try {
      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: args.status }),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
