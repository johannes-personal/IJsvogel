import { useEffect, useState } from "react";
import { CaseForm } from "./components/CaseForm";
import { CaseTable } from "./components/CaseTable";
import { AdminPanel } from "./components/AdminPanel";
import { LoginPage } from "./components/LoginPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import type { CaseRecord, NotificationSettings, User } from "./types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const STORAGE_KEY = "ijsvogel_user_id";

type Tab = "nieuw" | "overzicht" | "instellingen";

export const App = () => {
  // Check URL for password-reset token
  const resetToken = new URLSearchParams(window.location.search).get("reset");

  const [userId, setUserId] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overzicht");
  const [showChangePw, setShowChangePw] = useState(false);

  const isSuperadmin = currentUser?.role === "superadmin";
  const canSubmit = currentUser ? (currentUser.party !== "IJsvogel" || isSuperadmin) : false;

  const effectiveTab: Tab = (() => {
    if (activeTab === "nieuw" && !canSubmit) return "overzicht";
    if (activeTab === "instellingen" && !isSuperadmin) return "overzicht";
    return activeTab;
  })();

  // Verify stored userId on mount
  useEffect(() => {
    const verify = async () => {
      if (!userId) { setAuthLoading(false); return; }
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { "x-user-id": userId } });
      if (!res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        setUserId("");
        setCurrentUser(null);
      } else {
        const data = await res.json();
        setCurrentUser(data.user);
      }
      setAuthLoading(false);
    };
    void verify();
  }, []);

  const handleLogin = (loggedInUserId: string) => {
    localStorage.setItem(STORAGE_KEY, loggedInUserId);
    setUserId(loggedInUserId);
    // Fetch user object
    fetch(`${API_BASE_URL}/auth/me`, { headers: { "x-user-id": loggedInUserId } })
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user));
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId("");
    setCurrentUser(null);
    setCases([]);
    setSettings(null);
    setManagedUsers([]);
  };

  const loadOverview = async () => {
    if (!userId) return;
    const res = await fetch(`${API_BASE_URL}/cases/overview`, { headers: { "x-user-id": userId } });
    if (!res.ok) return;
    const data = await res.json();
    setCases(data.cases || []);
  };

  const loadAdmin = async () => {
    if (!userId || !isSuperadmin) return;
    const res = await fetch(`${API_BASE_URL}/admin/notification-settings`, { headers: { "x-user-id": userId } });
    if (!res.ok) return;
    setSettings((await res.json()).settings);
  };

  const loadUsers = async () => {
    if (!userId || !isSuperadmin) return;
    const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { "x-user-id": userId } });
    if (!res.ok) return;
    setManagedUsers((await res.json()).users || []);
  };

  useEffect(() => {
    if (!userId || !currentUser) return;
    void loadOverview();
    void loadAdmin();
    void loadUsers();
  }, [userId, currentUser?.role]);

  const routeItems  = cases.filter((c) => c.type === "Routeafwijking");
  const palletItems = cases.filter((c) => c.type === "Palletafwijking");
  const otherItems  = cases.filter((c) => c.type === "Ander");

  // Show reset page if URL has ?reset=...
  if (resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => { window.history.replaceState({}, "", "/"); }}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="layout">
        <header><h1>IJsvogel Portaal</h1></header>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      {showChangePw && (
        <ChangePasswordModal userId={userId} onClose={() => setShowChangePw(false)} />
      )}

      <header>
        <h1>IJsvogel Portaal</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.9rem" }}>
            {currentUser.name} <span style={{ opacity: 0.75 }}>({currentUser.party})</span>
          </span>
          <button
            className="act-btn act-cancel"
            style={{ fontSize: "0.8rem" }}
            onClick={() => setShowChangePw(true)}
            title="Wachtwoord wijzigen"
          >
            🔑 Wachtwoord
          </button>
          <button
            className="act-btn act-reject"
            style={{ fontSize: "0.8rem" }}
            onClick={handleLogout}
          >
            Uitloggen
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab-btn${effectiveTab === "overzicht" ? " active" : ""}`}
          onClick={() => setActiveTab("overzicht")}
        >
          Overzicht
        </button>
        {canSubmit && (
          <button
            className={`tab-btn${effectiveTab === "nieuw" ? " active" : ""}`}
            onClick={() => setActiveTab("nieuw")}
          >
            Nieuwe melding
          </button>
        )}
        {isSuperadmin && (
          <button
            className={`tab-btn${effectiveTab === "instellingen" ? " active" : ""}`}
            onClick={() => setActiveTab("instellingen")}
          >
            Instellingen
          </button>
        )}
      </nav>

      {effectiveTab === "nieuw" && (
        <section className="forms-stack">
          <CaseForm type="Routeafwijking" userId={userId} isSuperadmin={isSuperadmin} onCreated={loadOverview} />
          <CaseForm type="Palletafwijking" userId={userId} isSuperadmin={isSuperadmin} onCreated={loadOverview} />
          <CaseForm type="Ander" userId={userId} isSuperadmin={isSuperadmin} onCreated={loadOverview} />
        </section>
      )}

      {effectiveTab === "overzicht" && (
        <>
          <CaseTable type="Routeafwijking" items={routeItems} userParty={currentUser.party} userId={userId} onUpdated={loadOverview} />
          <CaseTable type="Palletafwijking" items={palletItems} userParty={currentUser.party} userId={userId} onUpdated={loadOverview} />
          <CaseTable type="Ander" items={otherItems} userParty={currentUser.party} userId={userId} onUpdated={loadOverview} />
        </>
      )}

      {effectiveTab === "instellingen" && (
        <AdminPanel userId={userId} settings={settings} users={managedUsers} onRefresh={loadAdmin} onUsersRefresh={loadUsers} />
      )}
    </div>
  );
};
