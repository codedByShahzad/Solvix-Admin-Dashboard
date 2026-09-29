import { baseApi } from "./baseApi";
import { extractItem, normalizeUser } from "@/lib/api/normalize";
import type { User } from "@/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /auth/login — confirmed. Raw response is parsed by parseLoginResponse. */
    login: b.mutation<unknown, LoginInput>({
      query: (body) => ({ endpoint: "auth.login", body }),
    }),
    /** NEEDS BACKEND ROUTE CONFIRMATION ("auth.me") */
    getMe: b.query<User | null, void>({
      query: () => ({ endpoint: "auth.me" }),
      transformResponse: (res: unknown) => normalizeUser(extractItem(extractItem(res).user ?? res)),
      providesTags: ["User"],
    }),
    /** NEEDS BACKEND ROUTE CONFIRMATION ("auth.changePassword") */
    changePassword: b.mutation<unknown, ChangePasswordInput>({
      query: (body) => ({ endpoint: "auth.changePassword", body }),
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery, useChangePasswordMutation } = authApi;
