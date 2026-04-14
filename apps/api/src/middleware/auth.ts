import type { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/store.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ message: "Niet ingelogd" });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "Ongeldige gebruiker" });
  }

  req.userId = userId;
  next();
};

export const requireSuperadmin = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Niet ingelogd" });
  }

  const user = await getUserById(req.userId);
  if (!user || user.role !== "superadmin") {
    return res.status(403).json({ message: "Alleen superadmin" });
  }

  next();
};
