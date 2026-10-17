const maxFileSize = 10 * 1024 * 1024;
const extensionsByType = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function onRequestPost({ request, env }) {
  if (request.headers.get("Origin") !== new URL(request.url).origin) return Response.json({ error: "Запрос отклонён" }, { status: 403 });
  if (!env.BUCKET) return Response.json({ error: "Хранилище изображений не подключено" }, { status: 503 });
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > maxFileSize + 100_000) return Response.json({ error: "Максимальный размер файла — 10 МБ" }, { status: 413 });

  let form;
  try { form = await request.formData(); } catch { return Response.json({ error: "Не удалось прочитать изображение" }, { status: 400 }); }
  const file = form.get("image");
  const isFile = file && typeof file !== "string" && typeof file.stream === "function";
  const extension = isFile ? extensionsByType.get(file.type) : null;
  if (!file || !extension) return Response.json({ error: "Поддерживаются JPG, PNG и WebP" }, { status: 400 });
  if (file.size > maxFileSize) return Response.json({ error: "Максимальный размер файла — 10 МБ" }, { status: 413 });

  const key = `cases_${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
  return Response.json({ image: `r2:${key}` }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
