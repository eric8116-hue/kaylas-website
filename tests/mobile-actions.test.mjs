import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const chat = readFileSync(new URL('../chatbot.js', import.meta.url), 'utf8');
const has = (source, pattern, message) => assert.ok(pattern.test(source), message);

test('mobile quick actions are one four-item bottom row', () => {
  has(html, /class="action-rail"[^>]*>[\s\S]*?class="rail-btn rail-book"/, 'book action missing');
  has(html, /class="rail-btn rail-mobile-only rail-whatsapp"/, 'WhatsApp action missing');
  has(html, /class="rail-btn rail-mobile-only rail-call"/, 'Call action missing');
  has(html, /\.action-rail\{[^}]*flex-direction:row/, 'mobile rail is not a row');
  has(html, /\.action-rail\{[^}]*bottom:0/, 'mobile rail is not bottom aligned');
  has(chat, /cb-mobile-label[^<]*[\s\S]*?Chat/, 'Chat label missing');
});

test('mobile has no duplicate hero booking or header contact actions', () => {
  has(html, /@media \(max-width:760px\)\{[\s\S]*?\.hero-cta\{display:none\}/, 'mobile hero booking is visible');
  has(html, /\.hdr-call-mobile\[href\^="tel:"\],\.hdr-call-mobile\[href\^="https:\/\/wa\.me\/"\]\{display:none\}/, 'duplicate header actions are visible');
  assert.ok(!/class="book-bar"/.test(html), 'old booking bar still exists');
});

test('mobile-only actions stay out of the desktop rail', () => {
  has(html, /\.action-rail > \.rail-mobile-only\{display:none\}/, 'desktop rail exposes mobile-only actions');
});
