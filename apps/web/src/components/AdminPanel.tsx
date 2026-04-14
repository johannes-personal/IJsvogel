import { useState } from "react";
import type { NotificationSettings, User } from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type Props = {
  userId: string;
  settings: NotificationSettings | null;
  users: User[];
  onRefresh: () => Promise<void>;
  onUsersRefresh: () => Promise<void>;
};

export const AdminPanel = ({ userId, settings, users, onRefresh, onUsersRefresh }: Props) => {
  const [newEmail, setNewEmail] = useState("");
  const [party, setParty] = useState<"Anidis" | "NedCargo">("Anidis");
  const [clientNumber, setClientNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountParty, setAccountParty] = useState<"Anidis" | "NedCargo" | "IJsvogel">("Anidis");
  const [accountRole, setAccountRole] = useState<"party_user" | "superadmin">("party_user");

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
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify(updated)
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Opslaan mislukt");
      return;
    }

    setNewEmail("");
    await onRefresh();
  };

  const updateClientMap = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/client-map`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ clientNumber, clientName })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Klantmapping mislukt");
      return;
    }

    setClientNumber("");
    setClientName("");
    alert("Klantmapping bijgewerkt");
  };

  const createUser = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({
        email: accountEmail,
        name: accountName,
        party: accountParty,
        role: accountRole
      })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Gebruiker aanmaken mislukt");
      return;
    }

    setAccountEmail("");
    setAccountName("");
    await onUsersRefresh();
  };

  const forceReset = async (targetUserId: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ userId: targetUserId })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Reset mislukt");
      return;
    }

    alert(data.message || "Resetmail verzonden");
  };

  return (
    <div className="card">
      <h3>Superadmin beheer</h3>
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

      <h4>Klantnummer mapping</h4>
      <div className="form-grid">
        <label>
          Klantnummer
          <input value={clientNumber} onChange={(e) => setClientNumber(e.target.value)} />
        </label>
        <label>
          Klantnaam
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </label>
      </div>
      <button onClick={updateClientMap}>Mapping opslaan</button>

      <h4>Gebruiker aanmaken</h4>
      <div className="form-grid">
        <label>
          Naam
          <input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </label>
        <label>
          E-mail
          <input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
        </label>
        <label>
          Partij
          <select value={accountParty} onChange={(e) => setAccountParty(e.target.value as "Anidis" | "NedCargo" | "IJsvogel")}>
            <option>Anidis</option>
            <option>NedCargo</option>
            <option>IJsvogel</option>
          </select>
        </label>
        <label>
          Rol
          <select value={accountRole} onChange={(e) => setAccountRole(e.target.value as "party_user" | "superadmin")}>
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
              <th>Naam</th>
              <th>E-mail</th>
              <th>Partij</th>
              <th>Rol</th>
              <th>Wachtwoord reset</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.party}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={() => forceReset(u.id)}>Reset versturen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {settings && (
        <div className="summary">
          <p><strong>Nieuwe inzendingen:</strong> {settings.onSubmission.join(", ")}</p>
          <p><strong>Statusupdates:</strong> {settings.onStatusUpdate.join(", ")}</p>
          <p><strong>Anidis:</strong> {settings.perParty.Anidis.join(", ")}</p>
          <p><strong>NedCargo:</strong> {settings.perParty.NedCargo.join(", ")}</p>
        </div>
      )}
    </div>
  );
};
