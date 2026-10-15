import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
// Clients stay on the website: the approved CRM form is copied to /intake-form/
// and saves through this site's own /submit-intake (Eric, 2026-10-15).
const form = '/intake-form/intake';
test('all legacy intake addresses open the website copy of the approved form', () => {
  const rules = read('_redirects').split('\n').map(line => line.trim());
  for (const path of ['/client-intake', '/client-intake/', '/client-intake.html', '/intake', '/intake.html']) {
    assert.ok(rules.includes(`${path} ${form} 302`), path);
  }
  assert.doesNotMatch(read('_redirects'), /precise-laser-crm-bkm\.pages\.dev/, 'clients never reach the staff site');
  const page = read('client-intake.html');
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.ok(page.includes(`href="${form}"`));
  assert.doesNotMatch(page, /id="(?:emergency_contact_name|first_name)"/);
});
test('the entry page sends every visitor, local or public, to the website form', () => {
  for (const href of ['http://127.0.0.1:8804/client-intake.html', 'https://preciselaserspa.com/client-intake']) {
    let destination;
    const link = {};
    vm.runInNewContext(read('intake-entry.js'), {
      URL, location: { href, replace(value) { destination = value; } },
      document: { querySelector() { return link; } },
    });
    assert.equal(destination, form);
    assert.equal(link.href, form);
  }
});
test('the website form is an unedited copy of the CRM form, posts here, and is not indexed', () => {
  const manifest = JSON.parse(read('intake-form/manifest.json'));
  for (const [name, sha] of Object.entries(manifest)) {
    const digest = createHash('sha256').update(readFileSync(new URL('../intake-form/' + name, import.meta.url))).digest('hex');
    assert.equal(digest, sha, `${name} changed by hand; run the CRM's tools/sync-intake-form.mjs --write`);
  }
  const html = read('intake-form/intake.html');
  assert.match(html, /fetch\("\/submit-intake"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(html + read('intake-form/app-shell.js'), /precise-laser-crm-bkm/);
  const headers = read('_headers');
  assert.match(headers, /\/intake-form\/\*\n {2}! Content-Security-Policy\n {2}Content-Security-Policy: [^\n]*connect-src 'self';/);
});
