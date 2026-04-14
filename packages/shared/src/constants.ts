import type { CaseStatus, CaseType } from "./types";

export const CASE_TYPES: CaseType[] = [
  "Routeafwijking",
  "Palletafwijking",
  "Ander"
];

export const CASE_STATUSES: CaseStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
  "Wijziging voorgesteld"
];

export const DUTCH_LABELS = {
  appTitle: "IJsvogel Casusportaal",
  tabs: {
    route: "Routeafwijking",
    pallet: "Palletafwijking",
    other: "Ander"
  },
  columns: {
    submissionTime: "Ingediend op",
    submittedBy: "Ingediend door",
    clientNumber: "Klantnummer",
    clientName: "Klantnaam",
    fromDate: "Van",
    toDate: "Tot",
    comment: "Opmerking",
    status: "Status",
    decidedOn: "Goedgekeurd/Afgewezen op"
  },
  actions: {
    approve: "Goedkeuren",
    reject: "Afwijzen",
    suggestChange: "Wijziging voorstellen",
    submit: "Indienen"
  }
} as const;
