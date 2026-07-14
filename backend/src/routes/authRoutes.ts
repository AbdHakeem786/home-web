import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  googleLoginSchema,
  addAddressSchema,
  updateAddressSchema,
} from "../validators/authValidators";
import * as authController from "../controllers/authController";

const router = Router();

// Sensitive auth endpoints get a much tighter limit than the global API limiter -
// these are the ones worth brute-forcing (credentials, OTP codes).
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  "/resend-verification-email",
  validate(resendVerificationEmailSchema),
  authController.resendVerificationEmail
);
router.post("/verify-otp", sensitiveAuthLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", sensitiveAuthLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post("/login", sensitiveAuthLimiter, validate(loginSchema), authController.login);
router.post("/google", validate(googleLoginSchema), authController.googleLogin);
router.post("/forgot-password", sensitiveAuthLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", sensitiveAuthLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.get("/me", requireAuth, authController.me);
router.put("/profile", requireAuth, validate(updateProfileSchema), authController.updateProfile);
router.delete("/profile", requireAuth, authController.deleteProfile);
router.get("/me/favorites", requireAuth, authController.listFavoriteWorkers);
router.post("/me/favorites/:workerId", requireAuth, authController.addFavoriteWorker);
router.delete("/me/favorites/:workerId", requireAuth, authController.removeFavoriteWorker);
router.get("/me/addresses", requireAuth, authController.listAddresses);
router.post("/me/addresses", requireAuth, validate(addAddressSchema), authController.addAddress);
router.patch("/me/addresses/:id", requireAuth, validate(updateAddressSchema), authController.updateAddress);
router.delete("/me/addresses/:id", requireAuth, authController.deleteAddress);
router.patch("/me/addresses/:id/current", requireAuth, authController.setCurrentAddress);

export default router;
