import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import {
  appendAudit,
  createCase,
  getCaseById,
  getClientName,
  getUserById,
  listCases,
  updateCaseDecision
} from "../services/store.js";
import { sendStatusNotification, sendSubmissionNotification } from "../services/mailer.js";

export const caseRouter = Router();
caseRouter.use(requireAuth);

const createCaseSchema = z.object({
  type: z.enum(["Routeafwijking", "Palletafwijking", "Ander"]),
  clientNumber: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  comment: z.string().min(1)
});

caseRouter.get("/overview", async (req: AuthedRequest, res) => {
  const user = await getUserById(req.userId!);
  if (!user) {
    return res.status(401).json({ message: "Niet ingelogd" });
  }

  const cases = await listCases();
  return res.json({ cases });
});

caseRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const user = await getUserById(req.userId!);
  if (!user || user.party === "IJsvogel") {
    return res.status(403).json({ message: "Alleen Anidis/NedCargo kunnen indienen" });
  }

  if (parsed.data.type !== "Ander" && !parsed.data.clientNumber) {
    return res.status(400).json({ message: "Klantnummer is verplicht voor dit type" });
  }

  if (parsed.data.type === "Routeafwijking" && (!parsed.data.fromDate || !parsed.data.toDate)) {
    return res.status(400).json({ message: "Van- en tot-datum zijn verplicht" });
  }

  const clientName = await getClientName(parsed.data.clientNumber);

  const record = await createCase({
    type: parsed.data.type,
    submittedBy: user.party,
    clientNumber: parsed.data.clientNumber,
    clientName,
    fromDate: parsed.data.fromDate,
    toDate: parsed.data.toDate,
    comment: parsed.data.comment,
    createdByUserId: user.id
  });

  await appendAudit("case_created", user.id, record.id, record.type);
  sendSubmissionNotification(record.id, record.submittedBy);

  return res.status(201).json({ case: record });
});

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "suggest_change"]),
  comment: z.string().optional()
});

caseRouter.post("/:id/action", async (req: AuthedRequest, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Ongeldige invoer" });
  }

  const user = await getUserById(req.userId!);
  if (!user) {
    return res.status(401).json({ message: "Niet ingelogd" });
  }

  const current = await getCaseById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "Casus niet gevonden" });
  }

  if (current.status !== "Pending" && !(current.status === "Wijziging voorgesteld" && parsed.data.action === "approve")) {
    return res.status(400).json({ message: "Deze actie is niet toegestaan in huidige status" });
  }

  if (user.role !== "superadmin" && user.party === current.submittedBy) {
    return res.status(403).json({ message: "Eigen casus kan niet beoordeeld worden" });
  }

  const nextStatus =
    parsed.data.action === "approve"
      ? "Approved"
      : parsed.data.action === "reject"
        ? "Rejected"
        : "Wijziging voorgesteld";

  const updated = await updateCaseDecision({
    id: current.id,
    status: nextStatus,
    comment: parsed.data.comment
  });

  await appendAudit("case_status_changed", user.id, updated.id, updated.status);
  sendStatusNotification(updated.id, updated.status);

  return res.json({ case: updated });
});
