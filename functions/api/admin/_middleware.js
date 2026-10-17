import { requireAdminAccess } from "../../_lib/access.js";

export async function onRequest({ request, env, next }) {
  const denied = await requireAdminAccess(request, env);
  return denied || next();
}
