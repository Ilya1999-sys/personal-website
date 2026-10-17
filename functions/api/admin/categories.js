import { ensurePortfolioData, getCategories } from "../../_lib/portfolio-data.js";

const headers = { "Cache-Control": "no-store" };
const error = (message, status = 400) => Response.json({ error: message }, { status, headers });

function checkOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

async function readBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 64_000) throw new Error("Слишком большой запрос");
  return request.json();
}

function validateLabel(value) {
  const label = String(value || "").trim();
  return label && label.length <= 40 ? label : null;
}

export async function onRequestGet({ env }) {
  if (!env.DB) return error("База данных не подключена", 503);
  return Response.json(await getCategories(env.DB), { headers });
}

export async function onRequestPost({ request, env }) {
  if (!checkOrigin(request)) return error("Запрос отклонён", 403);
  if (!env.DB) return error("База данных не подключена", 503);
  let body;
  try { body = await readBody(request); } catch { return error("Не удалось прочитать данные формы"); }
  const label = validateLabel(body?.label);
  if (!label) return error("Название обязательно и должно быть короче 40 символов");
  await ensurePortfolioData(env.DB);
  const { results } = await env.DB.prepare("SELECT id, label FROM case_categories").all();
  if (results.length >= 21) return error("Можно создать не больше двадцати вкладок");
  if (results.some(({ label: current }) => current.toLocaleLowerCase("ru-RU") === label.toLocaleLowerCase("ru-RU"))) return error("Вкладка с таким названием уже существует");
  const id = `category-${crypto.randomUUID()}`;
  await env.DB.prepare(
    "INSERT INTO case_categories (id, label, position) VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM case_categories))",
  ).bind(id, label).run();
  return Response.json({ id }, { status: 201, headers });
}

export async function onRequestPut({ request, env }) {
  if (!checkOrigin(request)) return error("Запрос отклонён", 403);
  if (!env.DB) return error("База данных не подключена", 503);
  let body;
  try { body = await readBody(request); } catch { return error("Не удалось прочитать данные формы"); }
  const categories = Array.isArray(body?.categories) ? body.categories : [];
  const ids = categories.map((category) => String(category?.id || ""));
  const positions = categories.map((category) => Number(category?.position));
  const labels = categories.map((category) => validateLabel(category?.label));
  const normalizedLabels = labels.map((label) => label?.toLocaleLowerCase("ru-RU"));
  if (!categories.length || ids.length !== new Set(ids).size || labels.some((label) => !label)) {
    return error("Проверьте названия вкладок: они должны быть уникальны по ID и не длиннее 40 символов");
  }
  if (normalizedLabels.length !== new Set(normalizedLabels).size) return error("Названия вкладок должны отличаться друг от друга");
  if (positions.some((position) => !Number.isInteger(position) || position < 1) || new Set(positions).size !== positions.length) {
    return error("Порядок должен быть задан уникальными целыми числами от 1");
  }
  if (!ids.includes("all") || categories.find((item) => item.id === "all")?.position !== 1) {
    return error("Вкладка «Все» должна оставаться первой");
  }
  if (categories.some((item) => item.id !== "all" && Number(item.position) === 1)) {
    return error("Первый номер закреплён за вкладкой «Все»");
  }
  await ensurePortfolioData(env.DB);
  const current = await getCategories(env.DB);
  if (current.length !== categories.length || ids.some((id) => !current.some((item) => item.id === id))) {
    return error("Список вкладок изменился. Обновите страницу и повторите сохранение.", 409);
  }
  await env.DB.batch(categories.map((item, index) => env.DB.prepare(
    "UPDATE case_categories SET label = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).bind(labels[index], Number(item.position), ids[index])));
  return Response.json({ ok: true }, { headers });
}

export async function onRequestDelete({ request, env }) {
  if (!checkOrigin(request)) return error("Запрос отклонён", 403);
  if (!env.DB) return error("База данных не подключена", 503);
  let body;
  try { body = await readBody(request); } catch { return error("Не удалось прочитать данные формы"); }
  const id = String(body?.id || "");
  if (id === "all") return error("Вкладку «Все» нельзя удалить");
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return error("Некорректный ID вкладки");
  await ensurePortfolioData(env.DB);
  const rows = await env.DB.prepare("SELECT id, categories FROM cases").all();
  const updates = rows.results.flatMap((row) => {
    let categories = [];
    try { categories = JSON.parse(row.categories); } catch { /* Replace malformed legacy metadata with an empty list. */ }
    const next = categories.filter((categoryId) => categoryId !== id);
    return next.length === categories.length ? [] : [env.DB.prepare(
      "UPDATE cases SET categories = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).bind(JSON.stringify(next), row.id)];
  });
  const exists = await env.DB.prepare("SELECT id FROM case_categories WHERE id = ?").bind(id).first();
  if (!exists) return error("Вкладка не найдена", 404);
  await env.DB.batch([...updates, env.DB.prepare("DELETE FROM case_categories WHERE id = ?").bind(id)]);
  return Response.json({ id }, { headers });
}
