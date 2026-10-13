import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const canonical = 'https://precise-laser-crm-bkm.pages.dev/intake.html';
test('all legacy intake addresses redirect to the single CRM form', () => {
  const rules = read('_redirects').split('\n').map(line => line.trim());
  for (const path of ['/client-intake', '/client-intake/', '/client-intake.html', '/intake', '/intake.html']) {
    assert.ok(rules.includes(`${path} ${canonical} 302`), path);
  }
  const page = read('client-intake.html');
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.ok(page.includes(canonical));
  assert.doesNotMatch(page, /id="(?:emergency_contact_name|first_name)"/);
});
test('local preview opens the local revised intake; public visitors use the hosted form', () => {
  for (const [href, expected] of [
    ['http://127.0.0.1:8804/client-intake.html', 'http://127.0.0.1:8818/intake.html'],
    ['http://localhost:8804/client-intake.html', 'http://localhost:8818/intake.html'],
    ['https://preciselaserspa.com/client-intake', canonical],
    ['https://preview.example.invalid/client-intake', canonical],
  ]) {
    let destination;
    const link = {};
    vm.runInNewContext(read('intake-entry.js'), {
      URL, location: { href, replace(value) { destination = value; } },
      document: { querySelector() { return link; } },
    });
    assert.equal(destination, expected);
    assert.equal(link.href, expected);
  }
});
