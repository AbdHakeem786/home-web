import { api } from "./client";
import type { ApiUser, ApiWorkerProfile, ApiWalletTransaction } from "./types";

export interface DashboardStats {
  totalCustomers: number;
  totalWorkers: number;
  verifiedWorkers: number;
  onlineWorkers: number;
  bookingsByStatus: Record<string, number>;
  totalBookings: number;
  openComplaints: number;
  totalRevenue: number;
}

export async function getDashboardStats() {
  const res = await api.get<DashboardStats>("/admin/dashboard");
  return res.data;
}

export interface AnalyticsResponse {
  revenueByDay: { date: string; bookings: number; revenue: number }[];
  categoryBreakdown: { category: string; bookings: number }[];
}

export async function getAnalytics(days = 14) {
  const res = await api.get<AnalyticsResponse>("/admin/analytics", { days });
  return res.data;
}

export async function listUsers(params: { role?: string; search?: string; page?: number; limit?: number } = {}) {
  const res = await api.get<ApiUser[]>("/admin/users", params);
  return { users: res.data, pagination: res.pagination };
}

export async function setUserActive(id: string, active: boolean) {
  const res = await api.patch<ApiUser>(`/admin/users/${id}/active`, { active });
  return res.data;
}

export async function creditCustomerWallet(id: string, amount: number, label?: string) {
  const res = await api.post<ApiUser>(`/admin/customers/${id}/wallet-credit`, { amount, label });
  return res.data;
}

export async function listWorkersAdmin(params: { verified?: boolean; page?: number; limit?: number } = {}) {
  const res = await api.get<ApiWorkerProfile[]>("/admin/workers", params);
  return { workers: res.data, pagination: res.pagination };
}

export async function verifyWorker(workerId: string) {
  const res = await api.patch<ApiWorkerProfile>(`/workers/${workerId}/verify`);
  return res.data;
}

export async function listWithdrawals(params: { status?: string; page?: number; limit?: number } = {}) {
  const res = await api.get<ApiWalletTransaction[]>("/admin/withdrawals", params);
  return { withdrawals: res.data, pagination: res.pagination };
}

export async function processWithdrawal(id: string, action: "complete" | "reject") {
  const res = await api.patch<ApiWalletTransaction>(`/admin/withdrawals/${id}`, { action });
  return res.data;
}
