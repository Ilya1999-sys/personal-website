import { clearedSessionCookie, hasAdminSession } from "../../_lib/access.js";

function sameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_PASSWORD) return Response.json({ authenticated: false, configured: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const authenticated = await hasAdminSession(request, env);
  return Response.json({ authenticated }, { status: authenticated ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}

export async function onRequestDelete({ request }) {
  if (!sameOrigin(request)) return Response.json({ error: "Запрос отклонён" }, { status: 403 });
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "Set-Cookie": clearedSessionCookie() } });
}
