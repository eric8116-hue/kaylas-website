import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestPost } from '../functions/api/notify.js';

const payload = {
  kind: 'contact', firstName: 'Synthetic', lastName: 'QA', email: 'qa@example.invalid',
  phone: '202-555-0100', heardVia: 'Website test', interests: ['Facials'], message: 'Synthetic cutover check.', hp: '',
};
const post = (body, ip = '192.0.2.40') => new Request('https://preciselaserspa.com/api/notify', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body),
});

function ledger() {
  const rows = [];
  return { rows, DB: { prepare(sql) {
    let values = [];
    return {
      bind(...v) { values = v; return this; },
      async first() { return { n: rows.filter(r => r.ip === values[0] && r.at > values[1]).length }; },
      async run() { rows.push({ ip: values[0], at: values[1] }); return {}; },
    };
  } } };
}

test('without Kayla\'s Resend key the page is told to use the existing worker', async () => {
  const response = await onRequestPost({ request: post(payload), env: {} });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, fallback: true });
});

test('with the key it sends through Resend to the spa with reply-to set to the guest', async () => {
  const original = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, options) => { sent.push({ url, body: JSON.parse(options.body) }); return Response.json({ id: 'local' }); };
  try {
    const { DB } = ledger();
    const response = await onRequestPost({ request: post(payload), env: { RESEND_API_KEY: 'synthetic', DB } });
    assert.equal(response.status, 200);
    assert.equal(sent[0].url, 'https://api.resend.com/emails');
    assert.deepEqual(sent[0].body.to, ['Preciselaserspa@gmail.com']);
    assert.equal(sent[0].body.reply_to, payload.email);
    assert.ok(sent[0].body.text.includes('Facials'));
  } finally { globalThis.fetch = original; }
});

test('spam, bad fields and floods never reach Resend; a Resend failure is reported, not hidden', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('bad key', { status: 401 }); };
  try {
    const { DB } = ledger();
    const env = { RESEND_API_KEY: 'synthetic', DB };
    for (const body of [{ ...payload, hp: 'bot' }, { ...payload, email: 'nope' }, { kind: 'other' }]) {
      assert.equal((await onRequestPost({ request: post(body), env })).status, 400);
    }
    assert.equal(calls, 0);
    assert.equal((await onRequestPost({ request: post(payload, '192.0.2.41'), env })).status, 502);
    for (let i = 0; i < 4; i++) await onRequestPost({ request: post(payload, '192.0.2.41'), env });
    assert.equal((await onRequestPost({ request: post(payload, '192.0.2.41'), env })).status, 429);
  } finally { globalThis.fetch = original; }
});

test('the page tries Kayla\'s /api/notify first and keeps Eric\'s worker as the fallback', () => {
  const home = readFileSync(new URL('../home.js', import.meta.url), 'utf8');
  assert.match(home, /const NOTIFY_API = '\/api\/notify';/);
  assert.match(home, /const NOTIFY_FALLBACK_API = 'https:\/\/chatbot-api\.eric8116\.workers\.dev\/notify';/);
  assert.match(home, /await sendNotify\(\{/);
});
