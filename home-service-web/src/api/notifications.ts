import { api } from "./client";
import type { ApiNotification } from "./types";

export async function listMyNotifications(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<ApiNotification[]>("/notifications", params);
  return { notifications: res.data, unreadCount: res.unreadCount ?? 0, pagination: res.pagination };
}

export async function markNotificationRead(id: string) {
  const res = await api.patch<ApiNotification>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  await api.patch(`/notifications/read-all`);
}

export async function getVapidPublicKey() {
  const res = await api.get<{ publicKey: string }>("/notifications/vapid-public-key", undefined, false);
  return res.data.publicKey;
}

export async function subscribePush(subscription: PushSubscriptionJSON) {
  await api.post("/notifications/subscribe", {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  });
}

export async function unsubscribePush(endpoint: string) {
  await api.post("/notifications/unsubscribe", { endpoint });
}
