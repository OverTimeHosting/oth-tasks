import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "text",
  "text_area",
  "rich_text",
  "number",
  "money",
  "rating",
  "progress",
  "tshirt_size",
  "checkbox",
  "dropdown",
  "custom_dropdown",
  "category",
  "labels",
  "voting",
  "date",
  "email",
  "phone",
  "website",
  "people",
  "location",
  "relation",
  "tasks",
  "files",
  "updates",
  "action_items",
  "formula",
  "summary",
  "translation",
  "sentiment",
  "signature",
  "button",
  "manual",
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
