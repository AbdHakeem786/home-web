import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import WorkerCard from "../../components/WorkerCard";
import { categoriesApi, workersApi, type ApiCategory, type ApiWorkerCard } from "../../api";

export default function WorkerList() {
  const { categoryId } = useParams();
  const resolvedCategoryId = categoryId === "all" ? undefined : categoryId;
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [list, setList] = useState<ApiWorkerCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep the input in sync if the URL's search param changes elsewhere (e.g. back/forward nav).
  useEffect(() => setSearchInput(search), [search]);

  // Debounce typing before it hits the URL (and therefore the API call below).
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) next.set("search", trimmed);
          else next.delete("search");
          return next;
        },
        { replace: true }
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      resolvedCategoryId ? categoriesApi.getCategory(resolvedCategoryId).catch(() => null) : Promise.resolve(null),
      workersApi.listWorkers({
        category: resolvedCategoryId,
        search: search || undefined,
        verified: true,
        sort: "rating",
      }),
    ])
      .then(([cat, workersRes]) => {
        if (cancelled) return;
        setCategory(cat);
        setList(workersRes.workers);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resolvedCategoryId, search]);

  return (
    <div>
      <TopBar
        title={category ? category.name : "All workers"}
        back
        right={
          <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface" aria-label="Filter">
            <SlidersHorizontal size={18} />
          </button>
        }
      />
      <div className="p-4 pb-0">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, skill, category..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            aria-label="Search workers"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {!loading && list.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">
            {search ? `No workers found for "${search}".` : "No workers found nearby for this category yet."}
          </p>
        )}
        {list.map((w) => (
          <WorkerCard key={w.id} worker={w} />
        ))}
      </div>
    </div>
  );
}
