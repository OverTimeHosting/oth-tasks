// Detect whether we're inside a git repo and, if so, what its remote URL and
// name are. Walks upward from cwd looking for a `.git` directory (a file in the
// case of worktrees — we still treat that as "inside a repo").

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import * as path from "node:path";

export interface GitInfo {
  repoRoot: string;
  remoteUrl: string | null;
  repoName: string;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function findRepoRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  // Cap the walk so we don't loop forever on weird FS setups.
  for (let i = 0; i < 64; i++) {
    if (await pathExists(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function runGit(repoRoot: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd: repoRoot });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => (stdout += b.toString()));
    child.stderr.on("data", (b) => (stderr += b.toString()));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        void stderr; // swallow
        resolve(null);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Strip git's various remote URL shapes down to "<owner>/<repo>".
//   git@github.com:owner/repo.git           -> owner/repo
//   https://github.com/owner/repo.git       -> owner/repo
//   https://github.com/owner/repo           -> owner/repo
//   ssh://git@github.com/owner/repo.git     -> owner/repo
export function parseRepoName(url: string): string | null {
  if (!url) return null;
  let s = url.trim();

  // git@host:owner/repo(.git)
  const scp = s.match(/^[^@\s]+@[^:]+:(.+?)(?:\.git)?$/);
  if (scp && scp[1]) return scp[1];

  // Strip scheme + host
  s = s.replace(/^[a-z]+:\/\/[^/]+\//i, "");
  s = s.replace(/\.git$/, "");
  s = s.replace(/^\/+/, "");
  if (!s) return null;
  return s;
}

export async function getGitInfo(startDir: string): Promise<GitInfo | null> {
  const repoRoot = await findRepoRoot(startDir);
  if (!repoRoot) return null;

  const remoteUrl = await runGit(repoRoot, [
    "config",
    "--get",
    "remote.origin.url",
  ]);

  const fromRemote = remoteUrl ? parseRepoName(remoteUrl) : null;
  const repoName = fromRemote ?? path.basename(repoRoot);

  return {
    repoRoot,
    remoteUrl: remoteUrl ?? null,
    repoName,
  };
}
