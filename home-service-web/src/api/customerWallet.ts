import { api } from "./client";
import type { ApiCustomerWalletTransaction } from "./types";

export async function getWalletSummary() {
  const res = await api.get<{ balance: number }>("/customer-wallet/summary");
  return res.data;
}

export async function listMyTransactions(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<ApiCustomerWalletTransaction[]>("/customer-wallet/transactions", params);
  return { transactions: res.data, pagination: res.pagination };
}
