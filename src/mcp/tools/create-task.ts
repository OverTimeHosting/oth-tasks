import { z } from "zod";
import { apiFetch, getProjectId } from "../api.js";
import { taskPrioritySchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  title: z.string().min(1).describe("Task title."),
  description: z.string().optional().describe("Optional task description."),
  priority: taskPrioritySchema.optional().describe("Task priority."),
  status: z.string().optional().describe("Initial task status."),
  tags: z.array(z.string()).optional().describe("Optional list of tags."),
  dueAt: z
    .string()
    .optional()
    .describe("Optional ISO 8601 due timestamp."),
};

export const createTaskTool = defineTool({
  name: "oth_create_task",
  description:
    "Create a new task in the current OTHCanva project. Returns the created task.",
  inputSchema,
  handler: async (args) => {
    try {
      const projectId = getProjectId();
      const body: Record<string, unknown> = { title: args.title };
      if (args.description !== undefined) body.description = args.description;
      if (args.priority !== undefined) body.priority = args.priority;
      if (args.status !== undefined) body.status = args.status;
      if (args.tags !== undefined) body.tags = args.tags;
      if (args.dueAt !== undefined) body.dueAt = args.dueAt;

      const result = await apiFetch(
        `/v1/projects/${encodeURIComponent(projectId)}/tasks`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
