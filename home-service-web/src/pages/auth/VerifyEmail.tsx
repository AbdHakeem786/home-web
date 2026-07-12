import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { authApi, ApiError } from "../../api";
import { useAppStore } from "../../store/appStore";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }
    authApi
      .verifyEmail(token)
      .then((data) => {
        setSession(data.user, data.accessToken, data.refreshToken);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Could not verify your email.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function goToApp() {
    const role = useAppStore.getState().user?.role;
    navigate(role === "worker" ? "/worker/dashboard" : role === "admin" ? "/admin/dashboard" : "/home");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
      {status === "verifying" && (
        <>
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="mt-4 text-sm text-ink-muted">Verifying your account...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light text-success">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Account verified</h1>
          <p className="mt-2 text-sm text-ink-muted">Your email is confirmed and you're now logged in.</p>
          <Button size="lg" fullWidth className="mt-8" onClick={goToApp}>
            Continue
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light text-danger">
            <XCircle size={26} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Verification failed</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <Button size="lg" fullWidth className="mt-8" onClick={() => navigate("/login")}>
            Back to login
          </Button>
        </>
      )}
    </div>
  );
}
