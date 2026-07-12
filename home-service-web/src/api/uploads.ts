import { BASE_URL, SERVER_ORIGIN, tokenStorage, ApiError } from "./client";

export type UploadType = "avatar" | "cnic" | "document" | "booking" | "completion" | "chat";

export async function uploadFile(type: UploadType, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);

  const token = tokenStorage.getAccess();
  const res = await fetch(`${BASE_URL}/uploads/${type}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? `Upload failed (${res.status})`, res.status, json?.details);
  }
  return { url: json.data.url as string };
}

/** Uploaded file URLs are server-relative (e.g. "/uploads/avatar/x.jpg"); resolve to a full URL for <img src>. */
export function resolveUploadUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SERVER_ORIGIN}${url}`;
}
