import { api } from "./client";
import type { ApiComplaint } from "./types";

export async function createComplaint(input: { bookingId?: string; subject: string; description: string }) {
  const res = await api.post<ApiComplaint>("/complaints", input);
  return res.data;
}

export async function listMyComplaints() {
  const res = await api.get<ApiComplaint[]>("/complaints/mine");
  return res.data;
}

export async function listAllComplaints(params: { status?: string; page?: number; limit?: number } = {}) {
  const res = await api.get<ApiComplaint[]>("/complaints", params);
  return { complaints: res.data, pagination: res.pagination };
}

export async function updateComplaint(id: string, input: { status: ApiComplaint["status"]; adminNote?: string }) {
  const res = await api.patch<ApiComplaint>(`/complaints/${id}`, input);
  return res.data;
}
