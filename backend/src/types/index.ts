export type UserRole = "customer" | "worker" | "admin";

export const USER_ROLES: UserRole[] = ["customer", "worker", "admin"];

export type BookingStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "accepted",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

// Valid forward transitions a booking can move through (used by the status-update endpoint)
export const BOOKING_STATUS_FLOW: Record<BookingStatus, BookingStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export type NotificationType = "booking" | "payment" | "offer" | "system";

export type WalletTxType = "credit" | "debit";
export type WalletTxStatus = "pending" | "completed" | "rejected";

export type ComplaintStatus = "open" | "in_review" | "resolved" | "rejected";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}
