import { baseApi } from "./baseApi";
import { mapUserDoc, type DataEnvelope, type RawUserDoc } from "@/lib/api/mappers";
import type { Editor } from "@/types";

/**
 * Editors:
 *   list   → GET  /admin/editors           (admin)
 *   create → POST /auth/register role=editor (see authApi.register)
 *   assign → PATCH /websites/:id/assign-editor (see websiteApi.assignEditor)
 * The backend has no update / delete / unassign routes for users.
 */
export const editorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getEditors: b.query<Editor[], void>({
      query: () => ({ endpoint: "admin.editors" }),
      transformResponse: (res: DataEnvelope<RawUserDoc[]>) => res.data.map(mapUserDoc),
      providesTags: (res) => [
        { type: "Editor" as const, id: "LIST" },
        ...(res?.map((x) => ({ type: "Editor" as const, id: x.id })) ?? []),
      ],
    }),
  }),
});

export const { useGetEditorsQuery } = editorApi;
