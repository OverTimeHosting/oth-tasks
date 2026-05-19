// `othcanva login` — refresh the token for the already-linked project.
// Same OAuth-like dance as `init`, but skips project creation by reusing
// .othcanva.json.

import { getGitInfo } from "../lib/git.js";
import {
  connectPoll,
  connectStart,
  DEFAULT_API_BASE,
  type ConnectPollResponse,
} from "../lib/api.js";
import { readRepoConfig, upsertToken } from "../lib/config.js";
import { openBrowser } from "../lib/open-browser.js";

export interface LoginOptions {
  apiBase?: string;
}

const POLL_INTERVAL_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runLogin(opts: LoginOptions): Promise<void> {
  const git = await getGitInfo(process.cwd());
  if (!git) {
    console.error("Run this inside a git repository.");
    process.exitCode = 1;
    return;
  }

  const repoCfg = await readRepoConfig(git.repoRoot);
  if (!repoCfg) {
    console.error(
      "No .othcanva.json found in this repo. Run `othcanva init` first.",
    );
    process.exitCode = 1;
    return;
  }

  const apiBase =
    opts.apiBase ?? process.env.OTH_API_BASE ?? repoCfg.apiBase ?? DEFAULT_API_BASE;

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
      console.error("Authorization code expired. Run `othcanva login` again.");
      process.exitCode = 1;
      return;
    }
  }

  if (!result || result.status !== "authorized") {
    console.error("Authorization timed out.");
    process.exitCode = 1;
    return;
  }

  await upsertToken(result.projectId, {
    value: result.token,
    createdAt: new Date().toISOString(),
    userEmail: result.userEmail,
  });

  console.log(`Refreshed token for ${result.projectName}.`);
}
