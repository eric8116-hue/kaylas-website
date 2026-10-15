// The approved form is copied from the CRM (tools/sync-intake-form.mjs) and
// served here, so clients never reach the staff site or its sign-in.
(() => {
  const target = '/intake-form/intake';
  const link = document.querySelector('[data-intake-link]');
  if (link) link.href = target;
  location.replace(target);
})();
