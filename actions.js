/* Page actions without inline JavaScript.
   Buttons say what they do in a data attribute, e.g.
     <button data-on-click="goStep(2)">          <a data-on-click="openOverlay('contact'); return false">
   This file runs those calls, so the pages carry no onclick="" code and the
   security policy can forbid inline scripts.
   Allowed in an action: plain function calls with literal arguments
   ('text', numbers, true/false/null) plus `this` (the element) and `event`;
   `return false` (cancel the default action); and the helpers below.
   Anything else is refused and logged, never executed.
   Load this in <head> without defer, before the page's own scripts. */
(() => {
  const helpers = {
    // Stop unless the click landed on the element itself (not on its contents).
    selfOnly: (el, e) => e.target === el,
    // Stop unless the key pressed is one of these; if it is, cancel its default.
    keys: (el, e, ...names) => { if (!names.includes(e.key)) return false; e.preventDefault(); return true; },
    clickSelf: el => { el.click(); return true; },
    closeDetails: (el, e, selector) => { el.closest(selector).open = false; return true; },
    hideClosest: (el, e, selector) => { el.closest(selector).style.display = 'none'; return true; },
    reload: () => { location.reload(); return true; }
  };

  // Split on a separator, ignoring separators inside quotes.
  function split(text, sep) {
    const parts = []; let cur = ''; let quote = null;
    for (const ch of text) {
      if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
      if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
      if (ch === sep) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts.map(p => p.trim()).filter(Boolean);
  }

  function value(token, el, e) {
    if (/^'[^']*'$|^"[^"]*"$/.test(token)) return token.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    if (token === 'this') return el;
    if (token === 'event') return e;
    throw new Error('unsupported argument ' + token);
  }

  function run(spec, el, e) {
    for (const statement of split(spec, ';')) {
      if (statement === 'return false') { e.preventDefault(); continue; }
      const call = statement.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/s);
      if (!call) throw new Error('unsupported action ' + statement);
      const args = split(call[2], ',').map(t => value(t, el, e));
      if (Object.hasOwn(helpers, call[1])) {
        if (helpers[call[1]](el, e, ...args) === false) return;
        continue;
      }
      const fn = window[call[1]];
      if (typeof fn !== 'function') throw new Error('no function ' + call[1]);
      fn.apply(el, args);
    }
  }

  function listen(type) {
    const attr = 'data-on-' + type;
    document.addEventListener(type, e => {
      // Run from the clicked element outwards, like inline handlers did,
      // and stop if one of them stops the event spreading.
      for (let el = e.target; el && el.nodeType === 1; el = el.parentElement) {
        if (el.hasAttribute(attr)) {
          try { run(el.getAttribute(attr), el, e); }
          catch (err) { console.error('[actions] ' + attr + '="' + el.getAttribute(attr) + '":', err.message); }
        }
        if (e.cancelBubble) break;
      }
    });
  }
  ['click', 'input', 'keydown'].forEach(listen);

  // Image load errors do not bubble, so catch them on the way down.
  document.addEventListener('error', e => {
    const el = e.target;
    if (el && el.nodeType === 1 && el.hasAttribute('data-on-error')) {
      try { run(el.getAttribute('data-on-error'), el, e); }
      catch (err) { console.error('[actions] data-on-error:', err.message); }
    }
  }, true);
})();
