// Public, read-only offer from Kayla's D1 database. Staff edits stay on the
// Access-protected CRM project; this site never accepts offer writes.
const DEFAULT_BOOKING = 'https://book.squareup.com/appointments/gs1i408ex6v4ly/location/LQD6Q4Z7MZVFG/services';
const today = () => new Date().toISOString().slice(0, 10);

export async function onRequestGet({ request, env }) {
  if (!env.DB) return Response.json({ active: false }, { status: 503 });
  const row = await env.DB.prepare('SELECT * FROM website_offer WHERE id = 1').first();
  if (!row || !row.active || (row.expires_on && row.expires_on < today())) {
    return Response.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const spanish = new URL(request.url).searchParams.get('lang') === 'es';
  const language = spanish ? 'es' : 'en';
  const imageKey = row[`image_key_${language}`] || row.image_key_en || '';
  return Response.json({
    active: true,
    badge: row[`badge_${language}`],
    headline: row[`headline_${language}`],
    subline: row[`subline_${language}`],
    code: row.promo_code,
    cta: row[`cta_${language}`] || row.cta || (spanish ? 'Reservar una consulta' : 'Book a consultation'),
    bookingUrl: row.booking_url || DEFAULT_BOOKING,
    fine: row[`fine_${language}`],
    delaySeconds: Math.min(60, Math.max(0, Number(row.delay_seconds) || 0)),
    price: row.price || '',
    bullets: String(row[`bullets_${language}`] || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 5),
    layout: row.layout === 'background' ? 'background' : 'side',
    textColor: /^#[0-9a-fA-F]{6}$/.test(row.text_color || '') ? row.text_color : '#ffffff',
    showHeader: row.show_header !== 0,
    imageUrl: imageKey ? `/api/offer-image?key=${encodeURIComponent(imageKey)}` : '',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
