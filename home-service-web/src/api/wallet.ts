import { api } from "./client";
import type { ApiWalletTransaction } from "./types";

export async function getWalletSummary() {
  const res = await api.get<{ balance: number; totalEarned: number; totalWithdrawn: number }>("/wallet/summary");
  return res.data;
}

export async function listMyTransactions(params: { page?: number; limit?: number } = {}) {
  const res = await api.get<ApiWalletTransaction[]>("/wallet/transactions", params);
  return { transactions: res.data, pagination: res.pagination };
}

export async function requestWithdrawal(amount: number, method: string, accountDetails: string) {
  const res = await api.post<ApiWalletTransaction>("/wallet/withdraw", { amount, method, accountDetails });
  return res.data;
}
