import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api/baseQuery";

export const TAGS = ["Website", "Blog", "Media", "Editor", "User", "Integration"] as const;

/**
 * Root RTK Query API. Feature APIs (websiteApi, blogApi, …) extend it with
 * injectEndpoints so they share one cache, one middleware and one base query.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAGS,
  refetchOnReconnect: true,
  keepUnusedDataFor: 60,
  endpoints: () => ({}),
});
