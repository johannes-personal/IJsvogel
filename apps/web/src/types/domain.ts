export type Party = "Anidis" | "NedCargo" | "IJsvogel";
export type Role = "superadmin" | "party_user";
export type CaseType = "Routeafwijking" | "Palletafwijking" | "Ander";
export type CaseStatus = "Pending" | "Approved" | "Rejected" | "Wijziging voorgesteld";

export interface User {
  id: string;
  email: string;
  name: string;
  party: Party;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface CaseRecord {
  id: string;
  type: CaseType;
  submissionTime: string;
  submittedBy: "Anidis" | "NedCargo";
  clientNumber?: string;
  clientName?: string;
  fromDate?: string;
  toDate?: string;
  comment: string;
  status: CaseStatus;
  decidedOn?: string;
  decisionComment?: string;
}

export interface NotificationSettings {
  onSubmission: string[];
  onStatusUpdate: string[];
  perParty: {
    Anidis: string[];
    NedCargo: string[];
  };
}
