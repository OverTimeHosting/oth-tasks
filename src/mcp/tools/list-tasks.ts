import { z } from "zod";
import { apiFetch, getProjectId } from "../api.js";
import { taskPrioritySchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  status: z.string().optional().describe("Filter by status."),
  priority: taskPrioritySchema.optional().describe("Filter by priority."),
  tag: z.string().optional().describe("Filter by tag."),
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .default(50)
    .describe("Maximum number of tasks to return."),
};

export const listTasksTool = defineTool({
  name: "oth_list_tasks",
  description:
    "List tasks in the current OTHCanva project, optionally filtered by status, priority, or tag.",
  inputSchema,
  handler: async (args) => {
    try {
      const projectId = getProjectId();
      const params = new URLSearchParams();
      if (args.status !== undefined) params.set("status", args.status);
      if (args.priority !== undefined) params.set("priority", args.priority);
      if (args.tag !== undefined) params.set("tag", args.tag);
      params.set("limit", String(args.limit));

      const path = `/v1/projects/${encodeURIComponent(projectId)}/tasks?${params.toString()}`;
      const result = await apiFetch(path);
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
