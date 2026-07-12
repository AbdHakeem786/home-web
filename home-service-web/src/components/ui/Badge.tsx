import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

const tones: Record<string, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-[#92620A]",
  danger: "bg-danger-light text-danger",
  neutral: "bg-surface text-ink-muted",
};

export default function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
