import { useEffect, useState } from "react";
import { Users, HardHat, CalendarCheck, Banknote } from "lucide-react";
import { adminApi, bookingsApi, type DashboardStats, type ApiBooking, type AnalyticsResponse } from "../../api";
import { formatPKR } from "../../lib/utils";
import RevenueTrendChart from "../../components/admin/RevenueTrendChart";
import CategoryBreakdownChart from "../../components/admin/CategoryBreakdownChart";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<ApiBooking[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    adminApi.getDashboardStats().then(setStats);
    bookingsApi.listMyBookings({ limit: 8 }).then(({ bookings }) => setRecentBookings(bookings));
    adminApi.getAnalytics(14).then(setAnalytics);
  }, []);

  const cards = stats
    ? [
        { icon: Users, label: "Total customers", value: String(stats.totalCustomers) },
        { icon: HardHat, label: "Verified workers", value: String(stats.verifiedWorkers) },
        { icon: CalendarCheck, label: "Total bookings", value: String(stats.totalBookings) },
        { icon: Banknote, label: "Total revenue", value: formatPKR(stats.totalRevenue) },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">Dashboard</h1>
      <p className="mb-5 text-sm text-ink-muted">Platform overview</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <Icon size={18} className="text-primary" />
            <p className="mt-2 font-display text-xl font-bold text-ink">{value}</p>
            <p className="text-xs text-ink-muted">{label}</p>
          </div>
        ))}
        {!stats && <p className="col-span-4 text-sm text-ink-muted">Loading stats...</p>}
      </div>

      {analytics && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <RevenueTrendChart data={analytics.revenueByDay} />
          <CategoryBreakdownChart data={analytics.categoryBreakdown} />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Recent bookings</h2>
        <div className="flex flex-col divide-y divide-border">
          {recentBookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{b.address.split(",")[1]?.trim() ?? b.address}</span>
              <span className="text-ink-muted">{b.status.replaceAll("_", " ")}</span>
              <span className="font-mono text-ink">{formatPKR(b.finalPrice ?? b.estimatedPrice)}</span>
            </div>
          ))}
          {recentBookings.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-muted">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
