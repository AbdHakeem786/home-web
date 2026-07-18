import { useEffect, useState } from "react";
import { HeartOff } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import WorkerCard from "../../components/WorkerCard";
import { authApi, type ApiWorkerCard } from "../../api";
import { useFavoritesStore } from "../../store/favoritesStore";

export default function Favorites() {
  const [workers, setWorkers] = useState<ApiWorkerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  // Filter live against the shared store so un-hearting a worker (here or
  // elsewhere) removes it from this list immediately, without a re-fetch.
  const visibleWorkers = workers.filter((w) => favoriteIds.has(w.id));

  useEffect(() => {
    useFavoritesStore.getState().load();
    let cancelled = false;
    authApi
      .listFavoriteWorkers()
      .then((res) => !cancelled && setWorkers(res))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <TopBar title="Saved workers" back />
      <div className="flex flex-col gap-2.5 p-4">
        {visibleWorkers.map((w) => (
          <WorkerCard key={w.id} worker={w} />
        ))}
        {!loading && visibleWorkers.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-muted">
              <HeartOff size={20} />
            </span>
            <p className="mt-3 max-w-55 text-sm text-ink-muted">
              No saved workers yet. Tap the heart on a worker's profile to save them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
