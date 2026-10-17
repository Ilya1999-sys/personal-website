import { createAdminSession, sessionCookie } from "../../_lib/access.js";

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function sameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function passwordMatches(input, expected) {
  const [left, right] = await Promise.all([digest(input), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function rateLimit(env, request) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
    ip TEXT PRIMARY KEY,
    window_started INTEGER NOT NULL,
    attempt_count INTEGER NOT NULL
  )`).run();
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT window_started, attempt_count FROM admin_login_attempts WHERE ip = ?").bind(ip).first();
  if (row && now - row.window_started < 900 && row.attempt_count >= 10) return false;
  if (!row || now - row.window_started >= 900) {
    await env.DB.prepare("INSERT INTO admin_login_attempts (ip, window_started, attempt_count) VALUES (?, ?, 1) ON CONFLICT(ip) DO UPDATE SET window_started = excluded.window_started, attempt_count = 1").bind(ip, now).run();
  } else {
    await env.DB.prepare("UPDATE admin_login_attempts SET attempt_count = attempt_count + 1 WHERE ip = ?").bind(ip).run();
  }
  return true;
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Запрос отклонён" }, 403);
  if (!env.ADMIN_PASSWORD) return json({ error: "Админка ещё не настроена: добавьте секрет ADMIN_PASSWORD в настройках Pages" }, 503);
  if (!env.DB) return json({ error: "База данных не подключена" }, 503);

  let body;
  try {
    if (Number(request.headers.get("Content-Length") || 0) > 4096) return json({ error: "Слишком большой запрос" }, 413);
    body = await request.json();
  } catch {
    return json({ error: "Не удалось прочитать пароль" }, 400);
  }
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 512) return json({ error: "Неверный пароль" }, 401);

  try {
    if (!await rateLimit(env, request)) return json({ error: "Слишком много попыток. Попробуйте через 15 минут" }, 429);
  } catch {
    return json({ error: "Проверка входа временно недоступна" }, 503);
  }

  if (!await passwordMatches(password, env.ADMIN_PASSWORD)) return json({ error: "Неверный пароль" }, 401);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip = ?").bind(ip).run();
  return json({ authenticated: true }, 200, { "Set-Cookie": sessionCookie(await createAdminSession(env.ADMIN_PASSWORD)) });
}
