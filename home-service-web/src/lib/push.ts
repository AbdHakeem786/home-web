import { notificationsApi } from "../api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

let inFlight: Promise<void> | null = null;

/** Best-effort: registers the SW and subscribes to push. Silently no-ops if
 * unsupported, permission is denied, or no VAPID key is configured server-side. */
export function enablePushNotifications(): Promise<void> {
  if (!inFlight) inFlight = doEnablePushNotifications().finally(() => (inFlight = null));
  return inFlight;
}

async function doEnablePushNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const publicKey = await notificationsApi.getVapidPublicKey();
    if (!publicKey) return;

    const registration = await navigator.serviceWorker.register("/sw.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    await notificationsApi.subscribePush(subscription.toJSON() as PushSubscriptionJSON);
  } catch {
    // Push is a progressive enhancement - never block the app on failure.
  }
}
