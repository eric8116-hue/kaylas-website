/* ═══════════════════════════════════════════════════════════════════
   PRECISE — CHATBOT Q&A API (Cloudflare Worker)

   Stores Kayla's custom chatbot questions & answers in Cloudflare KV.
   Also relays the website contact form and text-widget to a real inbox.

   ENDPOINTS
     GET  /qa      → public. Returns the current Q&A list as JSON.
     POST /qa      → protected. Saves a new Q&A list. Requires password.
     POST /login   → protected. Checks a password, returns ok/fail.
     POST /notify  → public. Emails a contact-form or text-widget submission
                     to a monitored inbox. See NOTIFY-SETUP.md.

   BINDINGS REQUIRED (set up in Cloudflare dashboard — see SETUP-CHATBOT-ADMIN.md
   and NOTIFY-SETUP.md)
     KV namespace binding name : CHATBOT_KV
     Secret (environment var)  : ADMIN_PASSWORD
     Send Email binding        : SEND_EMAIL   (for /notify — see NOTIFY-SETUP.md)
     Variable (environment var): NOTIFY_TO    (verified destination address)
   ═══════════════════════════════════════════════════════════════════ */

import { EmailMessage } from 'cloudflare:email';

const KV_KEY = 'custom_qa';
const NOTIFY_FROM = 'website@preciselaserspa.com';
const NOTIFY_FALLBACK_TO = 'Preciselaserspa@gmail.com';

// Allow the live site (and local file testing) to call this Worker.
const ALLOWED_ORIGINS = [
  'https://preciselaserspa.com',
  'https://www.preciselaserspa.com',
  'https://precise-laser-spa.pages.dev',
  'https://precise-laser-crm.pages.dev'
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Max-Age': '86400'
  };
}

function json(body, request, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

/* Constant-time-ish string compare so a wrong password can't be guessed
   by timing how long the check takes. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Validate and clean what the admin page sends us, so a malformed save
   can never corrupt the live chatbot. */
function sanitize(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const item of list.slice(0, 300)) {
    if (!item || typeof item !== 'object') continue;

    const reply = typeof item.reply === 'string' ? item.reply.trim().slice(0, 2000) : '';
    if (!reply) continue;

    let triggers = Array.isArray(item.triggers) ? item.triggers : [];
    triggers = triggers
      .filter(t => typeof t === 'string')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0 && t.length <= 100)
      .slice(0, 25);
    if (!triggers.length) continue;

    const label = typeof item.label === 'string' ? item.label.trim().slice(0, 200) : '';

    out.push({ label, triggers, reply });
  }
  return out;
}

/* ---------- /notify helpers ---------- */

function trimStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function sanitizeContact(body) {
  if (!body || typeof body !== 'object') return null;
  if (trimStr(body.hp, 50)) return null; // honeypot tripped — treat as spam
  const firstName = trimStr(body.firstName, 80);
  const email = trimStr(body.email, 200);
  const phone = trimStr(body.phone, 40);
  if (!firstName || !email || !phone) return null;
  if (!/^\S+@\S+\.\S+$/.test(email)) return null;
  const interests = Array.isArray(body.interests)
    ? body.interests.filter(x => typeof x === 'string').slice(0, 25).map(x => x.trim().slice(0, 100))
    : [];
  return {
    firstName, lastName: trimStr(body.lastName, 80), email, phone,
    heardVia: trimStr(body.heardVia, 100), interests,
    message: trimStr(body.message, 2000)
  };
}

function sanitizeTextWidget(body) {
  if (!body || typeof body !== 'object') return null;
  if (trimStr(body.hp, 50)) return null;
  const name = trimStr(body.name, 80);
  const phone = trimStr(body.phone, 40);
  const message = trimStr(body.message, 2000);
  if (!name || !phone || !message) return null;
  return { name, phone, message };
}

function renderContactBody(d) {
  return [
    'New contact form submission -- preciselaserspa.com',
    '',
    `Name: ${d.firstName} ${d.lastName}`.trim(),
    `Email: ${d.email}`,
    `Phone: ${d.phone}`,
    `Heard about us via: ${d.heardVia || '(not specified)'}`,
    `Interested in: ${d.interests.length ? d.interests.join(', ') : '(not specified)'}`,
    '',
    'Message:',
    d.message || '(none)'
  ].join('\n');
}

function renderTextWidgetBody(d) {
  return [
    'New "Text us" widget submission -- preciselaserspa.com',
    '',
    `Name: ${d.name}`,
    `Mobile: ${d.phone}`,
    '',
    'Message:',
    d.message
  ].join('\n');
}

/* Base64-encode a UTF-8 string (btoa() alone chokes on non-Latin1 chars,
   which matters here since guests write in Spanish too), then wrap to
   76-char lines per RFC 2045. */
function encodeBodyBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.match(/.{1,76}/g).join('\r\n');
}

/* Hand-build a minimal RFC 822 message. Subject stays fixed/ASCII —
   all guest-supplied text (which may include accents) lives in the
   base64-encoded body instead, so there's nothing to escape in headers. */
function buildRawEmail({ from, to, subject, body }) {
  return [
    `From: Precise Laser Website <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodeBodyBase64(body),
    ''
  ].join('\r\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    /* ---------- Public read: the chatbot calls this on every page load ---------- */
    if (path === '/qa' && request.method === 'GET') {
      const stored = await env.CHATBOT_KV.get(KV_KEY);
      const list = stored ? JSON.parse(stored) : [];
      return json({ qa: list }, request, 200, {
        // Cache briefly at the edge so we don't hit KV on every single visit,
        // but new answers still go live within a minute.
        'Cache-Control': 'public, max-age=60'
      });
    }

    /* ---------- Password check for the admin page ---------- */
    if (path === '/login' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false }, request, 400); }
      const ok = safeEqual(String(body.password || ''), String(env.ADMIN_PASSWORD || ''));
      if (!ok) {
        // Small delay makes brute-forcing impractical.
        await new Promise(r => setTimeout(r, 700));
        return json({ ok: false, error: 'Incorrect password.' }, request, 401);
      }
      return json({ ok: true }, request);
    }

    /* ---------- Protected write ---------- */
    if (path === '/qa' && request.method === 'POST') {
      const pw = request.headers.get('X-Admin-Password') || '';
      if (!safeEqual(pw, String(env.ADMIN_PASSWORD || ''))) {
        await new Promise(r => setTimeout(r, 700));
        return json({ ok: false, error: 'Not authorized.' }, request, 401);
      }

      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'Bad request.' }, request, 400); }

      const clean = sanitize(body.qa);
      if (clean === null) return json({ ok: false, error: 'Expected a list of Q&A items.' }, request, 400);

      await env.CHATBOT_KV.put(KV_KEY, JSON.stringify(clean));
      return json({ ok: true, count: clean.length }, request);
    }

    /* ---------- Public: contact form + text widget delivery ---------- */
    if (path === '/notify' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'Bad request.' }, request, 400); }

      const kind = body.kind === 'contact' || body.kind === 'text' ? body.kind : null;
      if (!kind) return json({ ok: false, error: 'Unknown form type.' }, request, 400);

      const clean = kind === 'contact' ? sanitizeContact(body) : sanitizeTextWidget(body);
      if (!clean) return json({ ok: false, error: 'Missing or invalid fields.' }, request, 400);

      if (!env.SEND_EMAIL) {
        // Binding not set up yet — see NOTIFY-SETUP.md. Fail loudly instead
        // of silently pretending the message went somewhere.
        return json({ ok: false, error: 'Notifications are not configured yet.' }, request, 503);
      }

      const to = String(env.NOTIFY_TO || NOTIFY_FALLBACK_TO);
      const subject = kind === 'contact'
        ? 'New contact form submission — Precise Laser website'
        : 'New text-widget message — Precise Laser website';
      const raw = buildRawEmail({
        from: NOTIFY_FROM,
        to,
        subject,
        body: kind === 'contact' ? renderContactBody(clean) : renderTextWidgetBody(clean)
      });

      try {
        await env.SEND_EMAIL.send(new EmailMessage(NOTIFY_FROM, to, raw));
      } catch (err) {
        return json({ ok: false, error: 'Could not send notification.' }, request, 502);
      }

      return json({ ok: true }, request);
    }

    return json({ ok: false, error: 'Not found.' }, request, 404);
  }
};
