import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public and practice homepage do not launch the promotion', () => {
  const homepage = readFileSync(new URL('../home.js', import.meta.url), 'utf8'); // home page script (moved out of index.html)
  const initializer = homepage.match(/\(function initPromo\(\)\{([\s\S]*?)\n\}\)\(\);/)?.[1] || '';
  assert.match(initializer, /if \(PROMOTIONS_DISABLED\) return;/);
  assert.match(homepage, /const PROMOTIONS_DISABLED = true;/);
});

test('service-page and enhancement launchers respect disabled promotion', () => {
  for (const file of ['offer-popup.js', 'offer-popup-enhance.js']) {
    const script = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(script, /PROMOTIONS_DISABLED=true/);
    assert.match(script, /if\(PROMOTIONS_DISABLED\)return/);
  }
});
