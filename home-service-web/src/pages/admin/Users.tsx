import { Fragment, useEffect, useState } from "react";
import { adminApi, ApiError, type ApiUser } from "../../api";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function AdminUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [creditingId, setCreditingId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditLabel, setCreditLabel] = useState("");
  const [crediting, setCrediting] = useState(false);
  const [creditError, setCreditError] = useState("");

  useEffect(() => {
    adminApi
      .listUsers({ limit: 50 })
      .then(({ users }) => setUsers(users))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(u: ApiUser) {
    setBusyId(u.id);
    setError("");
    try {
      const updated = await adminApi.setUserActive(u.id, !u.active);
      setUsers((us) => us.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update user status.");
    } finally {
      setBusyId(null);
    }
  }

  function openCredit(u: ApiUser) {
    setCreditingId(u.id);
    setCreditAmount("");
    setCreditLabel("");
    setCreditError("");
  }

  async function submitCredit(id: string) {
    const amount = Number(creditAmount);
    if (!amount || amount <= 0) return;
    setCrediting(true);
    setCreditError("");
    try {
      await adminApi.creditCustomerWallet(id, amount, creditLabel.trim() || undefined);
      setCreditingId(null);
    } catch (err) {
      setCreditError(err instanceof ApiError ? err.message : "Could not credit wallet.");
    } finally {
      setCrediting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Users</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr>
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{u.phone}</td>
                  <td className="px-4 py-3 capitalize text-ink-muted">{u.role}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "success" : "danger"}>{u.active ? "Active" : "Suspended"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.role === "customer" && (
                        <Button size="sm" variant="outline" onClick={() => openCredit(u)}>
                          Credit wallet
                        </Button>
                      )}
                      {u.role !== "admin" && (
                        <Button
                          size="sm"
                          variant={u.active ? "danger" : "outline"}
                          disabled={busyId === u.id}
                          onClick={() => toggleActive(u)}
                        >
                          {u.active ? "Suspend" : "Reactivate"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {creditingId === u.id && (
                  <tr>
                    <td colSpan={6} className="bg-surface-alt px-4 py-3.5">
                      {creditError && <p className="mb-2 text-xs text-danger">{creditError}</p>}
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="w-32">
                          <Input
                            id={`credit-amount-${u.id}`}
                            label="Amount (Rs)"
                            type="number"
                            min={1}
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                          />
                        </div>
                        <div className="min-w-40 flex-1">
                          <Input
                            id={`credit-label-${u.id}`}
                            label="Reason (optional)"
                            placeholder="e.g. Goodwill credit"
                            value={creditLabel}
                            onChange={(e) => setCreditLabel(e.target.value)}
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={crediting || !Number(creditAmount)}
                          onClick={() => submitCredit(u.id)}
                        >
                          {crediting ? "Crediting..." : "Confirm"}
                        </Button>
                        <Button size="sm" variant="outline" disabled={crediting} onClick={() => setCreditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No users yet.</p>
        )}
      </div>
    </div>
  );
}
