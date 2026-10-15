import { scenes } from './scene-catalog.mjs';

export const IDLE_MS = 5 * 60_000;
export const SCENE_MS = 30_000;
export function draftContainsClientData(draft) {
  if (!draft) return false;
  if (typeof draft !== 'object' || Array.isArray(draft)) return true;
  const fields = draft.fields || {};
  if (Object.entries(fields).some(([key, value]) => String(value ?? '').trim() && !(key === 'state' && value === 'NY'))) return true;
  const state = draft.state || {};
  return Boolean(Object.keys(state.yn || {}).length || state.adult != null || state.freq || state.methods?.length || state.consentDone?.some(Boolean) || draft.photoConsent || Object.values(draft.communicationConsents || {}).some(Boolean));
}
export function idleRequiresStaff({ changed, draft, completed }) {
  return Boolean(changed || draft || completed);
}

if (typeof document !== 'undefined' && new URLSearchParams(location.search).get('kiosk') === '1') {
  const banner = document.querySelector('.kiosk-banner');
  const screen = document.createElement('section');
  screen.className = 'intake-idle';
  screen.hidden = true;
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-label', 'Precise Laser welcome screen');
  screen.innerHTML = '<div class="intake-idle-shade"></div><div class="intake-idle-content"><img src="logo.png" alt="Precise Laser Hair Removal and Esthetics"><p class="intake-idle-tagline">A little calmer. All connected.</p><h1>Welcome to Precise Laser</h1><p class="intake-idle-message"></p><button class="intake-idle-start" type="button"></button><p class="intake-idle-footer">LONG ISLAND ROOTS. COASTAL SOUL.</p></div>';
  document.body.append(screen);
  const button = screen.querySelector('button');
  let changed = false;
  let lastActivity = Date.now();
  let locked = false;
  let sceneIndex = 0;
  let rotation;
  let priorInert = [];
  let priorFocus;
  const hasDraft = () => { try { return draftContainsClientData(JSON.parse(sessionStorage.getItem('precise_intake_draft'))); } catch { return true; } };
  const completed = () => document.querySelector('.step[data-step="6"]')?.classList.contains('active');
  function nextScene() {
    screen.style.backgroundImage = `url("${scenes[sceneIndex % scenes.length].src}")`;
    sceneIndex++;
  }
  function show() {
    if (!screen.hidden || document.querySelector('.kiosk-shield')) return;
    locked = idleRequiresStaff({ changed, draft: hasDraft(), completed: completed() });
    if (locked && typeof window.saveDraft === 'function' && !completed()) window.saveDraft();
    priorFocus = document.activeElement;
    priorInert = [...document.body.children].filter(el => el !== screen && !['SCRIPT', 'STYLE'].includes(el.tagName)).map(el => [el, el.inert]);
    priorInert.forEach(([el]) => { el.inert = true; });
    screen.querySelector('.intake-idle-message').textContent = locked ? 'Please return the iPad to your esthetician.' : 'Your esthetician has prepared a fresh intake form.';
    button.textContent = locked ? 'Staff unlock' : 'Begin intake';
    screen.hidden = false;
    document.body.classList.add('intake-idle-open');
    nextScene();
    rotation = setInterval(nextScene, SCENE_MS);
    button.focus();
  }
  function hide() {
    screen.hidden = true;
    clearInterval(rotation);
    document.body.classList.remove('intake-idle-open');
    priorInert.forEach(([el, inert]) => { el.inert = inert; });
    lastActivity = Date.now();
    if (priorFocus?.isConnected) priorFocus.focus();
  }
  button.addEventListener('click', () => {
    hide();
    if (locked) window.dispatchEvent(new CustomEvent('precise:staff-controls', { detail: { onDismiss: show } }));
    else document.getElementById('first_name')?.focus();
  });
  screen.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); button.focus(); }
  });
  ['pointerdown', 'keydown', 'input', 'change', 'scroll'].forEach(type => document.addEventListener(type, event => {
    if (!screen.hidden) return;
    lastActivity = Date.now();
    if (event.target.closest?.('.intake-content') && (['input', 'change'].includes(type) || (type === 'pointerdown' && event.target.closest('button,.chip,.check-line,.consent-item')))) changed = true;
  }, { capture: true, passive: type === 'scroll' }));
  setInterval(() => { if (Date.now() - lastActivity >= IDLE_MS) show(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - lastActivity >= IDLE_MS) show(); });
  const beach = document.createElement('button');
  beach.className = 'intake-beach-button';
  beach.type = 'button';
  beach.textContent = 'Beach screen';
  beach.addEventListener('click', show);
  banner?.append(beach);
}
