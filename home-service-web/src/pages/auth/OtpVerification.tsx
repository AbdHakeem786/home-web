import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAppStore } from "../../store/appStore";
import { authApi, ApiError } from "../../api";
import type { OtpPurpose } from "../../api/auth";

export default function OtpVerification() {
  const { state } = useLocation() as { state?: { phone: string; purpose: OtpPurpose } };
  const phone = state?.phone ?? "";
  const purpose = state?.purpose ?? "register";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  async function handleSubmit() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authApi.verifyOtp({ phone, code, purpose });
      if (purpose === "forgot_password") {
        navigate("/forgot-password", { state: { phone, code, verified: true } });
        return;
      }
      const data = result as { user?: any; accessToken?: string; refreshToken?: string };
      if (data.user && data.accessToken && data.refreshToken) {
        setSession(data.user, data.accessToken, data.refreshToken);
        const dest =
          data.user.role === "worker"
            ? "/worker/dashboard"
            : data.user.role === "admin"
              ? "/admin/dashboard"
              : "/home";
        navigate(dest);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await authApi.resendOtp({ phone, purpose });
      setSeconds(30);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="font-display text-xl font-bold text-ink">Verify your number</h1>
      <p className="mt-1 text-sm text-ink-muted">
        We've sent a 6-digit code to {phone || "your phone"}. Enter it below to continue.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>
      )}

      <div className="mt-8 flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            maxLength={1}
            inputMode="numeric"
            className="h-12 w-11 rounded-xl border border-border text-center font-display text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        ))}
      </div>

      <button
        onClick={handleResend}
        disabled={seconds > 0 || resending}
        className="mt-5 text-center text-sm font-medium text-primary disabled:text-ink-muted"
      >
        {seconds > 0 ? `Resend code in 00:${String(seconds).padStart(2, "0")}` : resending ? "Sending..." : "Resend code"}
      </button>

      <Button size="lg" fullWidth className="mt-8" onClick={handleSubmit} disabled={loading}>
        {loading ? "Verifying..." : "Verify & continue"}
      </Button>
    </div>
  );
}
