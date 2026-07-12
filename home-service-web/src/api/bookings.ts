import { api } from "./client";
import type { ApiBooking } from "./types";
import type { BookingStatus } from "../types";

export async function createBooking(input: {
  workerId: string;
  categoryId: string;
  date: string;
  time: string;
  address: string;
  description?: string;
  estimatedPrice: number;
  problemImages?: string[];
  paymentMethod?: "cash" | "stripe";
}) {
  const res = await api.post<ApiBooking>("/bookings", input);
  return res.data;
}

export async function createPaymentIntent(bookingId: string) {
  const res = await api.post<{ clientSecret: string }>(`/bookings/${bookingId}/payment-intent`);
  return res.data;
}

export async function listMyBookings(params: { status?: BookingStatus; page?: number; limit?: number } = {}) {
  const res = await api.get<ApiBooking[]>("/bookings", params);
  return { bookings: res.data, pagination: res.pagination };
}

export async function getBooking(id: string) {
  const res = await api.get<ApiBooking>(`/bookings/${id}`);
  return res.data;
}

export async function updateBookingStatus(
  id: string,
  input: { status: BookingStatus; cancelReason?: string; finalPrice?: number; completionImages?: string[] }
) {
  const res = await api.patch<ApiBooking>(`/bookings/${id}/status`, input);
  return res.data;
}

export async function rescheduleBooking(id: string, input: { date: string; time: string }) {
  const res = await api.patch<ApiBooking>(`/bookings/${id}/reschedule`, input);
  return res.data;
}
