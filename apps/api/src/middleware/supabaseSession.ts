import type { NextFunction, Request, Response } from "express";
import { getSupabaseClient } from "../services/supabase";

export interface SupabaseAuthedRequest extends Request {
  supabaseUserId?: string;
}

export const refreshSupabaseSession = async (
  req: SupabaseAuthedRequest,
  _res: Response,
  next: NextFunction
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    next();
    return;
  }

  const authHeader = req.header("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!bearer) {
    next();
    return;
  }

  const { data, error } = await supabase.auth.getUser(bearer);
  if (!error && data.user) {
    req.supabaseUserId = data.user.id;
  }

  next();
};
