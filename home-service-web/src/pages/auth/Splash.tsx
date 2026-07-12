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
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-white">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
        <Wrench size={32} />
        <span className="pulse-ring absolute inset-0 rounded-3xl border-2 border-white/40" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold">RestMenu Home</h1>
      <p className="mt-1 text-sm text-white/70">Verified help, at your door</p>
    </div>
  );
}
