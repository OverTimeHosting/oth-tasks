import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const PROJECT_CONFIG_FILE = ".othcanva.json";

const projectConfigSchema = z.object({
  projectId: z.string().min(1),
  apiBase: z.string().url(),
});

const credentialEntrySchema = z.object({
  value: z.string().min(1),
  createdAt: z.string().optional(),
});

const credentialsSchema = z.object({
  tokens: z.record(z.string(), credentialEntrySchema),
});

export interface LoadedConfig {
  projectId: string;
  apiBase: string;
  token: string;
}

const MISSING_MESSAGE =
  "Run `npx @oth/tasks init` to connect this repo to OTHCanva.";

function credentialsPath(): string {
  return join(homedir(), ".othcanva", "credentials.json");
}

function projectConfigPath(): string {
  return join(process.cwd(), PROJECT_CONFIG_FILE);
}

async function readJson(path: string): Promise<unknown> {
  try {
    const contents = await readFile(path, "utf8");
    return JSON.parse(contents);
  } catch {
    throw new Error(MISSING_MESSAGE);
  }
}

export async function loadConfig(): Promise<LoadedConfig> {
  const rawProject = await readJson(projectConfigPath());
  const project = projectConfigSchema.safeParse(rawProject);
  if (!project.success) {
    throw new Error(MISSING_MESSAGE);
  }

  const rawCreds = await readJson(credentialsPath());
  const creds = credentialsSchema.safeParse(rawCreds);
  if (!creds.success) {
    throw new Error(MISSING_MESSAGE);
  }

  const entry = creds.data.tokens[project.data.projectId];
  if (!entry) {
    throw new Error(MISSING_MESSAGE);
  }

  return {
    projectId: project.data.projectId,
    apiBase: project.data.apiBase.replace(/\/+$/, ""),
    token: entry.value,
  };
}
