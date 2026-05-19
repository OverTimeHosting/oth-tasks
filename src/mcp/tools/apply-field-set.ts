import { z } from "zod";
import { apiFetch } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
  setId: z.string().min(1).describe("Field-set identifier to apply."),
};

export const applyFieldSetTool = defineTool({
  name: "oth_apply_field_set",
  description: "Apply a field set to a task.",
  inputSchema,
  handler: async (args) => {
    try {
      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}/apply-field-set`,
        {
          method: "POST",
          body: JSON.stringify({ setId: args.setId }),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
