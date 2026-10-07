import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The shared header, footer and phone menu live in partials/. If a page is
// edited by hand and drifts, this fails: edit the partial and run
// `python3 tools/sync-shared.py` instead.
test('pages match the shared header, footer and phone menu', () => {
  const tool = fileURLToPath(new URL('../tools/sync-shared.py', import.meta.url));
  const out = execFileSync('python3', [tool, '--check'], { encoding: 'utf8' });
  assert.match(out, /in sync/);
});

test('no page carries inline JavaScript (the security policy forbids it)', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../', import.meta.url);
  for (const f of readdirSync(dir).filter(f => f.endsWith('.html'))) {
    const s = readFileSync(new URL(f, dir), 'utf8');
    assert.doesNotMatch(s, /<script>(?![\s\S]*?application\/ld)/, `${f}: inline <script>`);
    assert.doesNotMatch(s, /\son[a-z]+="/, `${f}: inline on*="" handler`);
  }
});
