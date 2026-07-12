import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import Button from "../../components/ui/Button";
import { authApi, ApiError } from "../../api";

export default function CheckEmail() {
  const { state } = useLocation() as { state?: { phone?: string; email?: string } };
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResend() {
    if (!state?.phone) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.resendVerificationEmail(state.phone);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend the link.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <MailCheck size={26} />
      </div>
      <h1 className="mt-4 font-display text-xl font-bold text-ink">Check your email</h1>
      <p className="mt-2 text-sm text-ink-muted">
        We've sent a verification link to{" "}
        <span className="font-medium text-ink">{state?.email ?? "your email"}</span>. Click it to activate your
        account.
      </p>

      {message && <p className="mt-4 rounded-xl bg-success-light px-3 py-2.5 text-sm text-success">{message}</p>}
      {error && <p className="mt-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <button
        onClick={handleResend}
        disabled={resending || !state?.phone}
        className="mt-6 text-sm font-medium text-primary disabled:text-ink-muted"
      >
        {resending ? "Sending..." : "Resend verification email"}
      </button>

      <Button size="lg" fullWidth className="mt-8" onClick={() => navigate("/login")}>
        Back to login
      </Button>
    </div>
  );
}
