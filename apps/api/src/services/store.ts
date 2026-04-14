import { randomUUID } from "crypto";
import { Pool } from "pg";
import type { CaseRecord, CaseStatus, NotificationSettings, Party, User, UserRole } from "../types.js";

const now = new Date().toISOString();
const earlier = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

type StoredResetToken = { token: string; userId: string; expiresAt: string };
type AuditEntry = { id: string; action: string; at: string; userId: string; entityId?: string; detail?: string };

type MemoryStore = {
  users: User[];
  cases: CaseRecord[];
  clientMap: Record<string, string>;
  notificationSettings: NotificationSettings;
  resetTokens: StoredResetToken[];
  audit: AuditEntry[];
};

const memory: MemoryStore = {
  users: [
    {
      id: "u-superadmin",
      email: "johannes.de.jong@ijsvogelretail.nl",
      name: "IJsvogel Superadmin",
      party: "IJsvogel",
      role: "superadmin",
      active: true,
      createdAt: now
    },
    {
      id: "u-anidis",
      email: "anidis@example.com",
      name: "Anidis Gebruiker",
      party: "Anidis",
      role: "party_user",
      active: true,
      createdAt: now
    },
    {
      id: "u-nedcargo",
      email: "nedcargo@example.com",
      name: "NedCargo Gebruiker",
      party: "NedCargo",
      role: "party_user",
      active: true,
      createdAt: now
    }
  ],
  cases: [
    {
      id: "c-sample-001",
      type: "Routeafwijking",
      submissionTime: earlier(30),
      submittedBy: "Anidis",
      clientNumber: "1001",
      clientName: "Klant Amsterdam",
      fromDate: "2026-04-14",
      toDate: "2026-04-16",
      comment: "Levering moet 2 dagen later vertrekken door voorraadcorrectie.",
      status: "Pending"
    },
    {
      id: "c-sample-002",
      type: "Routeafwijking",
      submissionTime: earlier(72),
      submittedBy: "NedCargo",
      clientNumber: "2002",
      clientName: "Klant Rotterdam",
      fromDate: "2026-04-10",
      toDate: "2026-04-12",
      comment: "Route via Breda voorgesteld vanwege wegwerkzaamheden.",
      status: "Approved",
      decidedOn: earlier(48),
      decisionComment: "Akkoord, planning is aangepast."
    },
    {
      id: "c-sample-003",
      type: "Palletafwijking",
      submissionTime: earlier(20),
      submittedBy: "NedCargo",
      clientNumber: "1001",
      clientName: "Klant Amsterdam",
      comment: "Ontvangst toont 3 pallets minder dan vrachtbrief.",
      status: "Wijziging voorgesteld",
      decidedOn: earlier(12),
      decisionComment: "Graag foto van laadlijst toevoegen."
    },
    {
      id: "c-sample-004",
      type: "Palletafwijking",
      submissionTime: earlier(96),
      submittedBy: "Anidis",
      clientNumber: "2002",
      clientName: "Klant Rotterdam",
      comment: "Twee pallets met transportschade geconstateerd.",
      status: "Rejected",
      decidedOn: earlier(80),
      decisionComment: "Schade niet aantoonbaar bij overdracht."
    },
    {
      id: "c-sample-005",
      type: "Ander",
      submissionTime: earlier(8),
      submittedBy: "Anidis",
      comment: "Losdock was niet beschikbaar binnen afgesproken tijdslot.",
      status: "Pending"
    }
  ],
  clientMap: {
    "1001": "Klant Amsterdam",
    "2002": "Klant Rotterdam"
  },
  notificationSettings: {
    onSubmission: ["johannes.de.jong@ijsvogelretail.nl"],
    onStatusUpdate: ["johannes.de.jong@ijsvogelretail.nl"],
    perParty: {
      Anidis: ["johannes.de.jong@ijsvogelretail.nl"],
      NedCargo: ["johannes.de.jong@ijsvogelretail.nl"]
    }
  },
  resetTokens: [],
  audit: []
};

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const hasPlaceholderDatabaseUrl =
  !rawDatabaseUrl ||
  rawDatabaseUrl.includes("YOUR_SUPABASE") ||
  rawDatabaseUrl.includes("YOUR_") ||
  rawDatabaseUrl.includes("replace-me");

const pool = !hasPlaceholderDatabaseUrl
  ? new Pool({
      connectionString: rawDatabaseUrl,
      ssl: rawDatabaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false }
    })
  : null;

const usingPostgres = Boolean(pool);
console.log(`[store] Mode: ${usingPostgres ? "PostgreSQL (Supabase)" : "In-memory (geen database)"}`);

const mapUserRow = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  party: row.party,
  role: row.role,
  active: row.active,
  createdAt: row.created_at
});

const mapCaseRow = (row: any): CaseRecord => ({
  id: row.id,
  type: row.type,
  submissionTime: row.submission_time,
  submittedBy: row.submitted_by,
  clientNumber: row.client_number ?? undefined,
  clientName: row.client_name ?? undefined,
  fromDate: row.from_date ?? undefined,
  toDate: row.to_date ?? undefined,
  comment: row.comment,
  status: row.status,
  decidedOn: row.decided_on ?? undefined,
  decisionComment: row.decision_comment ?? undefined
});

export const listDevUsers = async (): Promise<User[]> => {
  if (!usingPostgres) {
    return memory.users.filter((u) => u.active);
  }

  const result = await pool!.query("select * from users where active = true order by created_at asc");
  return result.rows.map(mapUserRow);
};

export const getUserById = async (id: string): Promise<User | null> => {
  if (!usingPostgres) {
    return memory.users.find((u) => u.id === id) ?? null;
  }

  const result = await pool!.query("select * from users where id = $1", [id]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!usingPostgres) {
    return memory.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  const result = await pool!.query("select * from users where lower(email) = lower($1)", [email]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
};

export const listUsers = async (): Promise<User[]> => {
  if (!usingPostgres) {
    return memory.users;
  }

  const result = await pool!.query("select * from users order by created_at desc");
  return result.rows.map(mapUserRow);
};

export const createUser = async (input: {
  email: string;
  name: string;
  party: Party;
  role: UserRole;
}): Promise<User> => {
  if (!usingPostgres) {
    const user: User = {
      id: `u-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      email: input.email,
      name: input.name,
      party: input.party,
      role: input.role,
      active: true,
      createdAt: new Date().toISOString()
    };
    memory.users.unshift(user);
    return user;
  }

  const result = await pool!.query(
    "insert into users (email, name, party, role, active) values ($1, $2, $3, $4, true) returning *",
    [input.email, input.name, input.party, input.role]
  );
  return mapUserRow(result.rows[0]);
};

export const createPasswordResetToken = async (userId: string, token: string, expiresAt: string): Promise<void> => {
  if (!usingPostgres) {
    memory.resetTokens.push({ token, userId, expiresAt });
    return;
  }

  await pool!.query(
    "insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)",
    [userId, token, expiresAt]
  );
};

export const getClientName = async (clientNumber?: string): Promise<string | undefined> => {
  if (!clientNumber) {
    return undefined;
  }

  if (!usingPostgres) {
    return memory.clientMap[clientNumber] ?? "Onbekend";
  }

  const result = await pool!.query("select client_name from client_map where client_number = $1", [clientNumber]);
  return result.rows[0]?.client_name ?? "Onbekend";
};

export const listCases = async (): Promise<CaseRecord[]> => {
  if (!usingPostgres) {
    return memory.cases;
  }

  const result = await pool!.query("select * from cases order by submission_time desc");
  return result.rows.map(mapCaseRow);
};

export const createCase = async (payload: {
  type: CaseRecord["type"];
  submittedBy: CaseRecord["submittedBy"];
  clientNumber?: string;
  clientName?: string;
  fromDate?: string;
  toDate?: string;
  comment: string;
  createdByUserId: string;
}): Promise<CaseRecord> => {
  if (!usingPostgres) {
    const record: CaseRecord = {
      id: `c-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      type: payload.type,
      submissionTime: new Date().toISOString(),
      submittedBy: payload.submittedBy,
      clientNumber: payload.clientNumber,
      clientName: payload.clientName,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      comment: payload.comment,
      status: "Pending"
    };
    memory.cases.unshift(record);
    return record;
  }

  const result = await pool!.query(
    `insert into cases (type, submitted_by, client_number, client_name, from_date, to_date, comment, status, created_by_user_id)
     values ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8)
     returning *`,
    [
      payload.type,
      payload.submittedBy,
      payload.clientNumber ?? null,
      payload.clientName ?? null,
      payload.fromDate ?? null,
      payload.toDate ?? null,
      payload.comment,
      payload.createdByUserId
    ]
  );

  return mapCaseRow(result.rows[0]);
};

export const getCaseById = async (id: string): Promise<CaseRecord | null> => {
  if (!usingPostgres) {
    return memory.cases.find((c) => c.id === id) ?? null;
  }

  const result = await pool!.query("select * from cases where id = $1", [id]);
  return result.rows[0] ? mapCaseRow(result.rows[0]) : null;
};

export const updateCaseDecision = async (input: {
  id: string;
  status: CaseStatus;
  comment?: string;
}): Promise<CaseRecord> => {
  if (!usingPostgres) {
    const current = memory.cases.find((c) => c.id === input.id);
    if (!current) {
      throw new Error("Case not found");
    }
    current.status = input.status;
    current.decidedOn = new Date().toISOString();
    current.decisionComment = input.comment;
    return current;
  }

  const result = await pool!.query(
    "update cases set status = $2, decided_on = now(), decision_comment = $3 where id = $1 returning *",
    [input.id, input.status, input.comment ?? null]
  );

  if (!result.rows[0]) {
    throw new Error("Case not found");
  }
  return mapCaseRow(result.rows[0]);
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  if (!usingPostgres) {
    return memory.notificationSettings;
  }

  const rows = (
    await pool!.query("select event_code, party, email from notification_recipients order by created_at asc")
  ).rows;

  const settings: NotificationSettings = {
    onSubmission: [],
    onStatusUpdate: [],
    perParty: {
      Anidis: [],
      NedCargo: []
    }
  };

  for (const row of rows) {
    if (row.event_code === "on_submission" && !row.party) {
      settings.onSubmission.push(row.email);
    }
    if (row.event_code === "on_status_update" && !row.party) {
      settings.onStatusUpdate.push(row.email);
    }
    if (row.party === "Anidis") {
      settings.perParty.Anidis.push(row.email);
    }
    if (row.party === "NedCargo") {
      settings.perParty.NedCargo.push(row.email);
    }
  }

  return settings;
};

export const updateNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  if (!usingPostgres) {
    memory.notificationSettings = settings;
    return;
  }

  await pool!.query("begin");
  try {
    await pool!.query("delete from notification_recipients");

    for (const email of settings.onSubmission) {
      await pool!.query("insert into notification_recipients (event_code, party, email) values ('on_submission', null, $1)", [
        email
      ]);
    }

    for (const email of settings.onStatusUpdate) {
      await pool!.query(
        "insert into notification_recipients (event_code, party, email) values ('on_status_update', null, $1)",
        [email]
      );
    }

    for (const email of settings.perParty.Anidis) {
      await pool!.query("insert into notification_recipients (event_code, party, email) values ('on_submission', 'Anidis', $1)", [
        email
      ]);
    }

    for (const email of settings.perParty.NedCargo) {
      await pool!.query(
        "insert into notification_recipients (event_code, party, email) values ('on_submission', 'NedCargo', $1)",
        [email]
      );
    }

    await pool!.query("commit");
  } catch (error) {
    await pool!.query("rollback");
    throw error;
  }
};

export const getClientMap = async (): Promise<Record<string, string>> => {
  if (!usingPostgres) {
    return memory.clientMap;
  }

  const rows = (await pool!.query("select client_number, client_name from client_map order by client_number asc")).rows;
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.client_number] = row.client_name;
  }
  return map;
};

export const upsertClientMap = async (clientNumber: string, clientName: string): Promise<Record<string, string>> => {
  if (!usingPostgres) {
    memory.clientMap[clientNumber] = clientName;
    return memory.clientMap;
  }

  await pool!.query(
    `insert into client_map (client_number, client_name)
     values ($1, $2)
     on conflict (client_number)
     do update set client_name = excluded.client_name, updated_at = now()`,
    [clientNumber, clientName]
  );

  return getClientMap();
};

export const appendAudit = async (action: string, userId: string, entityId?: string, detail?: string): Promise<void> => {
  if (!usingPostgres) {
    memory.audit.push({
      id: `a-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      action,
      at: new Date().toISOString(),
      userId,
      entityId,
      detail
    });
    return;
  }

  await pool!.query(
    "insert into audit_log (id, action, entity_id, detail, performed_by_user_id) values ($1, $2, $3, $4, $5)",
    [randomUUID(), action, entityId ?? null, detail ?? null, userId]
  );
};
