import { caseDetailFor } from "./case-detail-data.js";

const escape = (text = "") => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const imageSource = (src = "") => src.startsWith("r2:") ? `/media/${encodeURIComponent(src.slice(3))}` : src;

function textCards(task) {
  return `<div class="case-detail__text-grid">${[
    ["Проблема", task.problem],
    ["Задача", task.task],
    ["Процесс работы", task.process],
  ].map(([label, body]) => `<article class="case-detail__text-card"><h3>${label}</h3><p>${escape(body)}</p></article>`).join("")}</div>`;
}

function mediaSection(section) {
  const title = section.title || "Изображения проекта";
  const images = Array.isArray(section.images) ? section.images : [];
  const buttons = Array.isArray(section.buttons) ? section.buttons : [];
  const columns = Number(section.columns) === 4 ? 4 : 3;
  return `<section class="case-detail__media">
    ${section.title ? `<h3>${escape(section.title)}</h3>` : ""}
    ${images.length ? `<div class="case-detail__gallery${columns === 4 ? " case-detail__gallery--ads" : ""}" aria-label="${escape(title)}">${images.map((image, index) => `<figure><img src="${escape(imageSource(image.src))}" alt="${escape(image.alt || `${title} — изображение ${index + 1}`)}" loading="lazy" decoding="async" /></figure>`).join("")}</div>` : ""}
  </section>${buttons.length ? `<div class="case-detail__landing-links" aria-label="Ссылки проекта">${buttons.map((button) => `<a class="case-detail__landing-button" href="${escape(button.href)}" target="_blank" rel="noopener noreferrer">${escape(button.label)}</a>`).join("")}</div>` : ""}`;
}

function taskSection(task, index, multipleTasks) {
  return `<section class="case-detail__task"${multipleTasks ? ` aria-labelledby="case-task-${index + 1}"` : ""}>
    ${multipleTasks ? `<div class="case-detail__task-heading"><span>Задача</span><h2 id="case-task-${index + 1}">${escape(task.title)}</h2></div>` : ""}
    ${textCards(task)}
    ${(task.sections || []).map(mediaSection).join("")}
    <section class="case-detail__result"><h3>Итог</h3><p>${escape(task.result)}</p></section>
  </section>`;
}

export function caseDetailPage(item, header, footer) {
  const detail = caseDetailFor(item);
  if (!detail) return `<main class="page-content case-detail-content"><section class="case-detail__cover panel">${header()}<div class="case-detail__intro"><h1>Кейс не найден</h1><p>Проверьте адрес страницы.</p></div></section>${footer()}</main>`;
  const tasks = Array.isArray(detail.tasks) && detail.tasks.length ? detail.tasks : [];
  return `<main class="page-content case-detail-content${detail.multipleTasks ? " case-detail-content--loginom" : " case-detail-content--event"}">
    <div class="case-detail__first-group">
      <section class="case-detail__cover panel">${header()}<div class="case-detail__intro"><h1 class="no-nbsp">${escape(detail.title)}</h1><p>${escape(detail.description)}</p></div></section>
      ${tasks.length ? taskSection(tasks[0], 0, detail.multipleTasks) : ""}
    </div>
    ${tasks.length > 1 ? `<div class="case-detail__tasks">${tasks.slice(1).map((task, index) => taskSection(task, index + 1, detail.multipleTasks)).join("")}</div>` : ""}
    ${footer()}
  </main>`;
}
