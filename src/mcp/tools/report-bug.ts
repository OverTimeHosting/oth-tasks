import { z } from "zod";
import { apiFetch, getProjectId } from "../api.js";
import { taskPrioritySchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  title: z.string().min(1).describe("Short title for the bug."),
  description: z.string().min(1).describe("Bug description."),
  reproSteps: z
    .string()
    .optional()
    .describe("Optional reproduction steps; appended to the description."),
  severity: taskPrioritySchema
    .optional()
    .describe("Severity, mapped to task priority. Defaults to high."),
};

export const reportBugTool = defineTool({
  name: "oth_report_bug",
  description:
    "Create a bug report task with the `bug` tag and a sensible default priority.",
  inputSchema,
  handler: async (args) => {
    try {
      const projectId = getProjectId();
      const description = args.reproSteps
        ? `${args.description}\n\n## Repro steps\n${args.reproSteps}`
        : args.description;

      const body = {
        title: args.title,
        description,
        priority: args.severity ?? "high",
        tags: ["bug"],
      };

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
