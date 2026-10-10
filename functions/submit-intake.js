// POST /submit-intake  — PUBLIC, write-only.
// Lives OUTSIDE /api/ on purpose: everything under /api/* is staff-only and
// covered by the Cloudflare Access wildcard destination. This is the single
// endpoint a client can reach.
//
// It accepts a new intake submission and returns nothing but { ok: true }. It
// deliberately does NOT return the new record id, and there is no GET here —
// so a client sitting with the iPad cannot read back their own record, anyone
// else's, or enumerate the database. Reads live behind Access on /api/clients.
//
// TWO CALLERS:
//   1. the spa iPad          — same-origin, precise-laser-crm.pages.dev/intake.html
//   2. the marketing website — cross-origin, preciselaserspa.com/client-intake.html
//
// CORS exists for caller 2. Browsers only permit a cross-origin fetch if the
// response carries Access-Control-Allow-Origin, and because the body is JSON
// the browser sends an OPTIONS preflight first, which needs its own handler.
// Cloudflare Pages Functions 404 an OPTIONS request without an explicit
// onRequestOptions, and the real POST then never fires.
//
// CORS does NOT loosen who may write here. This endpoint was already public
// and unauthenticated by design — anyone could POST with curl regardless.
// CORS restricts which *websites' JavaScript* may call it; it grants no new
// server-side capability. The actual protection is below: rate limiting and
// (once configured) Turnstile.

import { encryptField, ENCRYPTED_CLIENT_FIELDS } from "../lib/crypto.js";
import { logAudit } from "../lib/audit.js";
import { readJsonObject, requestFailure } from "../lib/request-validation.js";
import { normalizeIntake } from "../lib/intake-validation.js";
import { checkRateLimit, verifyTurnstile, checkSpamSignals, record, pruneThrottle } from "../lib/abuse.js";

const COLUMNS = [
  "first_name","last_name","birth_month","birth_day","birth_year","address","city","state","zip","phone","email",
  "emergency_contact_name","emergency_contact_phone",
  "referral_source","areas_to_treat","accutane","accutane_detail","hormonal","hormonal_detail",
  "chemical_peel","chemical_peel_detail","medications","light_sensitive","light_sensitive_detail",
  "allergies","removal_frequency","removal_methods","last_treatment_before_us",
  "q_headaches","q_testosterone","q_laser_resurfacing","q_skin_infection","q_sensitive_skin",
  "q_genital_herpes","q_microdermabrasion","q_hirsutism_family","q_cold_sores","skin_type",
  "consent_initials","consent_items","photo_consent","marketing_optin",
  "sms_reminders_consent","sms_questions_consent","sms_promotions_consent","email_promotions_consent",
  "communications_consent_version","communications_consent_at","is_adult",
  "guardian_name","guardian_signature","client_signature","provider_name","provider_signature",
  "form_language","signed_at",
];

// Exact origins allowed to call this endpoint from a browser, plus any
// Cloudflare Pages preview URL for the marketing site (those get a random
// subdomain per deploy, e.g. https://abc123.kaylas-website.pages.dev, so
// they're matched by suffix rather than listed one by one).
const ALLOWED_ORIGINS = [
  "https://preciselaserspa.com",
  "https://www.preciselaserspa.com",
  "https://kaylas-website.pages.dev",
];
const ALLOWED_PREVIEW_SUFFIX = ".kaylas-website.pages.dev";

function corsOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(ALLOWED_PREVIEW_SUFFIX)) return origin;
  return null;
}

function withCors(response, request) {
  const origin = corsOrigin(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (!origin) return new Response(response.body, { status: response.status, headers });
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

export async function onRequestOptions(context) {
  const { request } = context;
  const origin = corsOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    },
  });
}

// Bilingual refusal text. Someone who trips a limit is standing at the counter
// or sitting at home mid-form — they get a sentence they can act on, in the
// language they were reading, not a bare status code.
const MSG = {
  rate: {
    en: "Too many submissions from this connection. Please wait a few minutes and try again, or ask the front desk for help.",
    es: "Demasiados envíos desde esta conexión. Espere unos minutos e inténtelo de nuevo, o pida ayuda en recepción.",
  },
  bot: {
    en: "We could not verify this submission. Please reload the page and try once more.",
    es: "No pudimos verificar este envío. Vuelva a cargar la página e inténtelo otra vez.",
  },
};
const pick = (m, lang) => (lang === "es" ? m.es : m.en);
export async function onRequestPost(context) {
  try { return await submitIntake(context); }
  catch (error) { return withCors(requestFailure(error), context.request); }
}

async function submitIntake(context) {
  const { request, env } = context;
  let body = await readJsonObject(request);
  const lang = body.form_language === "es" ? "es" : "en";

  // --- layer 1: rate limiting (always on, needs no configuration) ----------
  // Every refusal below goes through withCors(). Without the CORS header a
  // cross-origin browser cannot read the response at all, so the website form
  // would surface "network error" instead of the real, actionable reason.
  const limit = await checkRateLimit(env, request);
  if (!limit.ok) {
    return withCors(
      new Response(JSON.stringify({ error: pick(MSG.rate, lang) }), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter), "Content-Type": "application/json" },
      }),
      request
    );
  }

  // --- layer 2: honeypot + timing (always on, no configuration) ------------
  //
  // The website form ships a hidden company_url field and a form_elapsed_ms
  // timer. Both are ignored if absent, so the iPad is unaffected.
  //
  // Silently accepted, not rejected: a bot told "you failed the honeypot"
  // learns to leave that field alone next time. Returning 201 costs one junk
  // row -- which is why the outcome is ledgered as blocked_bot so the noise
  // is visible -- and teaches the bot nothing.
  const spam = checkSpamSignals(body);
  if (!spam.ok) {
    console.warn("spam signal:", spam.reason, spam.ms ?? "");
    await record(env, limit.ipHash, "blocked_bot");
    return withCors(Response.json({ ok: true }, { status: 201 }), request);
  }

  // --- layer 3: Turnstile (enforced only once TURNSTILE_SECRET is set) -----
  //
  // IMPORTANT FOR THE WEBSITE FORM: when the secret is set, this rejects any
  // submission without a valid token. The marketing site's client-intake.html
  // must therefore render its own Turnstile widget and send
  // `turnstile_token` in the payload, exactly as intake.html does. If it does
  // not, every website submission will 403 the moment the secret is added,
  // while the iPad keeps working — a failure that looks baffling unless you
  // know to look here.
  const ts = await verifyTurnstile(env, request, body.turnstile_token);
  if (!ts.ok) {
    await record(env, limit.ipHash, "blocked_bot");
    return withCors(
      new Response(JSON.stringify({ error: pick(MSG.bot, lang) }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
      request
    );
  }

  body = normalizeIntake(body);
  // Medications, allergies, the nine yes/no screening answers, and the
  // condition-detail fields are encrypted before they ever reach the
  // database — everything else (name, contact info, consent, signatures)
  // stays plain so search and normal staff screens keep working.
  const values = [];
  for (const c of COLUMNS) {
    const v = body[c];
    if (ENCRYPTED_CLIENT_FIELDS.includes(c)) {
      const plain = v === undefined || v === null ? null : (typeof v === "boolean" ? (v ? "1" : "0") : v);
      values.push(await encryptField(env, plain));
      continue;
    }
    if (v === undefined || v === null) { values.push(null); continue; }
    if (typeof v === "boolean") { values.push(v ? 1 : 0); continue; }
    if (Array.isArray(v) || typeof v === "object") { values.push(JSON.stringify(v)); continue; }
    values.push(v);
  }

  const placeholders = COLUMNS.map(() => "?").join(",");
  const sql = `INSERT INTO clients (${COLUMNS.join(",")}) VALUES (${placeholders})`;
  const res = await env.DB.prepare(sql).bind(...values).run();

  await logAudit(env, request, {
    actor: body.submission_source === "website" ? "client (web intake)" : "client (self-intake)",
    action: "create_client", client_id: res.meta.last_row_id,
    detail: "submitted via intake form",
  });
  // Ledger the accepted submission so it counts toward the next caller's
  // limit, then opportunistically prune old rows. Both are best-effort and
  // never throw — a bookkeeping failure must not fail a saved intake.
  await record(env, limit.ipHash, "accepted");
  await pruneThrottle(env);

  // 201 Created, not 200. The iPad draft-recovery cache in intake.html clears
  // itself only on a 201, so this status is load-bearing — if it is ever
  // changed back to 200 the client's local draft will never be discarded and
  // one client's answers could be restored into the next client's form.
  return withCors(Response.json({ ok: true }, { status: 201 }), request);
}
