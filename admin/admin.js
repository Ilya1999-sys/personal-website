import { createDetailEditor } from "./detail-editor.js";

const form = document.querySelector("#case-form");
const list = document.querySelector("#admin-case-list");
const status = document.querySelector("#admin-status");
const orderMessage = document.querySelector("#admin-order-message");
const formMessage = document.querySelector("#form-message");
const editorTitle = document.querySelector("#editor-title");
const deleteButton = document.querySelector("#delete-case");
const imageInput = document.querySelector("#image-file");
const imagePreview = document.querySelector("#image-preview");
const imagePrompt = document.querySelector("#image-prompt");
const loginPanel = document.querySelector("#admin-login");
const adminLayout = document.querySelector("#admin-layout");
const casesManagement = document.querySelector("#cases-management");
const categoriesManagement = document.querySelector("#categories-management");
const categoryList = document.querySelector("#admin-category-list");
const categoryMessage = document.querySelector("#category-message");
const categoryChecks = document.querySelector("#case-category-checks");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const logoutButton = document.querySelector("#admin-logout");
let cases = [];
let categories = [];
let selectedId = null;
let currentImage = "";
let orderSaving = false;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const message = (text, isError = false) => {
  formMessage.textContent = text;
  formMessage.dataset.error = String(isError);
};

async function api(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && url.startsWith("/api/admin/")) showLogin("Сессия завершена. Войдите снова.");
    if (response.status === 403 && url.startsWith("/api/admin/")) window.location.replace("/admin/");
    throw new Error(data.error || `Ошибка сервера: ${response.status}`);
  }
  return data;
}

const detailEditor = createDetailEditor({ api, message });

function showLogin(text = "") {
  cases = [];
  loginPanel.hidden = false;
  adminLayout.hidden = true;
  logoutButton.hidden = true;
  loginMessage.textContent = text;
  loginMessage.dataset.error = "true";
}

function showAdmin() {
  loginPanel.hidden = true;
  adminLayout.hidden = false;
  logoutButton.hidden = false;
}

function renderList() {
  const categoryLabels = new Map(categories.map(({ id, label }) => [id, label]));
  list.innerHTML = cases.map((item) => `<div class="admin-case-row" data-id="${escapeHtml(item.id)}">
    <button class="admin-case-grip" type="button" aria-label="Изменить порядок: ${escapeHtml(item.title)}. Перетащите или используйте стрелки вверх и вниз" title="Перетащить или нажать ↑ / ↓"><svg viewBox="0 0 18 22" aria-hidden="true"><circle cx="5" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/><circle cx="13" cy="11" r="1.5"/><circle cx="5" cy="17" r="1.5"/><circle cx="13" cy="17" r="1.5"/></svg></button>
    <button class="admin-case-item" type="button" aria-current="${item.id === selectedId}">${escapeHtml(item.title)}<span>${item.featured ? "На главной · " : ""}${(item.categories || []).map((id) => categoryLabels.get(id)).filter(Boolean).map(escapeHtml).join(" · ")}</span></button>
  </div>`).join("");
  list.querySelectorAll(".admin-case-item").forEach((button) => button.addEventListener("click", () => selectCase(button.closest("[data-id]").dataset.id)));
  status.textContent = `${cases.length} ${cases.length === 1 ? "кейс" : "кейсов"}`;
}

function setOrderMessage(text, isError = false) {
  orderMessage.textContent = text;
  orderMessage.dataset.error = String(isError);
}

async function saveCaseOrder(focusId) {
  if (orderSaving) return;
  const ids = [...list.querySelectorAll(".admin-case-row")].map((row) => row.dataset.id);
  if (ids.every((id, index) => id === cases[index]?.id)) return;
  orderSaving = true;
  list.setAttribute("aria-busy", "true");
  setOrderMessage("Сохраняю порядок…");
  try {
    await api("/api/admin/cases/order", { method: "PUT", body: JSON.stringify({ ids }) });
    const caseById = new Map(cases.map((item) => [item.id, item]));
    cases = ids.map((id) => caseById.get(id));
    setOrderMessage("Порядок сохранён. Карточки на странице «Кейсы» уже переставлены.");
  } catch (error) {
    renderList();
    list.querySelectorAll(".admin-case-row").forEach((row) => {
      if (row.dataset.id === focusId) row.querySelector(".admin-case-grip")?.focus();
    });
    setOrderMessage(error.message || "Не удалось сохранить порядок", true);
  } finally {
    orderSaving = false;
    list.removeAttribute("aria-busy");
  }
}

let draggedCase = null;
let autoScrollFrame = 0;

function placeDraggedCase() {
  if (!draggedCase?.started) return;
  const { row, x, y } = draggedCase;
  const bounds = list.getBoundingClientRect();
  if (x < bounds.left || x > bounds.right || y < bounds.top - 24 || y > bounds.bottom + 24) return;
  const otherRows = [...list.querySelectorAll(".admin-case-row")].filter((item) => item !== row);
  const before = otherRows.find((item) => y < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2) || null;
  if (row.nextElementSibling !== before) list.insertBefore(row, before);
}

function autoScrollCases() {
  if (!draggedCase?.started) return;
  const bounds = list.getBoundingClientRect();
  if (draggedCase.x >= bounds.left && draggedCase.x <= bounds.right) {
    if (draggedCase.y < bounds.top + 36) list.scrollTop -= 14;
    else if (draggedCase.y > bounds.bottom - 36) list.scrollTop += 14;
    placeDraggedCase();
  }
  autoScrollFrame = requestAnimationFrame(autoScrollCases);
}

function stopDraggingCase() {
  window.removeEventListener("pointermove", moveDraggedCase);
  window.removeEventListener("pointerup", dropDraggedCase);
  window.removeEventListener("pointercancel", cancelDraggedCase);
  cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = 0;
  draggedCase?.row.classList.remove("is-dragging");
  document.body.classList.remove("is-reordering-cases");
}

function moveDraggedCase(event) {
  if (!draggedCase || event.pointerId !== draggedCase.pointerId) return;
  draggedCase.x = event.clientX;
  draggedCase.y = event.clientY;
  if (!draggedCase.started && Math.abs(event.clientY - draggedCase.startY) < 6) return;
  if (!draggedCase.started) {
    draggedCase.started = true;
    draggedCase.row.classList.add("is-dragging");
    document.body.classList.add("is-reordering-cases");
    autoScrollFrame = requestAnimationFrame(autoScrollCases);
  }
  event.preventDefault();
  placeDraggedCase();
}

function dropDraggedCase(event) {
  if (!draggedCase || event.pointerId !== draggedCase.pointerId) return;
  const { started, id } = draggedCase;
  stopDraggingCase();
  draggedCase = null;
  if (started) void saveCaseOrder(id);
}

function cancelDraggedCase(event) {
  if (!draggedCase || event.pointerId !== draggedCase.pointerId) return;
  stopDraggingCase();
  draggedCase = null;
  renderList();
}

list.addEventListener("pointerdown", (event) => {
  const grip = event.target.closest(".admin-case-grip");
  if (!grip || draggedCase || orderSaving || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  const row = grip.closest(".admin-case-row");
  draggedCase = { row, id: row.dataset.id, pointerId: event.pointerId, startY: event.clientY, x: event.clientX, y: event.clientY, started: false };
  window.addEventListener("pointermove", moveDraggedCase, { passive: false });
  window.addEventListener("pointerup", dropDraggedCase);
  window.addEventListener("pointercancel", cancelDraggedCase);
});

list.addEventListener("keydown", (event) => {
  const grip = event.target.closest(".admin-case-grip");
  if (!grip || orderSaving || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const row = grip.closest(".admin-case-row");
  const other = event.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
  if (!other) return;
  if (event.key === "ArrowUp") list.insertBefore(row, other);
  else list.insertBefore(other, row);
  void saveCaseOrder(row.dataset.id);
});

function renderCategoryChecks(selected = []) {
  categoryChecks.innerHTML = categories.filter(({ id }) => id !== "all").map(({ id, label }) => `<label><input type="checkbox" name="categories" value="${escapeHtml(id)}" ${selected.includes(id) ? "checked" : ""} /> ${escapeHtml(label)}</label>`).join("");
}

function renderCategoryManager() {
  categoryList.innerHTML = categories.map(({ id, label, position }) => `<div class="admin-category-row" data-category-id="${escapeHtml(id)}">
    <label class="admin-field"><span>Название</span><input data-category-label maxlength="40" value="${escapeHtml(label)}" /></label>
    <label class="admin-field admin-category-order"><span>Позиция</span><input data-category-position type="number" min="1" step="1" value="${position}" ${id === "all" ? "readonly" : ""} /></label>
    <button class="admin-delete" type="button" data-delete-category ${id === "all" ? "disabled aria-label=\"Вкладка Все обязательна\"" : ""}>Удалить</button>
  </div>`).join("");
  categoryList.querySelectorAll("[data-delete-category]:not(:disabled)").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("[data-category-id]");
      const category = categories.find(({ id }) => id === row.dataset.categoryId);
      if (!category || !window.confirm(`Удалить вкладку «${category.label}»? Категория будет снята с связанных кейсов.`)) return;
      button.disabled = true;
      try {
        await api("/api/admin/categories", { method: "DELETE", body: JSON.stringify({ id: category.id }) });
        categories = categories.filter(({ id }) => id !== category.id);
        cases = cases.map((item) => ({ ...item, categories: (item.categories || []).filter((id) => id !== category.id) }));
        renderCategoryChecks(selectedId ? cases.find(({ id }) => id === selectedId)?.categories || [] : []);
        renderCategoryManager();
        renderList();
        messageCategory("Вкладка удалена.");
      } catch (error) {
        messageCategory(error.message || "Не удалось удалить вкладку", true);
      }
    });
  });
}

function messageCategory(text, isError = false) {
  categoryMessage.textContent = text;
  categoryMessage.dataset.error = String(isError);
}

async function loadCategories() {
  categories = await api("/api/categories");
  renderCategoryChecks(selectedId ? cases.find(({ id }) => id === selectedId)?.categories || [] : []);
  renderCategoryManager();
}

function switchAdminView(view) {
  const activeView = view === "categories" ? "categories" : "cases";
  const showCases = activeView === "cases";
  adminLayout.dataset.activeView = activeView;
  casesManagement.hidden = !showCases;
  categoriesManagement.hidden = showCases;
  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    const selected = button.dataset.adminView === activeView;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function imageSource(image) {
  if (image.startsWith("r2:")) return `/media/${encodeURIComponent(image.slice(3))}`;
  if (image.startsWith("/")) return image;
  if (/^https:\/\//i.test(image)) return image;
  return `/images/${image}`;
}

function setImage(image) {
  currentImage = image || "";
  if (!currentImage) {
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
    imagePrompt.textContent = "Выбрать JPG, PNG или WebP до 10 МБ";
    form.elements.imageUrl.value = "";
    return;
  }
  imagePreview.src = imageSource(currentImage);
  imagePreview.hidden = false;
  imagePrompt.textContent = "Заменить обложку";
  form.elements.imageUrl.value = currentImage.startsWith("https://") ? currentImage : "";
}

function selectCase(id) {
  selectedId = id;
  const item = cases.find((entry) => entry.id === id);
  if (!item) return resetForm();
  editorTitle.textContent = item.title;
  form.elements.title.value = item.title || "";
  form.elements.description.value = item.description || "";
  detailEditor.setCase(item);
  form.elements.href.value = detailEditor.getMode() === "external" ? item.href || "" : "";
  form.elements.featured.checked = Boolean(item.featured);
  renderCategoryChecks(item.categories || []);
  form.querySelectorAll('[name="tag"]').forEach((input, index) => { input.value = item.tags?.[index] || ""; });
  imageInput.value = "";
  setImage(item.image);
  deleteButton.hidden = false;
  document.querySelector("#save-case").textContent = "Сохранить изменения";
  message("");
  renderList();
}

function resetForm() {
  selectedId = null;
  editorTitle.textContent = "Новый кейс";
  form.reset();
  detailEditor.setCase(null);
  renderCategoryChecks([]);
  imageInput.value = "";
  setImage("");
  deleteButton.hidden = true;
  document.querySelector("#save-case").textContent = "Сохранить кейс";
  message("");
  renderList();
}

async function loadCases() {
  cases = await api("/api/cases");
  renderList();
  if (cases.length) selectCase(cases[0].id);
  else resetForm();
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) {
    form.elements.imageUrl.value = "";
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.hidden = false;
  }
});

form.elements.imageUrl.addEventListener("input", () => {
  imageInput.value = "";
  const value = form.elements.imageUrl.value.trim();
  if (value.startsWith("https://")) {
    imagePreview.src = value;
    imagePreview.hidden = false;
  }
});

document.querySelector("#add-case").addEventListener("click", resetForm);
document.querySelectorAll("[data-admin-view]").forEach((button) => button.addEventListener("click", () => switchAdminView(button.dataset.adminView)));

document.querySelector("#add-category-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#new-category-label");
  const button = document.querySelector("#add-category");
  button.disabled = true;
  try {
    await api("/api/admin/categories", { method: "POST", body: JSON.stringify({ label: input.value.trim() }) });
    input.value = "";
    await loadCategories();
    renderList();
    messageCategory("Вкладка добавлена. Измените порядок при необходимости и сохраните его.");
  } catch (error) {
    messageCategory(error.message || "Не удалось добавить вкладку", true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#save-categories").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const next = [...categoryList.querySelectorAll("[data-category-id]")].map((row) => ({
    id: row.dataset.categoryId,
    label: row.querySelector("[data-category-label]").value.trim(),
    position: Number(row.querySelector("[data-category-position]").value),
  }));
  button.disabled = true;
  try {
    await api("/api/admin/categories", { method: "PUT", body: JSON.stringify({ categories: next }) });
    categories = next;
    renderCategoryManager();
    renderCategoryChecks(selectedId ? cases.find(({ id }) => id === selectedId)?.categories || [] : []);
    renderList();
    messageCategory("Названия и порядок сохранены.");
  } catch (error) {
    messageCategory(error.message || "Не удалось сохранить вкладки", true);
  } finally {
    button.disabled = false;
  }
});

form.elements.featured.addEventListener("change", () => {
  const otherFeaturedCount = cases.filter((item) => item.featured && item.id !== selectedId).length;
  if (form.elements.featured.checked && otherFeaturedCount >= 4) {
    form.elements.featured.checked = false;
    message("На главной уже выбраны четыре кейса. Снимите галочку с другого кейса.", true);
    return;
  }
  message("");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#login-submit");
  button.disabled = true;
  loginMessage.textContent = "Проверяю пароль…";
  loginMessage.dataset.error = "false";
  try {
    const password = loginForm.elements.password.value;
    await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    loginForm.reset();
    showAdmin();
    await loadCategories();
    await loadCases();
  } catch (error) {
    loginMessage.textContent = error.message || "Не удалось войти";
    loginMessage.dataset.error = "true";
  } finally {
    button.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  try { await fetch("/api/admin/session", { method: "DELETE", cache: "no-store" }); } catch { /* The server session still expires after seven days. */ }
  window.location.replace("/admin/");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const saveButton = document.querySelector("#save-case");
  saveButton.disabled = true;
  try {
    let image = currentImage;
    const file = imageInput.files?.[0];
    if (file) {
      message("Загружаю обложку…");
      const body = new FormData();
      body.set("image", file);
      ({ image } = await api("/api/admin/upload", { method: "POST", body }));
    } else if (form.elements.imageUrl.value.trim()) {
      image = form.elements.imageUrl.value.trim();
    }
    const payload = {
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      image,
      href: detailEditor.getMode() === "page" ? "" : form.elements.href.value.trim(),
      detail: detailEditor.collect(),
      featured: form.elements.featured.checked,
      categories: [...form.querySelectorAll('[name="categories"]:checked')].map((input) => input.value),
      tags: [...form.querySelectorAll('[name="tag"]')].map((input) => input.value.trim()).filter(Boolean),
    };
    if (!payload.detail && !payload.href) throw new Error("Укажите ссылку на проект или создайте страницу кейса");
    if (selectedId) payload.id = selectedId;
    const saved = await api("/api/admin/cases", { method: selectedId ? "PUT" : "POST", body: JSON.stringify(payload) });
    const updated = { ...payload, id: saved.id || selectedId, href: payload.detail ? `/cases/${payload.detail.slug}/` : payload.href };
    if (selectedId) cases = cases.map((item) => item.id === selectedId ? updated : item);
    else cases.push(updated);
    selectedId = updated.id;
    setImage(image);
    detailEditor.setCase(updated);
    editorTitle.textContent = updated.title;
    deleteButton.hidden = false;
    document.querySelector("#save-case").textContent = "Сохранить изменения";
    renderList();
    message("Сохранено. Изменения уже отображаются на сайте.");
  } catch (error) {
    message(error.message || "Не удалось сохранить кейс", true);
  } finally {
    saveButton.disabled = false;
  }
});

deleteButton.addEventListener("click", async () => {
  const item = cases.find((entry) => entry.id === selectedId);
  if (!item || !window.confirm(`Удалить кейс «${item.title}»?`)) return;
  deleteButton.disabled = true;
  try {
    await api("/api/admin/cases", { method: "DELETE", body: JSON.stringify({ id: selectedId }) });
    cases = cases.filter((entry) => entry.id !== selectedId);
    resetForm();
  } catch (error) {
    message(error.message || "Не удалось удалить кейс", true);
  } finally {
    deleteButton.disabled = false;
  }
});

try {
  const response = await fetch("/api/admin/session", { cache: "no-store" });
  if (response.ok) {
    showAdmin();
    await loadCategories();
    await loadCases();
  } else {
    showLogin(response.status === 503 ? "Настройте пароль админки в конфигурации хостинга." : "");
  }
} catch {
  showLogin("Не удалось связаться с сервером. Обновите страницу и попробуйте снова.");
}
