export const defaultCategories = [
  { id: "all", label: "Все", position: 1 },
  { id: "uxui", label: "UXUI", position: 2 },
  { id: "web", label: "Веб-дизайн", position: 3 },
  { id: "creative", label: "Креативы", position: 4 },
  { id: "motion", label: "Моушен", position: 5 },
  { id: "article", label: "Статьи", position: 6 },
];

const caseCopyRevision = "figma-copy-2026-10-17";
const caseCopyUpdates = [
  {
    id: "case-004",
    description: "Придумал новую концепцию, подготовил анимации и презентовал готовый лендинг (верстал с помощью Framer). Как итог — готовый адаптивный макет с готовой анимацией и системой для масштабирования.",
    categories: ["uxui"],
  },
  {
    id: "case-008",
    description: "Пет-проект, который начался с курса на Stepik. Сейчас я еженедельно делаю посты в канал, продумываю стиль бренда (уже его можно так назвать), формирую контент-план, записываю подкасты, организую активности и общаюсь с экспертами и подрядчиками.",
  },
  {
    id: "case-013",
    description: "Разобрал новый функционал Figma на практических примерах. Сам предложил тему, подготовил шаблоны и проанализировал, чем данный инструмент удобен и полезен прямо сейчас.",
  },
  {
    id: "case-016",
    description: "Нашёл двух экспертов и вместе с ними рассказал о профессии, в которой я сам работаю. Получилась статья, которая вошла в топ 2025 года.",
  },
  {
    id: "case-019",
    description: "Собрал много экспертов и расспросил, как они применяют ИИ прямо сейчас в своей работе: моушен, шрифты, интерфейсы и графический дизайн.",
  },
  {
    id: "case-021",
    description: "С двумя экспертами погрузили в профессию и рассказали про обязанности, зарплаты, тренды и с чего вообще начать погружение в работу.",
  },
];

export async function ensurePortfolioData(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS case_categories (
    id TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS portfolio_migrations (
    id TEXT PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  await db.batch(defaultCategories.map((category) => db.prepare(
    "INSERT OR IGNORE INTO case_categories (id, label, position) VALUES (?, ?, ?)",
  ).bind(category.id, category.label, category.position)));

  const applied = await db.prepare("SELECT id FROM portfolio_migrations WHERE id = ?").bind(caseCopyRevision).first();
  if (!applied) {
    await db.batch([
      ...caseCopyUpdates.map((item) => db.prepare(
        "UPDATE cases SET description = ?, categories = COALESCE(?, categories), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(item.description, item.categories ? JSON.stringify(item.categories) : null, item.id)),
      db.prepare("INSERT OR IGNORE INTO portfolio_migrations (id) VALUES (?)").bind(caseCopyRevision),
    ]);
  }
}

export async function getCategories(db) {
  await ensurePortfolioData(db);
  const { results } = await db.prepare("SELECT id, label, position FROM case_categories ORDER BY position, id").all();
  return results;
}
