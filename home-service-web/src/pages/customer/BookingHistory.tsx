import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, CalendarClock, Star, Flag, Check } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { bookingsApi, reviewsApi, complaintsApi, ApiError, type ApiBooking } from "../../api";
import { formatPKR, cn } from "../../lib/utils";
import type { BookingStatus } from "../../types";

const RESCHEDULABLE: BookingStatus[] = ["pending", "accepted"];

const statusTone: Record<BookingStatus, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  accepted: "primary",
  on_the_way: "primary",
  arrived: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: "danger",
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [saving, setSaving] = useState(false);

  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportSubject, setReportSubject] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [submittingReport, setSubmittingReport] = useState(false);

  function load() {
    bookingsApi
      .listMyBookings()
      .then(({ bookings }) => setBookings(bookings))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openReschedule(b: ApiBooking) {
    setReschedulingId(b.id);
    setNewDate(b.date);
    setNewTime(b.time);
    setRescheduleError("");
  }

  async function submitReschedule(id: string) {
    setSaving(true);
    setRescheduleError("");
    try {
      await bookingsApi.rescheduleBooking(id, { date: newDate, time: newTime });
      setReschedulingId(null);
      load();
    } catch (err) {
      setRescheduleError(err instanceof ApiError ? err.message : "Could not reschedule booking.");
    } finally {
      setSaving(false);
    }
  }

  function openReview(b: ApiBooking) {
    setReviewingId(b.id);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
  }

  async function submitReview(id: string) {
    if (reviewRating < 1) {
      setReviewError("Please select a rating.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    try {
      await reviewsApi.createReview({ bookingId: id, rating: reviewRating, comment: reviewComment.trim() || undefined });
      setReviewedIds((s) => new Set(s).add(id));
      setReviewingId(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setReviewedIds((s) => new Set(s).add(id));
        setReviewingId(null);
      } else {
        setReviewError(err instanceof ApiError ? err.message : "Could not submit review.");
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  function openReport(b: ApiBooking) {
    setReportingId(b.id);
    setReportSubject("");
    setReportDescription("");
    setReportError("");
  }

  async function submitReport(id: string) {
    setSubmittingReport(true);
    setReportError("");
    try {
      await complaintsApi.createComplaint({ bookingId: id, subject: reportSubject.trim(), description: reportDescription.trim() });
      setReportedIds((s) => new Set(s).add(id));
      setReportingId(null);
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : "Could not submit report.");
    } finally {
      setSubmittingReport(false);
    }
  }

  return (
    <div>
      <TopBar title="Booking history" back />
      <div className="flex flex-col gap-3 p-4">
        {!loading && bookings.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No bookings yet.</p>
        )}
        {bookings.map((b) => {
          const workerName = b.worker && typeof b.worker === "object" ? b.worker.user?.name : undefined;
          const workerId = b.worker && typeof b.worker === "object" ? b.worker.id : b.worker;
          const active = b.status !== "completed" && b.status !== "cancelled";
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
              <Link
                to={active ? `/booking/${workerId}/track` : "#"}
                state={active ? { bookingId: b.id } : undefined}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{workerName ?? "Worker"}</p>
                  <Badge tone={statusTone[b.status]}>{b.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{b.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-muted">{b.date} · {b.time}</span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {formatPKR(b.finalPrice ?? b.estimatedPrice)}
                  </span>
                </div>
              </Link>
              {active && (
                <Link
                  to={`/chat/${b.id}`}
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  <MessageCircle size={13} /> Chat with {workerName ?? "worker"}
                </Link>
              )}
              {RESCHEDULABLE.includes(b.status) && reschedulingId !== b.id && (
                <button
                  onClick={() => openReschedule(b)}
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  <CalendarClock size={13} /> Reschedule
                </button>
              )}
              {reschedulingId === b.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-alt p-3">
                  {rescheduleError && <p className="text-xs text-danger">{rescheduleError}</p>}
                  <div className="flex gap-2">
                    <Input
                      id={`date-${b.id}`}
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                    <Input
                      id={`time-${b.id}`}
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving} onClick={() => submitReschedule(b.id)}>
                      {saving ? "Saving..." : "Confirm new time"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => setReschedulingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {b.status === "completed" &&
                (reviewedIds.has(b.id) ? (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-success">
                    <Check size={13} /> You reviewed this booking
                  </p>
                ) : reviewingId !== b.id ? (
                  <button
                    onClick={() => openReview(b)}
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-primary"
                  >
                    <Star size={13} /> Rate & review
                  </button>
                ) : null)}

              {reviewingId === b.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-alt p-3">
                  {reviewError && <p className="text-xs text-danger">{reviewError}</p>}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} star`}>
                        <Star
                          size={22}
                          className={cn(n <= reviewRating ? "fill-warning text-warning" : "text-border")}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="How was your experience? (optional)"
                    className="w-full rounded-xl border border-border p-2.5 text-sm outline-none focus:border-primary"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={submittingReview} onClick={() => submitReview(b.id)}>
                      {submittingReview ? "Submitting..." : "Submit review"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={submittingReview} onClick={() => setReviewingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {reportedIds.has(b.id) ? (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <Check size={13} /> Report submitted
                </p>
              ) : reportingId !== b.id ? (
                <button
                  onClick={() => openReport(b)}
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-danger"
                >
                  <Flag size={13} /> Report a problem
                </button>
              ) : null}

              {reportingId === b.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-alt p-3">
                  {reportError && <p className="text-xs text-danger">{reportError}</p>}
                  <Input
                    id={`report-subject-${b.id}`}
                    placeholder="Subject (e.g. Worker didn't show up)"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                  />
                  <textarea
                    rows={3}
                    placeholder="Describe what happened..."
                    className="w-full rounded-xl border border-border p-2.5 text-sm outline-none focus:border-primary"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={submittingReport || reportSubject.trim().length < 3 || reportDescription.trim().length < 5}
                      onClick={() => submitReport(b.id)}
                    >
                      {submittingReport ? "Submitting..." : "Submit report"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={submittingReport} onClick={() => setReportingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
