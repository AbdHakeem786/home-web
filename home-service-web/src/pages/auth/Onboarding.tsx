import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, MapPinned, Clock3 } from "lucide-react";
import Button from "../../components/ui/Button";

const slides = [
  {
    icon: ShieldCheck,
    title: "Verified professionals only",
    body: "Every worker on the platform is CNIC-checked and background verified before they can accept a job.",
  },
  {
    icon: MapPinned,
    title: "Track them like a ride",
    body: "See your worker's live location and ETA from the moment they accept your booking.",
  },
  {
    icon: Clock3,
    title: "Book now or schedule later",
    body: "Need someone in the next hour, or next week? Both are one tap away.",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = slides[step];
  const Icon = slide.icon;
  const isLast = step === slides.length - 1;

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-10">
      <div className="flex justify-end">
        <button onClick={() => navigate("/login")} className="text-sm font-medium text-ink-muted">
          Skip
        </button>
      </div>

      <div key={step} className="flex flex-col items-center text-center animate-[fadeIn_0.35s_ease]">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-light text-primary shadow-card">
          <Icon size={40} />
        </div>
        <h2 className="mt-8 font-display text-xl font-bold text-ink">{slide.title}</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{slide.body}</p>
      </div>

      <div>
        <div className="mb-6 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        <Button
          fullWidth
          size="lg"
          onClick={() => (isLast ? navigate("/login") : setStep((s) => s + 1))}
        >
          {isLast ? "Get started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
