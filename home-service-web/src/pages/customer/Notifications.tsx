import { useEffect, useState } from "react";
import { CalendarCheck, CreditCard, Gift, Bell } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import { notificationsApi, type ApiNotification } from "../../api";
import { cn } from "../../lib/utils";

const icons = {
  booking: CalendarCheck,
  payment: CreditCard,
  offer: Gift,
  system: Bell,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .listMyNotifications()
      .then(({ notifications }) => setNotifications(notifications))
      .finally(() => setLoading(false));
  }, []);

  async function handleOpen(n: ApiNotification) {
    if (n.read) return;
    try {
      await notificationsApi.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      /* non-critical */
    }
  }

  return (
    <div>
      <TopBar title="Notifications" />
      <div className="flex flex-col divide-y divide-border">
        {!loading && notifications.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No notifications yet.</p>
        )}
        {notifications.map((n) => {
          const Icon = icons[n.type];
          return (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={cn("flex w-full gap-3 px-4 py-3.5 text-left", !n.read && "bg-primary-light/30")}
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
