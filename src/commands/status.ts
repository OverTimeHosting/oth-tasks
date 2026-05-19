// `oth status` — quick health-check of the current repo's OTH connection.

import { getGitInfo } from "../lib/git.js";
import {
  ApiError,
  DEFAULT_API_BASE,
  getProject,
  getTokenInfo,
} from "../lib/api.js";
import { getToken, readRepoConfig } from "../lib/config.js";

export interface StatusOptions {
  apiBase?: string;
}

export async function runStatus(opts: StatusOptions): Promise<void> {
  const git = await getGitInfo(process.cwd());
  if (!git) {
    console.error("Run this inside a git repository.");
    process.exitCode = 1;
    return;
  }

  const repoCfg = await readRepoConfig(git.repoRoot);
  if (!repoCfg) {
    console.error("Not connected. Run `oth init`.");
    process.exitCode = 1;
    return;
  }

  const apiBase =
    opts.apiBase ?? process.env.OTH_API_BASE ?? repoCfg.apiBase ?? DEFAULT_API_BASE;

  const stored = await getToken(repoCfg.projectId);
  if (!stored) {
    console.error(
      `No credential for project ${repoCfg.projectId}. Run \`oth login\`.`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    const project = await getProject(
      { apiBase, token: stored.value },
      repoCfg.projectId,
    );
    console.log(`Project:    ${project.name} (${project.id})`);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`Failed to fetch project: ${err.message}`);
    } else {
      throw err;
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Email:      ${stored.userEmail ?? "(unknown)"}`);
  console.log(`Token age:  since ${stored.createdAt}`);

  try {
    const info = await getTokenInfo({ apiBase, token: stored.value });
    if (info.lastUsedAt) {
      console.log(`Last used:  ${info.lastUsedAt}`);
    }
  } catch {
    // Endpoint optional — just skip.
  }

  console.log(`API base:   ${apiBase}`);
}
