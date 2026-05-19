import { z } from "zod";
import { apiFetch } from "../api.js";
import { fieldTypeSchema } from "../types.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {
  setId: z.string().min(1).describe("Field-set identifier."),
  name: z.string().min(1).describe("Field name."),
  type: fieldTypeSchema.describe("Field type."),
  defaultValue: z.unknown().optional().describe("Optional default value."),
};

export const addFieldToSetTool = defineTool({
  name: "oth_add_field_to_set",
  description: "Add a single field to an existing field set.",
  inputSchema,
  handler: async (args) => {
    try {
      const body: Record<string, unknown> = {
        name: args.name,
        type: args.type,
      };
      if (args.defaultValue !== undefined) body.defaultValue = args.defaultValue;

      const result = await apiFetch(
        `/v1/field-sets/${encodeURIComponent(args.setId)}/fields`,
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
