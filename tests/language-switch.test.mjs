import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const english = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const spanish = readFileSync(new URL('../servicios.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../language-switch.css', import.meta.url), 'utf8');
const has = (source, pattern, message) => assert.ok(pattern.test(source), message);

test('English mobile header has the blue EN and red ES two-way switch', () => {
  has(english, /class="mobile-lang-switch"[^>]*>[\s\S]*?href="\/"[^>]*class="ls is-on"[^>]*>EN<\/a>[\s\S]*?href="\/servicios\.html"[^>]*class="ls"[^>]*>ES<\/a>/, 'English header switch missing or links wrong');
  has(styles, /\.mobile-lang-switch \.ls\[lang="en"\]\.is-on\{background:#2f80ed;color:#fff\}/, 'English active blue missing');
  has(styles, /\.mobile-lang-switch \.ls\[lang="es"\]\{color:#e53935\}/, 'Spanish inactive red missing');
  assert.ok(!/class="hdr-call-mobile"[^>]*>ES<\/a>/.test(english), 'old standalone ES button remains');
});

test('Spanish mobile header has the red ES and blue EN switch beside a menu', () => {
  has(spanish, /class="mobile-lang-switch"[^>]*>[\s\S]*?href="\/"[^>]*class="ls"[^>]*>EN<\/a>[\s\S]*?href="\/servicios\.html"[^>]*class="ls is-on"[^>]*>ES<\/a>/, 'Spanish header switch missing or links wrong');
  has(styles, /\.mobile-lang-switch \.ls\[lang="es"\]\.is-on\{background:#e53935;color:#fff\}/, 'Spanish active red missing');
  has(spanish, /<details class="es-mobile-menu">[\s\S]*?<summary[^>]*aria-label="Abrir menú"/, 'Spanish mobile menu missing');
});
