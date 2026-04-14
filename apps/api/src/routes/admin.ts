import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireSuperadmin, type AuthedRequest } from "../middleware/auth";
import {
  appendAudit,
  createPasswordResetToken,
  createUser,
  getClientMap,
  getNotificationSettings,
  getUserById,
  getUserByEmail,
  listUsers,
  updateNotificationSettings,
  upsertClientMap
} from "../services/store";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireSuperadmin);

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  party: z.enum(["Anidis", "NedCargo", "IJsvogel"]),
  role: z.enum(["superadmin", "party_user"]) 
});

adminRouter.get("/users", async (_req, res) => {
  const users = await listUsers();
  return res.json({ users });
});

adminRouter.post("/users", async (req: AuthedRequest, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const exists = await getUserByEmail(parsed.data.email);
  if (exists) {
    return res.status(409).json({ message: "E-mail bestaat al" });
  }

  const newUser = await createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    party: parsed.data.party,
    role: parsed.data.role
  });

  await appendAudit("user_created", req.userId!, newUser.id, newUser.email);
  return res.status(201).json({ user: newUser });
});

const notificationSchema = z.object({
  onSubmission: z.array(z.string().email()),
  onStatusUpdate: z.array(z.string().email()),
  perParty: z.object({
    Anidis: z.array(z.string().email()),
    NedCargo: z.array(z.string().email())
  })
});

adminRouter.get("/notification-settings", async (_req, res) => {
  const settings = await getNotificationSettings();
  return res.json({ settings });
});

adminRouter.put("/notification-settings", async (req: AuthedRequest, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  await updateNotificationSettings(parsed.data);

  await appendAudit("notification_settings_updated", req.userId!);
  const settings = await getNotificationSettings();
  return res.json({ settings });
});

const clientMapSchema = z.object({
  clientNumber: z.string().min(1),
  clientName: z.string().min(1)
});

adminRouter.get("/client-map", async (_req, res) => {
  const map = await getClientMap();
  return res.json({ map });
});

adminRouter.put("/client-map", async (req: AuthedRequest, res) => {
  const parsed = clientMapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const map = await upsertClientMap(parsed.data.clientNumber, parsed.data.clientName);
  await appendAudit("client_map_updated", req.userId!, parsed.data.clientNumber, parsed.data.clientName);

  return res.json({ map });
});

const resetUserSchema = z.object({ userId: z.string() });
adminRouter.post("/users/reset-password", async (req: AuthedRequest, res) => {
  const parsed = resetUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const user = await getUserById(parsed.data.userId);
  if (!user) {
    return res.status(404).json({ message: "Gebruiker niet gevonden" });
  }

  const token = `reset-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  await createPasswordResetToken(user.id, token, expiresAt);

  await appendAudit("password_reset_forced", req.userId!, user.id, user.email);
  console.log(`[MAIL][ADMIN_PASSWORD_RESET] to=${user.email} token=${token}`);
  return res.json({ message: "Resetmail verzonden" });
});
