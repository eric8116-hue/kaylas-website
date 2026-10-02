import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("website popup supports H&R side and behind image choices", async () => {
  const css = await readFile(
    fileURLToPath(new URL("../offer-popup.css", import.meta.url)),
    "utf8",
  );
  const js = await readFile(
    fileURLToPath(new URL("../offer-popup.js", import.meta.url)),
    "utf8",
  );
  assert.match(css, /\.promo-card\.has-image\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.promo-card\.has-image\.is-background\s*\{/);
  assert.match(
    js,
    /classList\.toggle\('is-background',\s*offer\.layout\s*===\s*'background'\)/,
  );
});
