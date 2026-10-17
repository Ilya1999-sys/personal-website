import { requireAdminAccess } from "../../_lib/access.js";

export async function onRequest({ request, env, next }) {
  const path = new URL(request.url).pathname;
  if (path === "/api/admin/login" || path === "/api/admin/session") return next();
  const denied = await requireAdminAccess(request, env);
  return denied || next();
}
