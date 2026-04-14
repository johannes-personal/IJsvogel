import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  userId: string;
  onClose: () => void;
};

export const ChangePasswordModal = ({ userId, onClose }: Props) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("Nieuwe wachtwoorden komen niet overeen");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ currentPassword: current, newPassword: next })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Wijzigen mislukt");
        return;
      }
      setSuccess(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="card" style={{ width: 360, margin: 0 }}>
        <h3>Wachtwoord wijzigen</h3>
        {success ? (
          <>
            <p style={{ color: "green" }}>Wachtwoord gewijzigd.</p>
            <button onClick={onClose}>Sluiten</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Huidig wachtwoord
                <input type="password" autoComplete="current-password" value={current}
                  onChange={(e) => setCurrent(e.target.value)} required />
              </label>
              <label>
                Nieuw wachtwoord (min. 8 tekens)
                <input type="password" autoComplete="new-password" value={next}
                  onChange={(e) => setNext(e.target.value)} minLength={8} required />
              </label>
              <label>
                Bevestig nieuw wachtwoord
                <input type="password" autoComplete="new-password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required />
              </label>
            </div>
            {error && <p style={{ color: "var(--brand-orange)", marginTop: "0.5rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" disabled={busy}>{busy ? "Bezig…" : "Opslaan"}</button>
              <button type="button" className="act-btn act-cancel" onClick={onClose}>Annuleren</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
