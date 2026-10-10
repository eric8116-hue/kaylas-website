// Counts the actions that matter for advertising: Book Now clicks, phone taps,
// text/WhatsApp taps and contact-form sends. No names, emails, phone numbers or
// form answers are ever sent. Not loaded on the client intake or self-assessment
// pages, which collect health information.
//
// Until GOOGLE_TAG_ID is filled in, nothing is sent anywhere: events are only
// recorded in window.dataLayer so they can be checked in the Site Preview.
(function () {
  const GOOGLE_TAG_ID = ''; // e.g. 'G-XXXXXXX' (Analytics) or 'AW-XXXXXXXXX' (Ads)
  // Optional Google Ads conversion labels, e.g. 'AW-123456789/AbCdEf'. Leave blank to skip.
  const ADS_CONVERSIONS = { book_click: '', phone_click: '', contact_form_sent: '' };

  const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (GOOGLE_TAG_ID && !local) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_TAG_ID);
    document.head.append(s);
    gtag('js', new Date());
    gtag('config', GOOGLE_TAG_ID);
  }

  function track(name, detail) {
    const params = Object.assign({ page: location.pathname, lang: document.documentElement.lang || 'en' }, detail || {});
    window.dataLayer.push({ event: name, ...params });
    if (GOOGLE_TAG_ID && !local) {
      window.gtag('event', name, params);
      if (ADS_CONVERSIONS[name]) window.gtag('event', 'conversion', { send_to: ADS_CONVERSIONS[name] });
    }
  }
  window.preciseTrack = track;

  // In the local Site Preview, the footer Staff link opens the local dashboard preview.
  if (local) document.querySelectorAll('a.staff-link').forEach(function (l) { l.href = 'http://127.0.0.1:8818/index.html'; });

  // One listener catches every link, including ones added later by the menu and chat.
  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const where = a.closest('.action-rail') ? 'phone_bar' : a.closest('header, .hdr') ? 'header' : a.closest('footer, .foot') ? 'footer' : 'page';
    if (href.indexOf('book.squareup.com') !== -1) track('book_click', { placement: where });
    else if (href.indexOf('tel:') === 0) track('phone_click', { placement: where });
    else if (href.indexOf('sms:') === 0) track('text_click', { placement: where });
    else if (href.indexOf('wa.me') !== -1) track('whatsapp_click', { placement: where });
  }, true);
})();
