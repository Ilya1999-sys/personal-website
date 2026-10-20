import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const outputDir = path.resolve(process.argv[2] || path.join(siteDir, "regru-dist"));
const include = ["index.html", "contacts", "cases", "styles.css", "images", "fonts", "admin"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
for (const item of include) await cp(path.join(siteDir, item), path.join(outputDir, item), { recursive: true });
await mkdir(path.join(outputDir, "scripts"), { recursive: true });
for (const file of ["site.js", "data.js"]) await cp(path.join(siteDir, "scripts", file), path.join(outputDir, "scripts", file));
await mkdir(path.join(outputDir, "api"), { recursive: true });
await mkdir(path.join(outputDir, "uploads", "cases"), { recursive: true });
await cp(path.join(siteDir, "regru-backend", "index.php"), path.join(outputDir, "api", "index.php"));
await cp(path.join(siteDir, "regru-backend", "api.htaccess"), path.join(outputDir, "api", ".htaccess"));
await cp(path.join(siteDir, "regru-backend", "root.htaccess"), path.join(outputDir, ".htaccess"));
await cp(path.join(siteDir, "regru-backend", "config.example.php"), path.join(outputDir, "api", "config.example.php"));

const initialDataPath = path.join(siteDir, "regru-backend", "migration", "portfolio.json");
let initialData;
try {
  initialData = JSON.parse(await readFile(initialDataPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const localCases = JSON.parse(await readFile(path.join(siteDir, "content", "cases.json"), "utf8"));
  initialData = {
    cases: localCases.map((item, position) => ({
      id: `case-${String(position + 1).padStart(3, "0")}`,
      position,
      ...item,
      image: `/images/${path.basename(item.image || "")}`,
    })),
    categories: [
      { id: "all", label: "Все", position: 1 },
      { id: "uxui", label: "UXUI", position: 2 },
      { id: "web", label: "Веб-дизайн", position: 3 },
      { id: "creative", label: "Креативы", position: 4 },
      { id: "motion", label: "Моушен", position: 5 },
      { id: "article", label: "Статьи", position: 6 },
    ],
  };
  console.warn("Cloudflare export не найден: использую кейсы из content/cases.json и категории по умолчанию.");
}
await writeFile(path.join(outputDir, "api", "initial-data.json"), JSON.stringify(initialData, null, 2) + "\n");
// The public page uses this snapshot if the PHP API is temporarily unavailable.
await mkdir(path.join(outputDir, "content"), { recursive: true });
await writeFile(path.join(outputDir, "content", "cases.json"), JSON.stringify(initialData.cases || [], null, 2) + "\n");
try {
  await cp(path.join(siteDir, "regru-backend", "migration", "uploads"), path.join(outputDir, "uploads"), { recursive: true, force: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(`REG.RU web root prepared at ${outputDir}`);
