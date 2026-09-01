// POST   /api/session  { password }  -> sets a signed, HttpOnly session cookie
// GET    /api/session              -> { admin: boolean }
// DELETE /api/session              -> clears the cookie
//
// The password lives in the ADMIN_PASSWORD environment variable (encrypted in
// the Pages dashboard), never in this repo. The check runs here, on Cloudflare,
// so a visitor cannot bypass it from the browser.

const COOKIE = "pa_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours
const encoder = new TextEncoder();

const toBase64Url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const sign = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
};

// Constant-time comparison: never leak how much of a value matched.
const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const readSession = async (request, secret) => {
  if (!secret) return false;
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;

  const [expires, signature] = decodeURIComponent(match[1]).split(".");
  if (!expires || !signature) return false;
  if (!Number(expires) || Number(expires) < Date.now()) return false;

  return safeEqual(signature, await sign(`admin:${expires}`, secret));
};

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });

export const onRequestGet = async ({ request, env }) =>
  json({ admin: await readSession(request, env.SESSION_SECRET) });

export const onRequestPost = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json(
      { error: "Server is missing ADMIN_PASSWORD or SESSION_SECRET. Set both in the Pages dashboard." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    ({ password = "" } = await request.json());
  } catch {
    return json({ error: "Expected JSON." }, { status: 400 });
  }

  if (!safeEqual(password, env.ADMIN_PASSWORD)) {
    return json({ error: "That password does not match." }, { status: 401 });
  }

  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${await sign(`admin:${expires}`, env.SESSION_SECRET)}`;

  return json(
    { admin: true },
    {
      headers: {
        "Set-Cookie": `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`,
      },
    }
  );
};

export const onRequestDelete = () =>
  json(
    { admin: false },
    {
      headers: {
        "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      },
    }
  );
