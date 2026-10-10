import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, cpSync, rmSync, existsSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'precise-release-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(join(root, 'tools'));
  for (const file of ['build-clean-bundle.sh', 'build-clean-bundle.py']) {
    cpSync(new URL('../tools/' + file, import.meta.url), join(root, 'tools', file));
  }
  const put = (file, contents = file) => {
    mkdirSync(join(root, file, '..'), {recursive: true});
    writeFileSync(join(root, file), contents);
  };
  put('index.html', '<h1>Current working copy</h1>');
  const run = (destination = 'dist') => spawnSync('bash', [join(root, 'tools/build-clean-bundle.sh'), destination], {cwd: tmpdir(), encoding: 'utf8'});
  return {root, put, run};
}

test('release stages current assets without Git and excludes backend, notes, tests, caches and backups', t => {
  const {root, put, run} = fixture(t);
  for (const file of ['home.js', 'home.css', '_headers', 'robots.txt', 'sitemap.xml', 'source-images/hero.jpg', 'assets/icons/star.svg']) put(file);
  for (const file of ['DEPLOY.md', 'owner.pdf', '.dev.vars', 'credentials.json', 'home.js.bak', 'functions/submit-intake.js', 'lib/crypto.js', 'worker/chatbot-api.js', 'tests/private.test.mjs', 'partials/footer.html', 'CRM-UPDATES/public/treatment.html', '.wrangler/cache/config.json', 'source-images/private.md', 'source-images/.cache/secret.js']) put(file, 'must stay private');
  put('home.js', 'current local edit; not committed');
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(root, 'dist/home.js'), 'utf8'), 'current local edit; not committed');
  assert.deepEqual(readdirSync(join(root, 'dist')).sort(), ['_headers', 'assets', 'home.css', 'home.js', 'index.html', 'robots.txt', 'sitemap.xml', 'source-images']);
  assert.deepEqual(readdirSync(join(root, 'dist/source-images')), ['hero.jpg']);
  assert.equal(readFileSync(join(root, 'dist/assets/icons/star.svg'), 'utf8'), 'assets/icons/star.svg');
});

test('release refuses to overwrite a previously staged package', t => {
  const {root, put, run} = fixture(t);
  put('dist/keep.txt', 'previous reviewed package');
  assert.notEqual(run().status, 0);
  assert.equal(readFileSync(join(root, 'dist/keep.txt'), 'utf8'), 'previous reviewed package');
  assert.deepEqual(readdirSync(join(root, 'dist')), ['keep.txt']);
});

test('release rejects source-directory destinations and symlink escapes before copying', t => {
  const {root, put, run} = fixture(t);
  assert.notEqual(run('functions/out').status, 0);
  assert.equal(existsSync(join(root, 'functions')), false);
  put('private/secret.txt', 'private');
  symlinkSync(join(root, 'private/secret.txt'), join(root, 'photo.jpg'));
  assert.notEqual(run().status, 0);
  assert.equal(existsSync(join(root, 'dist')), false);
  assert.equal(readFileSync(join(root, 'private/secret.txt'), 'utf8'), 'private');
});

test('release rejects missing public entry and symlink output folder', t => {
  const {root, run} = fixture(t);
  rmSync(join(root, 'index.html'));
  assert.notEqual(run().status, 0);
  assert.equal(existsSync(join(root, 'dist')), false);
  writeFileSync(join(root, 'index.html'), 'restored');
  mkdirSync(join(root, 'elsewhere'));
  symlinkSync(join(root, 'elsewhere'), join(root, 'dist'));
  assert.notEqual(run().status, 0);
  assert.deepEqual(readdirSync(join(root, 'elsewhere')), []);
});
