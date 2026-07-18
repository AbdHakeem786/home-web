import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Phone, Mail, Lock } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { cn } from "../../lib/utils";
import { authApi, ApiError } from "../../api";

export default function Register() {
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register({ name, phone, password, role, email });
      navigate("/check-email", { state: { phone, email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="font-display text-xl font-bold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Join as a customer or as a service provider</p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
        {(["customer", "worker"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-lg py-2 text-sm font-medium capitalize transition-all duration-150",
              role === r ? "bg-card text-primary shadow-card" : "text-ink-muted hover:text-ink"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        {error && (
          <p className="rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>
        )}
        <Input
          id="name"
          label="Full name"
          placeholder="Your full name"
          icon={<User size={16} />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          placeholder="At least 6 characters"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="-mt-2 text-xs text-ink-muted">We'll email you a verification link to activate your account.</p>
        {role === "worker" && (
          <p className="rounded-xl bg-primary-light px-3 py-2.5 text-xs text-primary">
            After signup you'll be asked to select your skills, price, and bio for your worker profile
            — verification badge is granted by the admin afterwards.
          </p>
        )}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Creating account..." : "Continue"}
        </Button>
      </form>

      <div className="mt-5">
        <GoogleSignInButton onError={setError} role={role} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
