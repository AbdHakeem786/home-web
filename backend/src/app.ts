import "express-async-errors";
import path from "path";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import workerRoutes from "./routes/workerRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import walletRoutes from "./routes/walletRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import messageRoutes from "./routes/messageRoutes";
import couponRoutes from "./routes/couponRoutes";
import { stripeWebhook } from "./controllers/webhookController";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  // Stripe requires the raw, unparsed body to verify the webhook signature,
  // so this must be registered before the global JSON body parser below.
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    "/uploads",
    (_req, res, next) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("X-Content-Type-Options", "nosniff");
      next();
    },
    express.static(path.join(__dirname, "..", "uploads"))
  );
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "ok", uptime: process.uptime() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/workers", workerRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/coupons", couponRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
