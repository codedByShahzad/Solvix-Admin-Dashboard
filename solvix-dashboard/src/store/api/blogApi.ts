import { baseApi } from "./baseApi";
import { extractItem, normalizeBlog, toListResult } from "@/lib/api/normalize";
import type { Blog, ListResult } from "@/types";

export type BlogPayload = Record<string, unknown>;

export const blogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getBlogs: b.query<ListResult<Blog>, void>({
      query: () => ({ endpoint: "blogs.list" }),
      transformResponse: (res: unknown) => toListResult(res, normalizeBlog),
      providesTags: (res) => [
        { type: "Blog" as const, id: "LIST" },
        ...(res?.items.map((x) => ({ type: "Blog" as const, id: x.id })) ?? []),
      ],
    }),
    getBlog: b.query<Blog, string>({
      query: (id) => ({ endpoint: "blogs.get", pathParams: { id } }),
      transformResponse: (res: unknown) => normalizeBlog(extractItem(res)),
      providesTags: (_r, _e, id) => [{ type: "Blog", id }],
    }),
    createBlog: b.mutation<Blog, BlogPayload>({
      query: (body) => ({ endpoint: "blogs.create", body }),
      transformResponse: (res: unknown) => normalizeBlog(extractItem(res)),
      invalidatesTags: [{ type: "Blog", id: "LIST" }],
    }),
    updateBlog: b.mutation<Blog, { id: string; body: BlogPayload }>({
      query: ({ id, body }) => ({ endpoint: "blogs.update", pathParams: { id }, body }),
      transformResponse: (res: unknown) => normalizeBlog(extractItem(res)),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Blog", id },
        { type: "Blog", id: "LIST" },
      ],
    }),
    deleteBlog: b.mutation<unknown, string>({
      query: (id) => ({ endpoint: "blogs.delete", pathParams: { id } }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Blog", id },
        { type: "Blog", id: "LIST" },
      ],
    }),
  }),
});

export const { useGetBlogsQuery, useGetBlogQuery, useCreateBlogMutation, useUpdateBlogMutation, useDeleteBlogMutation } =
  blogApi;
