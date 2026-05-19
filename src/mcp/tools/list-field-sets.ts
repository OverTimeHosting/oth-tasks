import { apiFetch, getProjectId } from "../api.js";
import { defineTool, errorResult, jsonResult } from "./_shared.js";

const inputSchema = {} as const;

export const listFieldSetsTool = defineTool({
  name: "oth_list_field_sets",
  description: "List the field templates available in the current project.",
  inputSchema,
  handler: async () => {
    try {
      const projectId = getProjectId();
      const result = await apiFetch(
        `/v1/projects/${encodeURIComponent(projectId)}/field-sets`,
      );
      return jsonResult(result);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  },
});
