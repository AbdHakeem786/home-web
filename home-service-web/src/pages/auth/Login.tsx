import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Lock, Wrench } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { useAppStore } from "../../store/appStore";
import { authApi, ApiError } from "../../api";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.login({ phone, password });
      if ("requiresOtp" in result && result.requiresOtp) {
        navigate("/verify-otp", { state: { phone, purpose: "login" } });
        return;
      }
      if (result.user && result.accessToken && result.refreshToken) {
        setSession(result.user, result.accessToken, result.refreshToken);
        const dest =
          result.user.role === "worker"
            ? "/worker/dashboard"
            : result.user.role === "admin"
              ? "/admin/dashboard"
              : "/home";
        navigate(dest);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-button">
          <Wrench size={24} />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Log in to book a verified worker</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>
        )}
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
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="mt-5">
        <GoogleSignInButton onError={setError} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link to="/register" className="font-medium text-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
