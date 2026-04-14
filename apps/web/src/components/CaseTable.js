import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const STATUS_LABELS = {
    "Pending": "In behandeling",
    "Approved": "Goedgekeurd",
    "Rejected": "Afgewezen",
    "Wijziging voorgesteld": "Wijziging voorgesteld",
};
const STATUS_CSS = {
    "Pending": "status-pending",
    "Approved": "status-approved",
    "Rejected": "status-rejected",
    "Wijziging voorgesteld": "status-wijziging",
};
const fmtDate = (iso) => iso ? iso.slice(0, 10) : "-";
const fmtDateTime = (iso) => {
    if (!iso)
        return "-";
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    return `${date} ${time}`;
};
const ACTION_BUTTONS = [
    { action: "approve", label: "Goedkeuren", icon: "✔", cls: "act-approve" },
    { action: "reject", label: "Afwijzen", icon: "✖", cls: "act-reject" },
    { action: "suggest_change", label: "Wijziging voorstellen", icon: "✎", cls: "act-suggest" },
];
// Base column count: Ingediend op, door, Klantnr., Naam, Postcode, Plaats, Opmerking, Toelichting, Status, Acties, Besluit op = 11
// With route dates: +2 = 13
const BASE_COLS = 11;
const sessionKey = (type) => `filter-active-${type}`;
const readFilter = (type) => {
    const stored = sessionStorage.getItem(sessionKey(type));
    return stored === null ? true : stored === "true";
};
export const CaseTable = ({ type, items, userParty, userId, onUpdated }) => {
    const [editingId, setEditingId] = useState(null);
    const [editState, setEditState] = useState({ clientNumber: "", fromDate: "", toDate: "", comment: "" });
    const [busy, setBusy] = useState(false);
    const [activeOnly, setActiveOnly] = useState(() => readFilter(type));
    const toggleFilter = () => {
        const next = !activeOnly;
        setActiveOnly(next);
        sessionStorage.setItem(sessionKey(type), String(next));
    };
    const visibleItems = activeOnly
        ? items.filter(i => i.status === "Pending" || i.status === "Wijziging voorgesteld")
        : items;
    const totalCols = type === "Routeafwijking" ? BASE_COLS + 2 : BASE_COLS;
    const canActOnItem = (item) => {
        const actionable = item.status === "Pending" || item.status === "Wijziging voorgesteld";
        if (!actionable)
            return false;
        if (userParty === "Anidis")
            return item.submittedBy === "NedCargo";
        if (userParty === "NedCargo")
            return item.submittedBy === "Anidis";
        return true; // IJsvogel/superadmin
    };
    const canEditItem = (item) => {
        if (item.status !== "Pending" && item.status !== "Wijziging voorgesteld")
            return false;
        if (userParty === "IJsvogel")
            return true;
        return item.submittedBy === userParty;
    };
    const startEdit = (item) => {
        setEditState({
            clientNumber: item.clientNumber ?? "",
            fromDate: item.fromDate ?? "",
            toDate: item.toDate ?? "",
            comment: item.comment,
        });
        setEditingId(item.id);
    };
    const cancelEdit = () => setEditingId(null);
    const saveEdit = async (item) => {
        setBusy(true);
        try {
            const body = { comment: editState.comment };
            if (editState.clientNumber)
                body.clientNumber = editState.clientNumber;
            if (editState.fromDate)
                body.fromDate = editState.fromDate;
            if (editState.toDate)
                body.toDate = editState.toDate;
            const res = await fetch(`${API_BASE_URL}/cases/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-user-id": userId },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.message || "Opslaan mislukt");
                return;
            }
            setEditingId(null);
            await onUpdated();
        }
        finally {
            setBusy(false);
        }
    };
    const applyAction = async (id, action) => {
        const comment = action === "approve" ? undefined : prompt("Geef een toelichting");
        const res = await fetch(`${API_BASE_URL}/cases/${id}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": userId },
            body: JSON.stringify({ action, comment }),
        });
        if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Actie mislukt");
            return;
        }
        await onUpdated();
    };
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h3", { children: type }), _jsxs("label", { className: "filter-toggle", children: [_jsx("input", { type: "checkbox", checked: activeOnly, onChange: toggleFilter }), "Alleen actieve meldingen"] })] }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ingediend op" }), _jsx("th", { children: "Ingediend door" }), _jsx("th", { children: "Klantnr." }), _jsx("th", { children: "Klantnaam" }), _jsx("th", { children: "Postcode" }), _jsx("th", { children: "Plaats" }), type === "Routeafwijking" && _jsx("th", { children: "Van" }), type === "Routeafwijking" && _jsx("th", { children: "Tot" }), _jsx("th", { children: "Opmerking" }), _jsx("th", { children: "Toelichting" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Acties" }), _jsx("th", { children: "Besluit op" })] }) }), _jsxs("tbody", { children: [visibleItems.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: totalCols, style: { textAlign: "center", color: "#888" }, children: activeOnly ? "Geen actieve meldingen" : "Geen meldingen" }) })), visibleItems.map((item) => {
                                    const editing = editingId === item.id;
                                    return (_jsxs("tr", { className: editing ? "row-editing" : undefined, children: [_jsx("td", { className: "nowrap", children: fmtDateTime(item.submissionTime) }), _jsx("td", { className: "nowrap", children: item.submittedBy }), _jsx("td", { className: "nowrap", children: editing
                                                    ? _jsx("input", { className: "edit-input", value: editState.clientNumber, onChange: e => setEditState(s => ({ ...s, clientNumber: e.target.value })) })
                                                    : item.clientNumber || "-" }), _jsx("td", { className: "nowrap", children: item.clientName || "-" }), _jsx("td", { className: "nowrap", children: item.clientPostcode || "-" }), _jsx("td", { className: "nowrap", children: item.clientPlaats || "-" }), type === "Routeafwijking" && (_jsx("td", { className: "nowrap", children: editing
                                                    ? _jsx("input", { className: "edit-input", type: "date", value: editState.fromDate, onChange: e => setEditState(s => ({ ...s, fromDate: e.target.value })) })
                                                    : fmtDate(item.fromDate) })), type === "Routeafwijking" && (_jsx("td", { className: "nowrap", children: editing
                                                    ? _jsx("input", { className: "edit-input", type: "date", value: editState.toDate, onChange: e => setEditState(s => ({ ...s, toDate: e.target.value })) })
                                                    : fmtDate(item.toDate) })), _jsx("td", { className: "comment-cell", children: editing
                                                    ? _jsx("textarea", { className: "edit-input", rows: 2, value: editState.comment, onChange: e => setEditState(s => ({ ...s, comment: e.target.value })) })
                                                    : item.comment }), _jsx("td", { className: "comment-cell", children: item.decisionComment || "-" }), _jsx("td", { className: "nowrap", children: _jsx("span", { className: `status-badge ${STATUS_CSS[item.status] ?? ""}`, children: STATUS_LABELS[item.status] ?? item.status }) }), _jsx("td", { className: "nowrap", children: editing ? (_jsxs("div", { className: "actions", children: [_jsxs("button", { className: "act-btn act-approve", disabled: busy, onClick: () => saveEdit(item), children: [_jsx("span", { className: "act-icon", children: "\uD83D\uDCBE" }), _jsx("span", { className: "act-label", children: "Opslaan" })] }), _jsxs("button", { className: "act-btn act-cancel", disabled: busy, onClick: cancelEdit, children: [_jsx("span", { className: "act-icon", children: "\u2715" }), _jsx("span", { className: "act-label", children: "Annuleren" })] })] })) : (_jsxs("div", { className: "actions", children: [canActOnItem(item) && ACTION_BUTTONS.map(({ action, label, icon, cls }) => (_jsxs("button", { className: `act-btn ${cls}`, title: label, onClick: () => applyAction(item.id, action), children: [_jsx("span", { className: "act-icon", children: icon }), _jsx("span", { className: "act-label", children: label })] }, action))), canEditItem(item) && (_jsxs("button", { className: "act-btn act-edit", title: "Bewerken", onClick: () => startEdit(item), children: [_jsx("span", { className: "act-icon", children: "\u270F" }), _jsx("span", { className: "act-label", children: "Bewerken" })] })), !canActOnItem(item) && !canEditItem(item) && "-"] })) }), _jsx("td", { className: "nowrap", children: fmtDateTime(item.decidedOn) })] }, item.id));
                                })] })] }) })] }));
};
