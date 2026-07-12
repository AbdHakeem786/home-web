import { Star } from "lucide-react";

export default function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-warning text-warning" : "fill-border text-border"}
        />
      ))}
    </div>
  );
}
