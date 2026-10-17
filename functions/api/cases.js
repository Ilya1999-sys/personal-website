import seedCases from "../../content/cases.json";

function parseJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ error: "Cases database is not configured" }, { status: 503 });

  // Bootstrap a newly connected D1 database from the checked-in portfolio data.
  // INSERT OR IGNORE makes simultaneous first visits safe and preserves edits on later deploys.
  const { results: counts } = await env.DB.prepare("SELECT COUNT(*) AS count FROM cases").all();
  if (!counts[0]?.count) {
    await env.DB.batch(seedCases.map((item, index) => env.DB.prepare(
      "INSERT OR IGNORE INTO cases (id, position, title, description, categories, tags, image, href) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      `case-${String(index + 1).padStart(3, "0")}`,
      index,
      item.title,
      item.description,
      JSON.stringify(item.categories),
      JSON.stringify(item.tags),
      `/images/${item.image}`,
      item.href || "",
    )));
  }

  const { results } = await env.DB.prepare(
    "SELECT id, title, description, categories, tags, image, href FROM cases ORDER BY position ASC, created_at ASC",
  ).all();
  return Response.json(results.map((item) => ({
    ...item,
    categories: parseJson(item.categories, []),
    tags: parseJson(item.tags, []),
  })), { headers: { "Cache-Control": "no-store" } });
}
