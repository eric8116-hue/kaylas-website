// The CRM hosts the approved form and is the single frontend source of truth.
(() => {
  const current = new URL(location.href);
  const localPreview = ['127.0.0.1', 'localhost'].includes(current.hostname) && current.port === '8804';
  const target = localPreview
    ? `${current.protocol}//${current.hostname}:8818/intake.html`
    : 'https://precise-laser-crm-bkm.pages.dev/intake.html';
  const link = document.querySelector('[data-intake-link]');
  if (link) link.href = target;
  location.replace(target);
})();
