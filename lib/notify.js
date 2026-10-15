// Contact-form and text-widget delivery for Kayla's Pages project, ready to
// replace Eric's chatbot-api /notify the moment RESEND_API_KEY is set on
// web-precise-laser. Field rules and email text match worker/chatbot-api.js so
// the spa's inbox sees the same messages whichever path delivered them.
export const NOTIFY_FROM = 'website@preciselaserspa.com';
export const NOTIFY_FROM_NAME = 'Precise Laser Website';
export const NOTIFY_FALLBACK_TO = 'Preciselaserspa@gmail.com';
export const NOTIFY_PER_IP_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

const trimStr = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';

export function sanitizeContact(body) {
  if (!body || typeof body !== 'object') return null;
  if (trimStr(body.hp, 50)) return null;
  const firstName = trimStr(body.firstName, 80);
  const email = trimStr(body.email, 200);
  const phone = trimStr(body.phone, 40);
  if (!firstName || !email || !phone) return null;
  if (!/^\S+@\S+\.\S+$/.test(email)) return null;
  const interests = Array.isArray(body.interests)
    ? body.interests.filter(x => typeof x === 'string').slice(0, 25).map(x => x.trim().slice(0, 100))
    : [];
  return { firstName, lastName: trimStr(body.lastName, 80), email, phone, heardVia: trimStr(body.heardVia, 100), interests, message: trimStr(body.message, 2000) };
}

export function sanitizeTextWidget(body) {
  if (!body || typeof body !== 'object') return null;
  if (trimStr(body.hp, 50)) return null;
  const name = trimStr(body.name, 80);
  const phone = trimStr(body.phone, 40);
  const message = trimStr(body.message, 2000);
  if (!name || !phone || !message) return null;
  return { name, phone, message };
}

export function renderContactBody(d) {
  return [
    'New contact form submission -- preciselaserspa.com', '',
    `Name: ${d.firstName} ${d.lastName}`.trim(), `Email: ${d.email}`, `Phone: ${d.phone}`,
    `Heard about us via: ${d.heardVia || '(not specified)'}`,
    `Interested in: ${d.interests.length ? d.interests.join(', ') : '(not specified)'}`,
    '', 'Message:', d.message || '(none)',
  ].join('\n');
}

export function renderTextWidgetBody(d) {
  return ['New "Text us" widget submission -- preciselaserspa.com', '', `Name: ${d.name}`, `Mobile: ${d.phone}`, '', 'Message:', d.message].join('\n');
}

export async function sendViaResend({ apiKey, to, subject, body, replyTo, fetchImpl = fetch }) {
  const res = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${NOTIFY_FROM_NAME} <${NOTIFY_FROM}>`, to: [to], subject, text: body, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

// At most five messages per visitor per hour, kept in the existing
// intake_throttle ledger under its own outcome so intake limits are unaffected.
export async function allowNotify(env, ip, now = Date.now()) {
  if (!env.DB || !ip) return true;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('notify:' + ip));
  const ipHash = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
  try {
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake_throttle WHERE ip_hash = ? AND outcome = 'notify' AND created_at > ?")
      .bind(ipHash, new Date(now - WINDOW_MS).toISOString()).first();
    if (row && row.n >= NOTIFY_PER_IP_LIMIT) return false;
    await env.DB.prepare("INSERT INTO intake_throttle (ip_hash, created_at, outcome) VALUES (?, ?, 'notify')").bind(ipHash, new Date(now).toISOString()).run();
  } catch { /* the ledger must never block a real enquiry */ }
  return true;
}
