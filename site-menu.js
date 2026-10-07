/* Shared keyboard behavior for the full-screen navigation on service pages. */
(() => {
  const drawer = document.getElementById('drawer');
  const trigger = document.querySelector('.burger');
  if (!drawer || !trigger) return;
  let returnFocus = null;
  let inertState = [];
  const focusable = () => [...drawer.querySelectorAll('a[href], button, [tabindex="0"]')]
    .filter(el => !el.disabled && el.getClientRects().length);
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Site navigation');
  trigger.setAttribute('aria-controls', drawer.id);
  trigger.setAttribute('aria-expanded', 'false');
  window.openDrawer = () => {
    if (drawer.classList.contains('open')) return;
    returnFocus = document.activeElement;
    inertState = [...document.body.children]
      .filter(el => el !== drawer && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName))
      .map(el => [el, el.inert]);
    inertState.forEach(([el]) => { el.inert = true; });
    drawer.classList.add('open');
    document.body.classList.add('locked');
    trigger.setAttribute('aria-expanded', 'true');
    focusable()[0]?.focus();
  };
  window.closeDrawer = () => {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    document.body.classList.remove('locked');
    trigger.setAttribute('aria-expanded', 'false');
    inertState.forEach(([el, wasInert]) => { el.inert = wasInert; });
    inertState = [];
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  document.addEventListener('keydown', event => {
    if (!drawer.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      window.closeDrawer();
    } else if (event.key === 'Tab') {
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }
  });
  // A resize can hide the menu trigger; never leave the page locked behind it.
  window.addEventListener('resize', () => {
    if (!trigger.getClientRects().length) window.closeDrawer();
  });
})();

/* In the local Site Preview, the footer Staff link opens the local dashboard preview instead of the live sign-in. */
(() => {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname)) return;
  document.querySelectorAll('a.staff-link').forEach(a => { a.href = 'http://127.0.0.1:8818/'; });
})();
