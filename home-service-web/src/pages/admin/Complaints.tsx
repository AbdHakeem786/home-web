import { useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { complaintsApi, ApiError, type ApiComplaint } from "../../api";

const tone: Record<ApiComplaint["status"], "danger" | "warning" | "success" | "neutral"> = {
  open: "danger",
  in_review: "warning",
  resolved: "success",
  rejected: "neutral",
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function reload() {
    complaintsApi
      .listAllComplaints({ limit: 50 })
      .then(({ complaints }) => setComplaints(complaints))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function setStatus(id: string, status: ApiComplaint["status"]) {
    setBusyId(id);
    setError("");
    try {
      const updated = await complaintsApi.updateComplaint(id, { status });
      setComplaints((cs) => cs.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update complaint.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Complaints</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-2.5">
        {complaints.map((c) => {
          const from = c.raisedBy && typeof c.raisedBy === "object" ? c.raisedBy.name : "User";
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{from} — {c.subject}</p>
                <Badge tone={tone[c.status]}>{c.status.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
              {c.status === "open" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" disabled={busyId === c.id} onClick={() => setStatus(c.id, "in_review")}>
                    Start review
                  </Button>
                  <Button size="sm" variant="danger" disabled={busyId === c.id} onClick={() => setStatus(c.id, "rejected")}>
                    Reject
                  </Button>
                </div>
              )}
              {c.status === "in_review" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" disabled={busyId === c.id} onClick={() => setStatus(c.id, "resolved")}>
                    Mark resolved
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {!loading && complaints.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No complaints yet.</p>
        )}
      </div>
    </div>
  );
}
