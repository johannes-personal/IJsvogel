import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export const ResetPasswordPage = ({ token, onDone }) => {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) {
            setError("Wachtwoorden komen niet overeen");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Instellen mislukt");
                return;
            }
            setMessage(data.message || "Wachtwoord ingesteld");
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "layout", children: [_jsx("header", { children: _jsx("h1", { children: "IJsvogel Portaal" }) }), _jsx("div", { style: { maxWidth: 400, margin: "3rem auto" }, children: _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Nieuw wachtwoord instellen" }), message ? (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: "green" }, children: message }), _jsx("button", { onClick: onDone, children: "Naar inlogpagina" })] })) : (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["Nieuw wachtwoord (minimaal 8 tekens)", _jsx("input", { type: "password", autoComplete: "new-password", value: password, onChange: (e) => setPassword(e.target.value), minLength: 8, required: true })] }), _jsxs("label", { children: ["Bevestig wachtwoord", _jsx("input", { type: "password", autoComplete: "new-password", value: confirm, onChange: (e) => setConfirm(e.target.value), required: true })] })] }), error && _jsx("p", { style: { color: "var(--brand-orange)", marginTop: "0.5rem" }, children: error }), _jsx("div", { style: { marginTop: "1rem" }, children: _jsx("button", { type: "submit", disabled: busy, children: busy ? "Bezig…" : "Wachtwoord instellen" }) })] }))] }) })] }));
};
