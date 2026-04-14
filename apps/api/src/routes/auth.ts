import { Router } from "express";
import { z } from "zod";
import { appendAudit, createPasswordResetToken, getUserByEmail, listDevUsers } from "../services/store";

export const authRouter = Router();

authRouter.get("/dev-users", async (_req, res) => {
  const users = await listDevUsers();
  return res.json({ users });
});

const loginSchema = z.object({
  email: z.string().email()
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (user && !user.active) {
    return res.status(401).json({ message: "Gebruiker niet actief" });
  }
  if (!user) {
    return res.status(401).json({ message: "Gebruiker niet gevonden" });
  }

  await appendAudit("login", user.id);
  return res.json({
    token: `dev-token-${user.id}`,
    user
  });
});

const resetRequestSchema = z.object({
  email: z.string().email()
});

authRouter.post("/request-password-reset", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return res.json({ message: "Als het account bestaat, is een resetlink verstuurd" });
  }

  const token = `reset-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  await createPasswordResetToken(user.id, token, expiresAt);
  await appendAudit("password_reset_requested", user.id);

  console.log(`[MAIL][PASSWORD_RESET] to=${user.email} token=${token}`);
  return res.json({ message: "Resetlink verzonden" });
});
