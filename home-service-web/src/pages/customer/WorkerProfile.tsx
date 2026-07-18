import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BadgeCheck, Heart, Phone, Briefcase, Award } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import RatingStars from "../../components/ui/RatingStars";
import { workersApi, type ApiWorkerProfile, type ApiReview } from "../../api";
import { formatPKR, isAvatarUrl } from "../../lib/utils";
import { resolveUploadUrl } from "../../api/uploads";
import { useFavoritesStore } from "../../store/favoritesStore";

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<ApiWorkerProfile | null>(null);
  const [workerReviews, setWorkerReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const isFavorited = useFavoritesStore((s) => (worker ? s.ids.has(worker.id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  useEffect(() => {
    useFavoritesStore.getState().load();
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    workersApi
      .getWorker(id)
      .then(({ worker, reviews }) => {
        if (cancelled) return;
        setWorker(worker);
        setWorkerReviews(reviews);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div>
        <TopBar title="Worker profile" back />
        <p className="p-6 text-center text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div>
        <TopBar title="Worker profile" back />
        <p className="p-6 text-center text-sm text-ink-muted">Worker not found.</p>
      </div>
    );
  }

  const avatarUrl = isAvatarUrl(worker.user.avatar) ? resolveUploadUrl(worker.user.avatar) : null;
  const initials = worker.user.name.slice(0, 2).toUpperCase();

  return (
    <div>
      <TopBar
        title="Worker profile"
        back
        right={
          <button
            type="button"
            onClick={() => toggleFavorite(worker.id)}
            aria-label={isFavorited ? "Remove from saved workers" : "Save worker"}
            aria-pressed={isFavorited}
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface"
          >
            <Heart size={20} className={isFavorited ? "fill-danger text-danger" : ""} />
          </button>
        }
      />

      <div className="px-4 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-light font-display text-2xl font-semibold text-primary shadow-card ring-4 ring-primary-light/50">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-lg font-bold text-ink">{worker.user.name}</h2>
              {worker.verified && <BadgeCheck size={16} className="text-primary" />}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <RatingStars rating={worker.rating} />
              <span className="text-xs text-ink-muted">
                {worker.rating} ({worker.reviewCount} reviews)
              </span>
            </div>
            <Badge tone={worker.online ? "success" : "neutral"} className="mt-1.5">
              {worker.online ? "Online now" : "Offline"}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
            <Briefcase size={16} className="mx-auto text-primary" />
            <p className="mt-1 font-display text-sm font-semibold text-ink">{worker.completedJobs}</p>
            <p className="text-[11px] text-ink-muted">Jobs done</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
            <Award size={16} className="mx-auto text-primary" />
            <p className="mt-1 font-display text-sm font-semibold text-ink">{worker.experienceYears} yrs</p>
            <p className="text-[11px] text-ink-muted">Experience</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
            <span className="mx-auto block font-mono text-sm font-semibold text-primary">
              {formatPKR(worker.priceFrom)}
            </span>
            <p className="text-[11px] text-ink-muted">Starting price</p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="font-display text-sm font-semibold text-ink">About</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{worker.bio || "No bio provided."}</p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="outline" icon={<Phone size={16} />} className="flex-1">
            Call
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-muted">Chat and calling unlock once you book this worker.</p>

        <div className="mt-6">
          <h3 className="mb-2 font-display text-sm font-semibold text-ink">
            Reviews ({workerReviews.length})
          </h3>
          <div className="flex flex-col gap-3">
            {workerReviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{r.customer.name}</p>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <RatingStars rating={r.rating} size={12} />
                <p className="mt-1.5 text-sm text-ink-muted">{r.comment}</p>
              </div>
            ))}
            {workerReviews.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-muted">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-border bg-card p-4 shadow-[0_-8px_24px_-16px_rgba(22,18,31,0.18)]">
        {worker.verified ? (
          <Button fullWidth size="lg" onClick={() => navigate(`/booking/new/${worker.id}`)}>
            Book now · {formatPKR(worker.priceFrom)}
          </Button>
        ) : (
          <>
            <Button fullWidth size="lg" disabled>
              Not yet verified
            </Button>
            <p className="mt-1.5 text-center text-[11px] text-ink-muted">
              This worker is still under review and can't be booked yet.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
