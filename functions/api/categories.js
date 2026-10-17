import { getCategories } from "../_lib/portfolio-data.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ error: "Cases database is not configured" }, { status: 503 });
  const categories = await getCategories(env.DB);
  return Response.json(categories, { headers: { "Cache-Control": "no-store" } });
}
