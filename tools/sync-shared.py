#!/usr/bin/env python3
"""Keep the shared page blocks in one place.

The header, footer and phone menu that several pages share live in partials/.
Edit the partial, then run:   python3 tools/sync-shared.py
To only check (used by the tests):   python3 tools/sync-shared.py --check
Pages keep their own line endings. partials/ and tools/ are never deployed."""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVICE = ['services-hair-removal.html', 'services-detox.html', 'services-facials.html', 'services-beautification.html']
BLOCKS = {
    # partial file: (how to find the block in a page, pages that share it)
    'service-header.html': ('header', SERVICE),
    'footer.html': ('footer', SERVICE + ['client-intake.html']),
    'drawer.html': ('drawer', SERVICE + ['client-intake.html', '404.html']),
}

def find(text, kind):
    if kind in ('header', 'footer'):
        m = re.search(rf'<{kind}\b.*?</{kind}>', text, re.S)
        return (m.start(), m.end()) if m else None
    i = text.find('id="drawer"')
    if i < 0: return None
    start = text.rfind('<', 0, i); depth = 0
    for m in re.finditer(r'<(/?)div\b', text[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return start, start + m.end() + text[start + m.end():].find('>') + 1

def main(check):
    problems = []
    for partial, (kind, pages) in BLOCKS.items():
        shared = (ROOT / 'partials' / partial).read_text(encoding='utf-8').rstrip('\n')
        for page in pages:
            p = ROOT / page
            text = p.read_text(encoding='utf-8')
            nl = '\r\n' if '\r\n' in text else '\n'
            span = find(text, kind)
            if not span:
                problems.append(f'{page}: no {kind} block found'); continue
            want = shared.replace('\n', nl)
            if text[span[0]:span[1]] != want:
                if check: problems.append(f'{page}: {kind} differs from partials/{partial}')
                else: p.write_text(text[:span[0]] + want + text[span[1]:], encoding='utf-8', newline='')
    if problems:
        print('\n'.join(problems)); sys.exit(1)
    print('shared blocks ' + ('in sync' if check else 'synced'))

main('--check' in sys.argv)
