import { useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { adminApi, ApiError, type ApiWalletTransaction } from "../../api";
import { formatPKR } from "../../lib/utils";

const tone: Record<ApiWalletTransaction["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  completed: "success",
  rejected: "danger",
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<ApiWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function reload() {
    adminApi
      .listWithdrawals({ limit: 50 })
      .then(({ withdrawals }) => setWithdrawals(withdrawals))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function process(id: string, action: "complete" | "reject") {
    setBusyId(id);
    setError("");
    try {
      const updated = await adminApi.processWithdrawal(id, action);
      setWithdrawals((ws) => ws.map((w) => (w.id === id ? updated : w)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not process withdrawal.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Withdrawals</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-2.5">
        {withdrawals.map((w) => (
          <div key={w.id} className="rounded-2xl border border-border bg-white p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{w.worker?.user?.name ?? "Worker"}</p>
              <Badge tone={tone[w.status]}>{w.status}</Badge>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold text-ink">{formatPKR(w.amount)}</p>
            <p className="mt-0.5 text-xs text-ink-muted">To: {w.accountDetails ?? "-"}</p>
            <p className="text-xs text-ink-muted">{new Date(w.createdAt).toLocaleString()}</p>
            {w.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={busyId === w.id} onClick={() => process(w.id, "complete")}>
                  Mark paid
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busyId === w.id}
                  onClick={() => process(w.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
        {!loading && withdrawals.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No withdrawal requests yet.</p>
        )}
      </div>
    </div>
  );
}
