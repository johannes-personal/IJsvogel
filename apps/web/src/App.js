import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { CaseForm } from "./components/CaseForm";
import { CaseTable } from "./components/CaseTable";
import { AdminPanel } from "./components/AdminPanel";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export const App = () => {
    const [users, setUsers] = useState([]);
    const [userId, setUserId] = useState("");
    const [cases, setCases] = useState([]);
    const [settings, setSettings] = useState(null);
    const [managedUsers, setManagedUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("overzicht");
    const currentUser = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);
    const isSuperadmin = currentUser?.role === "superadmin";
    const canSubmit = currentUser ? (currentUser.party !== "IJsvogel" || isSuperadmin) : false;
    // Re-route to a valid tab when user switches
    const effectiveTab = (() => {
        if (activeTab === "nieuw" && !canSubmit)
            return "overzicht";
        if (activeTab === "instellingen" && !isSuperadmin)
            return "overzicht";
        return activeTab;
    })();
    const loadDevUsers = async () => {
        const res = await fetch(`${API_BASE_URL}/auth/dev-users`);
        if (!res.ok)
            return;
        const data = await res.json();
        const loadedUsers = (data.users || []);
        setUsers(loadedUsers);
        if (!userId && loadedUsers.length > 0) {
            setUserId(loadedUsers[0].id);
        }
    };
    const loadOverview = async () => {
        if (!userId)
            return;
        const res = await fetch(`${API_BASE_URL}/cases/overview`, {
            headers: { "x-user-id": userId }
        });
        if (!res.ok)
            return;
        const data = await res.json();
        setCases(data.cases || []);
    };
    const loadAdmin = async () => {
        if (!userId || !currentUser)
            return;
        if (currentUser.role !== "superadmin")
            return;
        const res = await fetch(`${API_BASE_URL}/admin/notification-settings`, {
            headers: { "x-user-id": userId }
        });
        if (!res.ok)
            return;
        const data = await res.json();
        setSettings(data.settings);
    };
    const loadUsers = async () => {
        if (!userId || !currentUser)
            return;
        if (currentUser.role !== "superadmin")
            return;
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { "x-user-id": userId }
        });
        if (!res.ok)
            return;
        const data = await res.json();
        setManagedUsers(data.users || []);
    };
    useEffect(() => { void loadDevUsers(); }, []);
    useEffect(() => {
        if (!userId || !currentUser)
            return;
        void loadOverview();
        void loadAdmin();
        void loadUsers();
    }, [userId, currentUser?.role]);
    const routeItems = cases.filter((c) => c.type === "Routeafwijking");
    const palletItems = cases.filter((c) => c.type === "Palletafwijking");
    const otherItems = cases.filter((c) => c.type === "Ander");
    if (!currentUser) {
        return (_jsx("div", { className: "layout", children: _jsxs("header", { children: [_jsx("h1", { children: "IJsvogel Portaal" }), _jsx("p", { children: "Gebruikers laden..." })] }) }));
    }
    return (_jsxs("div", { className: "layout", children: [_jsxs("header", { children: [_jsx("h1", { children: "IJsvogel Portaal" }), _jsxs("label", { children: ["Actieve gebruiker", _jsx("select", { value: userId, onChange: (e) => setUserId(e.target.value), children: users.map((u) => (_jsxs("option", { value: u.id, children: [u.name, " (", u.party, ")"] }, u.id))) })] })] }), _jsxs("nav", { className: "tabs", children: [_jsx("button", { className: `tab-btn${effectiveTab === "overzicht" ? " active" : ""}`, onClick: () => setActiveTab("overzicht"), children: "Overzicht" }), canSubmit && (_jsx("button", { className: `tab-btn${effectiveTab === "nieuw" ? " active" : ""}`, onClick: () => setActiveTab("nieuw"), children: "Nieuwe melding" })), isSuperadmin && (_jsx("button", { className: `tab-btn${effectiveTab === "instellingen" ? " active" : ""}`, onClick: () => setActiveTab("instellingen"), children: "Instellingen" }))] }), effectiveTab === "nieuw" && (_jsxs("section", { className: "forms-stack", children: [_jsx(CaseForm, { type: "Routeafwijking", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview }), _jsx(CaseForm, { type: "Palletafwijking", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview }), _jsx(CaseForm, { type: "Ander", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview })] })), effectiveTab === "overzicht" && (_jsxs(_Fragment, { children: [_jsx(CaseTable, { type: "Routeafwijking", items: routeItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview }), _jsx(CaseTable, { type: "Palletafwijking", items: palletItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview }), _jsx(CaseTable, { type: "Ander", items: otherItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview })] })), effectiveTab === "instellingen" && (_jsx(AdminPanel, { userId: userId, settings: settings, users: managedUsers, onRefresh: loadAdmin, onUsersRefresh: loadUsers }))] }));
};
