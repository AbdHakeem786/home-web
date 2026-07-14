import { create } from "zustand";
import { authApi } from "../api";

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  load: () => void;
  toggle: (workerId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: () => {
    if (get().loaded) return;
    authApi
      .listFavoriteWorkers()
      .then((workers) => set({ ids: new Set(workers.map((w) => w.id)), loaded: true }))
      .catch(() => set({ loaded: true }));
  },
  toggle: (workerId) => {
    const isFavorited = get().ids.has(workerId);
    const next = new Set(get().ids);
    isFavorited ? next.delete(workerId) : next.add(workerId);
    set({ ids: next });

    const request = isFavorited ? authApi.removeFavoriteWorker(workerId) : authApi.addFavoriteWorker(workerId);
    request.catch(() => {
      // Revert on failure - keep the store in sync with the server.
      const reverted = new Set(get().ids);
      isFavorited ? reverted.add(workerId) : reverted.delete(workerId);
      set({ ids: reverted });
    });
  },
}));
