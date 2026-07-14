import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, MessageCircle, MapPin, Truck, Wrench, CheckCircle2 } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Button from "../../components/ui/Button";
import RouteStep from "../../components/RouteStep";
import LiveMap from "../../components/LiveMap";
import { bookingsApi, connectSocket, ApiError, type ApiBooking } from "../../api";
import { formatPKR } from "../../lib/utils";

const stages = ["accepted", "on_the_way", "arrived", "in_progress", "completed"] as const;

const DEFAULT_CENTER = { lat: 24.8607, lng: 67.0011 }; // Karachi fallback until a live ping arrives

export default function LiveTracking() {
  const { state } = useLocation() as { state?: { bookingId?: string } };
  const navigate = useNavigate();
  const bookingId = state?.bookingId;

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    bookingsApi.getBooking(bookingId).then(setBooking).catch(() => setError("Could not load this booking."));
  }, [bookingId]);

  useEffect(() => {
    const worker = booking && typeof booking.worker === "object" ? booking.worker : null;
    const coords = worker?.location?.coordinates;
    if (coords) setPosition({ lat: coords[1], lng: coords[0] });
  }, [booking]);

  useEffect(() => {
    if (!bookingId) return;
    const socket = connectSocket();
    if (!socket) return;

    socket.emit("join:booking", bookingId);
    const onLocation = (loc: { lat: number; lng: number }) => setPosition({ lat: loc.lat, lng: loc.lng });
    const onNotification = () => {
      bookingsApi.getBooking(bookingId).then(setBooking).catch(() => undefined);
    };
    socket.on("tracking:location", onLocation);
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("tracking:location", onLocation);
      socket.off("notification:new", onNotification);
    };
  }, [bookingId]);

  if (!bookingId) {
    return (
      <div>
        <TopBar title="Live tracking" back />
        <p className="p-6 text-center text-sm text-ink-muted">
          Open live tracking from an active booking in your booking history.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="Live tracking" back />
        <p className="p-6 text-center text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        <TopBar title="Live tracking" back />
        <p className="p-6 text-center text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  const worker = typeof booking.worker === "object" ? booking.worker : null;
  const workerName = worker?.user?.name ?? "Worker";
  const workerPhone = worker?.user && "phone" in worker.user ? (worker.user as { phone?: string }).phone : undefined;
  const initials = workerName.slice(0, 2).toUpperCase();
  const stageIndex = Math.max(0, stages.indexOf(booking.status as (typeof stages)[number]));
  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";

  function statusOf(i: number): "done" | "current" | "upcoming" {
    if (i < stageIndex) return "done";
    if (i === stageIndex) return "current";
    return "upcoming";
  }

  async function cancelBooking() {
    if (!booking) return;
    setCancelling(true);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(booking.id, { status: "cancelled" });
      setBooking(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel booking.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <TopBar title="Live tracking" back />

      <div className="relative h-56 overflow-hidden bg-surface">
        {isCancelled ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
            {booking.refundAmount !== undefined
              ? booking.cancellationFee
                ? `This booking was cancelled. ${formatPKR(booking.refundAmount)} was refunded after a ${formatPKR(booking.cancellationFee)} cancellation fee.`
                : `This booking was cancelled and ${formatPKR(booking.refundAmount)} was refunded in full.`
              : "This booking was cancelled."}
          </div>
        ) : (
          <>
            <LiveMap lat={position.lat} lng={position.lng} />
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow">
              {isCompleted ? "Arrived" : "Live location"}
            </div>
          </>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light font-display text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{workerName}</p>
            <p className="text-xs text-ink-muted capitalize">
              {booking.category && typeof booking.category === "object" ? booking.category.name : ""}
            </p>
          </div>
          {workerPhone && (
            <a
              href={`tel:${workerPhone}`}
              className="rounded-lg border border-border p-2 text-ink hover:bg-surface"
              aria-label="Call worker"
            >
              <Phone size={16} />
            </a>
          )}
          <button
            onClick={() => navigate(`/chat/${booking.id}`)}
            className="rounded-lg border border-border p-2 text-ink hover:bg-surface"
            aria-label="Message worker"
          >
            <MessageCircle size={16} />
          </button>
        </div>

        {error && <p className="mt-3 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

        {!isCancelled && (
          <div className="mt-6">
            <RouteStep status={statusOf(0)} title="Booking accepted" subtitle="Worker confirmed your request" icon={<CheckCircle2 size={14} />} />
            <RouteStep status={statusOf(1)} title="On the way" subtitle={`${workerName} is heading to your address`} icon={<Truck size={14} />} />
            <RouteStep status={statusOf(2)} title="Arrived" subtitle="Worker is at your location" icon={<MapPin size={14} />} />
            <RouteStep status={statusOf(3)} title="Job in progress" subtitle="Work has started" icon={<Wrench size={14} />} />
            <RouteStep status={statusOf(4)} title="Completed" subtitle="Rate your experience" icon={<CheckCircle2 size={14} />} isLast />
          </div>
        )}

        {isCompleted ? (
          <Button fullWidth size="lg" className="mt-6" onClick={() => navigate("/bookings")}>
            Rate & review
          </Button>
        ) : !isCancelled ? (
          <Button variant="danger" fullWidth size="lg" className="mt-6" disabled={cancelling} onClick={cancelBooking}>
            {cancelling ? "Cancelling..." : "Cancel booking"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
