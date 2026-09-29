import { baseApi } from "./baseApi";
import { extractItem, extractList, normalizeIntegration, toListResult } from "@/lib/api/normalize";
import type { ListResult, WebsiteIntegration } from "@/types";

export interface IntegrationTestInput {
  apiKey: string;
  apiSecret: string;
}

export interface IntegrationTestResult {
  count: number;
  sample: unknown;
}

export const integrationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** /website-integrations — NEEDS BACKEND ROUTE CONFIRMATION */
    getIntegrations: b.query<ListResult<WebsiteIntegration>, void>({
      query: () => ({ endpoint: "integrations.list" }),
      transformResponse: (res: unknown) => toListResult(res, normalizeIntegration),
      providesTags: (res) => [
        { type: "Integration" as const, id: "LIST" },
        ...(res?.items.map((x) => ({ type: "Integration" as const, id: x.id })) ?? []),
      ],
    }),
    createIntegration: b.mutation<WebsiteIntegration, { websiteId: string }>({
      query: ({ websiteId }) => ({ endpoint: "integrations.create", body: { website: websiteId } }),
      transformResponse: (res: unknown) => normalizeIntegration(extractItem(res)),
      invalidatesTags: [{ type: "Integration", id: "LIST" }],
    }),
    revokeIntegration: b.mutation<unknown, string>({
      query: (id) => ({ endpoint: "integrations.revoke", pathParams: { id } }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Integration", id },
        { type: "Integration", id: "LIST" },
      ],
    }),
    /**
     * GET /integration/blogs — confirmed. Uses X-API-Key / X-API-Secret and
     * deliberately does NOT send the dashboard JWT. Keys are typed by the admin
     * for a one-off test and never stored.
     */
    testIntegration: b.mutation<IntegrationTestResult, IntegrationTestInput>({
      query: ({ apiKey, apiSecret }) => ({
        endpoint: "integration.blogs",
        headers: { "X-API-Key": apiKey, "X-API-Secret": apiSecret },
      }),
      transformResponse: (res: unknown) => {
        const { items, total } = extractList(res);
        return { count: total ?? items.length, sample: items[0] ?? res };
      },
    }),
  }),
});

export const {
  useGetIntegrationsQuery,
  useCreateIntegrationMutation,
  useRevokeIntegrationMutation,
  useTestIntegrationMutation,
} = integrationApi;
