import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Profile } from "@/lib/auth";

// The signed-in customer, for any page to read with useCustomer() (src/store/hooks.ts).
//
// Filled by <AuthListener /> (src/store/AuthListener.tsx) from Supabase's session. Not persisted:
// Supabase already keeps the session in cookies, so this is only a view of it, rebuilt on load.
// Never put tokens or the password here.

export type CustomerStatus = "loading" | "signedOut" | "signedIn";

/** The parts of Supabase's `User` the pages need (kept small and serializable). */
export type CustomerUser = {
  id: string;
  email: string | null;
  /** "email" or "google". */
  provider: string | null;
};

type AuthState = {
  status: CustomerStatus;
  user: CustomerUser | null;
  /** From public.profiles: full_name, phone. Null while loading or when signed out. */
  profile: Profile | null;
  profileStatus: "idle" | "loading" | "loaded" | "failed";
};

const initialState: AuthState = { status: "loading", user: null, profile: null, profileStatus: "idle" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionChanged(state, action: PayloadAction<CustomerUser | null>) {
      const next = action.payload;
      const sameUser = next && state.user?.id === next.id;
      state.user = next;
      state.status = next ? "signedIn" : "signedOut";
      if (!sameUser) {
        state.profile = null;
        state.profileStatus = next ? "loading" : "idle";
      }
    },
    profileLoaded(state, action: PayloadAction<Profile | null>) {
      state.profile = action.payload;
      state.profileStatus = "loaded";
    },
    profileFailed(state) {
      state.profileStatus = "failed";
    },
    /** After saveProfile(): update the page without fetching again. */
    profileUpdated(state, action: PayloadAction<Partial<Pick<Profile, "full_name" | "phone">>>) {
      if (state.profile) Object.assign(state.profile, action.payload);
    },
  },
});

export const { sessionChanged, profileLoaded, profileFailed, profileUpdated } = authSlice.actions;
export default authSlice.reducer;
