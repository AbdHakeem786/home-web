import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Bell, ChevronRight, Gift } from "lucide-react";
import CategoryTile from "../../components/CategoryTile";
import WorkerCard from "../../components/WorkerCard";
import { useAppStore } from "../../store/appStore";
import { authApi, categoriesApi, workersApi, notificationsApi, type ApiCategory, type ApiWorkerCard } from "../../api";

export default function Home() {
  const userName = useAppStore((s) => s.user?.name ?? "there");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [nearby, setNearby] = useState<ApiWorkerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([categoriesApi.listCategories(), workersApi.listWorkers({ online: true, verified: true, limit: 3, sort: "rating" })])
      .then(([cats, workersRes]) => {
        if (cancelled) return;
        setCategories(cats);
        setNearby(workersRes.workers);
      })
      .catch(() => {
        /* silently ignore - empty state is shown below */
      })
      .finally(() => !cancelled && setLoading(false));
    notificationsApi
      .listMyNotifications()
      .then(({ unreadCount }) => !cancelled && setUnreadCount(unreadCount))
      .catch(() => undefined);
    authApi
      .listAddresses()
      .then(({ addresses, currentAddressId }) => {
        if (cancelled) return;
        const current = addresses.find((a) => a.id === currentAddressId);
        setCurrentAddress(current?.address ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="relative overflow-hidden bg-linear-to-br from-primary to-primary-dark px-4 pb-6 pt-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <Link to="/addresses" className="min-w-0">
              <div className="flex items-center gap-1 text-xs text-white/70">
                <MapPin size={12} /> Current location
              </div>
              <p className="truncate text-sm font-medium">{currentAddress ?? "Set your location"}</p>
            </Link>
            <Link to="/notifications" className="relative rounded-full bg-white/15 p-2">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
              )}
            </Link>
          </div>
          <p className="mt-4 font-display text-lg font-semibold">
            Assalam-o-Alaikum, {userName} 👋
          </p>
          <p className="text-sm text-white/70">What do you need help with today?</p>

          <Link
            to="/workers/all"
            className="mt-4 flex items-center gap-2 rounded-xl bg-card px-3.5 py-3 text-ink-muted"
          >
            <Search size={16} />
            <span className="text-sm">Search plumber, electrician, cleaner...</span>
          </Link>
        </div>
      </div>

      <div className="px-4">
        <div className="-mt-3 mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-light text-warning-ink">
            <Gift size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">15% off AC servicing this weekend</p>
            <p className="text-xs text-ink-muted">Use code WEEKEND15 at checkout</p>
          </div>
          <ChevronRight size={16} className="text-ink-muted" />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">Categories</h2>
          <Link to="/categories" className="text-xs font-medium text-primary">
            View all
          </Link>
        </div>
        <div className="mb-6 grid grid-cols-4 gap-2.5">
          {categories.slice(0, 8).map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
          {!loading && categories.length === 0 && (
            <p className="col-span-4 text-center text-xs text-ink-muted">No categories yet.</p>
          )}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">Nearby workers online now</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {nearby.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
          {!loading && nearby.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-muted">No workers online right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
