import { useEffect, useState } from "react";
import { BadgeCheck, Check, FileText, ChevronUp } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { adminApi, ApiError, type ApiWorkerProfile } from "../../api";
import { isAvatarUrl } from "../../lib/utils";
import { resolveUploadUrl } from "../../api/uploads";

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<ApiWorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function reload() {
    adminApi
      .listWorkersAdmin({ limit: 50 })
      .then(({ workers }) => setWorkers(workers))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setError("");
    try {
      await adminApi.verifyWorker(id);
      setWorkers((ws) => ws.map((w) => (w.id === id ? { ...w, verified: true } : w)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not approve worker.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Workers</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-2.5">
        {workers.filter((w) => w.user != null).map((w) => {
          const avatarUrl = isAvatarUrl(w.user.avatar) ? resolveUploadUrl(w.user.avatar) : null;
          const initials = w.user.name.slice(0, 2).toUpperCase();
          const hasDocs = Boolean(w.cnicImage) || (w.documents?.length ?? 0) > 0;
          const expanded = expandedId === w.id;
          return (
            <div key={w.id} className="rounded-2xl border border-border bg-card p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light font-display text-sm font-semibold text-primary">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-ink">{w.user.name}</p>
                      {w.verified && <BadgeCheck size={14} className="text-primary" />}
                    </div>
                    <p className="text-xs text-ink-muted capitalize">{w.category.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.verified ? "success" : "warning"}>
                    {w.verified ? "Verified" : "Pending review"}
                  </Badge>
                  {hasDocs && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={expanded ? <ChevronUp size={13} /> : <FileText size={13} />}
                      onClick={() => setExpandedId(expanded ? null : w.id)}
                    >
                      Documents
                    </Button>
                  )}
                  {!w.verified && (
                    <Button size="sm" icon={<Check size={13} />} disabled={busyId === w.id} onClick={() => approve(w.id)}>
                      Approve
                    </Button>
                  )}
                </div>
              </div>
              {expanded && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {w.cnicImage && (
                    <a href={resolveUploadUrl(w.cnicImage)} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={resolveUploadUrl(w.cnicImage)}
                        alt="CNIC"
                        className="h-24 w-36 rounded-lg border border-border object-cover"
                      />
                      <p className="mt-1 text-center text-[11px] text-ink-muted">CNIC</p>
                    </a>
                  )}
                  {w.documents?.map((doc, i) => (
                    <a key={doc} href={resolveUploadUrl(doc)} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={resolveUploadUrl(doc)}
                        alt={`Document ${i + 1}`}
                        className="h-24 w-36 rounded-lg border border-border object-cover"
                      />
                      <p className="mt-1 text-center text-[11px] text-ink-muted">Doc {i + 1}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && workers.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No workers yet.</p>
        )}
      </div>
    </div>
  );
}
