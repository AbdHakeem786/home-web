import { api } from "./client";
import type { ApiMessage } from "./types";

export async function listMessages(bookingId: string) {
  const res = await api.get<ApiMessage[]>(`/messages/${bookingId}`);
  return res.data;
}
