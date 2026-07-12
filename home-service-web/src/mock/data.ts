import type { Booking, Category, ChatMessage, NotificationItem, Review, Worker, WalletTx } from "../types";

export const categories: Category[] = [
  { id: "plumbing", name: "Plumbing", icon: "Wrench" },
  { id: "electrician", name: "Electrician", icon: "Zap" },
  { id: "carpenter", name: "Carpenter", icon: "Hammer" },
  { id: "cleaner", name: "Cleaner", icon: "Sparkles" },
  { id: "painter", name: "Painter", icon: "PaintRoller" },
  { id: "ac_repair", name: "AC Repair", icon: "Snowflake" },
  { id: "mason", name: "Mason", icon: "Bricks" },
  { id: "gardener", name: "Gardener", icon: "Flower2" },
  { id: "handyman", name: "Handyman", icon: "Settings2" },
  { id: "water_tank", name: "Water Tank Cleaning", icon: "Droplets" },
  { id: "cctv", name: "CCTV Installer", icon: "Camera" },
  { id: "internet", name: "Internet Technician", icon: "Wifi" },
];

export const workers: Worker[] = [
  { id: "w1", name: "Imran Sheikh", avatar: "IS", category: "plumbing", rating: 4.8, reviewCount: 213, completedJobs: 340, experienceYears: 7, priceFrom: 800, distanceKm: 1.2, online: true, verified: true, bio: "Specialist in leak repair, pipe fitting and bathroom fixtures. CNIC verified, background checked." },
  { id: "w2", name: "Bilal Hussain", avatar: "BH", category: "electrician", rating: 4.6, reviewCount: 156, completedJobs: 260, experienceYears: 5, priceFrom: 700, distanceKm: 2.4, online: true, verified: true, bio: "Wiring, switchboards, inverter installation and emergency electrical faults." },
  { id: "w3", name: "Fahad Malik", avatar: "FM", category: "carpenter", rating: 4.9, reviewCount: 98, completedJobs: 150, experienceYears: 9, priceFrom: 900, distanceKm: 3.1, online: false, verified: true, bio: "Custom furniture, door and window repair, polishing." },
  { id: "w4", name: "Sana Amjad", avatar: "SA", category: "cleaner", rating: 4.7, reviewCount: 302, completedJobs: 510, experienceYears: 4, priceFrom: 600, distanceKm: 0.8, online: true, verified: true, bio: "Deep cleaning, sofa shampoo, kitchen and bathroom sanitization." },
  { id: "w5", name: "Waqas Tariq", avatar: "WT", category: "ac_repair", rating: 4.5, reviewCount: 121, completedJobs: 190, experienceYears: 6, priceFrom: 1000, distanceKm: 4.0, online: true, verified: false, bio: "AC gas filling, servicing, installation for split and window units." },
  { id: "w6", name: "Adeel Raza", avatar: "AR", category: "painter", rating: 4.4, reviewCount: 87, completedJobs: 140, experienceYears: 5, priceFrom: 750, distanceKm: 2.9, online: true, verified: true, bio: "Interior and exterior painting, texture and putty work." },
];

export const reviews: Review[] = [
  { id: "r1", workerId: "w1", customerName: "Hina Fatima", rating: 5, comment: "Fixed the kitchen leak in 20 minutes. Very professional.", date: "2 days ago" },
  { id: "r2", workerId: "w1", customerName: "Usman Ali", rating: 5, comment: "On time and honest about pricing.", date: "1 week ago" },
  { id: "r3", workerId: "w1", customerName: "Mariam Khan", rating: 4, comment: "Good work, slightly delayed arrival.", date: "2 weeks ago" },
];

export const bookings: Booking[] = [
  { id: "b1", workerId: "w1", categoryId: "plumbing", status: "on_the_way", date: "Today", time: "4:30 PM", address: "House 12, Street 5, F-10, Islamabad", description: "Kitchen sink is leaking from the pipe joint.", estimatedPrice: 1200, createdAt: "2026-07-09" },
  { id: "b2", workerId: "w4", categoryId: "cleaner", status: "completed", date: "3 Jul", time: "11:00 AM", address: "Flat 4B, Bahria Town, Rawalpindi", description: "Full house deep cleaning, 2 bed 2 bath.", estimatedPrice: 3500, createdAt: "2026-07-03" },
  { id: "b3", workerId: "w2", categoryId: "electrician", status: "cancelled", date: "28 Jun", time: "2:00 PM", address: "House 7, G-11, Islamabad", description: "Switchboard sparking near main gate.", estimatedPrice: 900, createdAt: "2026-06-28" },
];

export const chatMessages: ChatMessage[] = [
  { id: "c1", senderId: "worker", text: "Assalam o Alaikum, I'm on my way to your location.", time: "4:02 PM" },
  { id: "c2", senderId: "me", text: "Walaikum Salam, please call when you reach the gate.", time: "4:03 PM" },
  { id: "c3", senderId: "worker", text: "Sure, ETA is about 12 minutes.", time: "4:04 PM" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Booking accepted", body: "Imran Sheikh accepted your plumbing request.", time: "10 min ago", type: "booking", read: false },
  { id: "n2", title: "Worker arrived", body: "Sana Amjad has arrived at your address.", time: "1 hr ago", type: "booking", read: false },
  { id: "n3", title: "Payment received", body: "Rs 3,500 paid via JazzCash for booking #b2.", time: "3 days ago", type: "payment", read: true },
  { id: "n4", title: "Weekend offer", body: "Get 15% off on AC servicing this weekend.", time: "5 days ago", type: "offer", read: true },
];

export const walletTxns: WalletTx[] = [
  { id: "t1", label: "Booking #b2 - Deep Cleaning", amount: 3500, type: "credit", date: "3 Jul" },
  { id: "t2", label: "Withdrawal to JazzCash", amount: 3000, type: "debit", date: "4 Jul" },
  { id: "t3", label: "Booking #b7 - AC Repair", amount: 1500, type: "credit", date: "28 Jun" },
];

export const workerJobs = [
  { id: "j1", customerName: "Hina Fatima", category: "Plumbing", address: "F-10, Islamabad", time: "Today, 4:30 PM", price: 1200, status: "pending" as const },
  { id: "j2", customerName: "Usman Ali", category: "Plumbing", address: "G-9, Islamabad", time: "Today, 6:00 PM", price: 800, status: "accepted" as const },
  { id: "j3", customerName: "Mariam Khan", category: "Plumbing", address: "Bahria Town, Rawalpindi", time: "Yesterday", price: 950, status: "completed" as const },
];
