import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export const LoginPage = ({ onLogin }) => {
    const [view, setView] = useState("login");
    // login form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginBusy, setLoginBusy] = useState(false);
    // forgot password form
    const [resetEmail, setResetEmail] = useState("");
    const [resetMsg, setResetMsg] = useState("");
    const [resetBusy, setResetBusy] = useState(false);
    const handleLogin = async (e) => {
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
        }
        finally {
            setLoginBusy(false);
        }
    };
    const handleForgot = async (e) => {
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
        }
        finally {
            setResetBusy(false);
        }
    };
    return (_jsxs("div", { className: "layout", children: [_jsx("header", { children: _jsx("h1", { children: "IJsvogel Portaal" }) }), _jsx("div", { style: { maxWidth: 400, margin: "3rem auto" }, children: view === "login" ? (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Inloggen" }), _jsxs("form", { onSubmit: handleLogin, children: [_jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["E-mailadres", _jsx("input", { type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { children: ["Wachtwoord", _jsx("input", { type: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true })] })] }), loginError && (_jsx("p", { style: { color: "var(--brand-orange)", marginTop: "0.5rem" }, children: loginError })), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }, children: [_jsx("button", { type: "submit", disabled: loginBusy, children: loginBusy ? "Bezig…" : "Inloggen" }), _jsx("button", { type: "button", className: "act-btn act-cancel", onClick: () => setView("forgot"), children: "Wachtwoord vergeten?" })] })] })] })) : (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Wachtwoord vergeten" }), resetMsg ? (_jsxs(_Fragment, { children: [_jsx("p", { children: resetMsg }), _jsx("button", { onClick: () => { setView("login"); setResetMsg(""); }, children: "Terug naar inloggen" })] })) : (_jsxs("form", { onSubmit: handleForgot, children: [_jsx("div", { className: "form-grid", children: _jsxs("label", { children: ["E-mailadres", _jsx("input", { type: "email", autoComplete: "email", value: resetEmail, onChange: (e) => setResetEmail(e.target.value), required: true })] }) }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", marginTop: "1rem" }, children: [_jsx("button", { type: "submit", disabled: resetBusy, children: resetBusy ? "Versturen…" : "Resetlink versturen" }), _jsx("button", { type: "button", className: "act-btn act-cancel", onClick: () => setView("login"), children: "Terug" })] })] }))] })) })] }));
};
