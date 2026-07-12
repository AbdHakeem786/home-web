import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, ApiError } from "../api";
import { useAppStore } from "../store/appStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Google's identity script is a page-level singleton: calling `initialize()`
// more than once (e.g. once per mounted <GoogleSignInButton>, such as on both
// Login and Register) logs a "multiple instances" warning. Initialize it once
// and redirect its callback to whichever instance is currently mounted.
let googleInitialized = false;
let activeCredentialHandler: ((response: { credential: string }) => void) | null = null;

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const setSession = useAppStore((s) => s.setSession);
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    let attempts = 0;

    async function handleCredential(response: { credential: string }) {
      try {
        const data = await authApi.googleLogin(response.credential);
        setSession(data.user, data.accessToken, data.refreshToken);
        const dest =
          data.user.role === "worker"
            ? "/worker/dashboard"
            : data.user.role === "admin"
              ? "/admin/dashboard"
              : "/home";
        navigate(dest);
      } catch (err) {
        onError?.(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
      }
    }

    activeCredentialHandler = handleCredential;

    function tryInit() {
      if (cancelled) return;
      if (window.google?.accounts?.id && ref.current) {
        if (!googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID!,
            callback: (response) => activeCredentialHandler?.(response),
          });
          googleInitialized = true;
        }
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
        return;
      }
      attempts += 1;
      if (attempts < 50) setTimeout(tryInit, 100);
    }
    tryInit();

    return () => {
      cancelled = true;
      if (activeCredentialHandler === handleCredential) activeCredentialHandler = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3 text-xs text-ink-muted">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      <div ref={ref} />
    </div>
  );
}
