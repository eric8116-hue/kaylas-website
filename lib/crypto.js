// Field-level encryption for the most sensitive medical answers, on top of
// Cloudflare's own disk-level encryption of the D1 database. AES-256-GCM via
// the platform's native Web Crypto API — no external package needed.
//
// Key: FIELD_ENCRYPTION_KEY, a 32-byte key stored ONLY as a Cloudflare secret
//   wrangler secret put FIELD_ENCRYPTION_KEY
// Never in code, never in wrangler.toml, never in the repo. See
// SECURITY-SETUP.md for how to generate it and where to keep a backup copy.
//
// If this key is ever lost, or rotated without re-encrypting existing rows
// first, every field encrypted under the old key becomes permanently
// unreadable. There is no recovery path other than the key itself.

const ALGO = "AES-GCM";
const IV_LEN = 12; // bytes — standard nonce length for GCM
const PREFIX = "enc:";

const cachedKeys = new Map();

function base64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function bytesToBase64(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function getKey(env, name = "FIELD_ENCRYPTION_KEY") {
  const raw = env[name];
  if (!raw) throw new Error(`${name} is not set — see SECURITY-SETUP.md`);
  if (!cachedKeys.has(raw)) {
    cachedKeys.set(raw, crypto.subtle.importKey("raw", base64ToBytes(raw), ALGO, false, ["encrypt", "decrypt"]));
  }
  return cachedKeys.get(raw);
}

// Encrypts a value into a single string safe to store in the existing TEXT
// column — no schema change needed. Empty/null input stores as null so blank
// fields don't turn into ciphertext noise.
export async function encryptField(env, plainValue) {
  if (plainValue === null || plainValue === undefined || plainValue === "") return null;
  const key = await getKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const data = new TextEncoder().encode(String(plainValue));
  const cipherBuf = await crypto.subtle.encrypt({ name: ALGO, iv }, key, data);
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return PREFIX + bytesToBase64(combined);
}

// Decrypts a value produced by encryptField. Values NOT in encrypted form are
// returned unchanged rather than rejected — this keeps any row written before
// encryption was turned on (or before the one-time backfill runs) readable
// instead of throwing.
export async function decryptField(env, storedValue) {
  if (storedValue === null || storedValue === undefined || storedValue === "") return storedValue;
  if (typeof storedValue !== "string" || !storedValue.startsWith(PREFIX)) return storedValue;
  const combined = base64ToBytes(storedValue.slice(PREFIX.length));
  const iv = combined.slice(0, IV_LEN);
  const cipherBytes = combined.slice(IV_LEN);
  for (const name of ["FIELD_ENCRYPTION_KEY", "LEGACY_FIELD_ENCRYPTION_KEY"]) {
    if (!env[name]) continue;
    try {
      const key = await getKey(env, name);
      const plainBuf = await crypto.subtle.decrypt({ name: ALGO, iv }, key, cipherBytes);
      return new TextDecoder().decode(plainBuf);
    } catch {
      // An older row may use the legacy key. Never expose the ciphertext or
      // cryptographic error to a staff screen.
    }
  }
  return "[unreadable — wrong or missing encryption key]";
}

// `clients` columns holding sensitive medical answers. Identity/contact
// fields (name, phone, email, address) are deliberately excluded — they must
// stay searchable in plain text or client lookup on the treatment/dashboard
// screens breaks.
export const ENCRYPTED_CLIENT_FIELDS = [
  "medications",
  "allergies",
  "accutane_detail",
  "hormonal_detail",
  "chemical_peel_detail",
  "light_sensitive_detail",
  "q_headaches",
  "q_testosterone",
  "q_laser_resurfacing",
  "q_skin_infection",
  "q_sensitive_skin",
  "q_genital_herpes",
  "q_microdermabrasion",
  "q_hirsutism_family",
  "q_cold_sores",
];

// `treatments` columns holding clinical notes.
export const ENCRYPTED_TREATMENT_FIELDS = ["notes"];

// Decrypts the given field names on a DB row, returning a new object.
export async function decryptObjectFields(env, row, fields) {
  if (!row) return row;
  const out = { ...row };
  for (const f of fields) {
    if (f in out) out[f] = await decryptField(env, out[f]);
  }
  return out;
}
