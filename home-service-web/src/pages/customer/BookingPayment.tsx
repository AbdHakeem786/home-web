import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Banknote, CreditCard, Check } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import TopBar from "../../components/ui/TopBar";
import Button from "../../components/ui/Button";
import { cn, formatPKR } from "../../lib/utils";
import { stripePromise } from "../../lib/stripe";
import { bookingsApi, ApiError } from "../../api";

const methods = [
  { id: "cash", label: "Cash on completion", icon: Banknote },
  { id: "stripe", label: "Card (Stripe)", icon: CreditCard },
];

interface BookingDraft {
  estimatedPrice: number;
  date: string;
  time: string;
  address: string;
  description: string;
  problemImages?: string[];
  workerId: string;
  categoryId: string;
}

function CardPaymentForm({
  clientSecret,
  workerId,
  bookingId,
}: {
  clientSecret: string;
  workerId: string;
  bookingId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setPaying(true);
    setError("");
    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }
    navigate(`/booking/${workerId}/track`, { state: { bookingId } });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {error && <p className="rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}
      <div className="rounded-xl border border-border p-3.5">
        <CardElement options={{ style: { base: { fontSize: "15px" } } }} />
      </div>
      <Button size="lg" fullWidth disabled={!stripe || paying} onClick={handlePay}>
        {paying ? "Processing..." : "Pay & confirm booking"}
      </Button>
    </div>
  );
}

export default function BookingPayment() {
  const { state } = useLocation() as { state?: BookingDraft };
  const navigate = useNavigate();
  const [method, setMethod] = useState<"cash" | "stripe">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stripeBooking, setStripeBooking] = useState<{ id: string; clientSecret: string } | null>(null);
  const price = state?.estimatedPrice ?? 0;

  async function handleConfirmCash() {
    if (!state) {
      setError("Missing booking details. Please start over.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const booking = await bookingsApi.createBooking({
        workerId: state.workerId,
        categoryId: state.categoryId,
        date: state.date,
        time: state.time,
        address: state.address,
        description: state.description,
        estimatedPrice: state.estimatedPrice,
        problemImages: state.problemImages,
        paymentMethod: "cash",
      });
      navigate(`/booking/${state.workerId}/track`, { state: { bookingId: booking.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCardPayment() {
    if (!state) {
      setError("Missing booking details. Please start over.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const booking = await bookingsApi.createBooking({
        workerId: state.workerId,
        categoryId: state.categoryId,
        date: state.date,
        time: state.time,
        address: state.address,
        description: state.description,
        estimatedPrice: state.estimatedPrice,
        problemImages: state.problemImages,
        paymentMethod: "stripe",
      });
      const { clientSecret } = await bookingsApi.createPaymentIntent(booking.id);
      setStripeBooking({ id: booking.id, clientSecret });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start card payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <TopBar title="Payment" back />

      <div className="p-4">
        {error && (
          <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>
        )}

        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-ink-muted">Estimated total</p>
          <p className="font-mono text-2xl font-bold text-ink">{formatPKR(price)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Final amount confirmed by the worker after inspecting the job.
          </p>
        </div>

        {!stripeBooking && (
          <>
            <h3 className="mb-2 mt-6 font-display text-sm font-semibold text-ink">Choose payment method</h3>
            <div className="flex flex-col gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as "cash" | "stripe")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      active ? "border-primary bg-primary-light/50" : "border-border"
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-primary text-white" : "bg-surface text-ink-muted")}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{m.label}</span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              fullWidth
              className="mt-6"
              disabled={loading}
              onClick={method === "cash" ? handleConfirmCash : handleStartCardPayment}
            >
              {loading ? "Please wait..." : method === "cash" ? "Confirm booking" : "Continue to card details"}
            </Button>
          </>
        )}

        {stripeBooking && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret: stripeBooking.clientSecret }}>
            <CardPaymentForm
              clientSecret={stripeBooking.clientSecret}
              workerId={state!.workerId}
              bookingId={stripeBooking.id}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
