import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, MessageCircle, Bell, User } from "lucide-react";
import { cn } from "../../lib/utils";

const items = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/categories", icon: LayoutGrid, label: "Categories" },
  { to: "/bookings", icon: MessageCircle, label: "Bookings" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-md items-center justify-around border-t border-border bg-card/95 px-2 py-2 backdrop-blur">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-1.5 text-[11px] font-medium transition-colors",
              isActive ? "bg-primary-light text-primary" : "text-ink-muted hover:text-ink"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
