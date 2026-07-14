import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]",
  secondary: "bg-primary-light text-primary hover:bg-primary/15",
  outline: "border border-border text-ink hover:border-primary hover:text-primary bg-card",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface",
  danger: "bg-danger-light text-danger hover:bg-danger/15",
};

const sizes: Record<string, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-5 py-3.5 rounded-xl gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
