import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "../config/env";
import { Message } from "../models/Message";
import { WorkerProfile } from "../models/WorkerProfile";
import { assertBookingChatAccess } from "../controllers/messageController";
import { AuthTokenPayload } from "../types";

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing auth token"));
      return;
    }
    try {
      const payload: AuthTokenPayload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = socket.data as { userId: string };
    socket.join(`user:${userId}`);

    socket.on("join:booking", async (bookingId: string, ack?: (res: { ok: boolean; error?: string }) => void) => {
      try {
        await assertBookingChatAccess(socket.data.userId, socket.data.role, bookingId);
        socket.join(`booking:${bookingId}`);
        ack?.({ ok: true });
      } catch (err: any) {
        ack?.({ ok: false, error: err?.message ?? "Access denied" });
      }
    });

    socket.on(
      "chat:message",
      async (data: { bookingId: string; text?: string; imageUrl?: string; voiceUrl?: string }) => {
        const { bookingId, text, imageUrl, voiceUrl } = data;
        if (!socket.rooms.has(`booking:${bookingId}`)) return;
        if (!text && !imageUrl && !voiceUrl) return;

        const message = await Message.create({
          booking: bookingId,
          sender: socket.data.userId,
          text,
          imageUrl,
          voiceUrl,
        });
        const populated = await message.populate("sender", "name avatar role");

        io!.to(`booking:${bookingId}`).emit("chat:message", populated.toJSON());
      }
    );

    socket.on("chat:typing", (data: { bookingId: string; isTyping: boolean }) => {
      if (!socket.rooms.has(`booking:${data.bookingId}`)) return;
      socket.to(`booking:${data.bookingId}`).emit("chat:typing", {
        userId: socket.data.userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("tracking:location", async (data: { bookingId: string; lat: number; lng: number }) => {
      if (socket.data.role !== "worker") return;
      if (!socket.rooms.has(`booking:${data.bookingId}`)) return;

      await WorkerProfile.updateOne(
        { user: socket.data.userId },
        { location: { type: "Point", coordinates: [data.lng, data.lat] } }
      );

      socket.to(`booking:${data.bookingId}`).emit("tracking:location", {
        lat: data.lat,
        lng: data.lng,
        at: Date.now(),
      });
    });
  });

  return io;
}
