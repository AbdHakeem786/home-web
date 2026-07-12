import { api } from "./client";
import type { ApiCategory } from "./types";

export async function listCategories() {
  const res = await api.get<ApiCategory[]>("/categories", undefined, false);
  return res.data;
}

export async function getCategory(id: string) {
  const res = await api.get<ApiCategory>(`/categories/${id}`, undefined, false);
  return res.data;
}

export async function createCategory(input: { name: string; icon: string }) {
  const res = await api.post<ApiCategory>("/categories", input);
  return res.data;
}

export async function deactivateCategory(id: string) {
  await api.del(`/categories/${id}`);
}
