import { loadConfig, type LoadedConfig } from "./config.js";

let cachedConfig: LoadedConfig | null = null;

export async function getConfig(): Promise<LoadedConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadConfig();
  }
  return cachedConfig;
}

export function getProjectId(): string {
  if (!cachedConfig) {
    throw new Error("Config not loaded. Call getConfig() first.");
  }
  return cachedConfig.projectId;
}

interface ApiErrorBody {
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = await getConfig();

  const url = `${config.apiBase}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${config.token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to reach OTHCanva API at ${url}: ${message}`);
  }

  const rawText = await response.text();
  let parsed: unknown = undefined;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    let message = `OTHCanva API ${response.status} ${response.statusText}`;
    if (parsed && typeof parsed === "object") {
      const body = parsed as ApiErrorBody;
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } else if (typeof parsed === "string" && parsed.length > 0) {
      message = parsed;
    }
    throw new Error(message);
  }

  return parsed as T;
}
