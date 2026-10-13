import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public pages do not present an unmaintained Google review total', () => {
  for (const name of ['index.html', 'servicios.html', 'services-hair-removal.html',
    'services-detox.html', 'services-facials.html', 'services-beautification.html']) {
    const html = readFileSync(new URL('../' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /(?:<b>)?332(?:<\/b>)?\s*(?:Google reviews|reviews|reseñas)/, name);
  }
});
