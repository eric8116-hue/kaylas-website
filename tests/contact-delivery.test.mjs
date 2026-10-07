import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/chatbot-api.js';

// Delivery is replaced locally: these tests never send email or contact the CRM.
const payload = {
  kind: 'contact', firstName: 'Synthetic', lastName: 'QA',
  email: 'qa@example.invalid', phone: '202-555-0100', heardVia: 'Website test',
  interests: ['Facials'], message: 'Synthetic local contract check.', hp: ''
};
const request = body => new Request('https://worker.example/notify', {
  method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://preciselaserspa.com'},
  body: JSON.stringify(body)
});

test('contact payload reaches the configured delivery adapter and sets reply-to', async () => {
  const originalFetch = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, options) => {
    sent.push({url, body: JSON.parse(options.body)});
    return Response.json({id: 'local-only'});
  };
  try {
    const response = await worker.fetch(request(payload), {
      RESEND_API_KEY: 'synthetic-key', NOTIFY_TO: 'owner@example.invalid'
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {ok: true});
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://preciselaserspa.com');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, 'https://api.resend.com/emails');
    assert.deepEqual(sent[0].body.to, ['owner@example.invalid']);
    assert.equal(sent[0].body.reply_to, payload.email);
    assert.ok(sent[0].body.text.includes(payload.message));
    assert.ok(sent[0].body.text.includes('Facials'));
  } finally { globalThis.fetch = originalFetch; }
});

test('invalid and honeypot submissions do not reach delivery', async () => {
  for (const body of [{...payload, email: 'invalid'}, {...payload, hp: 'spam'}, {...payload, phone: ''}]) {
    const response = await worker.fetch(request(body), {});
    assert.equal(response.status, 400);
  }
});

test('missing email configuration fails visibly instead of claiming success', async () => {
  const response = await worker.fetch(request(payload), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});

test('delivery provider failure returns a recoverable failure', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  globalThis.fetch = async () => new Response('Synthetic provider failure', {status: 503});
  console.error = () => {};
  try {
    const response = await worker.fetch(request(payload), {RESEND_API_KEY: 'synthetic-key'});
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  } finally { globalThis.fetch = originalFetch; console.error = originalError; }
});

test('one visitor cannot flood the inbox: the 6th send in an hour is refused before delivery', async () => {
  const originalFetch = globalThis.fetch;
  let deliveries = 0;
  globalThis.fetch = async () => { deliveries++; return Response.json({id: 'local-only'}); };
  const store = new Map();
  const kv = {get: async key => store.get(key) ?? null, put: async (key, value) => { store.set(key, value); }};
  const env = {RESEND_API_KEY: 'synthetic-key', NOTIFY_TO: 'owner@example.invalid', CHATBOT_KV: kv};
  const from = ip => { const r = request(payload); r.headers.set('CF-Connecting-IP', ip); return r; };
  try {
    for (let i = 0; i < 5; i++) assert.equal((await worker.fetch(from('203.0.113.7'), env)).status, 200);
    const blocked = await worker.fetch(from('203.0.113.7'), env);
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('Access-Control-Allow-Origin'), 'https://preciselaserspa.com');
    assert.equal(deliveries, 5);
    assert.equal((await worker.fetch(from('198.51.100.9'), env)).status, 200, 'other visitors still get through');
    assert.ok([...store.keys()].every(k => !k.includes('203.0.113.7')), 'raw IP addresses are never stored');
  } finally { globalThis.fetch = originalFetch; }
});
