import { baseApi } from "./baseApi";
import { mapAuthUser, type RawAuthUser } from "@/lib/api/mappers";
import type { Role, User } from "@/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /auth/login → { message, token, user } */
    login: b.mutation<LoginResult, LoginInput>({
      query: (body) => ({ endpoint: "auth.login", body }),
      transformResponse: (res: { token: string; user: RawAuthUser }) => ({ token: res.token, user: mapAuthUser(res.user) }),
    }),
    /** POST /auth/register → { message, user } (no token returned) */
    register: b.mutation<User, RegisterInput>({
      query: (body) => ({ endpoint: "auth.register", body }),
      transformResponse: (res: { user: RawAuthUser }) => mapAuthUser(res.user),
      invalidatesTags: [{ type: "Editor", id: "LIST" }],
    }),
    /** GET /auth/me → { user } */
    getMe: b.query<User, void>({
      query: () => ({ endpoint: "auth.me" }),
      transformResponse: (res: { user: RawAuthUser }) => mapAuthUser(res.user),
      providesTags: ["User"],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery } = authApi;
