import { baseApi } from "./baseApi";
import { MEDIA_UPLOAD_FIELD } from "@/lib/api/endpoints";
import { extractItem, normalizeMedia, toListResult } from "@/lib/api/normalize";
import type { ListResult, Media } from "@/types";

export interface MediaUploadInput {
  file: File;
  websiteId?: string;
  blogId?: string;
  alt?: string;
}

export type MediaPayload = Record<string, unknown>;

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMediaList: b.query<ListResult<Media>, void>({
      query: () => ({ endpoint: "media.list" }),
      transformResponse: (res: unknown) => toListResult(res, normalizeMedia),
      providesTags: (res) => [
        { type: "Media" as const, id: "LIST" },
        ...(res?.items.map((x) => ({ type: "Media" as const, id: x.id })) ?? []),
      ],
    }),
    getMedia: b.query<Media, string>({
      query: (id) => ({ endpoint: "media.get", pathParams: { id } }),
      transformResponse: (res: unknown) => normalizeMedia(extractItem(res)),
      providesTags: (_r, _e, id) => [{ type: "Media", id }],
    }),
    /** multipart/form-data — field names NEED BACKEND ROUTE CONFIRMATION */
    uploadMedia: b.mutation<Media, MediaUploadInput>({
      query: ({ file, websiteId, blogId, alt }) => {
        const form = new FormData();
        form.append(MEDIA_UPLOAD_FIELD, file);
        if (websiteId) form.append("website", websiteId);
        if (blogId) form.append("blog", blogId);
        if (alt) form.append("alt", alt);
        return { endpoint: "media.upload", body: form };
      },
      transformResponse: (res: unknown) => normalizeMedia(extractItem(res)),
      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),
    updateMedia: b.mutation<Media, { id: string; body: MediaPayload }>({
      query: ({ id, body }) => ({ endpoint: "media.update", pathParams: { id }, body }),
      transformResponse: (res: unknown) => normalizeMedia(extractItem(res)),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),
    deleteMedia: b.mutation<unknown, string>({
      query: (id) => ({ endpoint: "media.delete", pathParams: { id } }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMediaListQuery,
  useGetMediaQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
