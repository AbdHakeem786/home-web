import { useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { bookingsApi, ApiError, type ApiBooking } from "../../api";
import { formatPKR } from "../../lib/utils";
import type { BookingStatus } from "../../types";

const statusTone: Record<BookingStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  accepted: "primary",
  on_the_way: "primary",
  arrived: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: "danger",
};

// Mirrors backend BOOKING_STATUS_FLOW - only these forward moves are accepted by the server.
const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    bookingsApi
      .listMyBookings({ limit: 100 })
      .then(({ bookings }) => setBookings(bookings))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(b: ApiBooking, status: BookingStatus) {
    setBusyId(b.id);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(b.id, { status });
      setBookings((bs) => bs.map((x) => (x.id === b.id ? updated : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update booking status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Bookings</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Worker</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => {
              const workerName = b.worker && typeof b.worker === "object" ? b.worker.user?.name : b.worker || "Unassigned";
              const nextOptions = NEXT_STATUSES[b.status];
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-ink-muted">#{b.id.slice(-6)}</td>
                  <td className="px-4 py-3 text-ink">{workerName}</td>
                  <td className="px-4 py-3 text-ink-muted">{b.address}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[b.status]}>{b.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatPKR(b.finalPrice ?? b.estimatedPrice)}</td>
                  <td className="px-4 py-3">
                    {nextOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {nextOptions.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={s === "cancelled" ? "danger" : "outline"}
                            disabled={busyId === b.id}
                            onClick={() => changeStatus(b, s)}
                          >
                            {s.replaceAll("_", " ")}
                          </Button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && bookings.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
