import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User, IUser } from "../models/User";
import { Otp, OtpPurpose } from "../models/Otp";
import { EmailVerificationToken } from "../models/EmailVerificationToken";
import { AppError } from "../utils/AppError";
import { ok, created } from "../utils/apiResponse";
import { generateOtp, otpExpiryDate, deliverOtp } from "../utils/otp";
import { generateVerificationToken, hashToken, sendVerificationEmail } from "../utils/email";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env";
import { AuthTokenPayload } from "../types";

const googleClient = new OAuth2Client(env.googleClientId);

async function issueOtp(phone: string, purpose: OtpPurpose) {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await Otp.create({ phone, codeHash, purpose, expiresAt: otpExpiryDate() });
  deliverOtp(phone, code);
}

const EMAIL_TOKEN_EXPIRES_MS = 30 * 60 * 1000;

async function issueEmailVerification(user: Pick<IUser, "_id" | "name" | "email">) {
  if (!user.email) throw AppError.badRequest("Email is required to verify your account");
  const token = generateVerificationToken();
  await EmailVerificationToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRES_MS),
  });
  await sendVerificationEmail(user.email, user.name, token);
}

function issueTokens(userId: string, role: AuthTokenPayload["role"]) {
  const payload: AuthTokenPayload = { userId, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, phone, password, role, email } = req.body;

  const existing = await User.findOne({ phone });
  if (existing) {
    if (existing.phoneVerified) {
      throw AppError.conflict("An account with this phone number already exists");
    }
    // Previous signup never finished OTP verification - let them redo it
    // cleanly instead of getting stuck unable to register that number again.
    existing.name = name;
    existing.passwordHash = await bcrypt.hash(password, 10);
    existing.role = role;
    existing.email = email;
    await existing.save();

    await issueEmailVerification(existing);

    created(res, {
      message: "Registered. Check your email for a verification link to activate your account.",
      userId: existing._id.toString(),
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, phone, passwordHash, role, email });

  await issueEmailVerification(user);

  created(res, {
    message: "Registered. Check your email for a verification link to activate your account.",
    userId: user._id.toString(),
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token: string };

  const record = await EmailVerificationToken.findOne({ tokenHash: hashToken(token), consumed: false });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest("This verification link is invalid or has expired. Please request a new one.");
  }

  const user = await User.findById(record.user);
  if (!user) throw AppError.notFound("User not found");

  user.phoneVerified = true;
  await user.save();
  record.consumed = true;
  await record.save();

  const tokens = issueTokens(user._id.toString(), user.role);
  ok(res, { user, ...tokens });
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = req.body as { idToken: string };
  if (!env.googleClientId) {
    throw AppError.badRequest("Google Sign-In is not configured on this server.");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw AppError.unauthorized("Invalid Google sign-in token.");
  }
  if (!payload?.email || !payload.email_verified) {
    throw AppError.unauthorized("Google account has no verified email.");
  }

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email: payload.email });
  }

  const isAdminEmail = !!env.adminEmail && payload.email.toLowerCase() === env.adminEmail;

  if (!user) {
    user = await User.create({
      name: payload.name ?? payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture,
      role: isAdminEmail ? "admin" : "customer",
      phoneVerified: true,
      active: true,
    });
  } else {
    if (!user.active) throw AppError.unauthorized("Account no longer active");
    if (!user.googleId) user.googleId = payload.sub;
    if (!user.avatar && payload.picture) user.avatar = payload.picture;
    if (isAdminEmail && user.role !== "admin") user.role = "admin";
    user.phoneVerified = true;
    await user.save();
  }

  const tokens = issueTokens(user._id.toString(), user.role);
  ok(res, { user, ...tokens });
}

export async function resendVerificationEmail(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone: string };

  const user = await User.findOne({ phone });
  if (!user) {
    ok(res, { message: "If that account exists, a verification link has been sent." });
    return;
  }
  if (user.phoneVerified) {
    ok(res, { message: "This account is already verified. Please log in." });
    return;
  }

  await issueEmailVerification(user);
  ok(res, { message: "Verification link sent. Please check your email." });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { phone, code, purpose } = req.body;

  const otpDoc = await Otp.findOne({ phone, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!otpDoc) {
    throw AppError.badRequest("No pending OTP for this phone/purpose. Please request a new one.");
  }
  if (otpDoc.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest("OTP expired. Please request a new one.");
  }
  if (otpDoc.attempts >= 5) {
    throw AppError.badRequest("Too many incorrect attempts. Please request a new OTP.");
  }

  const matches = await bcrypt.compare(code, otpDoc.codeHash);
  if (!matches) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw AppError.badRequest("Incorrect OTP");
  }

  otpDoc.consumed = true;
  await otpDoc.save();

  const user = await User.findOne({ phone });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  if (purpose === "register" || purpose === "login") {
    user.phoneVerified = true;
    await user.save();
    const tokens = issueTokens(user._id.toString(), user.role);
    ok(res, { user, ...tokens });
    return;
  }

  // purpose === "forgot_password": just confirm the OTP is valid; the actual
  // password change happens in resetPassword using a fresh OTP check there.
  ok(res, { message: "OTP verified. You may now reset your password." });
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { phone, purpose } = req.body;
  const user = await User.findOne({ phone });
  if (!user) {
    throw AppError.notFound("No account found for this phone number");
  }
  await issueOtp(phone, purpose);
  ok(res, { message: "OTP sent" });
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

export async function login(req: Request, res: Response): Promise<void> {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });
  if (!user || !user.active) {
    throw AppError.unauthorized("Invalid phone number or password");
  }
  if (!user.passwordHash) {
    throw AppError.unauthorized("This account uses Google Sign-In. Please continue with Google.");
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw AppError.unauthorized(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOGIN_LOCKOUT_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw AppError.unauthorized("Invalid phone number or password");
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save();
  }

  if (!user.phoneVerified) {
    await issueOtp(phone, "login");
    ok(res, { requiresOtp: true, message: "Phone not verified. OTP sent." });
    return;
  }

  const tokens = issueTokens(user._id.toString(), user.role);
  ok(res, { user, ...tokens });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user) {
    // Don't reveal account existence
    ok(res, { message: "If that account exists, an OTP has been sent." });
    return;
  }
  await issueOtp(phone, "forgot_password");
  ok(res, { message: "If that account exists, an OTP has been sent." });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { phone, code, newPassword } = req.body;

  const otpDoc = await Otp.findOne({ phone, purpose: "forgot_password", consumed: false }).sort({
    createdAt: -1,
  });
  if (!otpDoc || otpDoc.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest("OTP invalid or expired. Please request a new one.");
  }
  const matches = await bcrypt.compare(code, otpDoc.codeHash);
  if (!matches) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw AppError.badRequest("Incorrect OTP");
  }

  const user = await User.findOne({ phone });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  otpDoc.consumed = true;
  await otpDoc.save();

  ok(res, { message: "Password reset successful. Please log in." });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  let payload: AuthTokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }
  const user = await User.findById(payload.userId);
  if (!user || !user.active) {
    throw AppError.unauthorized("Account no longer active");
  }
  const tokens = issueTokens(user._id.toString(), user.role);
  ok(res, tokens);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth!.userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  ok(res, user);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { name, email, avatar } = req.body;

  const user = await User.findById(req.auth!.userId);
  if (!user) throw AppError.notFound("User not found");

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  ok(res, user);
}

export async function deleteProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw AppError.notFound("User not found");

  // Soft-delete: deactivate rather than hard-delete, so existing bookings/
  // reviews/wallet history tied to this user stay intact and auditable.
  user.active = false;
  await user.save();

  ok(res, { message: "Account deactivated" });
}
