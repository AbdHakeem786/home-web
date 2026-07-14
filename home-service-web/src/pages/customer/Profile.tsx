import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, MapPin, Heart, Clock, CreditCard, LogOut, ChevronRight, Camera, Loader2, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { authApi, uploadsApi, resolveUploadUrl, ApiError } from "../../api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ThemeToggle from "../../components/ui/ThemeToggle";

const items = [
  { icon: Heart, label: "Saved workers", to: "/favorites" },
  { icon: MapPin, label: "Saved addresses", to: "/addresses" },
  { icon: Clock, label: "Booking history", to: "/bookings" },
  { icon: CreditCard, label: "Payment methods", to: "#" },
];

export default function Profile() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const displayName = user?.name ?? "there";

  async function handleAvatarChange(file: File) {
    setAvatarUploading(true);
    setError("");
    try {
      const { url } = await uploadsApi.uploadFile("avatar", file);
      const updated = await authApi.updateProfile({ avatar: url });
      setUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update photo.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const updated = await authApi.updateProfile({ name, email: email || undefined });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAccount() {
    setSaving(true);
    setError("");
    try {
      await authApi.deleteProfile();
      logout();
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not deactivate account.");
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 py-2">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-light font-display text-xl font-semibold text-primary">
            {user?.avatar ? (
              <img src={resolveUploadUrl(user.avatar)} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow"
            aria-label="Change photo"
          >
            {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarChange(file);
              e.target.value = "";
            }}
          />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink">{displayName}</p>
          <p className="text-sm text-ink-muted">{user?.phone ?? ""}</p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border p-4">
          <Input id="name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={saving} onClick={saveProfile}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3.5"
        >
          <User size={18} className="text-ink-muted" />
          <span className="flex-1 text-left text-sm text-ink">Edit profile</span>
          <ChevronRight size={16} className="text-ink-muted" />
        </button>
      )}

      <div className="mt-3 flex flex-col divide-y divide-border rounded-2xl border border-border">
        {items.map(({ icon: Icon, label, to }) => (
          <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5">
            <Icon size={18} className="text-ink-muted" />
            <span className="flex-1 text-sm text-ink">{label}</span>
            <ChevronRight size={16} className="text-ink-muted" />
          </Link>
        ))}
      </div>

      <ThemeToggle className="mt-3 w-full justify-center" />

      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light px-4 py-3.5 text-sm font-medium text-danger"
      >
        <LogOut size={18} />
        Log out
      </button>

      {confirmDelete ? (
        <div className="mt-3 rounded-2xl border border-danger/20 p-4">
          <p className="text-sm text-ink">Deactivate your account? You can contact support to reactivate it later.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="danger" disabled={saving} onClick={deactivateAccount}>
              {saving ? "Deactivating..." : "Yes, deactivate"}
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-medium text-ink-muted"
        >
          <Trash2 size={14} />
          Deactivate account
        </button>
      )}
    </div>
  );
}
