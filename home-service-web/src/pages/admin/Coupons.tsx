import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { couponsApi, ApiError, type ApiCoupon } from "../../api";
import { formatPKR } from "../../lib/utils";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [minBookingAmount, setMinBookingAmount] = useState("");
  const [creating, setCreating] = useState(false);

  function reload() {
    couponsApi
      .listCoupons({ limit: 50 })
      .then(({ coupons }) => setCoupons(coupons))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function addCoupon() {
    if (!code.trim() || !value) return;
    setCreating(true);
    setError("");
    try {
      const created = await couponsApi.createCoupon({
        code: code.trim(),
        type,
        value: Number(value),
        minBookingAmount: minBookingAmount ? Number(minBookingAmount) : undefined,
      });
      setCoupons((cs) => [created, ...cs]);
      setCode("");
      setValue("");
      setMinBookingAmount("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create coupon.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(coupon: ApiCoupon) {
    setBusyId(coupon.id);
    setError("");
    try {
      const updated = await couponsApi.setCouponActive(coupon.id, !coupon.active);
      setCoupons((cs) => cs.map((c) => (c.id === coupon.id ? updated : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update coupon.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeCoupon(id: string) {
    setBusyId(id);
    setError("");
    try {
      await couponsApi.deleteCoupon(id);
      setCoupons((cs) => cs.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete coupon.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">Promo codes</h1>

      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex-1 sm:min-w-[140px]">
          <Input id="code" label="Code" placeholder="WEEKEND15" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <label className="block sm:w-32">
          <span className="mb-1.5 block text-sm font-medium text-ink">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "flat")}
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="percent">Percent off</option>
            <option value="flat">Flat (Rs)</option>
          </select>
        </label>
        <div className="sm:w-28">
          <Input id="value" label={type === "percent" ? "Percent" : "Rs"} type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="sm:w-36">
          <Input
            id="minAmount"
            label="Min. order (Rs)"
            type="number"
            min={0}
            placeholder="0"
            value={minBookingAmount}
            onChange={(e) => setMinBookingAmount(e.target.value)}
          />
        </div>
        <Button icon={<Plus size={16} />} disabled={creating || !code.trim() || !value} onClick={addCoupon}>
          {creating ? "Adding..." : "Add"}
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Tag size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-sm font-semibold text-ink">{c.code}</p>
                <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "Active" : "Disabled"}</Badge>
              </div>
              <p className="text-xs text-ink-muted">
                {c.type === "percent" ? `${c.value}% off` : `${formatPKR(c.value)} off`}
                {c.minBookingAmount > 0 ? ` · min. ${formatPKR(c.minBookingAmount)}` : ""}
                {" · used "}
                {c.usedCount}
                {c.maxUses ? `/${c.maxUses}` : ""}
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => toggleActive(c)}>
              {c.active ? "Disable" : "Enable"}
            </Button>
            <button
              onClick={() => removeCoupon(c.id)}
              disabled={busyId === c.id}
              className="text-ink-muted hover:text-danger"
              aria-label={`Delete ${c.code}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {!loading && coupons.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No promo codes yet.</p>
        )}
      </div>
    </div>
  );
}
