import type { CaseRecord, CaseType } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  type: CaseType;
  items: CaseRecord[];
  canAct: boolean;
  userId: string;
  onUpdated: () => Promise<void>;
};

const fmtDate = (iso?: string) =>
  iso ? iso.slice(0, 10) : "-";

const fmtDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return `${date} ${time}`;
};

const ACTION_BUTTONS = [
  { action: "approve"        as const, label: "Goedkeuren",         icon: "✔", cls: "act-approve"  },
  { action: "reject"         as const, label: "Afwijzen",           icon: "✖", cls: "act-reject"   },
  { action: "suggest_change" as const, label: "Wijziging voorstellen", icon: "✎", cls: "act-suggest"  },
];

export const CaseTable = ({ type, items, canAct, userId, onUpdated }: Props) => {
  const applyAction = async (id: string, action: "approve" | "reject" | "suggest_change") => {
    const comment = action === "approve" ? undefined : prompt("Geef een toelichting");
    const res = await fetch(`${API_BASE_URL}/cases/${id}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ action, comment })
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
      <h3>{type}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ingediend op</th>
              <th>Ingediend door</th>
              <th>Klantnr.</th>
              <th>Klantnaam</th>
              {type === "Routeafwijking" && <th>Van</th>}
              {type === "Routeafwijking" && <th>Tot</th>}
              <th>Opmerking</th>
              <th>Status</th>
              <th>Besluit op</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={type === "Routeafwijking" ? 10 : 8} style={{ textAlign: "center", color: "#888" }}>
                  Geen meldingen
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="nowrap">{fmtDateTime(item.submissionTime)}</td>
                <td className="nowrap">{item.submittedBy}</td>
                <td className="nowrap">{item.clientNumber || "-"}</td>
                <td>{item.clientName || "-"}</td>
                {type === "Routeafwijking" && <td className="nowrap">{fmtDate(item.fromDate)}</td>}
                {type === "Routeafwijking" && <td className="nowrap">{fmtDate(item.toDate)}</td>}
                <td className="comment-cell">{item.comment}</td>
                <td className="nowrap"><span className={`status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>{item.status}</span></td>
                <td className="nowrap">{fmtDate(item.decidedOn)}</td>
                <td className="nowrap">
                  {canAct && item.status === "Pending" ? (
                    <div className="actions">
                      {ACTION_BUTTONS.map(({ action, label, icon, cls }) => (
                        <button
                          key={action}
                          className={`act-btn ${cls}`}
                          title={label}
                          onClick={() => applyAction(item.id, action)}
                        >
                          <span className="act-icon">{icon}</span>
                          <span className="act-label">{label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
