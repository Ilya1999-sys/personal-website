function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ error: "Cases database is not configured" }, { status: 503 });
  const { results } = await env.DB.prepare(
    "SELECT id, title, description, categories, tags, image, href FROM cases ORDER BY position ASC, created_at ASC",
  ).all();
  return Response.json(results.map((item) => ({
    ...item,
    categories: parseJson(item.categories, []),
    tags: parseJson(item.tags, []),
  })), { headers: { "Cache-Control": "no-store" } });
}
