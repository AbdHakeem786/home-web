import { api } from "./client";
import type { ApiWorkerCard, ApiWorkerProfile, ApiReview } from "./types";

export interface ListWorkersParams {
  category?: string;
  online?: boolean;
  verified?: boolean;
  minRating?: number;
  search?: string;
  sort?: "distance" | "rating" | "price" | "experience";
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
}

export async function listWorkers(params: ListWorkersParams = {}) {
  const res = await api.get<ApiWorkerCard[]>(
    "/workers",
    {
      category: params.category,
      online: params.online,
      verified: params.verified,
      minRating: params.minRating,
      search: params.search,
      sort: params.sort,
      lat: params.lat,
      lng: params.lng,
      page: params.page,
      limit: params.limit,
    },
    false
  );
  return { workers: res.data, pagination: res.pagination };
}

export async function getWorker(id: string) {
  const res = await api.get<{ worker: ApiWorkerProfile; reviews: ApiReview[] }>(`/workers/${id}`, undefined, false);
  return res.data;
}

export async function getMyWorkerProfile() {
  const res = await api.get<ApiWorkerProfile>("/workers/me");
  return res.data;
}

export async function createMyWorkerProfile(input: {
  category: string;
  bio?: string;
  priceFrom: number;
  experienceYears?: number;
  skills?: string[];
  cnicImage?: string;
  documents?: string[];
}) {
  const res = await api.post<ApiWorkerProfile>("/workers/me", input);
  return res.data;
}

export async function updateMyWorkerProfile(input: Partial<{
  category: string;
  bio: string;
  priceFrom: number;
  experienceYears: number;
  online: boolean;
  skills: string[];
  cnicImage: string;
  documents: string[];
}>) {
  const res = await api.patch<ApiWorkerProfile>("/workers/me", input);
  return res.data;
}

export async function updateMyLocation(lat: number, lng: number, bookingId?: string) {
  const res = await api.patch<{ location: unknown }>("/workers/me/location", { lat, lng, bookingId });
  return res.data;
}

export async function updateMyAvailability(online: boolean) {
  const res = await api.patch<{ online: boolean }>("/workers/me/availability", { online });
  return res.data;
}
