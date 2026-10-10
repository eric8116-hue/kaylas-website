// Shared audit-log helper.
// Records who touched which client record. Never throws — a logging failure
// must not block clinical work.

import { encryptField, decryptField } from "./crypto.js";

export function actorFrom(request) {
  return request.headers.get("Cf-Access-Authenticated-User-Email") || "unauthenticated";
}

export async function logAudit(env, request, { actor = actorFrom(request), action, client_id = null, treatment_id = null, detail = null }) {
  try {
    // Diffs and deletion snapshots can contain decrypted clinical answers.
    // Protect the whole detail, including new fields, with no plaintext fallback.
    const encryptedDetail = await encryptField(env, detail);
    await env.DB.prepare(
      `INSERT INTO audit_log (actor, action, client_id, treatment_id, detail, ip)
       VALUES (?,?,?,?,?,?)`
    ).bind(
      actor,
      action,
      client_id,
      treatment_id,
      encryptedDetail,
      request.headers.get("CF-Connecting-IP") || null
    ).run();
  } catch {
    // Database/crypto errors may contain payloads. Keep patient data out of logs.
    console.error("audit log failed: protected entry could not be saved");
  }
}

// Called only behind the staff Access gate. Legacy plaintext stays readable
// until backfilled; malformed ciphertext must not break the full history screen.
export async function readAuditDetail(env, detail) {
  try {
    return await decryptField(env, detail);
  } catch {
    return "[unreadable audit detail]";
  }
}
