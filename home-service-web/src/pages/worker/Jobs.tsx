import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation2, Check, X, Camera, MessageCircle, Radio, Truck, MapPin, Wrench, Flag } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ImageUploader from "../../components/ImageUploader";
import { bookingsApi, complaintsApi, resolveUploadUrl, ApiError, type ApiBooking } from "../../api";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { formatPKR, cn } from "../../lib/utils";

export default function WorkerJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionImages, setCompletionImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const { activeBookingId, error: locationError, start, stop } = useLocationBroadcast();

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportSubject, setReportSubject] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [submittingReport, setSubmittingReport] = useState(false);

  function openReport(job: ApiBooking) {
    setReportingId(job.id);
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

  function reload() {
    bookingsApi
      .listMyBookings()
      .then(({ bookings }) => setJobs(bookings))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function accept(job: ApiBooking) {
    setBusyId(job.id);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(job.id, { status: "accepted" });
      setJobs((js) => js.map((j) => (j.id === job.id ? updated : j)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update job.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(job: ApiBooking) {
    setBusyId(job.id);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(job.id, {
        status: "cancelled",
        cancelReason: "Declined by worker",
      });
      setJobs((js) => js.map((j) => (j.id === job.id ? updated : j)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update job.");
    } finally {
      setBusyId(null);
    }
  }

  async function advance(job: ApiBooking, status: ApiBooking["status"]) {
    setBusyId(job.id);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(job.id, { status });
      setJobs((js) => js.map((j) => (j.id === job.id ? updated : j)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update job.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmComplete(job: ApiBooking) {
    setBusyId(job.id);
    setError("");
    try {
      const updated = await bookingsApi.updateBookingStatus(job.id, {
        status: "completed",
        completionImages,
      });
      setJobs((js) => js.map((j) => (j.id === job.id ? updated : j)));
      setCompletingId(null);
      setCompletionImages([]);
      if (activeBookingId === job.id) stop();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete job.");
    } finally {
      setBusyId(null);
    }
  }

  const toneFor = (status: ApiBooking["status"]) =>
    status === "completed" ? "success" : status === "cancelled" ? "danger" : status === "pending" ? "warning" : "primary";

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-bold text-ink">Jobs</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      {locationError && (
        <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{locationError}</p>
      )}
      {!loading && jobs.length === 0 && (
        <p className="py-10 text-center text-sm text-ink-muted">No jobs yet.</p>
      )}
      <div className="flex flex-col gap-3">
        {jobs.map((j) => {
          const customerName = typeof j.customer === "object" ? j.customer.name : "Customer";
          const categoryName = typeof j.category === "object" ? j.category.name : "";
          const busy = busyId === j.id;
          const isActive = j.status === "accepted" || j.status === "on_the_way" || j.status === "arrived" || j.status === "in_progress";
          const sharing = activeBookingId === j.id;
          return (
            <Card key={j.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{customerName}</p>
                <Badge tone={toneFor(j.status)}>{j.status.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{categoryName} · {j.address}</p>
              <p className="mt-1 text-xs text-ink-muted">{j.date} · {j.time}</p>
              <p className="mt-2 font-mono text-sm font-semibold text-ink">{formatPKR(j.estimatedPrice)}</p>

              {j.problemImages && j.problemImages.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {j.problemImages.map((url) => (
                    <img key={url} src={resolveUploadUrl(url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {j.status === "pending" && (
                  <>
                    <Button size="sm" icon={<Check size={14} />} disabled={busy} onClick={() => accept(j)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" icon={<X size={14} />} disabled={busy} onClick={() => reject(j)}>
                      Reject
                    </Button>
                  </>
                )}
                {isActive && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Navigation2 size={14} />}
                      disabled={busy}
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(j.address)}`,
                          "_blank",
                          "noreferrer"
                        )
                      }
                    >
                      Navigate
                    </Button>
                    <Button
                      size="sm"
                      variant={sharing ? "secondary" : "outline"}
                      icon={<Radio size={14} />}
                      disabled={busy}
                      onClick={() => (sharing ? stop() : start(j.id))}
                    >
                      {sharing ? "Sharing location" : "Share live location"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<MessageCircle size={14} />}
                      disabled={busy}
                      onClick={() => navigate(`/worker/chat/${j.id}`)}
                    >
                      Chat
                    </Button>
                    {j.status === "accepted" && (
                      <Button size="sm" icon={<Truck size={14} />} disabled={busy} onClick={() => advance(j, "on_the_way")}>
                        On the way
                      </Button>
                    )}
                    {j.status === "on_the_way" && (
                      <Button size="sm" icon={<MapPin size={14} />} disabled={busy} onClick={() => advance(j, "arrived")}>
                        Mark arrived
                      </Button>
                    )}
                    {j.status === "arrived" && (
                      <Button size="sm" icon={<Wrench size={14} />} disabled={busy} onClick={() => advance(j, "in_progress")}>
                        Start job
                      </Button>
                    )}
                    {j.status === "in_progress" && (
                      <Button
                        size="sm"
                        icon={<Camera size={14} />}
                        disabled={busy}
                        onClick={() => {
                          setCompletingId(j.id);
                          setCompletionImages([]);
                        }}
                      >
                        Complete job
                      </Button>
                    )}
                    {!reportedIds.has(j.id) && reportingId !== j.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Flag size={14} />}
                        disabled={busy}
                        onClick={() => openReport(j)}
                      >
                        Report a problem
                      </Button>
                    )}
                  </>
                )}
              </div>

              {reportedIds.has(j.id) && (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <Check size={13} /> Report submitted
                </p>
              )}

              {reportingId === j.id && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border p-3">
                  {reportError && <p className="text-xs text-danger">{reportError}</p>}
                  <Input
                    id={`report-subject-${j.id}`}
                    placeholder="Subject (e.g. Customer address was wrong)"
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
                      onClick={() => submitReport(j.id)}
                    >
                      {submittingReport ? "Submitting..." : "Submit report"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={submittingReport} onClick={() => setReportingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {completingId === j.id && (
                <div className={cn("mt-3 rounded-xl border border-border p-3")}>
                  <ImageUploader
                    type="completion"
                    value={completionImages}
                    onChange={setCompletionImages}
                    max={4}
                    label="Photos of completed work (optional)"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => confirmComplete(j)}>
                      {busy ? "Completing..." : "Confirm complete"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setCompletingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
