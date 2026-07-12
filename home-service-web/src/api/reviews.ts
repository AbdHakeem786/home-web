import { api } from "./client";
import type { ApiReview } from "./types";

export async function createReview(input: { bookingId: string; rating: number; comment?: string }) {
  const res = await api.post<ApiReview>("/reviews", input);
  return res.data;
}

export async function listWorkerReviews(workerId: string) {
  const res = await api.get<ApiReview[]>(`/reviews/worker/${workerId}`, undefined, false);
  return res.data;
}
