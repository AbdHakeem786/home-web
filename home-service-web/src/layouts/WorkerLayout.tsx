import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Wallet, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../store/appStore";
import { connectSocket } from "../api";
import { enablePushNotifications } from "../lib/push";

const items = [
  { to: "/worker/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/worker/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/worker/wallet", icon: Wallet, label: "Wallet" },
];

export default function WorkerLayout() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const initials = (user?.name ?? "W").slice(0, 2).toUpperCase();

  useEffect(() => {
    connectSocket();
    enablePushNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-surface-alt md:flex">
      <aside className="border-b border-border bg-white p-4 md:h-screen md:w-56 md:border-b-0 md:border-r">
        <div className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-ink">{user?.name ?? "Worker Panel"}</p>
            <p className="truncate text-[11px] text-ink-muted">{user?.phone ?? user?.email ?? "Worker"}</p>
          </div>
        </div>
        <nav className="flex gap-1 md:flex-col">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:flex-none",
                  isActive ? "bg-primary-light text-primary" : "text-ink-muted hover:bg-surface"
                )
              }
            >
              <Icon size={17} />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="mt-4 hidden w-full items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-ink-muted hover:text-danger md:flex"
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
