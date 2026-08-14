/* ═══════════════════════════════════════════════════════════════════
   PRECISE — CHATBOT Q&A API (Cloudflare Worker)

   Stores Kayla's custom chatbot questions & answers in Cloudflare KV.

   ENDPOINTS
     GET  /qa      → public. Returns the current Q&A list as JSON.
     POST /qa      → protected. Saves a new Q&A list. Requires password.
     POST /login   → protected. Checks a password, returns ok/fail.

   BINDINGS REQUIRED (set up in Cloudflare dashboard — see SETUP-CHATBOT-ADMIN.md)
     KV namespace binding name : CHATBOT_KV
     Secret (environment var)  : ADMIN_PASSWORD
   ═══════════════════════════════════════════════════════════════════ */

const KV_KEY = 'custom_qa';

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

    return json({ ok: false, error: 'Not found.' }, request, 404);
  }
};
