import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";
import type { SessionMode } from "./session";

export interface AuthState {
  /** "loading" until the stored session has been read on the client. */
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: User | null;
  mode: SessionMode;
  /** Why the user was signed out — shown on the login page. */
  signOutReason: "expired" | "logout" | null;
}

const initialState: AuthState = {
  status: "loading",
  token: null,
  user: null,
  mode: "live",
  signOutReason: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ token: string; user: User; mode: SessionMode }>) {
      state.status = "authenticated";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.mode = action.payload.mode;
      state.signOutReason = null;
    },
    sessionEnded(state, action: PayloadAction<AuthState["signOutReason"]>) {
      state.status = "unauthenticated";
      state.token = null;
      state.user = null;
      state.mode = "live";
      state.signOutReason = action.payload;
    },
    userUpdated(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { sessionStarted, sessionEnded, userUpdated } = authSlice.actions;
export default authSlice.reducer;
