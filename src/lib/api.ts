// Thin fetch wrapper for talking to the OTHCanva backend.
//
// The connect/start + connect/poll endpoints are unauthenticated (the
// short-lived `code` is itself the proof). Everything else is bearer-auth'd
// with the per-repo token we stored in ~/.othcanva/credentials.json.

export const DEFAULT_API_BASE = "https://canva-app.oth.zone";

export interface ApiOptions {
  apiBase: string;
  token?: string;
}

export interface ConnectStartResponse {
  code: string;
  authUrl: string;
  expiresAt: string; // ISO timestamp
}

export type ConnectPollResponse =
  | { status: "pending" }
  | {
      status: "authorized";
      token: string;
      projectId: string;
      projectName: string;
      userEmail?: string;
    }
  | { status: "expired" };

export interface Project {
  id: string;
  name: string;
  repoUrl?: string;
  createdAt?: string;
}

export interface TokenInfo {
  lastUsedAt?: string | null;
  createdAt?: string | null;
  userEmail?: string | null;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  opts: ApiOptions,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${opts.apiBase.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as T;
}

export function connectStart(
  opts: ApiOptions,
  body: { repoName: string; repoUrl: string },
): Promise<ConnectStartResponse> {
  return request<ConnectStartResponse>(opts, "POST", "/v1/auth/connect/start", body);
}

export function connectPoll(
  opts: ApiOptions,
  body: { code: string },
): Promise<ConnectPollResponse> {
  return request<ConnectPollResponse>(opts, "POST", "/v1/auth/connect/poll", body);
}

export function getProject(opts: ApiOptions, projectId: string): Promise<Project> {
  return request<Project>(opts, "GET", `/v1/projects/${encodeURIComponent(projectId)}`);
}

export function getTokenInfo(opts: ApiOptions): Promise<TokenInfo> {
  // Best-effort — the backend may not have shipped this yet. Callers should
  // catch ApiError and fall back to whatever's in credentials.json.
  return request<TokenInfo>(opts, "GET", "/v1/auth/token");
}

export function createProject(
  opts: ApiOptions,
  body: { name: string; repoUrl?: string },
): Promise<Project> {
  return request<Project>(opts, "POST", "/v1/projects", body);
}
