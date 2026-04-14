import { useEffect, useMemo, useState } from "react";
import { CaseForm } from "./components/CaseForm";
import { CaseTable } from "./components/CaseTable";
import { AdminPanel } from "./components/AdminPanel";
import type { CaseRecord, NotificationSettings, User } from "./types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Tab = "nieuw" | "overzicht" | "instellingen";

export const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("nieuw");

  const currentUser = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  const isSuperadmin = currentUser?.role === "superadmin";
  const canSubmit = currentUser ? (currentUser.party !== "IJsvogel" || isSuperadmin) : false;

  // Re-route to a valid tab when user switches
  const effectiveTab: Tab = (() => {
    if (activeTab === "nieuw" && !canSubmit) return "overzicht";
    if (activeTab === "instellingen" && !isSuperadmin) return "overzicht";
    return activeTab;
  })();

  const loadDevUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/dev-users`);
    if (!res.ok) return;
    const data = await res.json();
    const loadedUsers = (data.users || []) as User[];
    setUsers(loadedUsers);
    if (!userId && loadedUsers.length > 0) {
      setUserId(loadedUsers[0].id);
    }
  };

  const loadOverview = async () => {
    if (!userId) return;
    const res = await fetch(`${API_BASE_URL}/cases/overview`, {
      headers: { "x-user-id": userId }
    });
    if (!res.ok) return;
    const data = await res.json();
    setCases(data.cases || []);
  };

  const loadAdmin = async () => {
    if (!userId || !currentUser) return;
    if (currentUser.role !== "superadmin") return;
    const res = await fetch(`${API_BASE_URL}/admin/notification-settings`, {
      headers: { "x-user-id": userId }
    });
    if (!res.ok) return;
    const data = await res.json();
    setSettings(data.settings);
  };

  const loadUsers = async () => {
    if (!userId || !currentUser) return;
    if (currentUser.role !== "superadmin") return;
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { "x-user-id": userId }
    });
    if (!res.ok) return;
    const data = await res.json();
    setManagedUsers(data.users || []);
  };

  useEffect(() => { void loadDevUsers(); }, []);

  useEffect(() => {
    if (!userId || !currentUser) return;
    void loadOverview();
    void loadAdmin();
    void loadUsers();
  }, [userId, currentUser?.role]);

  const routeItems = cases.filter((c) => c.type === "Routeafwijking");
  const palletItems = cases.filter((c) => c.type === "Palletafwijking");
  const otherItems = cases.filter((c) => c.type === "Ander");

  if (!currentUser) {
    return (
      <div className="layout">
        <header>
          <h1>IJsvogel Portaal</h1>
          <p>Gebruikers laden...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="layout">
      <header>
        <h1>IJsvogel Portaal</h1>
        <label>
          Actieve gebruiker
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.party})
              </option>
            ))}
          </select>
        </label>
      </header>

      <nav className="tabs">
        {canSubmit && (
          <button
            className={`tab-btn${effectiveTab === "nieuw" ? " active" : ""}`}
            onClick={() => setActiveTab("nieuw")}
          >
            Nieuwe melding
          </button>
        )}
        <button
          className={`tab-btn${effectiveTab === "overzicht" ? " active" : ""}`}
          onClick={() => setActiveTab("overzicht")}
        >
          Overzicht
        </button>
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
          <CaseTable
            type="Routeafwijking"
            items={routeItems}
            userParty={currentUser.party}
            userId={userId}
            onUpdated={loadOverview}
          />
          <CaseTable
            type="Palletafwijking"
            items={palletItems}
            userParty={currentUser.party}
            userId={userId}
            onUpdated={loadOverview}
          />
          <CaseTable
            type="Ander"
            items={otherItems}
            userParty={currentUser.party}
            userId={userId}
            onUpdated={loadOverview}
          />
        </>
      )}

      {effectiveTab === "instellingen" && (
        <AdminPanel
          userId={userId}
          settings={settings}
          users={managedUsers}
          onRefresh={loadAdmin}
          onUsersRefresh={loadUsers}
        />
      )}
    </div>
  );
};
