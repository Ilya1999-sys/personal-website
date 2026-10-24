import { ensurePortfolioData } from "../../_lib/portfolio-data.js";
import { validateDetail } from "../../_lib/case-detail.js";

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function validateCase(value, allowedCategories) {
  const title = String(value?.title || "").trim();
  const description = String(value?.description || "").trim();
  const image = String(value?.image || "").trim();
  const href = String(value?.href || "").trim();
  const detail = validateDetail(value?.detail ?? null);
  const featured = value?.featured === true;
  const categories = Array.isArray(value?.categories) ? [...new Set(value.categories.map(String))] : [];
  const tags = Array.isArray(value?.tags) ? value.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];

  if (!title || title.length > 160) return { error: "Заголовок обязателен и должен быть короче 160 символов" };
  if (detail.error) return detail;
  if (!description || description.length > 5000) return { error: "Описание обязательно и должно быть короче 5000 символов" };
  if (!image || image.length > 2048) return { error: "Добавьте обложку проекта" };
  if (categories.some((category) => !allowedCategories.has(category))) return { error: "Выберите допустимые категории" };
  if (tags.length > 5 || tags.some((tag) => tag.length > 40)) return { error: "Можно указать не более пяти тегов по 40 символов" };
  if (href) {
    try {
      const parsed = new URL(href);
      if (!["https:", "http:"].includes(parsed.protocol)) return { error: "Ссылка должна начинаться с http:// или https://" };
    } catch { return { error: "Проверьте ссылку на проект" }; }
  }
  if (image.startsWith("r2:") && !/^r2:cases_[a-f0-9-]+\.(jpg|png|webp)$/.test(image)) return { error: "Некорректная ссылка на обложку" };
  if (image.startsWith("/images/") && image.includes("..")) return { error: "Некорректная ссылка на обложку" };
  if (!image.startsWith("r2:") && !image.startsWith("/images/")) {
    try {
      if (new URL(image).protocol !== "https:") return { error: "Ссылка на обложку должна начинаться с https://" };
    } catch { return { error: "Укажите файл сайта или публичную HTTPS-ссылку на обложку" }; }
  }

  return { value: { title, description, image, href: detail.value ? `/cases/${detail.value.slug}/` : href, detail: detail.value, categories, tags, featured } };
}

async function checkSlug(db, detail, id = "") {
  if (!detail) return null;
  const { results } = await db.prepare("SELECT id,detail_json FROM cases WHERE detail_json IS NOT NULL AND id != ?").bind(id).all();
  return results.some((item) => {
    try { return JSON.parse(item.detail_json).slug === detail.slug; } catch { return false; }
  }) ? jsonError("Такой адрес страницы уже занят", 409) : null;
}

async function checkFeaturedLimit(db, featured, id = "") {
  if (!featured) return null;
  const selected = await db.prepare("SELECT COUNT(*) AS count FROM cases WHERE featured = 1 AND id != ?").bind(id).first();
  return selected?.count >= 4 ? jsonError("На главной можно показывать не больше четырёх кейсов", 409) : null;
}

function checkOrigin(request) {
  const origin = request.headers.get("Origin");
  return origin && origin === new URL(request.url).origin;
}

async function readBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 1_048_576) throw new Error("Слишком большой запрос");
  return request.json();
}

export async function onRequestPost({ request, env }) {
  if (!checkOrigin(request)) return jsonError("Запрос отклонён", 403);
  if (!env.DB) return jsonError("База данных не подключена", 503);
  await ensurePortfolioData(env.DB);
  let body;
  try { body = await readBody(request); } catch { return jsonError("Не удалось прочитать данные формы"); }
  const categoryRows = await env.DB.prepare("SELECT id FROM case_categories WHERE id != 'all'").all();
  const validated = validateCase(body, new Set(categoryRows.results.map((category) => category.id)));
  if (validated.error) return jsonError(validated.error);
  const limited = await checkFeaturedLimit(env.DB, validated.value.featured);
  if (limited) return limited;
  const duplicate = await checkSlug(env.DB, validated.value.detail);
  if (duplicate) return duplicate;
  const { title, description, image, href, detail, categories, tags, featured } = validated.value;
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO cases (id, position, title, description, categories, tags, image, href, detail_json, featured) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM cases), ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, title, description, JSON.stringify(categories), JSON.stringify(tags), image, href, detail ? JSON.stringify(detail) : null, featured ? 1 : 0).run();
  return Response.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestPut({ request, env }) {
  if (!checkOrigin(request)) return jsonError("Запрос отклонён", 403);
  if (!env.DB) return jsonError("База данных не подключена", 503);
  await ensurePortfolioData(env.DB);
  let body;
  try { body = await readBody(request); } catch { return jsonError("Не удалось прочитать данные формы"); }
  const id = String(body?.id || "");
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return jsonError("Некорректный ID кейса");
  const categoryRows = await env.DB.prepare("SELECT id FROM case_categories WHERE id != 'all'").all();
  const validated = validateCase(body, new Set(categoryRows.results.map((category) => category.id)));
  if (validated.error) return jsonError(validated.error);
  const limited = await checkFeaturedLimit(env.DB, validated.value.featured, id);
  if (limited) return limited;
  const duplicate = await checkSlug(env.DB, validated.value.detail, id);
  if (duplicate) return duplicate;
  const { title, description, image, href, detail, categories, tags, featured } = validated.value;
  const result = await env.DB.prepare(
    "UPDATE cases SET title = ?, description = ?, categories = ?, tags = ?, image = ?, href = ?, detail_json = ?, featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).bind(title, description, JSON.stringify(categories), JSON.stringify(tags), image, href, detail ? JSON.stringify(detail) : null, featured ? 1 : 0, id).run();
  if (!result.meta.changes) return jsonError("Кейс не найден", 404);
  return Response.json({ id }, { headers: { "Cache-Control": "no-store" } });
}

export async function onRequestDelete({ request, env }) {
  if (!checkOrigin(request)) return jsonError("Запрос отклонён", 403);
  if (!env.DB) return jsonError("База данных не подключена", 503);
  let body;
  try { body = await readBody(request); } catch { return jsonError("Не удалось прочитать данные формы"); }
  const id = String(body?.id || "");
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return jsonError("Некорректный ID кейса");
  const result = await env.DB.prepare("DELETE FROM cases WHERE id = ?").bind(id).run();
  if (!result.meta.changes) return jsonError("Кейс не найден", 404);
  return Response.json({ id }, { headers: { "Cache-Control": "no-store" } });
}
