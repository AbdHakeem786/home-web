import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, KeyRound, Lock } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { authApi, ApiError } from "../../api";

export default function ForgotPassword() {
  const { state } = useLocation() as { state?: { phone?: string } };
  const [phone, setPhone] = useState(state?.phone ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(phone);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ phone, code, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="font-display text-xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your registered phone number and we'll send you a reset code.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>
      )}

      {done ? (
        <div className="mt-6 flex flex-col gap-4">
          <p className="rounded-xl bg-success-light px-3 py-2.5 text-sm text-success">
            Password reset successful. You can now log in.
          </p>
          <Button size="lg" fullWidth onClick={() => navigate("/login")}>
            Go to login
          </Button>
        </div>
      ) : !sent ? (
        <form onSubmit={handleSend} className="mt-6 flex flex-col gap-4">
          <Input
            id="phone"
            label="Phone number"
            type="tel"
            placeholder="+923XXXXXXXXX"
            icon={<Phone size={16} />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-6 flex flex-col gap-4">
          <p className="rounded-xl bg-success-light px-3 py-2.5 text-sm text-success">
            Reset code sent. Check your SMS inbox.
          </p>
          <Input
            id="code"
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            icon={<KeyRound size={16} />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            id="newPassword"
            label="New password"
            type="password"
            placeholder="At least 6 characters"
            icon={<Lock size={16} />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      )}
    </div>
  );
}
