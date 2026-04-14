import { useEffect, useState } from "react";
import type { CaseRecord, NotificationSettings, Party, Role, User } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  userId: string;
  settings: NotificationSettings | null;
  users: User[];
  onRefresh: () => Promise<void>;
  onUsersRefresh: () => Promise<void>;
};

type EditingUser = {
  id: string;
  name: string;
  email: string;
  party: Party;
  role: Role;
  active: boolean;
};

const DUTCH_STATUS: Record<string, string> = {
  Pending: "In behandeling",
  Approved: "Goedgekeurd",
  Rejected: "Afgewezen",
  "Wijziging voorgesteld": "Wijziging voorgesteld"
};

export const AdminPanel = ({ userId, settings, users, onRefresh, onUsersRefresh }: Props) => {
  const [newEmail, setNewEmail] = useState("");
  const [party, setParty] = useState<"Anidis" | "NedCargo">("Anidis");
  const [clientNumber, setClientNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountParty, setAccountParty] = useState<Party>("Anidis");
  const [accountRole, setAccountRole] = useState<Role>("party_user");

  // user inline edit
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);

  // cases management
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [casesLoaded, setCasesLoaded] = useState(false);

  const loadCases = async () => {
    const res = await fetch(`${API_BASE_URL}/cases/overview`, {
      headers: { "x-user-id": userId }
    });
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases ?? []);
    }
    setCasesLoaded(true);
  };

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPartyEmail = async () => {
    if (!settings || !newEmail) return;
    const updated = {
      ...settings,
      perParty: {
        ...settings.perParty,
        [party]: Array.from(new Set([...settings.perParty[party], newEmail]))
      }
    };
    const res = await fetch(`${API_BASE_URL}/admin/notification-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(updated)
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Opslaan mislukt"); return; }
    setNewEmail("");
    await onRefresh();
  };

  const updateClientMap = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/client-map`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ clientNumber, clientName })
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Klantmapping mislukt"); return; }
    setClientNumber("");
    setClientName("");
    alert("Klantmapping bijgewerkt");
  };

  const createUser = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ email: accountEmail, name: accountName, party: accountParty, role: accountRole })
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Gebruiker aanmaken mislukt"); return; }
    setAccountEmail("");
    setAccountName("");
    await onUsersRefresh();
  };

  const forceReset = async (targetUserId: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ userId: targetUserId })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || "Reset mislukt"); return; }
    // If a token was returned (no SMTP configured), show the reset link
    if (data.token) {
      const link = `${window.location.origin}?reset=${data.token}`;
      prompt("Kopieer deze resetlink en stuur deze handmatig naar de gebruiker:", link);
    } else {
      alert(data.message || "Resetmail verzonden");
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const res = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ name: editingUser.name, email: editingUser.email, party: editingUser.party, role: editingUser.role, active: editingUser.active })
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Opslaan mislukt"); return; }
    setEditingUser(null);
    await onUsersRefresh();
  };

  const removeUser = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Gebruiker "${targetName}" definitief verwijderen?`)) return;
    const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}`, {
      method: "DELETE",
      headers: { "x-user-id": userId }
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Verwijderen mislukt"); return; }
    await onUsersRefresh();
  };

  const removeCase = async (caseId: string) => {
    if (!confirm("Casus definitief verwijderen?")) return;
    const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
      headers: { "x-user-id": userId }
    });
    if (!res.ok) { const d = await res.json(); alert(d.message || "Verwijderen mislukt"); return; }
    setCases((prev) => prev.filter((c) => c.id !== caseId));
  };

  return (
    <div className="card">
      <h3>Superadmin beheer</h3>

      <h4>Melding e-mails</h4>
      <div className="form-grid">
        <label>
          Partij
          <select value={party} onChange={(e) => setParty(e.target.value as "Anidis" | "NedCargo")}>
            <option>Anidis</option>
            <option>NedCargo</option>
          </select>
        </label>
        <label>
          E-mailadres voor meldingen
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </label>
      </div>
      <button onClick={addPartyEmail}>E-mail toevoegen</button>

      {settings && (
        <div className="summary" style={{ marginTop: "0.5rem" }}>
          <p><strong>Nieuwe inzendingen:</strong> {settings.onSubmission.join(", ")}</p>
          <p><strong>Statusupdates:</strong> {settings.onStatusUpdate.join(", ")}</p>
          <p><strong>Anidis:</strong> {settings.perParty.Anidis.join(", ")}</p>
          <p><strong>NedCargo:</strong> {settings.perParty.NedCargo.join(", ")}</p>
        </div>
      )}

      <h4>Klantnummer mapping</h4>
      <div className="form-grid">
        <label>Klantnummer<input value={clientNumber} onChange={(e) => setClientNumber(e.target.value)} /></label>
        <label>Klantnaam<input value={clientName} onChange={(e) => setClientName(e.target.value)} /></label>
      </div>
      <button onClick={updateClientMap}>Mapping opslaan</button>

      <h4>Gebruiker aanmaken</h4>
      <div className="form-grid">
        <label>Naam<input value={accountName} onChange={(e) => setAccountName(e.target.value)} /></label>
        <label>E-mail<input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} /></label>
        <label>
          Partij
          <select value={accountParty} onChange={(e) => setAccountParty(e.target.value as Party)}>
            <option>Anidis</option><option>NedCargo</option><option>IJsvogel</option>
          </select>
        </label>
        <label>
          Rol
          <select value={accountRole} onChange={(e) => setAccountRole(e.target.value as Role)}>
            <option value="party_user">party_user</option>
            <option value="superadmin">superadmin</option>
          </select>
        </label>
      </div>
      <button onClick={createUser}>Account aanmaken</button>

      <h4>Gebruikers</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Naam</th><th>E-mail</th><th>Partij</th><th>Rol</th><th>Actief</th><th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isEditing = editingUser?.id === u.id;
              return (
                <tr key={u.id}>
                  <td>
                    {isEditing
                      ? <input value={editingUser!.name} onChange={(e) => setEditingUser({ ...editingUser!, name: e.target.value })} />
                      : u.name}
                  </td>
                  <td>
                    {isEditing
                      ? <input value={editingUser!.email} onChange={(e) => setEditingUser({ ...editingUser!, email: e.target.value })} />
                      : u.email}
                  </td>
                  <td>
                    {isEditing
                      ? (
                        <select value={editingUser!.party} onChange={(e) => setEditingUser({ ...editingUser!, party: e.target.value as Party })}>
                          <option>Anidis</option><option>NedCargo</option><option>IJsvogel</option>
                        </select>
                      )
                      : u.party}
                  </td>
                  <td>
                    {isEditing
                      ? (
                        <select value={editingUser!.role} onChange={(e) => setEditingUser({ ...editingUser!, role: e.target.value as Role })}>
                          <option value="party_user">party_user</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      )
                      : u.role}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {isEditing
                      ? <input type="checkbox" checked={editingUser!.active} onChange={(e) => setEditingUser({ ...editingUser!, active: e.target.checked })} />
                      : <span style={{ color: u.active ? "green" : "#aaa" }}>{u.active ? "✔" : "✖"}</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {isEditing ? (
                      <>
                        <button className="act-btn act-approve" onClick={saveUser}>Opslaan</button>{" "}
                        <button className="act-btn act-cancel" onClick={() => setEditingUser(null)}>Annuleren</button>
                      </>
                    ) : (
                      <>
                        <button className="act-btn act-edit" onClick={() => setEditingUser({ id: u.id, name: u.name, email: u.email, party: u.party, role: u.role, active: u.active })}>Bewerken</button>{" "}
                        <button className="act-btn act-cancel" onClick={() => forceReset(u.id)}>Reset</button>{" "}
                        {u.id !== userId && (
                          <button className="act-btn act-reject" onClick={() => removeUser(u.id, u.name)}>Verwijderen</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h4>Meldingen beheren</h4>
      {!casesLoaded ? (
        <p>Laden…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ingediend op</th><th>Ingediend door</th><th>Type</th><th>Klantnr.</th><th>Status</th><th>Verwijderen</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center" }}>Geen meldingen</td></tr>
              ) : cases.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(c.submissionTime).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{c.submittedBy}</td>
                  <td>{c.type}</td>
                  <td>{c.clientNumber ?? "—"}</td>
                  <td>{DUTCH_STATUS[c.status] ?? c.status}</td>
                  <td>
                    <button className="act-btn act-reject" onClick={() => removeCase(c.id)}>Verwijderen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
