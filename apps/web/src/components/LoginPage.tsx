import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  onLogin: (userId: string) => void;
};

type View = "login" | "forgot";

export const LoginPage = ({ onLogin }: Props) => {
  const [view, setView] = useState<View>("login");

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // forgot password form
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || "Inloggen mislukt");
        return;
      }
      onLogin(data.userId);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    setResetBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      setResetMsg(data.message || "Verstuurd");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="layout">
      <header>
        <h1>IJsvogel Portaal</h1>
      </header>

      <div style={{ maxWidth: 400, margin: "3rem auto" }}>
        {view === "login" ? (
          <div className="card">
            <h3>Inloggen</h3>
            <form onSubmit={handleLogin}>
              <div className="form-grid">
                <label>
                  E-mailadres
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Wachtwoord
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
              </div>
              {loginError && (
                <p style={{ color: "var(--brand-orange)", marginTop: "0.5rem" }}>{loginError}</p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <button type="submit" disabled={loginBusy}>
                  {loginBusy ? "Bezig…" : "Inloggen"}
                </button>
                <button type="button" className="act-btn act-cancel" onClick={() => setView("forgot")}>
                  Wachtwoord vergeten?
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card">
            <h3>Wachtwoord vergeten</h3>
            {resetMsg ? (
              <>
                <p>{resetMsg}</p>
                <button onClick={() => { setView("login"); setResetMsg(""); }}>Terug naar inloggen</button>
              </>
            ) : (
              <form onSubmit={handleForgot}>
                <div className="form-grid">
                  <label>
                    E-mailadres
                    <input
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button type="submit" disabled={resetBusy}>
                    {resetBusy ? "Versturen…" : "Resetlink versturen"}
                  </button>
                  <button type="button" className="act-btn act-cancel" onClick={() => setView("login")}>
                    Terug
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
