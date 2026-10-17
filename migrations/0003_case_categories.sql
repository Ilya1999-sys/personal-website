CREATE TABLE IF NOT EXISTS case_categories (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO case_categories (id, label, position) VALUES
  ('all', 'Все', 1),
  ('uxui', 'UXUI', 2),
  ('web', 'Веб-дизайн', 3),
  ('creative', 'Креативы', 4),
  ('motion', 'Моушен', 5),
  ('article', 'Статьи', 6);

CREATE TABLE IF NOT EXISTS portfolio_migrations (
  id TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
