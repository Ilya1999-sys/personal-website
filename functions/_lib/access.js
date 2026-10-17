let jwksCache;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
}

async function getJwks(teamDomain) {
  if (!jwksCache || jwksCache.expiresAt <= Date.now()) {
    const promise = fetch(`${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 300, cacheEverything: true } })
      .then((response) => {
        if (!response.ok) throw new Error("Не удалось получить ключи Cloudflare Access");
        return response.json();
      })
      .catch((error) => {
        jwksCache = undefined;
        throw error;
      });
    jwksCache = { expiresAt: Date.now() + 300_000, promise };
  }
  return jwksCache.promise;
}

async function hasAdminAccess(request, env) {
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUDS || !env.ADMIN_EMAIL) return false;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;

  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart) return false;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerPart)));
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart)));
    if (header.alg !== "RS256" || typeof header.kid !== "string") return false;

    const teamDomain = env.CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "");
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const expectedAudiences = env.CF_ACCESS_AUDS.split(",").map((value) => value.trim()).filter(Boolean);
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== teamDomain || !expectedAudiences.some((expected) => audiences.includes(expected))) return false;
    if (typeof claims.exp !== "number" || claims.exp <= now || (claims.nbf && claims.nbf > now)) return false;
    if (String(claims.email || "").toLowerCase() !== env.ADMIN_EMAIL.trim().toLowerCase()) return false;

    const jwks = await getJwks(teamDomain);
    const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      decodeBase64Url(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
  } catch {
    return false;
  }
}

export async function requireAdminAccess(request, env) {
  if (await hasAdminAccess(request, env)) return null;
  return new Response("Нужен вход через Cloudflare Access", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
