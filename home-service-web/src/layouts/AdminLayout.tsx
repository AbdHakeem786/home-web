import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  HardHat,
  CalendarCheck,
  Tags,
  MessageSquareWarning,
  Wallet,
  Tag,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../store/appStore";
import { useThemeStore } from "../store/themeStore";

const items = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/workers", icon: HardHat, label: "Workers" },
  { to: "/admin/bookings", icon: CalendarCheck, label: "Bookings" },
  { to: "/admin/categories", icon: Tags, label: "Categories" },
  { to: "/admin/coupons", icon: Tag, label: "Promo codes" },
  { to: "/admin/complaints", icon: MessageSquareWarning, label: "Complaints" },
  { to: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
];

export default function AdminLayout() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const initials = (user?.name ?? "A").slice(0, 2).toUpperCase();
  return (
    <div className="min-h-screen bg-surface-alt md:flex">
      <aside className="flex w-full flex-col border-b border-border bg-sidebar p-4 md:h-screen md:w-60 md:border-b-0">
        <div className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-white">{user?.name ?? "Admin Panel"}</p>
            <p className="truncate text-[11px] text-white/50">{user?.email ?? user?.phone ?? "Admin"}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
          className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-white/60 hover:text-white"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-white/60 hover:text-white"
        >
          <LogOut size={14} /> Log out
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
