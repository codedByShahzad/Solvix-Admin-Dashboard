import { baseApi } from "./baseApi";
import { MEDIA_UPLOAD_FIELD } from "@/lib/api/endpoints";
import { mapMedia, type DataEnvelope, type RawMedia } from "@/lib/api/mappers";
import type { Media } from "@/types";

/** POST /media — multipart/form-data: image, websiteId, blogId?, altText? */
export interface MediaUploadInput {
  file: File;
  websiteId: string;
  blogId?: string;
  altText?: string;
}

/** PATCH /media/:id — altText, filename, blog ("" clears it), optional replacement image. */
export interface MediaUpdateInput {
  id: string;
  altText?: string;
  filename?: string;
  /** Blog ID, or "" to remove the association. */
  blog?: string;
  replaceWith?: File;
}

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMediaList: b.query<Media[], void>({
      query: () => ({ endpoint: "media.list" }),
      transformResponse: (res: DataEnvelope<RawMedia[]>) => res.data.map(mapMedia),
      providesTags: (res) => [
        { type: "Media" as const, id: "LIST" },
        ...(res?.map((x) => ({ type: "Media" as const, id: x.id })) ?? []),
      ],
    }),
    getMedia: b.query<Media, string>({
      query: (id) => ({ endpoint: "media.get", pathParams: { id } }),
      transformResponse: (res: DataEnvelope<RawMedia>) => mapMedia(res.data),
      providesTags: (_r, _e, id) => [{ type: "Media", id }],
    }),
    uploadMedia: b.mutation<Media, MediaUploadInput>({
      query: ({ file, websiteId, blogId, altText }) => {
        const form = new FormData();
        form.append(MEDIA_UPLOAD_FIELD, file);
        form.append("websiteId", websiteId);
        if (blogId) form.append("blogId", blogId);
        if (altText) form.append("altText", altText);
        return { endpoint: "media.upload", body: form };
      },
      transformResponse: (res: DataEnvelope<RawMedia>) => mapMedia(res.data),
      invalidatesTags: [{ type: "Media", id: "LIST" }],
    }),
    updateMedia: b.mutation<Media, MediaUpdateInput>({
      query: ({ id, replaceWith, ...fields }) => {
        if (!replaceWith) return { endpoint: "media.update", pathParams: { id }, body: fields };
        const form = new FormData();
        form.append(MEDIA_UPLOAD_FIELD, replaceWith);
        for (const [k, v] of Object.entries(fields)) if (v !== undefined) form.append(k, v);
        return { endpoint: "media.update", pathParams: { id }, body: form };
      },
      transformResponse: (res: DataEnvelope<RawMedia>) => mapMedia(res.data),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Media", id },
        { type: "Media", id: "LIST" },
      ],
    }),
    /** Admin only (media.routes.ts) */
    deleteMedia: b.mutation<void, string>({
      query: (id) => ({ endpoint: "media.delete", pathParams: { id } }),
      transformResponse: () => undefined,
      invalidatesTags: [{ type: "Media", id: "LIST" }],
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
