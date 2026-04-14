import { getNotificationSettings } from "./store.js";

export const sendSubmissionNotification = async (caseId: string, submittedBy: "Anidis" | "NedCargo") => {
  const settings = await getNotificationSettings();
  const recipients = Array.from(new Set([...settings.onSubmission, ...settings.perParty[submittedBy]])).join(", ");
  console.log(`[MAIL][SUBMISSION] case=${caseId} recipients=${recipients}`);
};

export const sendStatusNotification = async (caseId: string, status: string) => {
  const settings = await getNotificationSettings();
  const recipients = Array.from(
    new Set([...settings.onStatusUpdate, ...settings.perParty.Anidis, ...settings.perParty.NedCargo])
  ).join(", ");
  console.log(`[MAIL][STATUS] case=${caseId} status=${status} recipients=${recipients}`);
};
