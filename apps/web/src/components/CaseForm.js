import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
export const CaseForm = ({ type, userId, isSuperadmin, onCreated }) => {
    const [clientNumber, setClientNumber] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [comment, setComment] = useState("");
    const [submittedAs, setSubmittedAs] = useState("Anidis");
    const [busy, setBusy] = useState(false);
    const submit = async () => {
        setBusy(true);
        try {
            const payload = { type, comment };
            if (clientNumber)
                payload.clientNumber = clientNumber;
            if (fromDate)
                payload.fromDate = fromDate;
            if (toDate)
                payload.toDate = toDate;
            if (isSuperadmin)
                payload.submittedAs = submittedAs;
            const res = await fetch(`${API_BASE_URL}/cases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.message || "Indienen mislukt");
                return;
            }
            setClientNumber("");
            setFromDate("");
            setToDate("");
            setComment("");
            await onCreated();
        }
        finally {
            setBusy(false);
        }
    };
    const clientRequired = type !== "Ander";
    const showRange = type === "Routeafwijking";
    return (_jsxs("div", { className: "card", children: [_jsxs("h3", { children: [type, " indienen"] }), _jsxs("div", { className: "form-grid", children: [isSuperadmin && (_jsxs("label", { children: ["Namens partij *", _jsxs("select", { value: submittedAs, onChange: (e) => setSubmittedAs(e.target.value), children: [_jsx("option", { value: "Anidis", children: "Anidis" }), _jsx("option", { value: "NedCargo", children: "NedCargo" })] })] })), _jsxs("label", { children: ["Klantnummer ", clientRequired ? "*" : "(optioneel)", _jsx("input", { value: clientNumber, onChange: (e) => setClientNumber(e.target.value) })] }), showRange && (_jsxs(_Fragment, { children: [_jsxs("label", { children: ["Van *", _jsx("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value) })] }), _jsxs("label", { children: ["Tot *", _jsx("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value) })] })] })), _jsxs("label", { className: "wide", children: ["Opmerking *", _jsx("textarea", { value: comment, onChange: (e) => setComment(e.target.value), rows: 2 })] })] }), _jsx("button", { disabled: busy, onClick: submit, children: "Indienen" })] }));
};
