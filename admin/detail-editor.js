import { caseDetailFor } from "../scripts/case-detail-data.js";

const escape = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const imageSource = (src = "") => src.startsWith("r2:") ? `/media/${encodeURIComponent(src.slice(3))}` : src;
const emptyTask = () => ({ title: "", problem: "", task: "", process: "", result: "", sections: [] });
const emptySection = () => ({ title: "", columns: 3, images: [], buttons: [] });
const clone = (value) => JSON.parse(JSON.stringify(value));
const swap = (items, index, offset) => {
  const target = index + offset;
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
};

export function createDetailEditor({ api, message }) {
  const mode = document.querySelector("#case-destination");
  const externalField = document.querySelector("#case-external-link");
  const fields = document.querySelector("#case-detail-fields");
  const slug = document.querySelector("#case-page-slug");
  const title = document.querySelector("#case-page-title");
  const description = document.querySelector("#case-page-description");
  const multiple = document.querySelector("#case-multiple-tasks");
  const tasksContainer = document.querySelector("#case-detail-tasks");
  const addTask = document.querySelector("#add-detail-task");
  const preview = document.querySelector("#case-page-preview");
  let detail = null;
  let pendingUploads = 0;

  const updateVisibility = () => {
    const isPage = mode.value === "page";
    fields.hidden = !isPage;
    externalField.hidden = isPage;
    addTask.hidden = !isPage || !multiple.checked;
    preview.hidden = !isPage || !slug.value.trim();
    if (!preview.hidden) preview.href = `/cases/${encodeURIComponent(slug.value.trim())}/`;
  };

  const field = (label, name, value, area = false) => `<label class="admin-field"><span>${label}</span>${area ? `<textarea data-detail-field="${name}" rows="4">${escape(value)}</textarea>` : `<input data-detail-field="${name}" value="${escape(value)}" />`}</label>`;

  function renderTasks() {
    if (!detail) { tasksContainer.innerHTML = ""; return; }
    tasksContainer.innerHTML = detail.tasks.map((task, taskIndex) => `<article class="admin-detail-card" data-task-index="${taskIndex}">
      <div class="admin-detail-card__heading"><h4>${detail.multipleTasks ? `Задача ${taskIndex + 1}` : "Общая задача"}</h4><div class="admin-detail-card__actions">
        ${detail.multipleTasks ? `<button type="button" data-action="move-task-up" ${taskIndex === 0 ? "disabled" : ""} aria-label="Поднять задачу">↑</button><button type="button" data-action="move-task-down" ${taskIndex === detail.tasks.length - 1 ? "disabled" : ""} aria-label="Опустить задачу">↓</button><button type="button" data-action="remove-task">Удалить</button>` : ""}
      </div></div>
      ${detail.multipleTasks ? field("Название задачи", "title", task.title) : ""}
      ${field("Проблема", "problem", task.problem, true)}
      ${field("Задача", "task", task.task, true)}
      ${field("Процесс работы", "process", task.process, true)}
      <div class="admin-detail-sections"><strong class="admin-detail-section-title">Подзадачи, изображения и кнопки</strong>
        ${task.sections.map((section, sectionIndex) => `<section class="admin-detail-card admin-detail-card--section" data-section-index="${sectionIndex}">
          <div class="admin-detail-card__heading"><h4>Подзадача ${sectionIndex + 1}</h4><div class="admin-detail-card__actions"><button type="button" data-action="move-section-up" ${sectionIndex === 0 ? "disabled" : ""} aria-label="Поднять подзадачу">↑</button><button type="button" data-action="move-section-down" ${sectionIndex === task.sections.length - 1 ? "disabled" : ""} aria-label="Опустить подзадачу">↓</button><button type="button" data-action="remove-section">Удалить</button></div></div>
          ${field("Заголовок подзадачи (необязательно)", "section-title", section.title)}
          <label class="admin-field"><span>Изображений в ряду на большом экране</span><select data-detail-field="columns"><option value="3" ${Number(section.columns) === 3 ? "selected" : ""}>3 изображения</option><option value="4" ${Number(section.columns) === 4 ? "selected" : ""}>4 изображения</option></select></label>
          <div class="admin-detail-images">${section.images.map((image, imageIndex) => `<div class="admin-detail-image" data-image-index="${imageIndex}"><img src="${escape(imageSource(image.src))}" alt="" loading="lazy" />${field("Описание изображения (необязательно)", "alt", image.alt || "")}<div class="admin-detail-card__actions"><button type="button" data-action="move-image-up" ${imageIndex === 0 ? "disabled" : ""} aria-label="Поднять изображение">↑</button><button type="button" data-action="move-image-down" ${imageIndex === section.images.length - 1 ? "disabled" : ""} aria-label="Опустить изображение">↓</button><button type="button" data-action="remove-image">Удалить</button></div></div>`).join("")}</div>
          <label class="admin-detail-upload"><span>Добавить изображения JPG, PNG или WebP, до 10 МБ каждое</span><input type="file" data-detail-upload accept="image/jpeg,image/png,image/webp" multiple /></label>
          <div class="admin-detail-buttons">${section.buttons.map((button, buttonIndex) => `<div class="admin-detail-button" data-button-index="${buttonIndex}">${field("Текст кнопки", "button-label", button.label)}${field("HTTPS-ссылка", "button-href", button.href)}<div class="admin-detail-card__actions"><button type="button" data-action="move-button-up" ${buttonIndex === 0 ? "disabled" : ""} aria-label="Поднять кнопку">↑</button><button type="button" data-action="move-button-down" ${buttonIndex === section.buttons.length - 1 ? "disabled" : ""} aria-label="Опустить кнопку">↓</button><button type="button" data-action="remove-button">Удалить</button></div></div>`).join("")}</div>
          <button class="admin-add-button" type="button" data-action="add-button">+ Добавить кнопку</button>
        </section>`).join("")}
        <button class="admin-add-button" type="button" data-action="add-section">+ Добавить подзадачу</button>
      </div>
      <label class="admin-field admin-detail-result"><span>Результат — синяя плашка</span><textarea data-detail-field="result" rows="4">${escape(task.result)}</textarea></label>
    </article>`).join("");
  }

  function setCase(item) {
    const saved = caseDetailFor(item);
    detail = saved ? clone(saved) : null;
    mode.value = detail ? "page" : "external";
    slug.value = detail?.slug || "";
    title.value = detail?.title || "";
    description.value = detail?.description || "";
    multiple.checked = Boolean(detail?.multipleTasks);
    renderTasks();
    updateVisibility();
  }

  mode.addEventListener("change", () => {
    if (mode.value === "page" && !detail) {
      detail = { slug: "", title: "", description: "", multipleTasks: false, tasks: [emptyTask()] };
      renderTasks();
    }
    updateVisibility();
  });
  slug.addEventListener("input", updateVisibility);
  multiple.addEventListener("change", () => {
    if (!detail) return;
    if (!multiple.checked && detail.tasks.length > 1 && !window.confirm("Оставить только первую задачу? Остальные задачи будут удалены после сохранения.")) {
      multiple.checked = true;
      return;
    }
    detail.multipleTasks = multiple.checked;
    if (!multiple.checked) detail.tasks = [detail.tasks[0] || emptyTask()];
    renderTasks();
    updateVisibility();
  });
  addTask.addEventListener("click", () => {
    if (!detail || !detail.multipleTasks) return;
    detail.tasks.push(emptyTask());
    renderTasks();
    tasksContainer.lastElementChild?.scrollIntoView({ block: "nearest" });
  });
  tasksContainer.addEventListener("input", (event) => {
    const input = event.target.closest("[data-detail-field]");
    if (!input || !detail) return;
    const task = detail.tasks[Number(input.closest("[data-task-index]")?.dataset.taskIndex)];
    const section = task?.sections[Number(input.closest("[data-section-index]")?.dataset.sectionIndex)];
    const image = section?.images[Number(input.closest("[data-image-index]")?.dataset.imageIndex)];
    const button = section?.buttons[Number(input.closest("[data-button-index]")?.dataset.buttonIndex)];
    const key = input.dataset.detailField;
    if (key === "section-title") section.title = input.value;
    else if (key === "columns") section.columns = Number(input.value);
    else if (key === "alt") image.alt = input.value;
    else if (key === "button-label") button.label = input.value;
    else if (key === "button-href") button.href = input.value;
    else if (task) task[key] = input.value;
  });
  tasksContainer.addEventListener("change", (event) => {
    if (event.target.matches('[data-detail-field="columns"]')) event.target.dispatchEvent(new Event("input", { bubbles: true }));
  });
  tasksContainer.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control || !detail) return;
    const taskIndex = Number(control.closest("[data-task-index]")?.dataset.taskIndex);
    const task = detail.tasks[taskIndex];
    const sectionIndex = Number(control.closest("[data-section-index]")?.dataset.sectionIndex);
    const section = task?.sections[sectionIndex];
    const imageIndex = Number(control.closest("[data-image-index]")?.dataset.imageIndex);
    const buttonIndex = Number(control.closest("[data-button-index]")?.dataset.buttonIndex);
    switch (control.dataset.action) {
      case "add-section": task.sections.push(emptySection()); break;
      case "remove-task": if (detail.tasks.length > 1) detail.tasks.splice(taskIndex, 1); break;
      case "move-task-up": swap(detail.tasks, taskIndex, -1); break;
      case "move-task-down": swap(detail.tasks, taskIndex, 1); break;
      case "remove-section": task.sections.splice(sectionIndex, 1); break;
      case "move-section-up": swap(task.sections, sectionIndex, -1); break;
      case "move-section-down": swap(task.sections, sectionIndex, 1); break;
      case "remove-image": section.images.splice(imageIndex, 1); break;
      case "move-image-up": swap(section.images, imageIndex, -1); break;
      case "move-image-down": swap(section.images, imageIndex, 1); break;
      case "add-button": section.buttons.push({ label: "", href: "" }); break;
      case "remove-button": section.buttons.splice(buttonIndex, 1); break;
      case "move-button-up": swap(section.buttons, buttonIndex, -1); break;
      case "move-button-down": swap(section.buttons, buttonIndex, 1); break;
      default: return;
    }
    renderTasks();
  });
  tasksContainer.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-detail-upload]");
    if (!input || !detail) return;
    const taskIndex = Number(input.closest("[data-task-index]").dataset.taskIndex);
    const sectionIndex = Number(input.closest("[data-section-index]").dataset.sectionIndex);
    const targetDetail = detail;
    const targetSection = detail.tasks[taskIndex].sections[sectionIndex];
    const files = [...input.files];
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      message("Для изображений подходят JPG, PNG и WebP до 10 МБ.", true);
      return;
    }
    input.disabled = true;
    pendingUploads += 1;
    try {
      for (const [index, file] of files.entries()) {
        message(`Загружаю изображение ${index + 1} из ${files.length}…`);
        const body = new FormData();
        body.set("image", file);
        const uploaded = await api("/api/admin/upload", { method: "POST", body });
        targetSection.images.push({ src: uploaded.image, alt: "" });
      }
      message(`${files.length} изображений загружено. Сохраните кейс, чтобы добавить их на страницу.`);
    } catch (error) {
      message(error.message || "Не удалось загрузить изображения", true);
    } finally {
      pendingUploads -= 1;
      if (detail === targetDetail) renderTasks();
    }
  });

  function collect() {
    if (pendingUploads) throw new Error("Дождитесь загрузки изображений перед сохранением");
    if (mode.value !== "page") return null;
    if (!detail) throw new Error("Добавьте данные страницы кейса");
    detail.slug = slug.value.trim();
    detail.title = title.value.trim();
    detail.description = description.value.trim();
    detail.multipleTasks = multiple.checked;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(detail.slug)) throw new Error("Адрес страницы: латиница, цифры и дефисы");
    if (!detail.title || !detail.description || !detail.tasks.length) throw new Error("Заполните заголовок, описание и задачи страницы");
    for (const task of detail.tasks) {
      if (detail.multipleTasks && !task.title.trim()) throw new Error("Заполните название каждой задачи");
      if (![task.problem, task.task, task.process, task.result].every((value) => value.trim())) throw new Error("Заполните проблему, задачу, процесс и результат для каждой задачи");
      for (const section of task.sections) {
        if (!section.images.length && !section.buttons.length) throw new Error("Добавьте изображение или кнопку в каждую подзадачу");
        if (section.buttons.some((button) => !button.label.trim() || !/^https:\/\//i.test(button.href.trim()))) throw new Error("Проверьте текст и HTTPS-ссылки кнопок");
      }
    }
    return clone(detail);
  }

  return { setCase, collect, getMode: () => mode.value };
}
