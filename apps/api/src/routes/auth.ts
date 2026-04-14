import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  appendAudit,
  consumeResetToken,
  createPasswordResetToken,
  getUserByEmail,
  getUserById,
  getUserPasswordHash,
  listDevUsers,
  setUserPassword
} from "../services/store.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../services/mailer.js";

export const authRouter = Router();

// Dev helper – list all active users (used in development/testing only)
authRouter.get("/dev-users", async (_req, res) => {
  const users = await listDevUsers();
  return res.json({ users });
});

// GET /auth/me — return the currently logged-in user (identified by x-user-id header)
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await getUserById(req.userId!);
  if (!user) return res.status(404).json({ message: "Gebruiker niet gevonden" });
  return res.json({ user });
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "E-mail en wachtwoord zijn verplicht" });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return res.status(401).json({ message: "Onbekend e-mailadres of onjuist wachtwoord" });
  }
  if (!user.active) {
    return res.status(401).json({ message: "Dit account is gedeactiveerd" });
  }

  const hash = await getUserPasswordHash(user.id);
  if (!hash) {
    // Account exists but no password set yet → must set one via reset flow
    return res.status(401).json({ message: "Geen wachtwoord ingesteld. Gebruik 'Wachtwoord vergeten' om een wachtwoord in te stellen." });
  }

  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!valid) {
    return res.status(401).json({ message: "Onbekend e-mailadres of onjuist wachtwoord" });
  }

  await appendAudit("login", user.id);
  return res.json({ userId: user.id, user });
});

const resetRequestSchema = z.object({ email: z.string().email() });

authRouter.post("/request-password-reset", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  // Always return success to avoid user enumeration
  const user = await getUserByEmail(parsed.data.email);
  if (user && user.active) {
    const token = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await createPasswordResetToken(user.id, token, expiresAt);
    await appendAudit("password_reset_requested", user.id);
    await sendPasswordResetEmail(user.email, token);
  }

  return res.json({ message: "Als het account bestaat, is een resetlink verstuurd" });
});

const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8)
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Wachtwoord moet minimaal 8 tekens bevatten" });
  }

  const userId = await consumeResetToken(parsed.data.token);
  if (!userId) {
    return res.status(400).json({ message: "Ongeldige of verlopen resetlink" });
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await setUserPassword(userId, hash);
  await appendAudit("password_reset_completed", userId);

  return res.json({ message: "Wachtwoord ingesteld" });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8)
});

authRouter.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Nieuw wachtwoord moet minimaal 8 tekens bevatten" });
  }

  const hash = await getUserPasswordHash(req.userId!);
  if (!hash) {
    return res.status(400).json({ message: "Geen wachtwoord ingesteld. Gebruik 'Wachtwoord vergeten'." });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, hash);
  if (!valid) {
    return res.status(401).json({ message: "Huidig wachtwoord is onjuist" });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await setUserPassword(req.userId!, newHash);
  await appendAudit("password_changed", req.userId!);

  return res.json({ message: "Wachtwoord gewijzigd" });
});

