import type { CaseRecord, CaseType } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  type: CaseType;
  items: CaseRecord[];
  canAct: boolean;
  userId: string;
  onUpdated: () => Promise<void>;
};

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
              <th>Klantnummer</th>
              <th>Klantnaam</th>
              {type === "Routeafwijking" && <th>Van</th>}
              {type === "Routeafwijking" && <th>Tot</th>}
              <th>Opmerking</th>
              <th>Status</th>
              <th>Goedgekeurd/Afgewezen op</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={type === "Routeafwijking" ? 10 : 8}>Geen meldingen</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.submissionTime).toLocaleString("nl-NL")}</td>
                <td>{item.submittedBy}</td>
                <td>{item.clientNumber || "-"}</td>
                <td>{item.clientName || "-"}</td>
                {type === "Routeafwijking" && <td>{item.fromDate || "-"}</td>}
                {type === "Routeafwijking" && <td>{item.toDate || "-"}</td>}
                <td>{item.comment}</td>
                <td>{item.status}</td>
                <td>{item.decidedOn ? new Date(item.decidedOn).toLocaleDateString("nl-NL") : "-"}</td>
                <td>
                  {canAct && item.status === "Pending" ? (
                    <div className="actions">
                      <button onClick={() => applyAction(item.id, "approve")}>Goedkeuren</button>
                      <button onClick={() => applyAction(item.id, "reject")}>Afwijzen</button>
                      <button onClick={() => applyAction(item.id, "suggest_change")}>Wijziging voorstellen</button>
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
