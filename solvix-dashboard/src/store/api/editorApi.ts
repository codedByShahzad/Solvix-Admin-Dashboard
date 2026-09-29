import { baseApi } from "./baseApi";
import { extractItem, normalizeEditor, toListResult } from "@/lib/api/normalize";
import type { Editor, ListResult } from "@/types";

export type EditorPayload = Record<string, unknown>;

/** Editor management lives under /api/v1/admin — exact child routes NEED BACKEND ROUTE CONFIRMATION. */
export const editorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getEditors: b.query<ListResult<Editor>, void>({
      query: () => ({ endpoint: "editors.list" }),
      transformResponse: (res: unknown) => toListResult(res, normalizeEditor),
      providesTags: (res) => [
        { type: "Editor" as const, id: "LIST" },
        ...(res?.items.map((x) => ({ type: "Editor" as const, id: x.id })) ?? []),
      ],
    }),
    getEditor: b.query<Editor, string>({
      query: (id) => ({ endpoint: "editors.get", pathParams: { id } }),
      transformResponse: (res: unknown) => normalizeEditor(extractItem(res)),
      providesTags: (_r, _e, id) => [{ type: "Editor", id }],
    }),
    createEditor: b.mutation<Editor, EditorPayload>({
      query: (body) => ({ endpoint: "editors.create", body }),
      transformResponse: (res: unknown) => normalizeEditor(extractItem(res)),
      invalidatesTags: [{ type: "Editor", id: "LIST" }],
    }),
    updateEditor: b.mutation<Editor, { id: string; body: EditorPayload }>({
      query: ({ id, body }) => ({ endpoint: "editors.update", pathParams: { id }, body }),
      transformResponse: (res: unknown) => normalizeEditor(extractItem(res)),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Editor", id },
        { type: "Editor", id: "LIST" },
      ],
    }),
    deleteEditor: b.mutation<unknown, string>({
      query: (id) => ({ endpoint: "editors.delete", pathParams: { id } }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Editor", id },
        { type: "Editor", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetEditorsQuery,
  useGetEditorQuery,
  useCreateEditorMutation,
  useUpdateEditorMutation,
  useDeleteEditorMutation,
} = editorApi;
