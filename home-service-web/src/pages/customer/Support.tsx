import { useEffect, useState } from "react";
import { ChevronDown, LifeBuoy, MessageCircleQuestion, Send } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { complaintsApi, ApiError, type ApiComplaint } from "../../api";
import { cn } from "../../lib/utils";

const FAQS = [
  {
    q: "How do I book a verified worker?",
    a: "Pick a category from Home, choose a worker, and tap Book now. Fill in the date, time, address, and a short description of the job.",
  },
  {
    q: "How is the final price decided?",
    a: "You'll see an estimated price at booking. The worker confirms the final price after inspecting the job, and you're only charged that amount.",
  },
  {
    q: "Can I cancel or reschedule a booking?",
    a: "Yes, from Booking history. Rescheduling is free before the worker sets off. Cancelling after the worker is already on the way may include a small cancellation fee if paid by card.",
  },
  {
    q: "What is the wallet and how do I use it?",
    a: "Your wallet holds credits from refunds or support. Any balance is applied automatically at checkout on your next booking.",
  },
  {
    q: "How do refunds work?",
    a: "Card refunds return to your original payment method within a few business days. Wallet credit used on a booking is refunded to your wallet immediately if the booking is cancelled.",
  },
];

const statusTone: Record<ApiComplaint["status"], "warning" | "primary" | "success" | "danger"> = {
  open: "warning",
  in_review: "primary",
  resolved: "success",
  rejected: "danger",
};

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<ApiComplaint[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function loadTickets() {
    complaintsApi
      .listMyComplaints()
      .then(setTickets)
      .finally(() => setLoadingTickets(false));
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function submitTicket() {
    if (subject.trim().length < 3 || description.trim().length < 5) return;
    setSubmitting(true);
    setError("");
    try {
      await complaintsApi.createComplaint({ subject: subject.trim(), description: description.trim() });
      setSubject("");
      setDescription("");
      setSent(true);
      loadTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Help & support" back />
      <div className="p-4">
        <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
          <MessageCircleQuestion size={16} className="text-primary" /> Frequently asked
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card shadow-card">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className={cn(i !== 0 && "border-t border-border")}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-medium text-ink">{f.q}</span>
                  <ChevronDown
                    size={16}
                    className={cn("flex-shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && <p className="px-4 pb-3.5 text-sm leading-relaxed text-ink-muted">{f.a}</p>}
              </div>
            );
          })}
        </div>

        <h2 className="mb-2 mt-6 flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
          <LifeBuoy size={16} className="text-primary" /> Contact support
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          {sent && (
            <p className="rounded-xl bg-success-light px-3 py-2.5 text-sm text-success">
              Message sent! Our team will get back to you soon.
            </p>
          )}
          {error && <p className="rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
          <Input
            id="support-subject"
            label="Subject"
            placeholder="e.g. Payment not reflecting"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label htmlFor="support-description" className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Message</span>
            <textarea
              id="support-description"
              rows={4}
              placeholder="Describe your issue in detail..."
              className="w-full rounded-xl border border-border bg-card p-3 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <Button
            icon={<Send size={16} />}
            disabled={submitting || subject.trim().length < 3 || description.trim().length < 5}
            onClick={submitTicket}
          >
            {submitting ? "Sending..." : "Send message"}
          </Button>
        </div>

        {(loadingTickets || tickets.length > 0) && (
          <>
            <h2 className="mb-2 mt-6 font-display text-sm font-semibold text-ink">Your requests</h2>
            <div className="flex flex-col gap-2.5">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{t.subject}</p>
                    <Badge tone={statusTone[t.status]}>{t.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{t.description}</p>
                  {t.adminNote && (
                    <p className="mt-2 rounded-lg bg-primary-light px-2.5 py-2 text-xs text-primary">
                      Support: {t.adminNote}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-ink-muted">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
