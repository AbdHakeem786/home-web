import webpush from "web-push";
import { env } from "../config/env";
import { PushSubscription } from "../models/PushSubscription";

let configured = false;

function ensureConfigured(): boolean {
  if (!env.vapid.publicKey || !env.vapid.privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
    configured = true;
  }
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await PushSubscription.find({ user: userId });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );
}
