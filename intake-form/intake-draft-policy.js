// Draft recovery is temporary. Typed signatures must be entered again.
(() => {
  const excluded = new Set(['client_signature', 'guardian_signature']);
  function hasClientData(draft) {
    const fields=draft?.fields||{}, state=draft?.state||{};
    return Object.entries(fields).some(([id,value])=>String(value??'').trim() && !(id==='state' && value==='NY')) ||
      Boolean(Object.keys(state.yn||{}).length || state.adult!=null || state.freq || state.methods?.length || state.consentDone?.some(Boolean) || draft?.photoConsent || Object.values(draft?.communicationConsents||{}).some(Boolean));
  }
  function sanitize(draft, allowedIds, now = Date.now(), maxAge = 60 * 60_000) {
    if (!draft || ![1, 2].includes(draft.v) || !Number.isFinite(draft.savedAt) ||
        now - draft.savedAt > maxAge || draft.savedAt > now + 60_000 ||
        !draft.fields || typeof draft.fields !== 'object' || Array.isArray(draft.fields)) return null;
    const allowed = new Set(allowedIds);
    const cleaned={ ...draft, v: 2, fields: Object.fromEntries(Object.entries(draft.fields)
      .filter(([id, value]) => allowed.has(id) && !excluded.has(id) && typeof value === 'string' && value.length <= 8000)) };
    return hasClientData(cleaned) ? cleaned : null;
  }
  globalThis.PreciseIntakeDraftPolicy = Object.freeze({ sanitize, excluded, hasClientData });
})();
