# RestMenu Home — Web Frontend

React.js frontend for the InDrive/Yango-style home service marketplace, now wired to the
real backend (see `../backend`) instead of mock data.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (CSS-first `@theme`, see `src/index.css`)
- React Router v7
- Zustand (auth/session state)
- lucide-react (icons)
- Native `fetch` for API calls (see `src/api/`) — no extra HTTP library needed

## Run it

```bash
npm install
cp .env.example .env      # points at the backend, defaults to http://localhost:5000/api
npm run dev
```

Make sure the backend (`../backend`) is running first — `npm run seed` there gives you demo
accounts to log in with (see its README).

Open the printed local URL (mobile-width layout — resize your browser to ~400px or use device
toolbar for the intended look). Admin and worker panels are responsive full-width.

## Project structure

```
src/
 ├── api/               Backend integration layer
 │   ├── client.ts       fetch wrapper: base URL, auth header, silent token refresh
 │   ├── types.ts        Types matching the backend's JSON responses
 │   ├── auth.ts, categories.ts, workers.ts, bookings.ts, reviews.ts,
 │   │   wallet.ts, notifications.ts, complaints.ts, admin.ts
 │   └── index.ts        barrel export — `import { authApi, workersApi, ... } from "../../api"`
 ├── pages/
 │   ├── auth/          Splash, Onboarding, Login, Register, OTP, Forgot Password — all call
 │   │                   the real `/api/auth/*` endpoints now
 │   ├── customer/       Home, Categories, Worker list/profile, Booking, Payment,
 │   │                   Live tracking, Chat, Notifications, Profile, History
 │   ├── worker/         Dashboard, Jobs, Wallet — all backed by `/api/workers`, `/api/bookings`,
 │   │                   `/api/wallet`
 │   └── admin/          Dashboard, Users, Workers, Bookings, Categories, Complaints — backed by
 │                        `/api/admin/*`, `/api/categories`, `/api/complaints`
 ├── layouts/            CustomerLayout (bottom nav), WorkerLayout & AdminLayout (sidebar), AuthLayout
 ├── components/         WorkerCard, CategoryTile, RouteStep (booking/tracking progress), ui/*
 ├── store/appStore.ts   zustand: real session (user, role) restored from localStorage on load
 ├── hooks/useLocationBroadcast.ts  Worker-side GPS watch → emits `tracking:location` over the socket
 ├── types/index.ts      Shared TypeScript types
 └── lib/utils.ts        cn() class helper, formatPKR()
```

## What's real vs. still simulated

Everything below now calls the backend:
- Auth: register → OTP verify → login (JWT stored in `localStorage`, silently refreshed on 401)
- Categories, worker browsing/profile/reviews, booking creation + status flow, wallet,
  notifications, complaints, and the full admin panel
- `Chat.tsx` — real-time via `socket.io-client` (`chat:message` / `chat:typing`), backed by the
  `Message` model on the API.
- `LiveTracking.tsx` — a real Leaflet map (`components/LiveMap.tsx`). The worker toggles "Share
  live location" on `worker/Jobs.tsx`, which watches the browser's real GPS
  (`hooks/useLocationBroadcast.ts`) and emits `tracking:location` over the socket to everyone in
  that booking's room; the customer's map re-centers live as pings arrive.

**Still stubbed:**
- SMS delivery for phone OTP — the backend just logs the code in dev
  (`backend/src/utils/otp.ts`); no SMS gateway is wired up yet.

## Auth session

`src/store/appStore.ts` restores the logged-in user from `localStorage` on page load, so a
refresh doesn't log you out. `src/api/client.ts` automatically retries a request once with a
refreshed access token if the server returns 401, before giving up and clearing the session.

## Demo accounts

Run `npm run seed` in `../backend` first, then log in with (see its README for the full list):
- Admin: `+923000000000` / `Admin@123`
- Customer: `+923001112233` / `Customer@123`
- Worker: `+923001234567` / `Worker@123`
