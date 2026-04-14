import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const DUTCH_STATUS = {
    Pending: "In behandeling",
    Approved: "Goedgekeurd",
    Rejected: "Afgewezen",
    "Wijziging voorgesteld": "Wijziging voorgesteld"
};
export const AdminPanel = ({ userId, settings, users, onRefresh, onUsersRefresh }) => {
    const [newEmail, setNewEmail] = useState("");
    const [party, setParty] = useState("Anidis");
    const [clientNumber, setClientNumber] = useState("");
    const [clientName, setClientName] = useState("");
    const [accountEmail, setAccountEmail] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountParty, setAccountParty] = useState("Anidis");
    const [accountRole, setAccountRole] = useState("party_user");
    // user inline edit
    const [editingUser, setEditingUser] = useState(null);
    // cases management
    const [cases, setCases] = useState([]);
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
        if (!settings || !newEmail)
            return;
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
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Opslaan mislukt");
            return;
        }
        setNewEmail("");
        await onRefresh();
    };
    const updateClientMap = async () => {
        const res = await fetch(`${API_BASE_URL}/admin/client-map`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-user-id": userId },
            body: JSON.stringify({ clientNumber, clientName })
        });
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Klantmapping mislukt");
            return;
        }
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
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Gebruiker aanmaken mislukt");
            return;
        }
        setAccountEmail("");
        setAccountName("");
        await onUsersRefresh();
    };
    const forceReset = async (targetUserId) => {
        const res = await fetch(`${API_BASE_URL}/admin/users/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": userId },
            body: JSON.stringify({ userId: targetUserId })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Reset mislukt");
            return;
        }
        // If a token was returned (no SMTP configured), show the reset link
        if (data.token) {
            const link = `${window.location.origin}?reset=${data.token}`;
            prompt("Kopieer deze resetlink en stuur deze handmatig naar de gebruiker:", link);
        }
        else {
            alert(data.message || "Resetmail verzonden");
        }
    };
    const saveUser = async () => {
        if (!editingUser)
            return;
        const res = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-user-id": userId },
            body: JSON.stringify({ name: editingUser.name, email: editingUser.email, party: editingUser.party, role: editingUser.role, active: editingUser.active })
        });
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Opslaan mislukt");
            return;
        }
        setEditingUser(null);
        await onUsersRefresh();
    };
    const removeUser = async (targetUserId, targetName) => {
        if (!confirm(`Gebruiker "${targetName}" definitief verwijderen?`))
            return;
        const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}`, {
            method: "DELETE",
            headers: { "x-user-id": userId }
        });
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Verwijderen mislukt");
            return;
        }
        await onUsersRefresh();
    };
    const removeCase = async (caseId) => {
        if (!confirm("Casus definitief verwijderen?"))
            return;
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
            method: "DELETE",
            headers: { "x-user-id": userId }
        });
        if (!res.ok) {
            const d = await res.json();
            alert(d.message || "Verwijderen mislukt");
            return;
        }
        setCases((prev) => prev.filter((c) => c.id !== caseId));
    };
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Superadmin beheer" }), _jsx("h4", { children: "Melding e-mails" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["Partij", _jsxs("select", { value: party, onChange: (e) => setParty(e.target.value), children: [_jsx("option", { children: "Anidis" }), _jsx("option", { children: "NedCargo" })] })] }), _jsxs("label", { children: ["E-mailadres voor meldingen", _jsx("input", { value: newEmail, onChange: (e) => setNewEmail(e.target.value) })] })] }), _jsx("button", { onClick: addPartyEmail, children: "E-mail toevoegen" }), settings && (_jsxs("div", { className: "summary", style: { marginTop: "0.5rem" }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Nieuwe inzendingen:" }), " ", settings.onSubmission.join(", ")] }), _jsxs("p", { children: [_jsx("strong", { children: "Statusupdates:" }), " ", settings.onStatusUpdate.join(", ")] }), _jsxs("p", { children: [_jsx("strong", { children: "Anidis:" }), " ", settings.perParty.Anidis.join(", ")] }), _jsxs("p", { children: [_jsx("strong", { children: "NedCargo:" }), " ", settings.perParty.NedCargo.join(", ")] })] })), _jsx("h4", { children: "Klantnummer mapping" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["Klantnummer", _jsx("input", { value: clientNumber, onChange: (e) => setClientNumber(e.target.value) })] }), _jsxs("label", { children: ["Klantnaam", _jsx("input", { value: clientName, onChange: (e) => setClientName(e.target.value) })] })] }), _jsx("button", { onClick: updateClientMap, children: "Mapping opslaan" }), _jsx("h4", { children: "Gebruiker aanmaken" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["Naam", _jsx("input", { value: accountName, onChange: (e) => setAccountName(e.target.value) })] }), _jsxs("label", { children: ["E-mail", _jsx("input", { value: accountEmail, onChange: (e) => setAccountEmail(e.target.value) })] }), _jsxs("label", { children: ["Partij", _jsxs("select", { value: accountParty, onChange: (e) => setAccountParty(e.target.value), children: [_jsx("option", { children: "Anidis" }), _jsx("option", { children: "NedCargo" }), _jsx("option", { children: "IJsvogel" })] })] }), _jsxs("label", { children: ["Rol", _jsxs("select", { value: accountRole, onChange: (e) => setAccountRole(e.target.value), children: [_jsx("option", { value: "party_user", children: "party_user" }), _jsx("option", { value: "superadmin", children: "superadmin" })] })] })] }), _jsx("button", { onClick: createUser, children: "Account aanmaken" }), _jsx("h4", { children: "Gebruikers" }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Naam" }), _jsx("th", { children: "E-mail" }), _jsx("th", { children: "Partij" }), _jsx("th", { children: "Rol" }), _jsx("th", { children: "Actief" }), _jsx("th", { children: "Acties" })] }) }), _jsx("tbody", { children: users.map((u) => {
                                const isEditing = editingUser?.id === u.id;
                                return (_jsxs("tr", { children: [_jsx("td", { children: isEditing
                                                ? _jsx("input", { value: editingUser.name, onChange: (e) => setEditingUser({ ...editingUser, name: e.target.value }) })
                                                : u.name }), _jsx("td", { children: isEditing
                                                ? _jsx("input", { value: editingUser.email, onChange: (e) => setEditingUser({ ...editingUser, email: e.target.value }) })
                                                : u.email }), _jsx("td", { children: isEditing
                                                ? (_jsxs("select", { value: editingUser.party, onChange: (e) => setEditingUser({ ...editingUser, party: e.target.value }), children: [_jsx("option", { children: "Anidis" }), _jsx("option", { children: "NedCargo" }), _jsx("option", { children: "IJsvogel" })] }))
                                                : u.party }), _jsx("td", { children: isEditing
                                                ? (_jsxs("select", { value: editingUser.role, onChange: (e) => setEditingUser({ ...editingUser, role: e.target.value }), children: [_jsx("option", { value: "party_user", children: "party_user" }), _jsx("option", { value: "superadmin", children: "superadmin" })] }))
                                                : u.role }), _jsx("td", { style: { textAlign: "center" }, children: isEditing
                                                ? _jsx("input", { type: "checkbox", checked: editingUser.active, onChange: (e) => setEditingUser({ ...editingUser, active: e.target.checked }) })
                                                : _jsx("span", { style: { color: u.active ? "green" : "#aaa" }, children: u.active ? "✔" : "✖" }) }), _jsx("td", { style: { whiteSpace: "nowrap" }, children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "act-btn act-approve", onClick: saveUser, children: "Opslaan" }), " ", _jsx("button", { className: "act-btn act-cancel", onClick: () => setEditingUser(null), children: "Annuleren" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "act-btn act-edit", onClick: () => setEditingUser({ id: u.id, name: u.name, email: u.email, party: u.party, role: u.role, active: u.active }), children: "Bewerken" }), " ", _jsx("button", { className: "act-btn act-cancel", onClick: () => forceReset(u.id), children: "Reset" }), " ", u.id !== userId && (_jsx("button", { className: "act-btn act-reject", onClick: () => removeUser(u.id, u.name), children: "Verwijderen" }))] })) })] }, u.id));
                            }) })] }) }), _jsx("h4", { children: "Meldingen beheren" }), !casesLoaded ? (_jsx("p", { children: "Laden\u2026" })) : (_jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ingediend op" }), _jsx("th", { children: "Ingediend door" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Klantnr." }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Verwijderen" })] }) }), _jsx("tbody", { children: cases.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: { textAlign: "center" }, children: "Geen meldingen" }) })) : cases.map((c) => (_jsxs("tr", { children: [_jsx("td", { style: { whiteSpace: "nowrap" }, children: new Date(c.submissionTime).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" }) }), _jsx("td", { children: c.submittedBy }), _jsx("td", { children: c.type }), _jsx("td", { children: c.clientNumber ?? "—" }), _jsx("td", { children: DUTCH_STATUS[c.status] ?? c.status }), _jsx("td", { children: _jsx("button", { className: "act-btn act-reject", onClick: () => removeCase(c.id), children: "Verwijderen" }) })] }, c.id))) })] }) }))] }));
};
