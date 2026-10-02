import { baseApi } from "./baseApi";
import {
  mapBlog,
  type DataEnvelope,
  type RawBlog,
} from "@/lib/api/mappers";
import type {
  Blog,
  BlogStatus,
  Section,
} from "@/types";

/**
 * Request body for POST /blogs and PATCH /blogs/:id
 * (fields of models/Blog.ts).
 *
 * Author is NOT included because the backend
 * automatically assigns the logged-in user as the author.
 */
export interface BlogPayload {
  website: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  category?: string;
  publishDate?: string;
  readingTime?: string;
  canonicalPath?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords: string[];
  ogImage?: string;
  sections: Section[];
  status: BlogStatus;
  relatedSlugs: string[];
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /**
     * GET /blogs?status=
     *
     * Scoped server-side to the user's websites.
     */
    getBlogs: b.query<
      Blog[],
      { status?: BlogStatus } | void
    >({
      query: (args) => ({
        endpoint: "blogs.list",
        params: {
          status: args?.status,
        },
      }),

      transformResponse: (
        res: DataEnvelope<RawBlog[]>
      ) => res.data.map(mapBlog),

      providesTags: (res) => [
        {
          type: "Blog" as const,
          id: "LIST",
        },

        ...(res?.map((x) => ({
          type: "Blog" as const,
          id: x.id,
        })) ?? []),
      ],
    }),

    /**
     * GET /blogs/:id
     */
    getBlog: b.query<Blog, string>({
      query: (id) => ({
        endpoint: "blogs.get",
        pathParams: {
          id,
        },
      }),

      transformResponse: (
        res: DataEnvelope<RawBlog>
      ) => mapBlog(res.data),

      providesTags: (_r, _e, id) => [
        {
          type: "Blog",
          id,
        },
      ],
    }),

    /**
     * POST /blogs
     *
     * The backend automatically assigns
     * the logged-in user as the author.
     */
    createBlog: b.mutation<
      Blog,
      BlogPayload
    >({
      query: (body) => ({
        endpoint: "blogs.create",
        body,
      }),

      transformResponse: (
        res: DataEnvelope<RawBlog>
      ) => mapBlog(res.data),

      invalidatesTags: [
        {
          type: "Blog",
          id: "LIST",
        },
      ],
    }),

    /**
     * PATCH /blogs/:id
     *
     * Author is intentionally not sent from
     * the frontend. The backend keeps the
     * existing author unchanged.
     */
    updateBlog: b.mutation<
      Blog,
      {
        id: string;
        body: Partial<BlogPayload>;
      }
    >({
      query: ({ id, body }) => ({
        endpoint: "blogs.update",
        pathParams: {
          id,
        },
        body,
      }),

      transformResponse: (
        res: DataEnvelope<RawBlog>
      ) => mapBlog(res.data),

      invalidatesTags: (
        _r,
        _e,
        { id }
      ) => [
        {
          type: "Blog",
          id,
        },
        {
          type: "Blog",
          id: "LIST",
        },
      ],
    }),

    /**
     * DELETE /blogs/:id
     */
    deleteBlog: b.mutation<
      void,
      string
    >({
      query: (id) => ({
        endpoint: "blogs.delete",
        pathParams: {
          id,
        },
      }),

      transformResponse: () =>
        undefined,

      invalidatesTags: [
        {
          type: "Blog",
          id: "LIST",
        },
        {
          type: "Media",
          id: "LIST",
        },
      ],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogApi;