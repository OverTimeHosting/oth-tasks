import { z } from "zod";
import { apiFetch } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
  text: z.string().min(1).describe("Activity log message."),
};

export const logChangeTool = defineTool({
  name: "oth_log_change",
  description: "Append a system-kind activity entry to a task.",
  inputSchema,
  handler: async (args) => {
    try {
      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}/activity`,
        {
          method: "POST",
          body: JSON.stringify({ kind: "system", text: args.text }),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
