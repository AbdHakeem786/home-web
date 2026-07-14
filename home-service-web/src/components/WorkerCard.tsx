import { Link } from "react-router-dom";
import { BadgeCheck, Heart, MapPin } from "lucide-react";
import type { Worker } from "../types";
import RatingStars from "./ui/RatingStars";
import { formatPKR, isAvatarUrl } from "../lib/utils";
import { resolveUploadUrl } from "../api/uploads";
import { useFavoritesStore } from "../store/favoritesStore";

export default function WorkerCard({ worker }: { worker: Worker }) {
  const avatarUrl = isAvatarUrl(worker.avatar) ? resolveUploadUrl(worker.avatar) : null;
  const isFavorited = useFavoritesStore((s) => s.ids.has(worker.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  return (
    <div className="relative flex gap-3 rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-sm">
      <Link to={`/worker/${worker.id}`} className="absolute inset-0 z-0" aria-label={worker.name} />
      <div className="relative z-10 h-14 w-14 flex-shrink-0">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary-light font-display text-sm font-semibold text-primary">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : worker.avatar}
        </div>
        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            worker.online ? "bg-success" : "bg-ink-muted/40"
          }`}
        />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate font-display text-sm font-semibold text-ink">{worker.name}</p>
          {worker.verified && <BadgeCheck size={14} className="flex-shrink-0 text-primary" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <RatingStars rating={worker.rating} size={12} />
          <span className="text-xs text-ink-muted">
            {worker.rating} ({worker.reviewCount})
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
          <MapPin size={12} />
          {worker.distanceKm !== null ? `${worker.distanceKm} km away · ` : ""}
          {worker.experienceYears} yrs exp
        </div>
      </div>
      <div className="relative z-10 flex flex-shrink-0 flex-col items-end justify-between">
        <span className="font-mono text-sm font-semibold text-primary">{formatPKR(worker.priceFrom)}</span>
        <span className="text-[11px] text-ink-muted">from</span>
      </div>
      <button
        type="button"
        onClick={() => toggleFavorite(worker.id)}
        aria-label={isFavorited ? "Remove from saved workers" : "Save worker"}
        aria-pressed={isFavorited}
        className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center self-start"
      >
        <Heart size={16} className={isFavorited ? "fill-danger text-danger" : "text-ink-muted"} />
      </button>
    </div>
  );
}
