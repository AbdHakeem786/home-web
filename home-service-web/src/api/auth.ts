import { api, tokenStorage } from "./client";
import type { ApiUser, ApiWorkerCard } from "./types";

export type OtpPurpose = "register" | "login" | "forgot_password";

export async function register(input: {
  name: string;
  phone: string;
  password: string;
  role: "customer" | "worker";
  email: string;
}) {
  const res = await api.post<{ message: string; userId: string }>("/auth/register", input, false);
  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await api.post<{ user: ApiUser; accessToken: string; refreshToken: string }>(
    "/auth/verify-email",
    { token },
    false
  );
  tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
  return res.data;
}

export async function resendVerificationEmail(phone: string) {
  const res = await api.post<{ message: string }>("/auth/resend-verification-email", { phone }, false);
  return res.data;
}

export async function googleLogin(idToken: string, role?: "customer" | "worker") {
  const res = await api.post<{ user: ApiUser; accessToken: string; refreshToken: string }>(
    "/auth/google",
    { idToken, role },
    false
  );
  tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
  return res.data;
}

export async function verifyOtp(input: { phone: string; code: string; purpose: OtpPurpose }) {
  const res = await api.post<
    { message: string } | { user: ApiUser; accessToken: string; refreshToken: string }
  >("/auth/verify-otp", input, false);
  const data = res.data as { user?: ApiUser; accessToken?: string; refreshToken?: string };
  if (data.accessToken && data.refreshToken && data.user) {
    tokenStorage.setSession(data.accessToken, data.refreshToken, data.user);
  }
  return data;
}

export async function resendOtp(input: { phone: string; purpose: OtpPurpose }) {
  const res = await api.post<{ message: string }>("/auth/resend-otp", input, false);
  return res.data;
}

export async function login(input: { phone: string; password: string }) {
  const res = await api.post<
    { requiresOtp: true; message: string } | { user: ApiUser; accessToken: string; refreshToken: string }
  >("/auth/login", input, false);
  const data = res.data as {
    requiresOtp?: boolean;
    user?: ApiUser;
    accessToken?: string;
    refreshToken?: string;
  };
  if (data.accessToken && data.refreshToken && data.user) {
    tokenStorage.setSession(data.accessToken, data.refreshToken, data.user);
  }
  return data;
}

export async function forgotPassword(phone: string) {
  const res = await api.post<{ message: string }>("/auth/forgot-password", { phone }, false);
  return res.data;
}

export async function resetPassword(input: { phone: string; code: string; newPassword: string }) {
  const res = await api.post<{ message: string }>("/auth/reset-password", input, false);
  return res.data;
}

export async function me() {
  const res = await api.get<ApiUser>("/auth/me");
  return res.data;
}

export async function updateProfile(input: { name?: string; email?: string; avatar?: string }) {
  const res = await api.put<ApiUser>("/auth/profile", input);
  tokenStorage.setUser(res.data);
  return res.data;
}

export async function deleteProfile() {
  const res = await api.del<{ message: string }>("/auth/profile");
  return res.data;
}

export function logout() {
  tokenStorage.clear();
}

export async function listFavoriteWorkers() {
  const res = await api.get<ApiWorkerCard[]>("/auth/me/favorites");
  return res.data;
}

export async function addFavoriteWorker(workerId: string) {
  const res = await api.post<{ message: string }>(`/auth/me/favorites/${workerId}`);
  return res.data;
}

export async function removeFavoriteWorker(workerId: string) {
  const res = await api.del<{ message: string }>(`/auth/me/favorites/${workerId}`);
  return res.data;
}

export interface ApiAddress {
  id: string;
  label: string;
  address: string;
}

interface AddressListResponse {
  addresses: ApiAddress[];
  currentAddressId: string | null;
}

export async function listAddresses() {
  const res = await api.get<AddressListResponse>("/auth/me/addresses");
  return res.data;
}

export async function addAddress(input: { label: string; address: string }) {
  const res = await api.post<AddressListResponse>("/auth/me/addresses", input);
  return res.data;
}

export async function updateAddress(id: string, input: { label?: string; address?: string }) {
  const res = await api.patch<AddressListResponse>(`/auth/me/addresses/${id}`, input);
  return res.data;
}

export async function deleteAddress(id: string) {
  const res = await api.del<AddressListResponse>(`/auth/me/addresses/${id}`);
  return res.data;
}

export async function setCurrentAddress(id: string) {
  const res = await api.patch<AddressListResponse>(`/auth/me/addresses/${id}/current`);
  return res.data;
}
