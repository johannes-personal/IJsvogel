import { useState } from "react";
import type { CaseRecord, CaseType, Party } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  type: CaseType;
  items: CaseRecord[];
  userParty: Party;
  userId: string;
  onUpdated: () => Promise<void>;
};

const STATUS_LABELS: Record<string, string> = {
  "Pending":               "In behandeling",
  "Approved":              "Goedgekeurd",
  "Rejected":              "Afgewezen",
  "Wijziging voorgesteld": "Wijziging voorgesteld",
};

const STATUS_CSS: Record<string, string> = {
  "Pending":               "status-pending",
  "Approved":              "status-approved",
  "Rejected":              "status-rejected",
  "Wijziging voorgesteld": "status-wijziging",
};

const fmtDate = (iso?: string) => iso ? iso.slice(0, 10) : "-";

const fmtDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return `${date} ${time}`;
};

type EditState = {
  clientNumber: string;
  fromDate: string;
  toDate: string;
  comment: string;
};

const ACTION_BUTTONS = [
  { action: "approve"        as const, label: "Goedkeuren",            icon: "✔", cls: "act-approve" },
  { action: "reject"         as const, label: "Afwijzen",              icon: "✖", cls: "act-reject"  },
  { action: "suggest_change" as const, label: "Wijziging voorstellen", icon: "✎", cls: "act-suggest" },
];

// Base column count: Ingediend op, door, Klantnr., Naam, Postcode, Plaats, Opmerking, Toelichting, Status, Acties, Besluit op = 11
// With route dates: +2 = 13
const BASE_COLS = 11;

const sessionKey = (type: CaseType) => `filter-active-${type}`;

const readFilter = (type: CaseType): boolean => {
  const stored = sessionStorage.getItem(sessionKey(type));
  return stored === null ? true : stored === "true";
};

export const CaseTable = ({ type, items, userParty, userId, onUpdated }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ clientNumber: "", fromDate: "", toDate: "", comment: "" });
  const [busy, setBusy] = useState(false);
  const [activeOnly, setActiveOnly] = useState<boolean>(() => readFilter(type));

  const toggleFilter = () => {
    const next = !activeOnly;
    setActiveOnly(next);
    sessionStorage.setItem(sessionKey(type), String(next));
  };

  const visibleItems = activeOnly
    ? items.filter(i => i.status === "Pending" || i.status === "Wijziging voorgesteld")
    : items;

  const totalCols = type === "Routeafwijking" ? BASE_COLS + 2 : BASE_COLS;

  const canActOnItem = (item: CaseRecord) => {
    const actionable = item.status === "Pending" || item.status === "Wijziging voorgesteld";
    if (!actionable) return false;
    if (userParty === "Anidis")   return item.submittedBy === "NedCargo";
    if (userParty === "NedCargo") return item.submittedBy === "Anidis";
    return true; // IJsvogel/superadmin
  };

  const canEditItem = (item: CaseRecord) => {
    if (item.status !== "Pending" && item.status !== "Wijziging voorgesteld") return false;
    if (userParty === "IJsvogel") return true;
    return item.submittedBy === userParty;
  };

  const canResubmitItem = (item: CaseRecord) => {
    if (item.status !== "Wijziging voorgesteld") return false;
    if (userParty === "IJsvogel") return true;
    return item.submittedBy === userParty;
  };

  const resubmit = async (item: CaseRecord) => {
    setBusy(true);
    try {
      const body: Record<string, string> = { comment: item.comment };
      if (item.clientNumber) body.clientNumber = item.clientNumber;
      if (item.fromDate)     body.fromDate     = item.fromDate;
      if (item.toDate)       body.toDate       = item.toDate;
      const res = await fetch(`${API_BASE_URL}/cases/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Opnieuw indienen mislukt");
        return;
      }
      await onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: CaseRecord) => {
    setEditState({
      clientNumber: item.clientNumber ?? "",
      fromDate:     item.fromDate     ?? "",
      toDate:       item.toDate       ?? "",
      comment:      item.comment,
    });
    setEditingId(item.id);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (item: CaseRecord) => {
    setBusy(true);
    try {
      const body: Record<string, string> = { comment: editState.comment };
      if (editState.clientNumber) body.clientNumber = editState.clientNumber;
      if (editState.fromDate)     body.fromDate     = editState.fromDate;
      if (editState.toDate)       body.toDate       = editState.toDate;

      const res = await fetch(`${API_BASE_URL}/cases/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Opslaan mislukt");
        return;
      }
      setEditingId(null);
      await onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const applyAction = async (id: string, action: "approve" | "reject" | "suggest_change") => {
    const comment = action === "approve" ? undefined : prompt("Geef een toelichting");
    const res = await fetch(`${API_BASE_URL}/cases/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ action, comment }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Actie mislukt");
      return;
    }
    await onUpdated();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>{type}</h3>
        <label className="filter-toggle">
          <input type="checkbox" checked={activeOnly} onChange={toggleFilter} />
          Alleen actieve meldingen
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ingediend op</th>
              <th>Ingediend door</th>
              <th>Klantnr.</th>
              <th>Klantnaam</th>
              <th>Postcode</th>
              <th>Plaats</th>
              {type === "Routeafwijking" && <th>Van</th>}
              {type === "Routeafwijking" && <th>Tot</th>}
              <th>Opmerking</th>
              <th>Opmerking wijziging</th>
              <th>Status</th>
              <th>Acties</th>
              <th>Besluit op</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={totalCols} style={{ textAlign: "center", color: "#888" }}>
                  {activeOnly ? "Geen actieve meldingen" : "Geen meldingen"}
                </td>
              </tr>
            )}
            {visibleItems.map((item) => {
              const editing = editingId === item.id;
              return (
                <tr key={item.id} className={editing ? "row-editing" : undefined}>
                  <td className="nowrap">{fmtDateTime(item.submissionTime)}</td>
                  <td className="nowrap">{item.submittedBy}</td>

                  {/* Klantnr */}
                  <td className="nowrap">
                    {editing
                      ? <input className="edit-input" value={editState.clientNumber} onChange={e => setEditState(s => ({ ...s, clientNumber: e.target.value }))} />
                      : item.clientNumber || "-"}
                  </td>

                  <td className="nowrap">{item.clientName || "-"}</td>
                  <td className="nowrap">{item.clientPostcode || "-"}</td>
                  <td className="nowrap">{item.clientPlaats || "-"}</td>

                  {type === "Routeafwijking" && (
                    <td className="nowrap">
                      {editing
                        ? <input className="edit-input" type="date" value={editState.fromDate} onChange={e => setEditState(s => ({ ...s, fromDate: e.target.value }))} />
                        : fmtDate(item.fromDate)}
                    </td>
                  )}
                  {type === "Routeafwijking" && (
                    <td className="nowrap">
                      {editing
                        ? <input className="edit-input" type="date" value={editState.toDate} onChange={e => setEditState(s => ({ ...s, toDate: e.target.value }))} />
                        : fmtDate(item.toDate)}
                    </td>
                  )}

                  {/* Opmerking */}
                  <td className="comment-cell">
                    {editing
                      ? <textarea className="edit-input" rows={2} value={editState.comment} onChange={e => setEditState(s => ({ ...s, comment: e.target.value }))} />
                      : item.comment}
                  </td>

                  {/* Toelichting (decisionComment) */}
                  <td className="comment-cell">{item.decisionComment || "-"}</td>

                  <td className="nowrap">
                    <span className={`status-badge ${STATUS_CSS[item.status] ?? ""}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>

                  <td className="nowrap">
                    {editing ? (
                      <div className="actions">
                        <button className="act-btn act-approve" disabled={busy} onClick={() => saveEdit(item)}>
                          <span className="act-icon">💾</span>
                          <span className="act-label">Opslaan</span>
                        </button>
                        <button className="act-btn act-cancel" disabled={busy} onClick={cancelEdit}>
                          <span className="act-icon">✕</span>
                          <span className="act-label">Annuleren</span>
                        </button>
                      </div>
                    ) : (
                      <div className="actions">
                        {canActOnItem(item) && ACTION_BUTTONS.map(({ action, label, icon, cls }) => (
                          <button key={action} className={`act-btn ${cls}`} title={label}
                            onClick={() => applyAction(item.id, action)}>
                            <span className="act-icon">{icon}</span>
                            <span className="act-label">{label}</span>
                          </button>
                        ))}
                        {canEditItem(item) && (
                          <button className="act-btn act-edit" title="Bewerken" onClick={() => startEdit(item)}>
                            <span className="act-icon">✏</span>
                            <span className="act-label">Bewerken</span>
                          </button>
                        )}
                        {canResubmitItem(item) && (
                          <button className="act-btn act-approve" title="Opnieuw indienen" disabled={busy} onClick={() => resubmit(item)}>
                            <span className="act-icon">↩</span>
                            <span className="act-label">Opnieuw indienen</span>
                          </button>
                        )}
                        {!canActOnItem(item) && !canEditItem(item) && !canResubmitItem(item) && "-"}
                      </div>
                    )}
                  </td>

                  <td className="nowrap">{fmtDateTime(item.decidedOn)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
