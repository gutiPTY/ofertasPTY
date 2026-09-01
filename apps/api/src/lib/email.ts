import { Resend } from "resend";
import { env } from "../env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (env.NODE_ENV === "test") {
    // No mandar emails reales durante la suite de tests (spam a inboxes
    // reales de los usuarios sintéticos +test-... y una dependencia de red
    // extra en un entorno con latencia ya ajustada).
    return;
  }

  if (!resend) {
    // Sin RESEND_API_KEY configurada (p.ej. en un entorno nuevo sin la
    // variable todavía) no se rompe el flujo de moderación por un email
    // que no se pudo mandar; solo se loguea.
    console.warn(`[email] RESEND_API_KEY no configurada, no se envía: "${opts.subject}" a ${opts.to}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
  if (error) {
    // No se relanza: un email que falla no debe tumbar la decisión de
    // moderación en sí (ya se guardó en la base cuando esto se llama).
    console.error(`[email] Error enviando "${opts.subject}" a ${opts.to}:`, error.message);
  }
}
