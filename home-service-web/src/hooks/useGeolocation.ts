import { useEffect, useState } from "react";

// One-shot best-effort location fetch for "workers near me" sorting/display.
// Silently resolves to null on denial/unsupported browsers - this is an
// enhancement (distance display, nearby sort), never something that should
// block browsing if the user declines the permission prompt.
export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  }, []);

  return position;
}
