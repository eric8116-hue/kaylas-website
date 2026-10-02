import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("website pop-up retains H&R side-by-side and behind-image layouts", async () => {
  const css = await readFile(
    fileURLToPath(new URL("../offer-popup.css", import.meta.url)),
    "utf8",
  );
  const script = await readFile(
    fileURLToPath(new URL("../offer-popup.js", import.meta.url)),
    "utf8",
  );

  assert.match(css, /\.promo-card\.has-image\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.promo-card\.has-image\.is-background\s*\{/);
  assert.match(
    script,
    /classList\.toggle\('is-background',offer\.layout==='background'\)/,
  );
});
