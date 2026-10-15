// POST /api/notify -- contact form and "Text us" widget, same body as
// chatbot-api's /notify. Same-origin, so no CORS.
//
// Cutover without downtime: until Kayla pastes RESEND_API_KEY into
// web-precise-laser's settings this answers 503 { fallback: true } and home.js
// posts to Eric's chatbot-api /notify exactly as before. The browser does the
// fallback (not this function) so each visitor keeps their own rate limit;
// a server-side relay would arrive from one Cloudflare address and share it.
import { sanitizeContact, sanitizeTextWidget, renderContactBody, renderTextWidgetBody, sendViaResend, allowNotify, NOTIFY_FALLBACK_TO } from '../../lib/notify.js';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return reply({ ok: false, fallback: true }, 503);
  let body;
  try { body = await request.json(); } catch { return reply({ ok: false, error: 'Bad request.' }, 400); }
  const kind = body?.kind === 'contact' || body?.kind === 'text' ? body.kind : null;
  if (!kind) return reply({ ok: false, error: 'Unknown form type.' }, 400);
  const clean = kind === 'contact' ? sanitizeContact(body) : sanitizeTextWidget(body);
  if (!clean) return reply({ ok: false, error: 'Missing or invalid fields.' }, 400);
  if (!(await allowNotify(env, request.headers.get('CF-Connecting-IP')))) {
    return reply({ ok: false, error: 'Too many messages. Please call or text the spa.' }, 429);
  }
  try {
    await sendViaResend({
      apiKey: env.RESEND_API_KEY,
      to: String(env.NOTIFY_TO || NOTIFY_FALLBACK_TO),
      subject: kind === 'contact' ? 'New contact form submission — Precise Laser website' : 'New text-widget message — Precise Laser website',
      body: kind === 'contact' ? renderContactBody(clean) : renderTextWidgetBody(clean),
      replyTo: kind === 'contact' ? clean.email : undefined,
    });
  } catch (error) {
    console.error('notify send failed:', error.message);
    // The key is set but delivery failed: say so; never silently drop an enquiry.
    return reply({ ok: false, error: 'Could not send notification.' }, 502);
  }
  return reply({ ok: true });
}
