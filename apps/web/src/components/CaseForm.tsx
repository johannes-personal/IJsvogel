import { useState } from "react";
import type { CaseType } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  type: CaseType;
  userId: string;
  isSuperadmin?: boolean;
  onCreated: () => Promise<void>;
};

export const CaseForm = ({ type, userId, isSuperadmin, onCreated }: Props) => {
  const [clientNumber, setClientNumber] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [comment, setComment] = useState("");
  const [submittedAs, setSubmittedAs] = useState<"Anidis" | "NedCargo">("Anidis");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const payload: Record<string, string> = { type, comment };
      if (clientNumber) payload.clientNumber = clientNumber;
      if (fromDate) payload.fromDate = fromDate;
      if (toDate) payload.toDate = toDate;
      if (isSuperadmin) payload.submittedAs = submittedAs;

      const res = await fetch(`${API_BASE_URL}/cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Indienen mislukt");
        return;
      }

      setClientNumber("");
      setFromDate("");
      setToDate("");
      setComment("");
      await onCreated();
    } finally {
      setBusy(false);
    }
  };

  const clientRequired = type !== "Ander";
  const showRange = type === "Routeafwijking";

  return (
    <div className="card">
      <h3>{type} indienen</h3>
      <div className="form-grid">
        {isSuperadmin && (
          <label>
            Namens partij *
            <select value={submittedAs} onChange={(e) => setSubmittedAs(e.target.value as "Anidis" | "NedCargo")}>
              <option value="Anidis">Anidis</option>
              <option value="NedCargo">NedCargo</option>
            </select>
          </label>
        )}
        <label>
          Klantnummer {clientRequired ? "*" : "(optioneel)"}
          <input value={clientNumber} onChange={(e) => setClientNumber(e.target.value)} />
        </label>
        {showRange && (
          <>
            <label>
              Van *
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label>
              Tot *
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
          </>
        )}
        <label className="wide">
          Opmerking *
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </label>
      </div>
      <button disabled={busy} onClick={submit}>Indienen</button>
    </div>
  );
};
