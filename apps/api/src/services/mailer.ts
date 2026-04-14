import nodemailer from "nodemailer";
import { getNotificationSettings } from "./store.js";

const APP_URL = process.env.APP_URL?.trim() || "https://ijsvogel-web.vercel.app";

const smtpConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

const FROM = process.env.SMTP_FROM || "noreply@ijsvogelretail.nl";

async function sendMail(to: string | string[], subject: string, html: string): Promise<void> {
  const toStr = Array.isArray(to) ? to.join(", ") : to;
  if (!transporter) {
    console.log(`[MAIL][NO-SMTP] to="${toStr}" subject="${subject}"`);
    // Log the text preview
    console.log(`[MAIL BODY] ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)}`);
    return;
  }
  await transporter.sendMail({ from: FROM, to: toStr, subject, html });
}

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const link = `${APP_URL}?reset=${token}`;
  await sendMail(
    email,
    "Wachtwoord instellen – IJsvogel Portaal",
    `<p>Gebruik de onderstaande link om uw wachtwoord in te stellen. De link is 30 minuten geldig.</p>
     <p><a href="${link}">${link}</a></p>
     <p>Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren.</p>`
  );
  console.log(`[MAIL][PASSWORD_RESET] to=${email} token=${token} link=${link}`);
};

export const sendSubmissionNotification = async (caseId: string, submittedBy: "Anidis" | "NedCargo") => {
  const settings = await getNotificationSettings();
  const recipients = Array.from(new Set([...settings.onSubmission, ...settings.perParty[submittedBy]]));
  if (recipients.length === 0) return;
  await sendMail(
    recipients,
    "Nieuwe melding ingediend – IJsvogel Portaal",
    `<p>Er is een nieuwe melding ingediend door <strong>${submittedBy}</strong> (ID: ${caseId}).</p>
     <p><a href="${APP_URL}">${APP_URL}</a></p>`
  );
};

export const sendStatusNotification = async (caseId: string, status: string) => {
  const settings = await getNotificationSettings();
  const recipients = Array.from(
    new Set([...settings.onStatusUpdate, ...settings.perParty.Anidis, ...settings.perParty.NedCargo])
  );
  if (recipients.length === 0) return;
  await sendMail(
    recipients,
    `Status gewijzigd: ${status} – IJsvogel Portaal`,
    `<p>De status van melding <strong>${caseId}</strong> is gewijzigd naar <strong>${status}</strong>.</p>
     <p><a href="${APP_URL}">${APP_URL}</a></p>`
  );
};

