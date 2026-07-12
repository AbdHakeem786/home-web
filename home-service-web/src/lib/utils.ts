import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function formatPKR(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

/** Distinguishes a real avatar URL/path from a precomputed initials fallback like "IS". */
export function isAvatarUrl(value?: string): value is string {
  return !!value && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/"));
}
