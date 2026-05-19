import { addCommentTool } from "./add-comment.js";
import { addFieldToSetTool } from "./add-field-to-set.js";
import { applyFieldSetTool } from "./apply-field-set.js";
import { createFieldSetTool } from "./create-field-set.js";
import { createTaskTool } from "./create-task.js";
import { getTaskTool } from "./get-task.js";
import { listFieldSetsTool } from "./list-field-sets.js";
import { listTasksTool } from "./list-tasks.js";
import { logChangeTool } from "./log-change.js";
import { moveStatusTool } from "./move-status.js";
import { reportBugTool } from "./report-bug.js";
import { updateTaskTool } from "./update-task.js";

export const allTools = [
  createTaskTool,
  listTasksTool,
  getTaskTool,
  updateTaskTool,
  moveStatusTool,
  addCommentTool,
  reportBugTool,
  logChangeTool,
  listFieldSetsTool,
  applyFieldSetTool,
  createFieldSetTool,
  addFieldToSetTool,
];

export {
  addCommentTool,
  addFieldToSetTool,
  applyFieldSetTool,
  createFieldSetTool,
  createTaskTool,
  getTaskTool,
  listFieldSetsTool,
  listTasksTool,
  logChangeTool,
  moveStatusTool,
  reportBugTool,
  updateTaskTool,
};
