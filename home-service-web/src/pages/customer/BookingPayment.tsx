import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Banknote, CreditCard, Check, Tag, X } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import TopBar from "../../components/ui/TopBar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { cn, formatPKR } from "../../lib/utils";
import { stripePromise } from "../../lib/stripe";
import { bookingsApi, couponsApi, ApiError, type ApiCouponPreview } from "../../api";

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
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<ApiCouponPreview | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const price = state?.estimatedPrice ?? 0;
  const discount = coupon?.discount ?? 0;
  const payableTotal = Math.max(0, price - discount);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const preview = await couponsApi.validateCoupon(code, price);
      setCoupon(preview);
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof ApiError ? err.message : "Could not apply this code.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

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
        couponCode: coupon?.code,
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
        couponCode: coupon?.code,
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
          {discount > 0 ? (
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-2xl font-bold text-ink">{formatPKR(payableTotal)}</p>
              <p className="font-mono text-sm text-ink-muted line-through">{formatPKR(price)}</p>
            </div>
          ) : (
            <p className="font-mono text-2xl font-bold text-ink">{formatPKR(price)}</p>
          )}
          {coupon && <p className="mt-1 text-xs font-medium text-success">You saved {formatPKR(discount)} with {coupon.code}</p>}
          <p className="mt-1 text-xs text-ink-muted">
            Final amount confirmed by the worker after inspecting the job.
          </p>
        </div>

        {!stripeBooking && (
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-light px-3.5 py-3">
                <Tag size={16} className="text-success" />
                <span className="flex-1 text-sm font-medium text-success">{coupon.code} applied</span>
                <button type="button" onClick={removeCoupon} aria-label="Remove promo code" className="text-success">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    id="couponCode"
                    placeholder="Promo code"
                    icon={<Tag size={16} />}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    error={couponError}
                  />
                </div>
                <Button variant="outline" disabled={applyingCoupon || !couponInput.trim()} onClick={applyCoupon}>
                  {applyingCoupon ? "..." : "Apply"}
                </Button>
              </div>
            )}
          </div>
        )}

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
