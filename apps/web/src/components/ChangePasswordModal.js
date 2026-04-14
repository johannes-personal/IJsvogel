import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export const ChangePasswordModal = ({ userId, onClose }) => {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [busy, setBusy] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (next !== confirm) {
            setError("Nieuwe wachtwoorden komen niet overeen");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-id": userId },
                body: JSON.stringify({ currentPassword: current, newPassword: next })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Wijzigen mislukt");
                return;
            }
            setSuccess(true);
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { style: {
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }, children: _jsxs("div", { className: "card", style: { width: 360, margin: 0 }, children: [_jsx("h3", { children: "Wachtwoord wijzigen" }), success ? (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: "green" }, children: "Wachtwoord gewijzigd." }), _jsx("button", { onClick: onClose, children: "Sluiten" })] })) : (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["Huidig wachtwoord", _jsx("input", { type: "password", autoComplete: "current-password", value: current, onChange: (e) => setCurrent(e.target.value), required: true })] }), _jsxs("label", { children: ["Nieuw wachtwoord (min. 8 tekens)", _jsx("input", { type: "password", autoComplete: "new-password", value: next, onChange: (e) => setNext(e.target.value), minLength: 8, required: true })] }), _jsxs("label", { children: ["Bevestig nieuw wachtwoord", _jsx("input", { type: "password", autoComplete: "new-password", value: confirm, onChange: (e) => setConfirm(e.target.value), required: true })] })] }), error && _jsx("p", { style: { color: "var(--brand-orange)", marginTop: "0.5rem" }, children: error }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", marginTop: "1rem" }, children: [_jsx("button", { type: "submit", disabled: busy, children: busy ? "Bezig…" : "Opslaan" }), _jsx("button", { type: "button", className: "act-btn act-cancel", onClick: onClose, children: "Annuleren" })] })] }))] }) }));
};
