// Abuse protection for the single public write endpoint (/submit-intake).
//
// Two independent layers, in this order:
//   1. Rate limiting  — always on, needs no configuration
//   2. Turnstile      — only enforced once TURNSTILE_SECRET is set
//
// Design note on why the limits are what they are: this endpoint serves ONE
// iPad in ONE spa, plus (soon) clients filling the form at home before an
// appointment. A busy day is a couple dozen submissions. The limits below are
// generous for that reality and still stop a bot cold.

// --- tunables -------------------------------------------------------------
const PER_IP_LIMIT     = 5;    // submissions allowed from one IP ...
const PER_IP_WINDOW_S  = 3600; // ... per hour
const GLOBAL_LIMIT     = 60;   // submissions allowed from everyone ...
const GLOBAL_WINDOW_S  = 3600; // ... per hour  (a hard ceiling on damage)
const RETENTION_S      = 86400 * 2; // prune ledger rows older than 2 days

/**
 * SHA-256 the IP so the throttle ledger never stores a raw address.
 * Truncated to 32 hex chars — ample to avoid collisions, useless for lookup.
 */
async function hashIp(ip) {
  const data = new TextEncoder().encode("precise-intake:" + (ip || "unknown"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/**
 * Rate-limit check. Returns { ok } or { ok:false, reason, retryAfter }.
 *
 * Fails OPEN on a database error. A transient D1 hiccup must never stop a real
 * client mid-intake from submitting a form they just spent ten minutes on —
 * the cost of losing that submission is far higher than the cost of letting one
 * extra request through. Turnstile is the layer that fails closed.
 */
export async function checkRateLimit(env, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = await hashIp(ip);
  const now = Date.now();

  try {
    const sinceIp = new Date(now - PER_IP_WINDOW_S * 1000).toISOString();
    const ipRow = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM intake_throttle WHERE ip_hash = ? AND created_at > ?"
    ).bind(ipHash, sinceIp).first();

    if (ipRow && ipRow.n >= PER_IP_LIMIT) {
      await record(env, ipHash, "blocked_ip");
      return { ok: false, reason: "per_ip", retryAfter: PER_IP_WINDOW_S, ipHash };
    }

    const sinceGlobal = new Date(now - GLOBAL_WINDOW_S * 1000).toISOString();
    const gRow = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM intake_throttle WHERE created_at > ?"
    ).bind(sinceGlobal).first();

    if (gRow && gRow.n >= GLOBAL_LIMIT) {
      await record(env, ipHash, "blocked_global");
      return { ok: false, reason: "global", retryAfter: 900, ipHash };
    }

    return { ok: true, ipHash };
  } catch (err) {
    console.error("rate limit check failed, allowing through:", err);
    return { ok: true, ipHash, degraded: true };
  }
}

/** Append one row to the throttle ledger. Never throws. */
export async function record(env, ipHash, outcome) {
  try {
    await env.DB.prepare(
      "INSERT INTO intake_throttle (ip_hash, created_at, outcome) VALUES (?,?,?)"
    ).bind(ipHash, new Date().toISOString(), outcome).run();
  } catch (err) {
    console.error("throttle ledger write failed:", err);
  }
}

/** Opportunistic cleanup so the ledger cannot grow without bound. */
export async function pruneThrottle(env) {
  try {
    const cutoff = new Date(Date.now() - RETENTION_S * 1000).toISOString();
    await env.DB.prepare("DELETE FROM intake_throttle WHERE created_at < ?").bind(cutoff).run();
  } catch (err) {
    console.error("throttle prune failed:", err);
  }
}

/**
 * Honeypot + timing check.
 *
 * The website intake form carries two signals the iPad does not:
 *
 *   company_url      a hidden field. A real person never sees it and leaves it
 *                    empty; automated form-fillers populate every input they
 *                    find. Anything in it means a bot, with near-zero risk of
 *                    a false positive.
 *
 *   form_elapsed_ms  how long the form was open. Five pages of medical
 *                    history, thirteen consent items and a signature cannot
 *                    honestly be completed in three seconds.
 *
 * Both are OPTIONAL. The iPad form sends neither, and a submission without
 * them is treated as fine — otherwise this would reject every in-office
 * client the moment it shipped.
 *
 * Costs nothing, needs no configuration, and works today — unlike Turnstile,
 * which sits dormant until keys exist.
 */
const MIN_FILL_MS = 3000;

export function checkSpamSignals(body) {
  const hp = body.company_url;
  if (typeof hp === "string" && hp.trim() !== "") {
    return { ok: false, reason: "honeypot" };
  }

  const ms = body.form_elapsed_ms;
  if (typeof ms === "number" && Number.isFinite(ms) && ms >= 0 && ms < MIN_FILL_MS) {
    return { ok: false, reason: "too_fast", ms };
  }

  return { ok: true };
}

/**
 * Cloudflare Turnstile verification.
 *
 * Enforced ONLY when env.TURNSTILE_SECRET exists. That is deliberate: the spa's
 * iPad is in daily use, and shipping a hard requirement for a secret that has
 * not been created yet would break intake for real clients standing at the
 * counter. Once the secret is set, this fails CLOSED — a missing or invalid
 * token is rejected.
 *
 * Returns { ok } or { ok:false, reason }.
 */
export async function verifyTurnstile(env, request, token) {
  if (!env.TURNSTILE_SECRET) {
    return { ok: true, skipped: true };
  }
  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  try {
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (!data.success) {
      console.error("turnstile rejected:", data["error-codes"]);
      return { ok: false, reason: "failed", codes: data["error-codes"] };
    }
    return { ok: true };
  } catch (err) {
    // Cloudflare's own verification service being unreachable is not the
    // client's fault. Rate limiting still applies, so let it through.
    console.error("turnstile verify errored, allowing through:", err);
    return { ok: true, degraded: true };
  }
}
