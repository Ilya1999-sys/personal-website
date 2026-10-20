import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const baseUrl = (process.argv[2] || "https://ilya-polikarpov-portfolio.pages.dev").replace(/\/$/, "");
const migrationDir = path.join(siteDir, "regru-backend", "migration");
const outputImages = path.join(siteDir, "regru-backend", "migration", "uploads", "cases");
const localImagesDir = path.join(siteDir, "images");

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} вернул HTTP ${response.status}`);
  return response.json();
};

await mkdir(migrationDir, { recursive: true });
await mkdir(outputImages, { recursive: true });
const [cases, categories] = await Promise.all([
  fetchJson(`${baseUrl}/api/cases`),
  fetchJson(`${baseUrl}/api/categories`),
]);
if (!Array.isArray(cases) || !cases.length || !Array.isArray(categories) || !categories.length) {
  throw new Error("Cloudflare API вернул пустой или неожиданный список кейсов/категорий.");
}

for (const item of cases) {
  if (!String(item.image || "").startsWith("r2:")) continue;
  const key = item.image.slice(3);
  if (!/^cases_[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) throw new Error(`Некорректный ключ изображения: ${key}`);
  const response = await fetch(`${baseUrl}/media/${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Не удалось скачать обложку ${key}: HTTP ${response.status}`);
  await mkdir(outputImages, { recursive: true });
  await writeFile(path.join(outputImages, key), Buffer.from(await response.arrayBuffer()));
  item.image = `/uploads/cases/${key}`;
}

// Cloudflare rows already contain their complete current metadata. Local image
// paths remain valid in the package; uploaded R2 images are copied separately.
await writeFile(path.join(migrationDir, "portfolio.json"), JSON.stringify({ cases, categories }, null, 2) + "\n");
console.log(`Экспортировано кейсов: ${cases.length}; категорий: ${categories.length}`);
console.log(`Данные: ${path.join(migrationDir, "portfolio.json")}`);
