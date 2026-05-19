import { z } from "zod";
import { apiFetch } from "../api.js";
import { taskPrioritySchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  taskId: z.string().min(1).describe("Task identifier."),
  title: z.string().optional().describe("New task title."),
  description: z.string().optional().describe("New task description."),
  priority: taskPrioritySchema.optional().describe("New task priority."),
  status: z.string().optional().describe("New task status."),
  dueAt: z
    .string()
    .optional()
    .describe("New ISO 8601 due timestamp."),
  tags: z.array(z.string()).optional().describe("Replacement list of tags."),
};

export const updateTaskTool = defineTool({
  name: "oth_update_task",
  description: "Update fields on an existing task. Only provided fields change.",
  inputSchema,
  handler: async (args) => {
    try {
      const body: Record<string, unknown> = {};
      if (args.title !== undefined) body.title = args.title;
      if (args.description !== undefined) body.description = args.description;
      if (args.priority !== undefined) body.priority = args.priority;
      if (args.status !== undefined) body.status = args.status;
      if (args.dueAt !== undefined) body.dueAt = args.dueAt;
      if (args.tags !== undefined) body.tags = args.tags;

      const result = await apiFetch(
        `/v1/tasks/${encodeURIComponent(args.taskId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
