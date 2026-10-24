const localImage = /^\/(?:images(?:\/[A-Za-z0-9._-]+)+|uploads\/cases\/[A-Za-z0-9._-]+)(?:\?v=[A-Za-z0-9._-]+)?$/;
const r2Image = /^r2:cases_[a-f0-9-]+\.(?:jpg|png|webp)$/;

export function validateDetail(value) {
  if (value == null) return { value: null };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Проверьте данные страницы кейса" };
  const slug = String(value.slug || "").trim();
  const title = String(value.title || "").trim();
  const description = String(value.description || "").trim();
  const multipleTasks = value.multipleTasks === true;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || slug === "detail") return { error: "Адрес страницы: латиница, цифры и дефисы, до 80 символов" };
  if (!title || title.length > 200 || !description || description.length > 5000) return { error: "Проверьте заголовок и описание страницы" };
  if (!Array.isArray(value.tasks) || !value.tasks.length || (!multipleTasks && value.tasks.length !== 1)) return { error: "Добавьте задачи страницы" };
  const tasks = [];
  for (const task of value.tasks) {
    if (!task || typeof task !== "object") return { error: "Проверьте задачу" };
    const taskTitle = String(task.title || "").trim();
    if ((multipleTasks && !taskTitle) || taskTitle.length > 200) return { error: "Проверьте название задачи" };
    const copy = Object.fromEntries(["problem", "task", "process", "result"].map((field) => [field, String(task[field] || "").trim()]));
    if (Object.values(copy).some((text) => !text || text.length > 10000)) return { error: "Заполните все поля задачи (до 10000 символов каждое)" };
    if (!Array.isArray(task.sections)) return { error: "Проверьте подзадачи" };
    const sections = [];
    for (const section of task.sections) {
      if (!section || typeof section !== "object") return { error: "Проверьте подзадачу" };
      const sectionTitle = String(section.title || "").trim();
      const columns = Number(section.columns || 3);
      if (sectionTitle.length > 200 || ![3, 4].includes(columns) || !Array.isArray(section.images) || !Array.isArray(section.buttons)) return { error: "Проверьте подзадачу" };
      const images = [];
      for (const image of section.images) {
        const src = String(image?.src || "").trim();
        const alt = String(image?.alt || "").trim();
        if ((!localImage.test(src) && !r2Image.test(src)) || src.includes("..") || alt.length > 300) return { error: "Проверьте файл изображения" };
        images.push({ src, alt });
      }
      const buttons = [];
      for (const button of section.buttons) {
        const label = String(button?.label || "").trim();
        const href = String(button?.href || "").trim();
        let valid = false;
        try { valid = new URL(href).protocol === "https:"; } catch { /* invalid URL */ }
        if (!label || label.length > 120 || !valid) return { error: "Проверьте название и HTTPS-ссылку кнопки" };
        buttons.push({ label, href });
      }
      if (!images.length && !buttons.length) return { error: "Добавьте изображение или кнопку в подзадачу" };
      sections.push({ title: sectionTitle, columns, images, buttons });
    }
    tasks.push({ title: multipleTasks ? taskTitle : "", ...copy, sections });
  }
  return { value: { slug, title, description, multipleTasks, tasks } };
}
