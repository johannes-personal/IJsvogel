import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { CaseForm } from "./components/CaseForm";
import { CaseTable } from "./components/CaseTable";
import { AdminPanel } from "./components/AdminPanel";
import { LoginPage } from "./components/LoginPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const STORAGE_KEY = "ijsvogel_user_id";
export const App = () => {
    // Check URL for password-reset token
    const resetToken = new URLSearchParams(window.location.search).get("reset");
    const [userId, setUserId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [cases, setCases] = useState([]);
    const [settings, setSettings] = useState(null);
    const [managedUsers, setManagedUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("overzicht");
    const [showChangePw, setShowChangePw] = useState(false);
    const isSuperadmin = currentUser?.role === "superadmin";
    const canSubmit = currentUser ? (currentUser.party !== "IJsvogel" || isSuperadmin) : false;
    const effectiveTab = (() => {
        if (activeTab === "nieuw" && !canSubmit)
            return "overzicht";
        if (activeTab === "instellingen" && !isSuperadmin)
            return "overzicht";
        return activeTab;
    })();
    // Verify stored userId on mount
    useEffect(() => {
        const verify = async () => {
            if (!userId) {
                setAuthLoading(false);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { "x-user-id": userId } });
            if (!res.ok) {
                localStorage.removeItem(STORAGE_KEY);
                setUserId("");
                setCurrentUser(null);
            }
            else {
                const data = await res.json();
                setCurrentUser(data.user);
            }
            setAuthLoading(false);
        };
        void verify();
    }, []);
    const handleLogin = (loggedInUserId) => {
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
        if (!userId)
            return;
        const res = await fetch(`${API_BASE_URL}/cases/overview`, { headers: { "x-user-id": userId } });
        if (!res.ok)
            return;
        const data = await res.json();
        setCases(data.cases || []);
    };
    const loadAdmin = async () => {
        if (!userId || !isSuperadmin)
            return;
        const res = await fetch(`${API_BASE_URL}/admin/notification-settings`, { headers: { "x-user-id": userId } });
        if (!res.ok)
            return;
        setSettings((await res.json()).settings);
    };
    const loadUsers = async () => {
        if (!userId || !isSuperadmin)
            return;
        const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { "x-user-id": userId } });
        if (!res.ok)
            return;
        setManagedUsers((await res.json()).users || []);
    };
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
    // Show reset page if URL has ?reset=...
    if (resetToken) {
        return (_jsx(ResetPasswordPage, { token: resetToken, onDone: () => { window.history.replaceState({}, "", "/"); } }));
    }
    if (authLoading) {
        return (_jsx("div", { className: "layout", children: _jsx("header", { children: _jsx("h1", { children: "IJsvogel Portaal" }) }) }));
    }
    if (!currentUser) {
        return _jsx(LoginPage, { onLogin: handleLogin });
    }
    return (_jsxs("div", { className: "layout", children: [showChangePw && (_jsx(ChangePasswordModal, { userId: userId, onClose: () => setShowChangePw(false) })), _jsxs("header", { children: [_jsx("h1", { children: "IJsvogel Portaal" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "1rem" }, children: [_jsxs("span", { style: { fontSize: "0.9rem" }, children: [currentUser.name, " ", _jsxs("span", { style: { opacity: 0.75 }, children: ["(", currentUser.party, ")"] })] }), _jsx("button", { className: "act-btn act-cancel", style: { fontSize: "0.8rem" }, onClick: () => setShowChangePw(true), title: "Wachtwoord wijzigen", children: "\uD83D\uDD11 Wachtwoord" }), _jsx("button", { className: "act-btn act-reject", style: { fontSize: "0.8rem" }, onClick: handleLogout, children: "Uitloggen" })] })] }), _jsxs("nav", { className: "tabs", children: [_jsx("button", { className: `tab-btn${effectiveTab === "overzicht" ? " active" : ""}`, onClick: () => setActiveTab("overzicht"), children: "Overzicht" }), canSubmit && (_jsx("button", { className: `tab-btn${effectiveTab === "nieuw" ? " active" : ""}`, onClick: () => setActiveTab("nieuw"), children: "Nieuwe melding" })), isSuperadmin && (_jsx("button", { className: `tab-btn${effectiveTab === "instellingen" ? " active" : ""}`, onClick: () => setActiveTab("instellingen"), children: "Instellingen" }))] }), effectiveTab === "nieuw" && (_jsxs("section", { className: "forms-stack", children: [_jsx(CaseForm, { type: "Routeafwijking", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview }), _jsx(CaseForm, { type: "Palletafwijking", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview }), _jsx(CaseForm, { type: "Ander", userId: userId, isSuperadmin: isSuperadmin, onCreated: loadOverview })] })), effectiveTab === "overzicht" && (_jsxs(_Fragment, { children: [_jsx(CaseTable, { type: "Routeafwijking", items: routeItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview }), _jsx(CaseTable, { type: "Palletafwijking", items: palletItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview }), _jsx(CaseTable, { type: "Ander", items: otherItems, userParty: currentUser.party, userId: userId, onUpdated: loadOverview })] })), effectiveTab === "instellingen" && (_jsx(AdminPanel, { userId: userId, settings: settings, users: managedUsers, onRefresh: loadAdmin, onUsersRefresh: loadUsers }))] }));
};
