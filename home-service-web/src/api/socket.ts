import { io, type Socket } from "socket.io-client";
import { SERVER_ORIGIN, tokenStorage } from "./client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket | null {
  const token = tokenStorage.getAccess();
  if (!token) return null;

  // Reuse the existing socket whether it's already connected or still in
  // the middle of connecting - tearing down an in-flight connection here
  // (e.g. on a second effect run under StrictMode) just kills the
  // handshake and logs a spurious "closed before established" warning.
  if (socket) return socket;

  socket = io(SERVER_ORIGIN, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
