import { api } from "./client";

export interface ApiCouponPreview {
  code: string;
  type: "percent" | "flat";
  value: number;
  discount: number;
}

export interface ApiCoupon {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  maxUses?: number;
  usedCount: number;
  perUserLimit: number;
  minBookingAmount: number;
  restrictToUser?: string;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export async function validateCoupon(code: string, amount: number) {
  const res = await api.post<ApiCouponPreview>("/coupons/validate", { code, amount });
  return res.data;
}

export async function listCoupons(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<ApiCoupon[]>("/coupons", params);
  return { coupons: res.data, pagination: res.pagination };
}

export async function createCoupon(input: {
  code: string;
  type: "percent" | "flat";
  value: number;
  maxUses?: number;
  perUserLimit?: number;
  minBookingAmount?: number;
  expiresAt?: string;
}) {
  const res = await api.post<ApiCoupon>("/coupons", input);
  return res.data;
}

export async function setCouponActive(id: string, active: boolean) {
  const res = await api.patch<ApiCoupon>(`/coupons/${id}`, { active });
  return res.data;
}

export async function deleteCoupon(id: string) {
  const res = await api.del<{ deleted: boolean }>(`/coupons/${id}`);
  return res.data;
}
