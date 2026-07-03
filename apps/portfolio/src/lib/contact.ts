"use server";

import { Resend } from "resend";

type State = { ok: boolean; error?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Handles a contact-form submission and emails it via Resend.
 *
 * The destination address lives only in server env vars (CONTACT_TO_EMAIL),
 * so it is never shipped to the browser or embedded in the page.
 */
export async function sendContactMessage(
  _prev: State,
  formData: FormData,
): Promise<State> {
  // Honeypot: real users never fill this hidden field; bots that do are dropped.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { ok: true };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in every field." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "That message is a little long — mind trimming it?" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "Mike Upton <contact@send.uptonm.dev>";

  if (!apiKey || !to) {
    return {
      ok: false,
      error: "The contact form isn't configured yet. Please try again later.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      return { ok: false, error: "Couldn't send your message — please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't send your message — please try again." };
  }
}
