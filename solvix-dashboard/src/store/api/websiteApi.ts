import { baseApi } from "./baseApi";
import { mapWebsite, type DataEnvelope, type RawWebsite } from "@/lib/api/mappers";
import type { Website } from "@/types";

export interface CreateWebsiteInput {
  name: string;
  slug: string;
  domain: string;
  description?: string;
}

export interface UpdateWebsiteInput extends Partial<CreateWebsiteInput> {
  isActive?: boolean;
}

export const websiteApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** Admin → websites they own · Editor → websites they're assigned to */
    getWebsites: b.query<Website[], void>({
      query: () => ({ endpoint: "websites.list" }),
      transformResponse: (res: DataEnvelope<RawWebsite[]>) => res.data.map(mapWebsite),
      providesTags: (res) => [
        { type: "Website" as const, id: "LIST" },
        ...(res?.map((w) => ({ type: "Website" as const, id: w.id })) ?? []),
      ],
    }),
    getWebsite: b.query<Website, string>({
      query: (id) => ({ endpoint: "websites.get", pathParams: { id } }),
      transformResponse: (res: DataEnvelope<RawWebsite>) => mapWebsite(res.data),
      providesTags: (_r, _e, id) => [{ type: "Website", id }],
    }),
    createWebsite: b.mutation<Website, CreateWebsiteInput>({
      query: (body) => ({ endpoint: "websites.create", body }),
      transformResponse: (res: DataEnvelope<RawWebsite>) => mapWebsite(res.data),
      invalidatesTags: [{ type: "Website", id: "LIST" }],
    }),
    updateWebsite: b.mutation<Website, { id: string; body: UpdateWebsiteInput }>({
      query: ({ id, body }) => ({ endpoint: "websites.update", pathParams: { id }, body }),
      transformResponse: (res: DataEnvelope<RawWebsite>) => mapWebsite(res.data),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Website", id },
        { type: "Website", id: "LIST" },
        { type: "Blog", id: "LIST" },
        { type: "Media", id: "LIST" },
      ],
    }),
    deleteWebsite: b.mutation<void, string>({
      query: (id) => ({ endpoint: "websites.delete", pathParams: { id } }),
      transformResponse: () => undefined,
      invalidatesTags: [{ type: "Website", id: "LIST" }],
    }),
    /** PATCH /websites/:id/assign-editor { editorId } */
    assignEditor: b.mutation<Website, { websiteId: string; editorId: string }>({
      query: ({ websiteId, editorId }) => ({
        endpoint: "websites.assignEditor",
        pathParams: { id: websiteId },
        body: { editorId },
      }),
      transformResponse: (res: DataEnvelope<RawWebsite>) => mapWebsite(res.data),
      invalidatesTags: (_r, _e, { websiteId }) => [
        { type: "Website", id: websiteId },
        { type: "Website", id: "LIST" },
      ],
    }),
    /** PATCH /websites/:id/owner { owner } */
    transferOwnership: b.mutation<Website, { websiteId: string; ownerId: string }>({
      query: ({ websiteId, ownerId }) => ({
        endpoint: "websites.transferOwnership",
        pathParams: { id: websiteId },
        body: { owner: ownerId },
      }),
      transformResponse: (res: DataEnvelope<RawWebsite>) => mapWebsite(res.data),
      invalidatesTags: (_r, _e, { websiteId }) => [
        { type: "Website", id: websiteId },
        { type: "Website", id: "LIST" },
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
  useAssignEditorMutation,
  useTransferOwnershipMutation,
} = websiteApi;
