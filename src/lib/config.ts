// Read/write the two config files this CLI cares about:
//
//   <repo>/.othcanva.json           — per-repo project pointer (safe to commit)
//   ~/.othcanva/credentials.json    — bearer tokens, gitignored & chmod 600

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { DEFAULT_API_BASE } from "./api.js";

export interface RepoConfig {
  projectId: string;
  apiBase: string;
}

export interface StoredToken {
  value: string;
  createdAt: string;
  userEmail?: string;
}

export interface CredentialsFile {
  tokens: Record<string, StoredToken>;
}

export const REPO_CONFIG_FILENAME = ".othcanva.json";

export function repoConfigPath(repoRoot: string): string {
  return path.join(repoRoot, REPO_CONFIG_FILENAME);
}

export function credentialsDir(): string {
  return path.join(os.homedir(), ".othcanva");
}

export function credentialsPath(): string {
  return path.join(credentialsDir(), "credentials.json");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function readRepoConfig(repoRoot: string): Promise<RepoConfig | null> {
  const p = repoConfigPath(repoRoot);
  if (!(await pathExists(p))) return null;
  const raw = await fs.readFile(p, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<RepoConfig>;
    if (!parsed.projectId) return null;
    return {
      projectId: parsed.projectId,
      apiBase: parsed.apiBase ?? DEFAULT_API_BASE,
    };
  } catch {
    return null;
  }
}

export async function writeRepoConfig(
  repoRoot: string,
  cfg: RepoConfig,
): Promise<void> {
  const p = repoConfigPath(repoRoot);
  await fs.writeFile(p, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export async function readCredentials(): Promise<CredentialsFile> {
  const p = credentialsPath();
  if (!(await pathExists(p))) return { tokens: {} };
  try {
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as Partial<CredentialsFile>;
    return { tokens: parsed.tokens ?? {} };
  } catch {
    return { tokens: {} };
  }
}

export async function writeCredentials(creds: CredentialsFile): Promise<void> {
  const dir = credentialsDir();
  await fs.mkdir(dir, { recursive: true });
  const p = credentialsPath();
  await fs.writeFile(p, JSON.stringify(creds, null, 2) + "\n", "utf8");
  // chmod 600 on POSIX. On Windows fs.chmod is a no-op for permission bits;
  // we still call it so the code path is exercised uniformly.
  if (process.platform !== "win32") {
    try {
      await fs.chmod(p, 0o600);
    } catch {
      // Best effort — non-fatal.
    }
  }
}

export async function upsertToken(
  projectId: string,
  token: StoredToken,
): Promise<void> {
  const creds = await readCredentials();
  creds.tokens[projectId] = token;
  await writeCredentials(creds);
}

export async function getToken(projectId: string): Promise<StoredToken | null> {
  const creds = await readCredentials();
  return creds.tokens[projectId] ?? null;
}

const GITIGNORE_LINE = ".othcanva/";

export async function ensureGitignoreEntry(repoRoot: string): Promise<void> {
  const p = path.join(repoRoot, ".gitignore");
  let existing = "";
  if (await pathExists(p)) {
    existing = await fs.readFile(p, "utf8");
  }
  const lines = existing.split(/\r?\n/);
  if (lines.some((l) => l.trim() === GITIGNORE_LINE)) return;
  const needsLeadingNewline = existing.length > 0 && !existing.endsWith("\n");
  const addition = `${needsLeadingNewline ? "\n" : ""}${GITIGNORE_LINE}\n`;
  await fs.writeFile(p, existing + addition, "utf8");
}
