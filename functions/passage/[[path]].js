/**
 * nealgill.com/passage  ->  neals-passage.netlify.app
 *
 * A reverse proxy rather than a redirect, so the address bar keeps saying
 * nealgill.com. Three things make this more than a pass-through:
 *
 *  1. The Netlify site is password protected. Its gate works by setting a
 *     cookie, so cookies have to survive in both directions or the login
 *     loops forever.
 *  2. The app calls '/.netlify/functions/gemini' as an absolute path. Served
 *     under /passage that would hit nealgill.com and 404, so the HTML is
 *     rewritten on the way out.
 *  3. Relative asset paths only resolve correctly from a trailing slash, so
 *     /passage redirects to /passage/.
 */

const UPSTREAM = 'https://neals-passage.netlify.app';
const PREFIX = '/passage';

// Headers Cloudflare adds that upstream should not see.
const STRIP = ['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor',
               'x-forwarded-host', 'x-real-ip'];

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  const parts = params.path;
  const path = Array.isArray(parts) ? parts.join('/') : (parts || '');

  // Without the trailing slash, every relative asset reference resolves one
  // level too high and the page loads naked.
  if (!path && !url.pathname.endsWith('/')) {
    return Response.redirect(url.origin + PREFIX + '/' + url.search, 308);
  }

  const target = UPSTREAM + '/' + path + url.search;

  const headers = new Headers(request.headers);
  headers.set('host', new URL(UPSTREAM).host);
  headers.set('accept-encoding', 'identity');   // so we can rewrite the body
  // Marks this as a proxy fetch. The Netlify edge function sends anything
  // arriving without it back here, so the .netlify.app address stops being
  // a second front door, without the proxy redirecting itself in circles.
  headers.set('x-via-nealgill', '1');
  STRIP.forEach((h) => headers.delete(h));

  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;

  const upstream = await fetch(target, init);

  const out = new Headers(upstream.headers);
  out.delete('content-encoding');
  out.delete('content-length');
  out.delete('transfer-encoding');

  // Keep redirects inside nealgill.com, including the password gate's own.
  const loc = out.get('location');
  if (loc) {
    try {
      const abs = new URL(loc, UPSTREAM);
      if (abs.origin === UPSTREAM) {
        out.set('location', PREFIX + (abs.pathname === '/' ? '/' : abs.pathname) + abs.search);
      }
    } catch (_) { /* leave a malformed Location alone */ }
  }

  // Cookies are scoped to the upstream path; re-scope them to /passage so the
  // browser sends them back on the next request.
  const cookies = upstream.headers.getSetCookie
    ? upstream.headers.getSetCookie()
    : (out.get('set-cookie') ? [out.get('set-cookie')] : []);
  if (cookies.length) {
    out.delete('set-cookie');
    for (const c of cookies) {
      out.append('set-cookie', c.replace(/;\s*Path=\/(?!passage)/i, '; Path=' + PREFIX + '/'));
    }
  }

  const type = out.get('content-type') || '';
  if (type.includes('text/html')) {
    let html = await upstream.text();
    html = html
      .split('/.netlify/functions/').join(PREFIX + '/.netlify/functions/')
      .split('href="/').join('href="' + PREFIX + '/')
      .split('src="/').join('src="' + PREFIX + '/')
      // undo the two rewrites above where they hit a protocol-relative URL
      .split('href="' + PREFIX + '//').join('href="//')
      .split('src="' + PREFIX + '//').join('src="//');
    return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers: out });
  }

  return new Response(upstream.body, {
    status: upstream.status, statusText: upstream.statusText, headers: out,
  });
}
