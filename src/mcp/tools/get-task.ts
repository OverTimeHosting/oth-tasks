import { z } from "zod";
import { apiFetch } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
};

export const getTaskTool = defineTool({
  name: "oth_get_task",
  description: "Fetch a single task by id.",
  inputSchema,
  handler: async (args) => {
    try {
      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}`,
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
