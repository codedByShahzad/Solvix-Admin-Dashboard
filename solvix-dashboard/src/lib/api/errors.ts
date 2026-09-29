import type { EndpointKey } from "./endpoints";

export type ApiErrorStatus =
  | number
  | "FETCH_ERROR"
  | "PARSING_ERROR"
  | "TIMEOUT_ERROR"
  | "UNCONFIRMED"
  | "CUSTOM_ERROR";

export interface ApiError {
  status: ApiErrorStatus;
  /** User-safe message. Raw backend errors are never shown directly. */
  message: string;
  endpoint?: EndpointKey;
  /** Field-level validation messages, keyed by field name, when the backend supplies them. */
  fieldErrors?: Record<string, string>;
}

const FRIENDLY: Record<string, string> = {
  400: "The request couldn't be processed. Please check the form and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you were looking for.",
  409: "This conflicts with an existing record.",
  413: "The file is too large to upload.",
  422: "Some fields are invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server. Please try again shortly.",
  FETCH_ERROR: "Can't reach the Solvix server. Check your connection or that the backend is running.",
  TIMEOUT_ERROR: "The server took too long to respond. Please try again.",
  PARSING_ERROR: "The server sent an unexpected response.",
  UNCONFIRMED: "This feature is waiting for its backend route to be connected.",
  CUSTOM_ERROR: "Something went wrong. Please try again.",
};

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 ? value.trim() : undefined;
}

/** Pull field errors out of common Express / Mongoose / zod error payloads. */
function extractFieldErrors(data: unknown): Record<string, string> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const source = d.errors ?? d.errorSources ?? (d.error as Record<string, unknown> | undefined)?.errors;
  const out: Record<string, string> = {};

  if (Array.isArray(source)) {
    for (const e of source) {
      if (!e || typeof e !== "object") continue;
      const item = e as Record<string, unknown>;
      const field = pickString(item.path) ?? pickString(item.field) ?? pickString(item.param);
      const msg = pickString(item.message) ?? pickString(item.msg);
      if (field && msg) out[field] = msg;
    }
  } else if (source && typeof source === "object") {
    for (const [field, v] of Object.entries(source as Record<string, unknown>)) {
      const msg = pickString(v) ?? pickString((v as Record<string, unknown> | null)?.message);
      if (msg) out[field] = msg;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function backendMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  return pickString(d.message) ?? pickString((d.error as Record<string, unknown> | undefined)?.message) ?? pickString(d.error);
}

/**
 * Convert any RTK / fetch error into an ApiError with a user-safe message.
 * Backend messages are only surfaced for validation/conflict responses (400/409/422),
 * where they are written for end users (e.g. "Email already exists").
 */
export function toApiError(raw: { status: ApiErrorStatus; data?: unknown }, endpoint?: EndpointKey): ApiError {
  const status = raw.status;
  const key = String(status);
  let message = FRIENDLY[key] ?? (typeof status === "number" && status >= 500 ? FRIENDLY[500] : FRIENDLY.CUSTOM_ERROR);

  if (status === 400 || status === 409 || status === 422) {
    message = backendMessage(raw.data) ?? message;
  }
  if (status === 401 && endpoint === "auth.login") {
    message = "Invalid email or password.";
  }

  return { status, message, endpoint, fieldErrors: extractFieldErrors(raw.data) };
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === "object" && "status" in e && "message" in e;
}

export function getErrorMessage(e: unknown, fallback = FRIENDLY.CUSTOM_ERROR): string {
  return isApiError(e) ? e.message : fallback;
}

export function isUnconfirmed(e: unknown): e is ApiError {
  return isApiError(e) && e.status === "UNCONFIRMED";
}

export function isForbidden(e: unknown): boolean {
  return isApiError(e) && e.status === 403;
}

export function isNotFound(e: unknown): boolean {
  return isApiError(e) && e.status === 404;
}
