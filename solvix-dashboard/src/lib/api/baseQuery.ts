/**
 * The single request pipeline for every RTK Query endpoint:
 *   1. demo session      → answered from in-browser sample data (no network)
 *   2. unconfirmed route → UNCONFIRMED error (no network, no guessed URL)
 *   3. confirmed route   → fetch with centralized Bearer header
 *   4. any error         → normalized, user-safe ApiError; 401 ends the session
 */
import { fetchBaseQuery, type BaseQueryFn, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { config } from "@/lib/config";
import { ENDPOINTS, resolvePath, type EndpointKey } from "./endpoints";
import { toApiError, type ApiError } from "./errors";
import { sessionEnded, type AuthState } from "@/features/auth/authSlice";
import { clearSession } from "@/features/auth/session";
import { demoRequest } from "@/lib/demo/handler";

export interface ApiRequest {
  endpoint: EndpointKey;
  pathParams?: Record<string, string | number>;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: config.apiUrl, timeout: 30_000 });

export const baseQuery: BaseQueryFn<ApiRequest, unknown, ApiError> = async (req, api, extraOptions) => {
  const { auth } = api.getState() as { auth: AuthState };

  if (auth.mode === "demo") {
    return demoRequest(req, auth.user);
  }

  const def = ENDPOINTS[req.endpoint];
  if (!def) {
    return {
      error: {
        status: "UNCONFIRMED",
        endpoint: req.endpoint,
        message: `The backend route for "${req.endpoint}" hasn't been connected yet.`,
      },
    };
  }

  let url: string;
  try {
    url = resolvePath(def.path, req.pathParams);
  } catch {
    return { error: { status: "CUSTOM_ERROR", endpoint: req.endpoint, message: "Invalid request." } };
  }

  const headers: Record<string, string> = { Accept: "application/json", ...req.headers };
  if (def.auth !== false && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const params = req.params
    ? Object.fromEntries(Object.entries(req.params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    : undefined;

  const result = await rawBaseQuery({ url, method: def.method, params, body: req.body, headers }, api, extraOptions);

  if (result.error) {
    const e = result.error as FetchBaseQueryError;
    const status = e.status === "PARSING_ERROR" ? e.originalStatus : e.status;
    const apiError = toApiError({ status, data: "data" in e ? e.data : undefined }, req.endpoint);

    if (apiError.status === 401 && def.auth !== false && auth.status === "authenticated") {
      clearSession();
      api.dispatch(sessionEnded("expired"));
    }
    return { error: apiError };
  }

  return { data: result.data };
};
