const form = document.querySelector("#case-form");
const list = document.querySelector("#admin-case-list");
const status = document.querySelector("#admin-status");
const formMessage = document.querySelector("#form-message");
const editorTitle = document.querySelector("#editor-title");
const deleteButton = document.querySelector("#delete-case");
const imageInput = document.querySelector("#image-file");
const imagePreview = document.querySelector("#image-preview");
const imagePrompt = document.querySelector("#image-prompt");
const categoryLabels = new Map([["uxui", "UX/UI"], ["web", "Веб-дизайн"], ["creative", "Креативы"], ["motion", "Моушен"], ["article", "Статьи"]]);
let cases = [];
let selectedId = null;
let currentImage = "";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const message = (text, isError = false) => {
  formMessage.textContent = text;
  formMessage.dataset.error = String(isError);
};

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Ошибка сервера: ${response.status}`);
  return data;
}

function renderList() {
  list.innerHTML = cases.map((item) => `<button class="admin-case-item" type="button" data-id="${escapeHtml(item.id)}" aria-current="${item.id === selectedId}">${escapeHtml(item.title)}<span>${(item.categories || []).map((id) => categoryLabels.get(id)).filter(Boolean).join(" · ")}</span></button>`).join("");
  list.querySelectorAll("[data-id]").forEach((button) => button.addEventListener("click", () => selectCase(button.dataset.id)));
  status.textContent = `${cases.length} ${cases.length === 1 ? "кейс" : "кейсов"}`;
}

function setImage(image) {
  currentImage = image || "";
  if (!currentImage) {
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
    imagePrompt.textContent = "Выбрать JPG, PNG или WebP до 10 МБ";
    return;
  }
  imagePreview.src = currentImage.startsWith("r2:") ? `/media/${encodeURIComponent(currentImage.slice(3))}` : currentImage.startsWith("/") ? currentImage : `/images/${currentImage}`;
  imagePreview.hidden = false;
  imagePrompt.textContent = "Заменить обложку";
}

function selectCase(id) {
  selectedId = id;
  const item = cases.find((entry) => entry.id === id);
  if (!item) return resetForm();
  editorTitle.textContent = item.title;
  form.elements.title.value = item.title || "";
  form.elements.description.value = item.description || "";
  form.elements.href.value = item.href || "";
  form.querySelectorAll('[name="categories"]').forEach((input) => { input.checked = (item.categories || []).includes(input.value); });
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
  imageInput.value = "";
  setImage("");
  deleteButton.hidden = true;
  document.querySelector("#save-case").textContent = "Сохранить кейс";
  message("");
  renderList();
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) imagePreview.src = URL.createObjectURL(file), imagePreview.hidden = false;
});

document.querySelector("#add-case").addEventListener("click", resetForm);

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
    }
    const payload = {
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      image,
      href: form.elements.href.value.trim(),
      categories: [...form.querySelectorAll('[name="categories"]:checked')].map((input) => input.value),
      tags: [...form.querySelectorAll('[name="tag"]')].map((input) => input.value.trim()).filter(Boolean),
    };
    if (selectedId) payload.id = selectedId;
    const saved = await api("/api/admin/cases", { method: selectedId ? "PUT" : "POST", body: JSON.stringify(payload) });
    const updated = { ...payload, id: saved.id || selectedId };
    if (selectedId) cases = cases.map((item) => item.id === selectedId ? updated : item);
    else cases.push(updated);
    selectedId = updated.id;
    setImage(image);
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
  cases = await api("/api/cases");
  renderList();
  if (cases.length) selectCase(cases[0].id);
  else resetForm();
} catch (error) {
  status.textContent = error.message || "Не удалось загрузить кейсы";
  message("Админка ждёт подключения Cloudflare Access, D1 и R2. После настройки кейсы появятся здесь.", true);
}
