import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";

export interface AuthState {
  /** "loading" until the stored session has been read on the client. */
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: User | null;
  /** Why the user was signed out — shown on the login page. */
  signOutReason: "expired" | "logout" | null;
}

const initialState: AuthState = { status: "loading", token: null, user: null, signOutReason: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ token: string; user: User }>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.signOutReason = null;
    },
    sessionEnded(state, action: PayloadAction<AuthState["signOutReason"]>) {
      state.status = "unauthenticated";
      state.token = null;
      state.user = null;
      state.signOutReason = action.payload;
    },
    userRefreshed(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
});

export const { sessionStarted, sessionEnded, userRefreshed } = authSlice.actions;
export default authSlice.reducer;
