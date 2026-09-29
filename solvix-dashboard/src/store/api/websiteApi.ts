import { baseApi } from "./baseApi";
import { extractItem, normalizeWebsite, toListResult } from "@/lib/api/normalize";
import type { ListResult, Website } from "@/types";

export type WebsitePayload = Record<string, unknown>;

export const websiteApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getWebsites: b.query<ListResult<Website>, void>({
      query: () => ({ endpoint: "websites.list" }),
      transformResponse: (res: unknown) => toListResult(res, normalizeWebsite),
      providesTags: (res) => [
        { type: "Website" as const, id: "LIST" },
        ...(res?.items.map((w) => ({ type: "Website" as const, id: w.id })) ?? []),
      ],
    }),
    getWebsite: b.query<Website, string>({
      query: (id) => ({ endpoint: "websites.get", pathParams: { id } }),
      transformResponse: (res: unknown) => normalizeWebsite(extractItem(res)),
      providesTags: (_r, _e, id) => [{ type: "Website", id }],
    }),
    createWebsite: b.mutation<Website, WebsitePayload>({
      query: (body) => ({ endpoint: "websites.create", body }),
      transformResponse: (res: unknown) => normalizeWebsite(extractItem(res)),
      invalidatesTags: [{ type: "Website", id: "LIST" }],
    }),
    updateWebsite: b.mutation<Website, { id: string; body: WebsitePayload }>({
      query: ({ id, body }) => ({ endpoint: "websites.update", pathParams: { id }, body }),
      transformResponse: (res: unknown) => normalizeWebsite(extractItem(res)),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Website", id },
        { type: "Website", id: "LIST" },
      ],
    }),
    deleteWebsite: b.mutation<unknown, string>({
      query: (id) => ({ endpoint: "websites.delete", pathParams: { id } }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Website", id },
        { type: "Website", id: "LIST" },
        { type: "Blog", id: "LIST" },
        { type: "Media", id: "LIST" },
        { type: "Integration", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetWebsitesQuery,
  useGetWebsiteQuery,
  useCreateWebsiteMutation,
  useUpdateWebsiteMutation,
  useDeleteWebsiteMutation,
} = websiteApi;
