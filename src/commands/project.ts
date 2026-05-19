// `othcanva project create <name>` / `othcanva project use <id>` —
// manage which OTH project this repo is bound to.

import { getGitInfo } from "../lib/git.js";
import {
  ApiError,
  createProject,
  DEFAULT_API_BASE,
  getProject,
} from "../lib/api.js";
import {
  getToken,
  readRepoConfig,
  writeRepoConfig,
} from "../lib/config.js";

export interface ProjectOptions {
  apiBase?: string;
}

export async function runProjectCreate(
  name: string,
  opts: ProjectOptions,
): Promise<void> {
  const git = await getGitInfo(process.cwd());
  if (!git) {
    console.error("Run this inside a git repository.");
    process.exitCode = 1;
    return;
  }

  const repoCfg = await readRepoConfig(git.repoRoot);
  const apiBase =
    opts.apiBase ??
    process.env.OTH_API_BASE ??
    repoCfg?.apiBase ??
    DEFAULT_API_BASE;

  // Need an existing token to call /v1/projects. If the repo isn't connected
  // yet, point the user at `othcanva init` instead.
  if (!repoCfg) {
    console.error(
      "This repo isn't connected yet. Run `othcanva init` first, then `othcanva project create` if you want a second project.",
    );
    process.exitCode = 1;
    return;
  }

  const stored = await getToken(repoCfg.projectId);
  if (!stored) {
    console.error("No credential available. Run `othcanva login`.");
    process.exitCode = 1;
    return;
  }

  try {
    const project = await createProject(
      { apiBase, token: stored.value },
      { name, repoUrl: git.remoteUrl ?? undefined },
    );

    await writeRepoConfig(git.repoRoot, {
      projectId: project.id,
      apiBase,
    });

    console.log(`Created project ${project.name} (${project.id}).`);
    console.log(`Active project for this repo is now ${project.id}.`);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`Failed to create project: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

export async function runProjectUse(
  projectId: string,
  opts: ProjectOptions,
): Promise<void> {
  const git = await getGitInfo(process.cwd());
  if (!git) {
    console.error("Run this inside a git repository.");
    process.exitCode = 1;
    return;
  }

  const repoCfg = await readRepoConfig(git.repoRoot);
  const apiBase =
    opts.apiBase ??
    process.env.OTH_API_BASE ??
    repoCfg?.apiBase ??
    DEFAULT_API_BASE;

  // Soft-validate that the project exists if we have a token for it.
  const stored = await getToken(projectId);
  if (stored) {
    try {
      await getProject({ apiBase, token: stored.value }, projectId);
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(
          `Warning: could not verify project ${projectId}: ${err.message}`,
        );
      }
    }
  } else {
    console.error(
      `Note: no token stored for ${projectId}. You'll need to \`othcanva login\` after switching.`,
    );
  }

  await writeRepoConfig(git.repoRoot, {
    projectId,
    apiBase,
  });

  console.log(`Active project for this repo is now ${projectId}.`);
}
