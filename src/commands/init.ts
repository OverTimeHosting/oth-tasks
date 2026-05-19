// `oth init` — onboard the current git repo into OTHCanva.

import { existsSync } from "node:fs";
import { join } from "node:path";

import { getGitInfo } from "../lib/git.js";
import {
  connectPoll,
  connectStart,
  DEFAULT_API_BASE,
  type ConnectPollResponse,
} from "../lib/api.js";
import {
  REPO_CONFIG_FILENAME,
  upsertToken,
  writeRepoConfig,
} from "../lib/config.js";
import { patchMcpConfig } from "../lib/mcp-config.js";
import { openBrowser } from "../lib/open-browser.js";

export interface InitOptions {
  apiBase?: string;
  force?: boolean;
}

const POLL_INTERVAL_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runInit(opts: InitOptions): Promise<void> {
  const apiBase =
    opts.apiBase ?? process.env.OTH_API_BASE ?? DEFAULT_API_BASE;

  const git = await getGitInfo(process.cwd());
  if (!git) {
    console.error("Run this inside a git repository.");
    process.exitCode = 1;
    return;
  }

  // Guard: refuse to re-init a repo that's already connected. Otherwise
  // every accidental `oth init` mints a brand-new project on the server.
  const existingConfig = join(git.repoRoot, REPO_CONFIG_FILENAME);
  if (existsSync(existingConfig) && !opts.force) {
    console.error(`This repo is already connected (${REPO_CONFIG_FILENAME} exists).`);
    console.error("");
    console.error("Options:");
    console.error("  • `oth login`              refresh the token without creating a new project");
    console.error("  • `oth project use <id>`   point this repo at a different existing project");
    console.error("  • `oth status`             see what's currently linked");
    console.error("  • `oth init --force`       wipe and re-link (creates a new project)");
    process.exitCode = 1;
    return;
  }

  console.log(`Repo: ${git.repoName}`);
  if (git.remoteUrl) console.log(`Remote: ${git.remoteUrl}`);
  console.log(`API: ${apiBase}`);
  console.log("");

  const start = await connectStart(
    { apiBase },
    { repoName: git.repoName, repoUrl: git.remoteUrl ?? "" },
  );

  console.log(`Authorize this repo: ${start.authUrl}`);
  await openBrowser(start.authUrl);
  console.log("Waiting for authorization…");

  const expiresAt = Date.parse(start.expiresAt);
  let result: ConnectPollResponse | null = null;

  while (Date.now() < expiresAt) {
    await sleep(POLL_INTERVAL_MS);
    const poll = await connectPoll({ apiBase }, { code: start.code });
    if (poll.status === "authorized") {
      result = poll;
      break;
    }
    if (poll.status === "expired") {
      console.error("Authorization code expired. Run `oth init` again.");
      process.exitCode = 1;
      return;
    }
    // pending — loop
  }

  if (!result || result.status !== "authorized") {
    console.error("Authorization timed out. Run `oth init` again.");
    process.exitCode = 1;
    return;
  }

  // 1. Repo pointer
  await writeRepoConfig(git.repoRoot, {
    projectId: result.projectId,
    apiBase,
  });

  // 2. Credentials (in $HOME, not the repo)
  await upsertToken(result.projectId, {
    value: result.token,
    createdAt: new Date().toISOString(),
    userEmail: result.userEmail,
  });

  // 3. .mcp.json
  await patchMcpConfig(git.repoRoot);

  console.log(
    `Connected ${result.projectName}. Run \`claude\` and tools will be available.`,
  );
}
