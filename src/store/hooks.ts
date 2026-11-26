import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

/**
 * The signed-in customer, from the `auth` slice (kept in step with Supabase by AuthListener).
 *   status         "loading" until Supabase has read the session, then "signedIn" / "signedOut"
 *   user           { id, email, provider } or null
 *   profile        public.profiles row (full_name, phone) or null while it loads
 *   profileStatus  "idle" | "loading" | "loaded" | "failed"
 */
export const useCustomer = () => useAppSelector((state) => state.auth);
