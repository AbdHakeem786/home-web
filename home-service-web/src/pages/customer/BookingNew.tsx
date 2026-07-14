import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ImageUploader from "../../components/ImageUploader";
import { authApi, workersApi, type ApiWorkerProfile } from "../../api";
import { formatPKR, isAvatarUrl } from "../../lib/utils";
import { resolveUploadUrl } from "../../api/uploads";

export default function BookingNew() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<ApiWorkerProfile | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [problemImages, setProblemImages] = useState<string[]>([]);

  useEffect(() => {
    if (!workerId) return;
    workersApi.getWorker(workerId).then(({ worker }) => setWorker(worker));
  }, [workerId]);

  // Prefill from the customer's saved current address so they don't retype it every time.
  useEffect(() => {
    authApi
      .listAddresses()
      .then(({ addresses, currentAddressId }) => {
        const current = addresses.find((a) => a.id === currentAddressId);
        if (current) setAddress((prev) => prev || current.address);
      })
      .catch(() => undefined);
  }, []);

  if (!worker) {
    return (
      <div>
        <TopBar title="Book service" back />
        <p className="p-6 text-center text-sm text-ink-muted">Loading...</p>
      </div>
    );
  }

  const estimatedPrice = worker.priceFrom + (description.length > 40 ? 300 : 0);
  const avatarUrl = isAvatarUrl(worker.user.avatar) ? resolveUploadUrl(worker.user.avatar) : null;
  const initials = worker.user.name.slice(0, 2).toUpperCase();

  return (
    <div>
      <TopBar title="Book service" back />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/booking/${worker.id}/payment`, {
            state: {
              estimatedPrice,
              date,
              time,
              address,
              description,
              problemImages,
              workerId: worker.id,
              categoryId: (worker.category as any).id ?? (worker.category as any)._id,
            },
          });
        }}
        className="flex flex-col gap-4 p-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light font-display text-sm font-semibold text-primary">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{worker.user.name}</p>
            <p className="text-xs text-ink-muted capitalize">{worker.category.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="date"
            label="Date"
            type="date"
            icon={<Calendar size={16} />}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            id="time"
            label="Time"
            type="time"
            icon={<Clock size={16} />}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <Input
          id="address"
          label="Service address"
          placeholder="House #, street, area, city"
          icon={<MapPin size={16} />}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          minLength={3}
          required
        />

        <label htmlFor="description" className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Problem description</span>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the issue so the worker comes prepared..."
            className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <ImageUploader
          type="booking"
          value={problemImages}
          onChange={setProblemImages}
          max={4}
          label="Photos of the issue (optional)"
        />

        <div className="mt-1 flex items-center justify-between rounded-xl bg-primary-light px-3.5 py-3">
          <span className="text-sm text-primary">Estimated price</span>
          <span className="font-mono text-base font-semibold text-primary">{formatPKR(estimatedPrice)}</span>
        </div>

        <Button type="submit" size="lg" fullWidth>
          Continue to payment
        </Button>
      </form>
    </div>
  );
}
