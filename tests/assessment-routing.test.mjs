import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// The self-assessment script moved to self-assessment.js; read it with the page.
const html = ['../self-assessment.html', '../self-assessment.js'].map(f => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
const matchingCode = html.slice(html.indexOf('const CATEGORIES ='), html.indexOf('function goResults()'));
const match = (zone, concern) => vm.runInNewContext(matchingCode + '\nmatchCategories()', {
  state: {concernsByZone: {[zone]: [concern]}}
});

test('lash and lip concerns lead to the relevant beauty service and booking destination', () => {
  const beautyPage = readFileSync(new URL('../services-beautification.html', import.meta.url), 'utf8');
  for (const [concern, id, anchor, booking] of [
    ['Thin, sparse lashes', 'lash-lift', 'lash-lift', 'URGO3WEIP2ODMHHXJDVFZPTE'],
    ['Uneven or thin lips', 'lip-blushing', 'lip-blushing', 'QY7N47DI3HBAGCKQL7AWZ2N6']
  ]) {
    const results = match('head', concern);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, id);
    assert.equal(results[0].page, '/services-beautification.html#' + anchor);
    assert.ok(beautyPage.includes('id="' + anchor + '"'));
    assert.ok(results[0].bookUrl.endsWith('/services/' + booking));
  }
});

test('unrelated medical symptoms do not produce a cosmetic treatment recommendation', () => {
  for (const concern of ['Weak immunity', 'Constipation / irregularity', 'Swelling / water retention']) {
    assert.equal(match('stomach', concern).length, 0);
  }
});

test('dermaplaning remains limited to facial peach fuzz', () => {
  assert.equal(match('head', 'Peach fuzz')[0].id, 'dermaplaning');
  assert.equal(match('calves', 'Unwanted hair').some(r => r.id === 'dermaplaning'), false);
});
