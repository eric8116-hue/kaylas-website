import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/submit-intake.js';
import { decryptField } from '../lib/crypto.js';

test('public intake protects audit details as well as clinical answers without returning a record ID', async () => {
  const writes = [];
  const env = {
    FIELD_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    DB: { prepare(sql) { return { bind(...values) { return {
      async first() { return { n: 0 }; },
      async run() { writes.push({ sql, values }); return { meta: { last_row_id: 42 } }; },
    }; } }; } },
  };
  const response = await onRequestPost({ env, request: new Request('https://preciselaserspa.com/submit-intake', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://preciselaserspa.com', 'CF-Connecting-IP': '192.0.2.10' },
    body: JSON.stringify({ first_name: 'Synthetic', last_name: 'Test', medications: 'SYNTHETIC MEDICAL ANSWER',
      submission_source: 'website', form_elapsed_ms: 10000,
      consent_items: Array(13).fill(true), consent_initials: 'ST', client_signature: 'Synthetic Test', is_adult: true }),
  }) });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  const audit = writes.find(row => row.sql.startsWith('INSERT INTO audit_log'));
  assert.equal(audit.values[0], 'client (web intake)');
  assert.match(audit.values[4], /^enc:/);
  assert.equal(await decryptField(env, audit.values[4]), 'submitted via intake form');
  const client = writes.find(row => row.sql.startsWith('INSERT INTO clients'));
  const columns = client.sql.match(/INSERT INTO clients \(([^)]+)\)/)[1].split(',');
  const stored = client.values[columns.indexOf('medications')];
  assert.match(stored, /^enc:/);
  assert.equal(await decryptField(env, stored), 'SYNTHETIC MEDICAL ANSWER');
});

test('public intake cannot bypass consent, guardian, identity type or text-length validation', async () => {
  const writes = [];
  const env = { DB: { prepare(sql) { return { bind(...values) { return {
    first: async () => ({ n: 0 }), run: async () => { writes.push({ sql, values }); return { meta: { last_row_id: 1 } }; },
  }; } }; } } };
  const complete = { first_name: 'Synthetic', last_name: 'Client', consent_initials: 'SC',
    consent_items: Array(13).fill(true), client_signature: 'Synthetic Client', is_adult: true, form_elapsed_ms: 10000 };
  for (const override of [{ consent_items: [] }, { is_adult: false }, { client_signature: '' }, { first_name: {} }, { medications: 'x'.repeat(4001) }]) {
    const response = await onRequestPost({ env, request: new Request('https://preciselaserspa.com/submit-intake', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://preciselaserspa.com' },
      body: JSON.stringify({ ...complete, ...override }),
    }) });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://preciselaserspa.com');
  }
  assert.equal(writes.filter(row => row.sql.startsWith('INSERT INTO clients')).length, 0);
});
