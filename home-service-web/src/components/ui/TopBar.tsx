import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3.5 backdrop-blur">
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="-ml-1.5 rounded-lg p-1.5 text-ink hover:bg-surface"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="font-display text-base font-semibold text-ink">{title}</h1>
      </div>
      {right}
    </div>
  );
}
