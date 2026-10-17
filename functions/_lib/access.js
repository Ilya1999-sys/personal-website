const cookieName = "portfolio_admin";
const sessionSeconds = 60 * 60 * 24 * 7;

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
}

function sessionKey(password) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function readAdminCookie(request) {
  const value = request.headers.get("Cookie") || "";
  const pair = value.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  return pair ? pair.slice(cookieName.length + 1) : "";
}

export async function createAdminSession(password) {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + sessionSeconds })));
  const signature = await crypto.subtle.sign("HMAC", await sessionKey(password), new TextEncoder().encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function hasAdminSession(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const token = readAdminCookie(request);
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  try {
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1000)) return false;
    return await crypto.subtle.verify("HMAC", await sessionKey(env.ADMIN_PASSWORD), decodeBase64Url(signature), new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

export function sessionCookie(token) {
  return `${cookieName}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionSeconds}`;
}

export function clearedSessionCookie() {
  return `${cookieName}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function requireAdminAccess(request, env) {
  if (await hasAdminSession(request, env)) return null;
  return Response.json({ error: "Войдите в админку, чтобы продолжить" }, {
    status: 401,
    headers: { "Cache-Control": "no-store" },
  });
}
