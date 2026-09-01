// GET /api/blocks -> { blocks: [...] | null }   public
// PUT /api/blocks -> { ok: true, count }         admin session required
//
// Blocks are stored as one JSON array in the BLOCKS KV namespace, so the
// archive is the same on every device and every visitor sees it.

import { readSession } from "./session.js";

const KEY = "blocks";
const MAX_BLOCKS = 250;
const LIMITS = { title: 200, url: 2000, label: 80, status: 80, description: 1000, id: 64 };

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });

const missingBinding = () =>
  json(
    { error: "Server is missing the BLOCKS KV binding. Add it in the Pages dashboard." },
    { status: 503 }
  );

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const sanitize = (block) => ({
  id: clean(block.id, LIMITS.id) || crypto.randomUUID(),
  title: clean(block.title, LIMITS.title) || "Untitled block",
  url: clean(block.url, LIMITS.url) || "#",
  label: clean(block.label, LIMITS.label) || "Website",
  status: clean(block.status, LIMITS.status) || "Archive",
  description: clean(block.description, LIMITS.description),
});

export const onRequestGet = async ({ env }) => {
  if (!env.BLOCKS) return missingBinding();

  const stored = await env.BLOCKS.get(KEY, { type: "json" });
  // null means "never saved" — the page falls back to the projects.js seeds.
  return json({ blocks: Array.isArray(stored) ? stored : null });
};

export const onRequestPut = async ({ request, env }) => {
  if (!env.BLOCKS) return missingBinding();

  if (!(await readSession(request, env.SESSION_SECRET))) {
    return json({ error: "Not signed in." }, { status: 401 });
  }

  let blocks;
  try {
    ({ blocks } = await request.json());
  } catch {
    return json({ error: "Expected JSON." }, { status: 400 });
  }

  if (!Array.isArray(blocks)) {
    return json({ error: "Expected a blocks array." }, { status: 400 });
  }
  if (blocks.length > MAX_BLOCKS) {
    return json({ error: `That is more than ${MAX_BLOCKS} blocks.` }, { status: 413 });
  }

  const cleaned = blocks.map(sanitize);
  await env.BLOCKS.put(KEY, JSON.stringify(cleaned));

  return json({ ok: true, count: cleaned.length });
};
