export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^website-offer\/(en|es)-[a-f0-9-]+\.(jpg|png|webp)$/i.test(key)) return new Response('Not found', { status: 404 });
  const object = await env.PHOTOS?.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'image/jpeg', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
}
