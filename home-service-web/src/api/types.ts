export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "customer" | "worker" | "admin";
  avatar?: string;
  phoneVerified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

// Shape returned by GET /workers (list) - matches the frontend's existing Worker type
export interface ApiWorkerCard {
  id: string;
  name: string;
  avatar: string;
  category: string;
  categoryId: string;
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

// Shape returned by GET /workers/:id (populated document)
export interface ApiWorkerProfile {
  id: string;
  user: { id?: string; name: string; avatar?: string };
  category: { id?: string; name: string; icon: string };
  bio: string;
  priceFrom: number;
  experienceYears: number;
  online: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  skills?: string[];
  cnicImage?: string;
  documents?: string[];
  location?: { type: "Point"; coordinates: [number, number] };
}

export interface ApiReview {
  id: string;
  customer: { id?: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ApiBooking {
  id: string;
  customer: { id: string; name: string; avatar?: string; phone?: string } | string;
  worker: (ApiWorkerProfile & { id: string; user: ApiWorkerProfile["user"] & { phone?: string } }) | string;
  category: { id: string; name: string; icon: string } | string;
  status:
    | "pending"
    | "accepted"
    | "on_the_way"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  date: string;
  time: string;
  address: string;
  description: string;
  estimatedPrice: number;
  finalPrice?: number;
  couponCode?: string;
  discountAmount?: number;
  walletAmount?: number;
  cancelReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  problemImages?: string[];
  completionImages?: string[];
  paymentMethod?: "cash" | "stripe";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  id: string;
  booking: string;
  sender: { id?: string; name: string; avatar?: string; role?: string } | string;
  text?: string;
  imageUrl?: string;
  voiceUrl?: string;
  readAt?: string;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  type: "booking" | "payment" | "offer" | "system";
  read: boolean;
  createdAt: string;
}

export interface ApiWalletTransaction {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "completed" | "rejected";
  accountDetails?: string;
  worker?: { id?: string; user?: { name: string; phone?: string } };
  createdAt: string;
}

export interface ApiCustomerWalletTransaction {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
  booking?: string;
  createdAt: string;
}

export interface ApiComplaint {
  id: string;
  raisedBy: { id?: string; name: string; phone?: string; role?: string } | string;
  subject: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  adminNote?: string;
  createdAt: string;
}
