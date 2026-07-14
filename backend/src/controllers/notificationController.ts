import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { PushSubscription } from "../models/PushSubscription";
import { AppError } from "../utils/AppError";
import { ok, paginated } from "../utils/apiResponse";
import { env } from "../config/env";

export async function listMyNotifications(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 30);

  const filter = { user: req.auth!.userId };
  const [total, unreadCount, items] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    unreadCount,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.auth!.userId },
    { read: true },
    { new: true }
  );
  if (!notif) throw AppError.notFound("Notification not found");
  ok(res, notif);
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  await Notification.updateMany({ user: req.auth!.userId, read: false }, { read: true });
  ok(res, { message: "All notifications marked as read" });
}

export function getVapidPublicKey(_req: Request, res: Response): void {
  ok(res, { publicKey: env.vapid.publicKey });
}

export async function subscribePush(req: Request, res: Response): Promise<void> {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
  const update = { user: req.auth!.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth };

  try {
    await PushSubscription.findOneAndUpdate({ endpoint }, update, { upsert: true });
  } catch (err) {
    // Two concurrent subscribe calls for the same endpoint (e.g. a double-mounted
    // effect in dev) can both miss the upsert's existence check and race on the
    // unique index; the loser just needs a plain update, the doc now exists.
    if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
      await PushSubscription.updateOne({ endpoint }, update);
    } else {
      throw err;
    }
  }

  ok(res, { message: "Subscribed to push notifications" });
}

export async function unsubscribePush(req: Request, res: Response): Promise<void> {
  const { endpoint } = req.body as { endpoint: string };
  await PushSubscription.deleteOne({ endpoint, user: req.auth!.userId });
  ok(res, { message: "Unsubscribed" });
}
