import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2, Clock3, Wallet } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { cn, formatPKR } from "../../lib/utils";
import { workersApi, bookingsApi, walletApi, categoriesApi, ApiError, type ApiWorkerProfile, type ApiBooking, type ApiCategory } from "../../api";
import { useAppStore } from "../../store/appStore";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ImageUploader from "../../components/ImageUploader";

export default function WorkerDashboard() {
  const user = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<ApiWorkerProfile | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [weekIncome, setWeekIncome] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  function reload() {
    Promise.all([
      workersApi.getMyWorkerProfile().catch(() => null),
      bookingsApi.listMyBookings(),
      walletApi.getWalletSummary().catch(() => null),
    ]).then(([p, b, w]) => {
      setProfile(p);
      setBookings(b.bookings);
      if (w) setWeekIncome(w.totalEarned);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  async function toggleOnline() {
    if (!profile) return;
    setToggling(true);
    setError("");
    try {
      const updated = await workersApi.updateMyWorkerProfile({ online: !profile.online });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    } finally {
      setToggling(false);
    }
  }

  const todayJobs = bookings.filter((j) => j.status !== "completed" && j.status !== "cancelled");
  const pendingCount = bookings.filter((j) => j.status === "pending").length;
  const completedCount = bookings.filter((j) => j.status === "completed").length;

  if (!profile) {
    return <WorkerOnboardingForm onDone={reload} />;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">Welcome back, {user?.name ?? "there"}</p>
        </div>
        <button
          onClick={toggleOnline}
          disabled={toggling}
          className={cn(
            "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
            profile.online ? "bg-success-light text-success" : "bg-surface text-ink-muted"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", profile.online ? "bg-success" : "bg-ink-muted")} />
          {profile.online ? "Online" : "Offline"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <Briefcase size={18} className="text-primary" />
          <p className="mt-2 font-display text-xl font-bold text-ink">{todayJobs.length}</p>
          <p className="text-xs text-ink-muted">Active jobs</p>
        </Card>
        <Card>
          <Clock3 size={18} className="text-warning" />
          <p className="mt-2 font-display text-xl font-bold text-ink">{pendingCount}</p>
          <p className="text-xs text-ink-muted">Pending</p>
        </Card>
        <Card>
          <CheckCircle2 size={18} className="text-success" />
          <p className="mt-2 font-display text-xl font-bold text-ink">{completedCount}</p>
          <p className="text-xs text-ink-muted">Completed</p>
        </Card>
        <Card>
          <Wallet size={18} className="text-primary" />
          <p className="mt-2 font-mono text-xl font-bold text-ink">{formatPKR(weekIncome)}</p>
          <p className="text-xs text-ink-muted">Total earned</p>
        </Card>
      </div>

      <h2 className="mb-2 mt-6 font-display text-sm font-semibold text-ink">Active jobs</h2>
      <div className="flex flex-col gap-2.5">
        {todayJobs.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">No active jobs right now.</p>
        )}
        {todayJobs.map((j) => {
          const customerName = j.customer && typeof j.customer === "object" ? j.customer.name : "Customer";
          const categoryName = j.category && typeof j.category === "object" ? j.category.name : "";
          return (
            <Card key={j.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{customerName}</p>
                <p className="text-xs text-ink-muted">{categoryName} · {j.address}</p>
                <p className="mt-1 text-xs text-ink-muted">{j.date} · {j.time}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-ink">{formatPKR(j.estimatedPrice)}</p>
                <Badge tone={j.status === "pending" ? "warning" : "primary"} className="mt-1">
                  {j.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WorkerOnboardingForm({ onDone }: { onDone: () => void }) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [bio, setBio] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [cnicImage, setCnicImage] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Please choose a service category.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await workersApi.createMyWorkerProfile({
        category: categoryId,
        bio,
        priceFrom: Number(priceFrom) || 0,
        experienceYears: Number(experienceYears) || 0,
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cnicImage: cnicImage[0],
        documents,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">Complete your profile</h1>
      <p className="mb-5 text-sm text-ink-muted">
        Set up your worker profile so customers can find and book you.
      </p>

      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Service category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <Input
          id="priceFrom"
          label="Starting price (PKR)"
          type="number"
          min={0}
          value={priceFrom}
          onChange={(e) => setPriceFrom(e.target.value)}
          required
        />
        <Input
          id="experienceYears"
          label="Years of experience"
          type="number"
          min={0}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
        />
        <label htmlFor="bio" className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Short bio</span>
          <textarea
            id="bio"
            rows={3}
            placeholder="Tell customers about your skills and experience..."
            className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>

        <Input
          id="skills"
          label="Skills (comma separated)"
          placeholder="Pipe fitting, leak repair, bathroom fixtures"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
        />

        <ImageUploader type="cnic" value={cnicImage} onChange={setCnicImage} max={1} label="CNIC photo (for verification)" />
        <ImageUploader type="document" value={documents} onChange={setDocuments} max={5} label="Certificates / documents (optional)" />

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Saving..." : "Create worker profile"}
        </Button>
      </form>
    </div>
  );
}
