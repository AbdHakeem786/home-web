import { Notification } from "../models/Notification";
import { NotificationType } from "../types";
import { getIO } from "../realtime/socket";
import { sendPushToUser } from "./push";

export async function notifyUser(
  userId: string,
  data: { title: string; body: string; type: NotificationType }
): Promise<void> {
  const notification = await Notification.create({ user: userId, ...data });

  getIO()?.to(`user:${userId}`).emit("notification:new", notification.toJSON());

  await sendPushToUser(userId, { title: data.title, body: data.body });
}
