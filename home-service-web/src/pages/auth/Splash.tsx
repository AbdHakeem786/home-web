import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate("/onboarding"), 1400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-primary to-primary-dark text-white">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
        <Wrench size={32} />
        <span className="pulse-ring absolute inset-0 rounded-3xl border-2 border-white/40" />
      </div>
      <h1 className="relative mt-5 font-display text-2xl font-bold tracking-tight">RestMenu Home</h1>
      <p className="relative mt-1 text-sm text-white/70">Verified help, at your door</p>
    </div>
  );
}
