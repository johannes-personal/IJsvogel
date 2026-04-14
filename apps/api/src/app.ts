import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { caseRouter } from "./routes/cases.js";
import { adminRouter } from "./routes/admin.js";
import { refreshSupabaseSession } from "./middleware/supabaseSession.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.APP_BASE_URL,
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(refreshSupabaseSession);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/cases", caseRouter);
app.use("/admin", adminRouter);

export default app;
