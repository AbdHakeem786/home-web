import { create } from "zustand";
import type { UserRole } from "../types";
import { tokenStorage } from "../api/client";
import { disconnectSocket } from "../api/socket";
import type { ApiUser } from "../api/types";
import { useFavoritesStore } from "./favoritesStore";

interface AppState {
  role: UserRole;
  user: ApiUser | null;
  isAuthenticated: boolean;
  /** Populated after login/verify-otp with the server's user + tokens. */
  setSession: (user: ApiUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: ApiUser) => void;
  logout: () => void;
}

const persistedUser = tokenStorage.getUser<ApiUser>();
const hasToken = Boolean(tokenStorage.getAccess());

export const useAppStore = create<AppState>((set) => ({
  role: persistedUser?.role ?? "customer",
  user: persistedUser,
  isAuthenticated: hasToken && Boolean(persistedUser),
  setSession: (user, accessToken, refreshToken) => {
    tokenStorage.setSession(accessToken, refreshToken, user);
    set({ user, role: user.role, isAuthenticated: true });
  },
  setUser: (user) => {
    tokenStorage.setUser(user);
    set({ user, role: user.role });
  },
  logout: () => {
    tokenStorage.clear();
    disconnectSocket();
    useFavoritesStore.setState({ ids: new Set(), loaded: false });
    set({ user: null, isAuthenticated: false });
  },
}));

/** Convenience selector for display name, since userName was used throughout the UI. */
export function useUserName(): string {
  return useAppStore((s) => s.user?.name ?? "there");
}

// client.ts clears localStorage itself when a 401 survives a refresh attempt, but
// it has no reference to this store. Without this, isAuthenticated stays true in
// memory and every route keeps rendering while every request silently 401s.
window.addEventListener("rmh:session-expired", () => {
  useAppStore.getState().logout();
});
