import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('shared intake code matches its release contract', async () => {
  const manifest = JSON.parse(await readFile(new URL('../docs/intake-contract.json', import.meta.url), 'utf8'));
  assert.equal(manifest.canonicalIntake, 'https://precise-laser-crm-bkm.pages.dev/intake.html');
  assert.equal(Object.keys(manifest.files).length, 6);
  for (const [name, expected] of Object.entries(manifest.files)) {
    const source = await readFile(new URL('../' + name, import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'), expected,
      `${name} changed; synchronize the canonical intake contract before release`);
  }
});
