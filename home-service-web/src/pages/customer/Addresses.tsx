import { useEffect, useState } from "react";
import { MapPin, Check, Trash2, Plus } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { authApi, ApiError, type ApiAddress } from "../../api";
import { cn } from "../../lib/utils";

export default function Addresses() {
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi
      .listAddresses()
      .then((res) => {
        setAddresses(res.addresses);
        setCurrentId(res.currentAddressId);
      })
      .finally(() => setLoading(false));
  }, []);

  async function addAddress() {
    if (!label.trim() || !address.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await authApi.addAddress({ label: label.trim(), address: address.trim() });
      setAddresses(res.addresses);
      setCurrentId(res.currentAddressId);
      setLabel("");
      setAddress("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  async function makeCurrent(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await authApi.setCurrentAddress(id);
      setCurrentId(res.currentAddressId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update address.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeAddress(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await authApi.deleteAddress(id);
      setAddresses(res.addresses);
      setCurrentId(res.currentAddressId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete address.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <TopBar title="Saved addresses" back />
      <div className="p-4">
        {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

        <div className="flex flex-col gap-2.5">
          {addresses.map((a) => {
            const isCurrent = a.id === currentId;
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5",
                  isCurrent ? "border-primary bg-primary-light/40" : "border-border"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                    isCurrent ? "bg-primary text-white" : "bg-surface text-ink-muted"
                  )}
                >
                  <MapPin size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{a.label}</p>
                  <p className="text-xs text-ink-muted">{a.address}</p>
                  {!isCurrent && (
                    <button
                      onClick={() => makeCurrent(a.id)}
                      disabled={busyId === a.id}
                      className="mt-1.5 text-xs font-medium text-primary"
                    >
                      Use this address
                    </button>
                  )}
                  {isCurrent && (
                    <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                      <Check size={12} /> Current location
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeAddress(a.id)}
                  disabled={busyId === a.id}
                  className="text-ink-muted hover:text-danger"
                  aria-label={`Delete ${a.label}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {!loading && addresses.length === 0 && !adding && (
            <p className="py-6 text-center text-sm text-ink-muted">No saved addresses yet.</p>
          )}
        </div>

        {adding ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border p-4">
            <Input
              id="label"
              label="Label"
              placeholder="Home, Work, ..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Input
              id="address"
              label="Address"
              placeholder="House #, street, area, city"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={saving || !label.trim() || !address.trim()} onClick={addAddress}>
                {saving ? "Saving..." : "Save address"}
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" fullWidth icon={<Plus size={16} />} className="mt-4" onClick={() => setAdding(true)}>
            Add new address
          </Button>
        )}
      </div>
    </div>
  );
}
