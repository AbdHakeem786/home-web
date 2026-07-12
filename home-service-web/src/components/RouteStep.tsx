import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

interface RouteStepProps {
  status: "done" | "current" | "upcoming";
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isLast?: boolean;
}

export default function RouteStep({ status, title, subtitle, icon, isLast }: RouteStepProps) {
  return (
    <div className={cn("route-line flex gap-3 pb-6", status !== "upcoming" && "route-line--active", isLast && "pb-0")}>
      <div
        className={cn(
          "route-node",
          status === "done" && "route-node--done",
          status === "current" && "route-node--current"
        )}
      >
        {status === "done" ? <Check size={16} /> : icon}
      </div>
      <div className="pt-1">
        <p className={cn("font-display text-sm font-semibold", status === "upcoming" ? "text-ink-muted" : "text-ink")}>
          {title}
        </p>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
