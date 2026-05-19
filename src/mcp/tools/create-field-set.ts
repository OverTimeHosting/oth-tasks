import { z } from "zod";
import { apiFetch, getProjectId } from "../api.js";
import { fieldTypeSchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const fieldSchema = z.object({
  name: z.string().min(1),
  type: fieldTypeSchema,
  defaultValue: z.unknown().optional(),
});

const inputSchema = {
  name: z.string().min(1).describe("Field-set name."),
  description: z.string().optional().describe("Optional description."),
  fields: z
    .array(fieldSchema)
    .optional()
    .describe("Optional list of fields to seed the set with."),
};

export const createFieldSetTool = defineTool({
  name: "oth_create_field_set",
  description: "Create a new field set (template) on the current project.",
  inputSchema,
  handler: async (args) => {
    try {
      const projectId = getProjectId();
      const body: Record<string, unknown> = { name: args.name };
      if (args.description !== undefined) body.description = args.description;
      if (args.fields !== undefined) body.fields = args.fields;

      const result = await apiFetch(
        `/v1/projects/${encodeURIComponent(projectId)}/field-sets`,
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
