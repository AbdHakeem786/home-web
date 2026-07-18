import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { cn } from "../../lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-ink-muted transition-all duration-150 hover:border-primary/30 hover:text-ink active:scale-[0.98]",
        className
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
