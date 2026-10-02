import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
test("marketing service pages load the managed offer pop-up in their own language", () => {
  for (const file of [
    "services-beautification.html",
    "services-detox.html",
    "services-facials.html",
    "services-hair-removal.html",
    "servicios.html",
  ]) {
    const html = readFileSync(new URL(file, root), "utf8");
    assert.match(
      html,
      /offer-popup\.js/,
      `${file} should include managed offers`,
    );
  }
  const script = readFileSync(
    new URL("../offer-popup.js", import.meta.url),
    "utf8",
  );
  assert.match(script, /lang==='es'/);
  assert.match(script, /\/api\/offer/);
  assert.match(script, /endpoint\+'\?lang='/);
  for (const field of [
    "offer.imageUrl",
    "offer.bullets",
    "offer.price",
    "offer.layout",
    "offer.textColor",
    "offer.showHeader",
  ])
    assert.ok(script.includes(field), `popup should render ${field}`);
});

test("homepage offer modal loads the same visual builder enhancements", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /offer-popup\.css/);
  assert.match(html, /offer-popup-enhance\.js/);
  const enhance = readFileSync(
    new URL("../offer-popup-enhance.js", import.meta.url),
    "utf8",
  );
  for (const field of [
    "offer.imageUrl",
    "offer.bullets",
    "offer.price",
    "offer.layout",
  ])
    assert.ok(enhance.includes(field));
});
