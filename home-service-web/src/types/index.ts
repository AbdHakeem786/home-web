export type UserRole = "customer" | "worker" | "admin";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  experienceYears: number;
  priceFrom: number;
  distanceKm: number | null;
  online: boolean;
  verified: boolean;
  bio: string;
}

export interface Review {
  id: string;
  workerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  workerId: string;
  categoryId: string;
  status: BookingStatus;
  date: string;
  time: string;
  address: string;
  description: string;
  estimatedPrice: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: "me" | "worker";
  text: string;
  time: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "booking" | "payment" | "offer" | "system";
  read: boolean;
}

export interface WalletTx {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
}
