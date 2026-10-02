/**
 * The single request pipeline for every RTK Query endpoint:
 *   - resolves the route from the ENDPOINTS registry
 *   - attaches `Authorization: Bearer <token>` for JWT routes (auth.middleware.ts)
 *   - converts errors to a user-safe ApiError using the backend's `message`
 *   - ends the session when a JWT route returns 401
 */
import { fetchBaseQuery, type BaseQueryFn, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { config } from "@/lib/config";
import { ENDPOINTS, resolvePath, type EndpointKey } from "./endpoints";
import { toApiError, type ApiError } from "./errors";
import { sessionEnded, type AuthState } from "@/features/auth/authSlice";
import { clearSession } from "@/features/auth/session";

export interface ApiRequest {
  endpoint: EndpointKey;
  pathParams?: Record<string, string | number>;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: config.apiUrl, timeout: 60_000 });

export const baseQuery: BaseQueryFn<ApiRequest, unknown, ApiError> = async (req, api, extraOptions) => {
  const { auth } = api.getState() as { auth: AuthState };
  const def = ENDPOINTS[req.endpoint];

  let url: string;
  try {
    url = resolvePath(def.path, req.pathParams);
  } catch {
    return { error: { status: "CUSTOM_ERROR", endpoint: req.endpoint, message: "Invalid request." } };
  }

  const headers: Record<string, string> = { Accept: "application/json", ...req.headers };
  if (def.auth && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const params = req.params
    ? Object.fromEntries(Object.entries(req.params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    : undefined;

  // fetchBaseQuery sets Content-Type: application/json for plain objects and
  // lets the browser set the multipart boundary for FormData.
  const result = await rawBaseQuery({ url, method: def.method, params, body: req.body, headers }, api, extraOptions);

  if (result.error) {
    const e = result.error as FetchBaseQueryError;
    const status = e.status === "PARSING_ERROR" ? e.originalStatus : e.status;
    const apiError = toApiError({ status, data: "data" in e ? e.data : undefined }, req.endpoint);

    if (apiError.status === 401 && def.auth && auth.status === "authenticated") {
      clearSession();
      api.dispatch(sessionEnded("expired"));
    }
    return { error: apiError };
  }

  return { data: result.data };
};
