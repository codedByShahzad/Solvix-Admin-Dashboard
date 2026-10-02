import type { EndpointKey } from "./endpoints";

export type ApiErrorStatus = number | "FETCH_ERROR" | "PARSING_ERROR" | "TIMEOUT_ERROR" | "CUSTOM_ERROR";

export interface ApiError {
  status: ApiErrorStatus;
  /** Message safe to show the user. */
  message: string;
  endpoint?: EndpointKey;
  /** Extra validation messages (blog create/update returns `errors: string[]`). */
  details?: string[];
}

const FALLBACK: Record<string, string> = {
  400: "The request couldn't be processed. Please check the form and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to perform this action.",
  404: "We couldn't find what you were looking for.",
  409: "This conflicts with an existing record.",
  413: "The file is too large to upload.",
  422: "Some fields are invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server. Please try again shortly.",
  FETCH_ERROR: "Can't reach the Solvix server. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.",
  TIMEOUT_ERROR: "The server took too long to respond. Please try again.",
  PARSING_ERROR: "The server sent an unexpected response.",
  CUSTOM_ERROR: "Something went wrong. Please try again.",
};

/**
 * Every Solvix backend error is JSON shaped like
 *   { success?: false, message: string, errors?: string[] }
 * and the messages are written for end users, so we show them directly.
 */
function readBackendError(data: unknown): { message?: string; details?: string[] } {
  if (!data || typeof data !== "object") return {};
  const d = data as { message?: unknown; errors?: unknown };
  const message = typeof d.message === "string" && d.message.trim() ? d.message.trim() : undefined;
  const details = Array.isArray(d.errors) ? d.errors.filter((e): e is string => typeof e === "string") : undefined;
  return { message, details };
}

export function toApiError(raw: { status: ApiErrorStatus; data?: unknown }, endpoint?: EndpointKey): ApiError {
  const { message, details } = readBackendError(raw.data);
  const key = String(raw.status);
  const fallback =
    FALLBACK[key] ?? (typeof raw.status === "number" && raw.status >= 500 ? FALLBACK[500] : FALLBACK.CUSTOM_ERROR);

  // An expired/invalid dashboard token gets the friendly wording.
  const isSessionError =
    raw.status === 401 && endpoint !== "auth.login" && !endpoint?.startsWith("integration.");

  return {
    status: raw.status,
    message: isSessionError ? FALLBACK[401] : (message ?? fallback),
    endpoint,
    details,
  };
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === "object" && "status" in e && "message" in e;
}

export function getErrorMessage(e: unknown, fallback = FALLBACK.CUSTOM_ERROR): string {
  return isApiError(e) ? e.message : fallback;
}

export const isForbidden = (e: unknown) => isApiError(e) && e.status === 403;
export const isNotFound = (e: unknown) => isApiError(e) && e.status === 404;
