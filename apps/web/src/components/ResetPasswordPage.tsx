import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  token: string;
  onDone: () => void;
};

export const ResetPasswordPage = ({ token, onDone }: Props) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Instellen mislukt");
        return;
      }
      setMessage(data.message || "Wachtwoord ingesteld");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="layout">
      <header>
        <h1>IJsvogel Portaal</h1>
      </header>

      <div style={{ maxWidth: 400, margin: "3rem auto" }}>
        <div className="card">
          <h3>Nieuw wachtwoord instellen</h3>
          {message ? (
            <>
              <p style={{ color: "green" }}>{message}</p>
              <button onClick={onDone}>Naar inlogpagina</button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Nieuw wachtwoord (minimaal 8 tekens)
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label>
                  Bevestig wachtwoord
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </label>
              </div>
              {error && <p style={{ color: "var(--brand-orange)", marginTop: "0.5rem" }}>{error}</p>}
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" disabled={busy}>
                  {busy ? "Bezig…" : "Wachtwoord instellen"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
