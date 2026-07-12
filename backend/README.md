# RestMenu Home — Backend API

Node.js + Express + TypeScript + MongoDB (Mongoose) REST API for the RestMenu Home
service marketplace (customer / worker / admin), built to match the data model and
endpoint contract already described in the frontend's own README.

Real-time features (chat, live tracking) are **not** included yet — this is REST-only,
per scope. The frontend README's suggestion to add Socket.io for `Chat.tsx` and
`LiveTracking.tsx` still stands as a future step.

## Stack
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT auth (access + refresh tokens)
- Zod request validation
- bcryptjs for password/OTP hashing

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI / JWT secrets as needed
npm run seed               # optional: creates categories + demo accounts
npm run dev                 # starts on http://localhost:5000
```

Requires a running MongoDB instance (local `mongod` or a connection string from
MongoDB Atlas) set as `MONGO_URI` in `.env`.

### Demo accounts created by `npm run seed`
| Role     | Phone            | Password       |
|----------|------------------|----------------|
| Admin    | +923000000000    | Admin@123      |
| Customer | +923001112233    | Customer@123   |
| Worker   | +923001234567    | Worker@123     |
(5 more sample workers are seeded too — see `src/utils/seed.ts`, phones `...568`–`...572`)

## Project structure
```
src/
 ├── config/        env loader, MongoDB connection
 ├── models/         Mongoose schemas (User, WorkerProfile, Category, Booking,
 │                    Review, WalletTransaction, Notification, Complaint, Otp)
 ├── middleware/      auth (JWT + role guard), zod validate, error handler
 ├── validators/      zod schemas per resource
 ├── controllers/      route handlers
 ├── routes/            Express routers, mounted in app.ts
 ├── utils/              AppError, JWT sign/verify, OTP gen, seed script
 ├── app.ts               Express app (middleware + route wiring)
 └── server.ts             entry point (connects DB, starts listener)
```

## Auth flow
1. `POST /api/auth/register` → creates account (unverified), sends OTP (logged to
   console in dev — no real SMS provider wired up yet, matching the frontend's own
   note that OTP is currently mocked).
2. `POST /api/auth/verify-otp` (`purpose: "register"`) → marks phone verified,
   returns `{ user, accessToken, refreshToken }`.
3. `POST /api/auth/login` → if already verified, returns tokens directly. If not,
   sends a fresh OTP and returns `{ requiresOtp: true }`.
4. `POST /api/auth/refresh` with `refreshToken` → new token pair.
5. `POST /api/auth/forgot-password` → OTP (purpose `forgot_password`) →
   `POST /api/auth/reset-password` with the code + new password.

Send `Authorization: Bearer <accessToken>` on all protected routes.

## API reference

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | – | `{ name, phone, password, role?, email? }` |
| POST | `/verify-otp` | – | `{ phone, code, purpose }` |
| POST | `/resend-otp` | – | `{ phone, purpose }` |
| POST | `/login` | – | `{ phone, password }` |
| POST | `/forgot-password` | – | `{ phone }` |
| POST | `/reset-password` | – | `{ phone, code, newPassword }` |
| POST | `/refresh` | – | `{ refreshToken }` |
| GET | `/me` | ✅ | current user |

### Categories (`/api/categories`)
| Method | Path | Auth |
|---|---|---|
| GET | `/` | – (public) |
| GET | `/:id` | – |
| POST | `/` | admin |
| PATCH | `/:id` | admin |
| DELETE | `/:id` | admin (soft-deactivates) |

### Workers (`/api/workers`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | – | filters: `category, online, verified, minRating, lat, lng, sort, page, limit`. Pass `lat`/`lng` to get real `distanceKm` (via Mongo geo query); `sort=distance\|rating\|price\|experience` |
| GET | `/:id` | – | profile + reviews |
| GET | `/me` | worker | own profile |
| POST | `/me` | worker | create own profile (onboarding) |
| PATCH | `/me` | worker | update bio/price/online/location/etc |
| PATCH | `/:id/verify` | admin | mark CNIC-verified |

### Bookings (`/api/bookings`) — all require auth
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/` | customer | `{ workerId, categoryId, date, time, address, description?, estimatedPrice }` |
| GET | `/` | any | scoped automatically to caller's role (customer sees own, worker sees own, admin sees all) |
| GET | `/:id` | any | must own the booking (or be admin) |
| PATCH | `/:id/status` | customer/worker | customer may only cancel; worker moves forward through `pending→accepted→on_the_way→arrived→in_progress→completed`, or cancels. Completing auto-credits the worker's wallet and bumps `completedJobs` |

### Reviews (`/api/reviews`)
| Method | Path | Auth |
|---|---|---|
| POST | `/` | customer — `{ bookingId, rating, comment? }`, booking must be `completed`, one review per booking. Recomputes worker's `rating`/`reviewCount`. |
| GET | `/worker/:workerId` | – |

### Wallet (`/api/wallet`) — worker only
| Method | Path |
|---|---|
| GET | `/summary` — `{ balance, totalEarned, totalWithdrawn }` |
| GET | `/transactions` |
| POST | `/withdraw` — `{ amount, method }` |

### Notifications (`/api/notifications`) — auth required
| Method | Path |
|---|---|
| GET | `/` |
| PATCH | `/:id/read` |
| PATCH | `/read-all` |

### Complaints (`/api/complaints`) — auth required
| Method | Path | Role |
|---|---|---|
| POST | `/` | any — `{ bookingId?, subject, description }` |
| GET | `/mine` | any |
| GET | `/` | admin |
| PATCH | `/:id` | admin — `{ status, adminNote? }` |

### Admin (`/api/admin`) — admin only
| Method | Path |
|---|---|
| GET | `/dashboard` — counts + revenue |
| GET | `/users` — filters: `role, search, page, limit` |
| PATCH | `/users/:id/active` — `{ active }` |
| GET | `/workers` — filters: `verified, page, limit` |

## Connecting the existing frontend

The frontend README already lays out the plan — this backend fulfills it:

1. Add `src/api/client.ts` in the frontend with an Axios instance pointed at
   `http://localhost:5000/api`, attaching `Authorization: Bearer <token>` from
   the Zustand store.
2. Replace each `src/mock/data.ts` import with a call to the matching endpoint
   above (e.g. `categories` → `GET /categories`, `workers` → `GET /workers`).
3. Swap `useAppStore`'s manual role switching for the role returned by
   `POST /api/auth/login` / `verify-otp`.
4. Chat and live-tracking remain simulated until Socket.io is added — that's
   the one piece intentionally deferred, per your earlier answer.

Happy to wire up that `src/api/*` layer in the frontend next, if you'd like.
