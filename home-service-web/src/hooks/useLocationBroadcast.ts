import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../api";

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission denied. Allow location access in your browser settings to share live location.";
    case err.POSITION_UNAVAILABLE:
      return "Could not determine your location. Check your device's location/GPS settings.";
    case err.TIMEOUT:
      return "Timed out getting your location. Try again.";
    default:
      return "Could not share live location.";
  }
}

export function useLocationBroadcast() {
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const watchIdRef = useRef<number | null>(null);

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActiveBookingId(null);
  }

  function start(bookingId: string) {
    setError("");
    if (!navigator.geolocation) {
      setError("Your browser does not support location sharing.");
      return;
    }
    stop();
    const socket = connectSocket();
    socket?.emit("join:booking", bookingId);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        connectSocket()?.emit("tracking:location", { bookingId, lat: latitude, lng: longitude });
      },
      (err) => {
        setError(geolocationErrorMessage(err));
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = id;
    setActiveBookingId(bookingId);
  }

  useEffect(() => stop, []);

  return { activeBookingId, error, start, stop };
}
