import { categories as staticCategories, contactCards, experience, links, programs } from "./data.js";

async function loadCases() {
  const apiResponse = await fetch("/api/cases").catch(() => null);
  if (apiResponse?.ok) return apiResponse.json();

  const staticResponse = await fetch("/content/cases.json");
  if (!staticResponse.ok) throw new Error(`Не удалось загрузить кейсы: ${staticResponse.status}`);
  const items = await staticResponse.json();
  return items.map((item, index) => ({ id: `case-${String(index + 1).padStart(3, "0")}`, ...item }));
}

async function loadCategories() {
  const response = await fetch("/api/categories", { cache: "no-store" }).catch(() => null);
  if (response?.ok) return response.json();
  return staticCategories;
}

const [categories, cases] = await Promise.all([loadCategories(), loadCases()]);

const root = document.querySelector("#site");
const page = document.body.dataset.page || "home";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function icon(name) {
  if (name === "telegram") return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#229ED9"/><path d="m9 19.1 20-7.7c.9-.3 1.7.2 1.4 1.5l-3.4 16.2c-.2 1.1-.9 1.4-1.8.9l-5.4-4-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.5L27 14c.5-.4-.1-.7-.7-.3l-12.8 8.1-5.5-1.7c-1.2-.4-1.2-1.2 1-2Z" fill="#fff"/></svg>';
  if (name === "email") return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 11.5h30v19H5z" fill="#fff"/><path d="M5 12l15 12 15-12" fill="none" stroke="#4285f4" stroke-width="4"/><path d="M5 12v18" stroke="#34a853" stroke-width="4"/><path d="M35 12v18" stroke="#fbbc04" stroke-width="4"/><path d="m5 12 8 6" stroke="#ea4335" stroke-width="4"/><path d="m35 12-8 6" stroke="#ea4335" stroke-width="4"/></svg>';
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 5h5l3 8-4 3a23 23 0 0 0 9 9l3-4 8 3v5c0 2-2 4-4 4C17 32 8 23 5 9c0-2 2-4 6-4Z" fill="#064bff"/></svg>';
}

function header() {
  const casesCurrent = page === "cases" ? ' aria-current="page"' : "";
  const contactsCurrent = page === "contacts" ? ' aria-current="page"' : "";
  return `<header class="site-nav">
    <div class="nav-left">
      <a class="brand" href="/" aria-label="Илья П.">Илья П.</a>
      <nav class="nav-links" aria-label="Основная навигация">
        <a href="/cases/"${casesCurrent}>Кейсы</a>
        <a href="/contacts/"${contactsCurrent}>Контакты</a>
      </nav>
    </div>
    <div class="nav-actions">
      <a class="button button-secondary" href="${links.resume}" target="_blank" rel="noopener noreferrer">Смотреть резюме</a>
      <a class="button button-primary" href="${links.telegram}" target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
    </div>
  </header>`;
}

function caseImageSrc(image) {
  if (!image) return "";
  if (image.startsWith("r2:")) return `/media/${encodeURIComponent(image.slice(3))}`;
  return image.startsWith("/") ? image : `/images/${image}`;
}

function contactLinkMarkup({ title, value, href, kind }) {
  return `<a class="contact-card" href="${escapeHtml(href)}"${kind === "telegram" ? ' target="_blank" rel="noopener noreferrer"' : ""}>
    <span class="contact-card__label">${escapeHtml(title)}</span>
    <span class="contact-card__value">${escapeHtml(value)}</span>
  </a>`;
}

function footer() {
  return `<footer class="footer-panel">
    <h2>Давайте сотрудничать и работать вместе</h2>
    <p>Конечно, если посчитаете нужным, ведь навязываться — плохо.</p>
    <div class="footer-links">
      <a href="${links.telegram}" target="_blank" rel="noopener noreferrer">${icon("telegram")}<span>@ilya_uxui_design</span></a>
      <a href="mailto:${links.email}">${icon("email")}<span>${links.email}</span></a>
      <a href="tel:${links.phoneHref}">${icon("phone")}<span>${links.phone}</span></a>
    </div>
  </footer>`;
}

function makeCaseCard(item, featured = false, index = 0) {
  const title = escapeHtml(item.title);
  const categoryIds = Array.isArray(item.categories) ? item.categories : [];
  const itemTags = Array.isArray(item.tags) ? item.tags : [];
  const tagNames = [...new Set([...categoryIds.map((id) => categories.find((c) => c.id === id)?.label).filter(Boolean), ...itemTags])];
  const tags = tagNames.slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const tooltip = item.tooltip || item;
  const tooltipTitle = escapeHtml(tooltip.title);
  const tooltipDescription = escapeHtml(tooltip.description);
  const tooltipTags = (tooltip.tags || tagNames).slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const mobile = item.mobile || item;
  const cardClass = featured ? `featured-card featured-card--${index + 1}` : "case-card";
  return `<a class="${cardClass}" href="${escapeHtml(item.href || "#")}"${featured && item.mobile ? ` data-desktop-href="${escapeHtml(item.href)}" data-mobile-href="${escapeHtml(mobile.href)}"` : ""} target="_blank" rel="noopener noreferrer" data-featured="${featured}">
    <picture>${featured && mobile.image !== item.image ? `<source media="(max-width: 767px)" srcset="${escapeHtml(caseImageSrc(mobile.image))}" />` : ""}<img src="${escapeHtml(caseImageSrc(item.image))}" alt="Обложка проекта: ${title}" loading="${featured && index === 0 ? "eager" : "lazy"}" /></picture>
    ${featured ? `<div class="featured-card__mobile-copy"><h3>${escapeHtml(mobile.title)}</h3><p>${escapeHtml(mobile.description)}</p><div class="tag-list">${[...new Set([...(Array.isArray(mobile.categories) ? mobile.categories : []).map((id) => categories.find((c) => c.id === id)?.label).filter(Boolean), ...(Array.isArray(mobile.tags) ? mobile.tags : [])])].slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div></div>` : ""}
    ${featured ? `<span class="featured-card__label">${title}</span>` : `<div class="case-card__body"><h3>${title}</h3><p>${escapeHtml(item.description)}</p><div class="tag-list">${tags}</div></div>`}
    ${featured ? `<span class="case-tooltip" aria-hidden="true"><strong>${tooltipTitle}</strong><span>${tooltipDescription}</span><span class="tag-list">${tooltipTags}</span></span>` : ""}
  </a>`;
}

function homePage() {
  const eventVisual = cases.find((item) => item.id === "case-005") || cases[4];
  const eventLanding = cases.find((item) => item.id === "case-006") || cases[5];
  const featured = cases.filter((item) => item.featured).slice(0, 4).map((item) => {
    if (item.id === "case-003") {
      return {
        ...item,
        image: "featured-loginom.png",
        mobile: eventVisual,
        href: eventLanding?.href || item.href,
        tooltip: {
          title: "Лендинг мероприятия",
          description: eventLanding?.description || item.description,
          tags: ["Веб-дизайн", "Стиль", "Адаптивы"],
        },
      };
    }
    if (item.id === "case-005") return { ...item, mobile: eventLanding || item };
    return item;
  });
  const makeExperienceCard = (entry, extraClass = "") => `<article class="experience-card ${entry.kind === "course" ? "experience-card--course" : ""} ${extraClass}">
      <div class="experience-card__meta"><span>${escapeHtml(entry.company)}</span><span>${escapeHtml(entry.period)}</span></div>
      <h4>${escapeHtml(entry.title)}</h4>
      <p>${escapeHtml(entry.text)}</p>
    </article>`;
  const years = experience.map(({ year, entries }) => ({ year, entries: entries.filter((entry) => entry.company !== "Loginom" && entry.company !== "Tilda Education") }));
  const yearRows = (rows, extraClass = "") => rows.map(({ year, entries }) => `<div class="timeline-year ${extraClass} timeline-year--${year}">
    <h3>${escapeHtml(year)}</h3><div class="experience-grid">${entries.map((entry) => makeExperienceCard(entry)).join("")}</div>
  </div>`).join("");
  const earlyYears = years.filter(({ year }) => Number(year) <= 2023);
  const lateYears = years.filter(({ year }) => Number(year) >= 2024);
  const tilda = experience.flatMap(({ entries }) => entries).find((entry) => entry.company === "Tilda Education");
  const loginom = experience.flatMap(({ entries }) => entries).find((entry) => entry.company === "Loginom");
  const marqueeItems = programs.map((program) => `<span class="marquee-item">${escapeHtml(program)}<i aria-hidden="true"></i></span>`).join("");
  return `<main class="page-content home-content">
    <section class="hero-panel panel">
      ${header()}
      <div class="hero-copy">
        <img class="hero-avatar" src="/images/portrait-home.png?v=20261020" alt="Илья Поликарпов" width="160" height="160" />
        <div class="hero-copy__text">
          <h1>Создаю цифровые продукты и отвечаю за весь процесс дизайна: от идеи до продакшн-решения</h1>
          <p>Я UX/UI-дизайнер с акцентом на десктоп-интерфейсы B2B и B2C приложений. Помимо этого делаю дизайн сайтов и лендингов, визуал для мероприятий и соцсетей, вайбкожу с Codex, презентации. В общем, беру задачи, где надо разобраться, продумать решение и реализовать его, а не сделать в стол.</p>
        </div>
      </div>
    </section>

    <section class="content-section featured-section" aria-labelledby="featured-title">
      <h2 class="section-title" id="featured-title">Кейсы</h2>
      <div class="featured-stage"${featured.length ? "" : " hidden"}><div class="featured-grid"><div class="featured-track">${featured.map((item, i) => makeCaseCard(item, true, i)).join("")}</div></div></div>
      <a class="button button-primary all-cases" href="/cases/">Смотреть все кейсы</a>
    </section>

    <section class="content-section experience-section" aria-labelledby="experience-title">
      <h2 class="section-title" id="experience-title">5 лет в дизайне</h2>
      <div class="timeline">
        <div class="timeline-early">${yearRows(earlyYears)}</div>
        <div class="timeline-late">${yearRows(lateYears, "timeline-year--late")}${makeExperienceCard(tilda, "experience-card--tilda")}${makeExperienceCard(loginom, "experience-card--loginom")}</div>
      </div>
    </section>

    <section class="about-section" aria-label="Немного обо мне">
      <div class="about-copy">
        <p>Мне нравится делать проекты с нуля, разбирать задачи на части и делать результат, который вдохновляет. Так я создал пет-проект по обучению редакторов, который сейчас превратился в целое комьюнити: сайт, телеграм-канал (более 1,5 тыс. подписчиков), курсы и подкасты.</p>
        <img src="/images/about.jpeg" alt="Илья за работой над проектом" loading="lazy" />
      </div>
      <div class="program-marquee" aria-label="Инструменты и программы">
        <div class="marquee-track"><div class="marquee-group">${marqueeItems}</div><div class="marquee-group" aria-hidden="true">${marqueeItems}</div></div>
      </div>
    </section>
    ${footer()}
  </main>`;
}

function casesPage() {
  return `<main class="page-content cases-content">
    <section class="page-heading panel">
      ${header()}
      <div class="page-heading__copy">
        <h1>Здесь собраны рабочие, учебные, фриланс и вообще все-все последние проекты, которые мне нестыдно показать</h1>
        <p>Для работодателей, потенциальных клиентов и знакомых, которые хотят за меня порадоваться, что я не просто так фигнёй по дизайну занимаюсь.</p>
      </div>
    </section>
    <section class="content-section cases-section" aria-label="Проекты">
      <div class="filter-list" role="group" aria-label="Фильтр кейсов">${categories.map(({ id, label }, index) => `<button class="filter-button" type="button" data-filter="${id}" aria-pressed="${index === 0}">${escapeHtml(label)}</button>`).join("")}</div>
      <div class="case-grid">${cases.map((item) => makeCaseCard(item)).join("")}</div>
      <p class="empty-state" hidden>В этой категории пока нет проектов.</p>
    </section>
    ${footer()}
  </main>`;
}

function contactsPage() {
  const longTitle = "Связывайтесь удобным способом и стартанём делать крутые проекты!";
  const description = "Если вы ищете UX/UI дизайнера, вам нужно сделать сайт или лендинг, хотите найти автора и редактора статей по дизайну или же у вас какой-то специфичный проект — пишите, всё обсудим и договоримся. Если я не помогу, то смогу посоветовать другого специалиста.";
  return `<main class="page-content contacts-content">
    <section class="contacts-panel panel">
      ${header()}
      <div class="contact-intro">
        <img src="/images/contacts-photo.jpeg" alt="Илья Поликарпов в Петербурге" width="160" height="160" />
        <h1>${longTitle}</h1>
        <p>${description}</p>
      </div>
      <div class="contact-grid">${contactCards.map(contactLinkMarkup).join("")}</div>
    </section>
  </main>`;
}

root.innerHTML = page === "cases" ? casesPage() : page === "contacts" ? contactsPage() : homePage();

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    const filter = button.dataset.filter;
    let visibleCount = 0;
    document.querySelectorAll(".case-card").forEach((card, index) => {
      const matches = filter === "all" || cases[index]?.categories?.includes(filter);
      card.hidden = !matches;
      visibleCount += Number(matches);
    });
    const empty = document.querySelector(".empty-state");
    if (empty) empty.hidden = visibleCount > 0;
  });
});

const featuredCards = [...document.querySelectorAll(".featured-card")];
const mobileFeatured = window.matchMedia("(max-width: 767px)");
const syncFeaturedLinks = () => featuredCards.forEach((card) => {
  const href = mobileFeatured.matches ? card.dataset.mobileHref : card.dataset.desktopHref;
  if (href) card.href = href;
});
syncFeaturedLinks();
mobileFeatured.addEventListener?.("change", syncFeaturedLinks);

const featuredStage = document.querySelector(".featured-stage");
const featuredGrid = document.querySelector(".featured-grid");
const featuredTrack = document.querySelector(".featured-track");
const allFeaturedVisible = window.matchMedia("(min-width: 1140px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (featuredStage && featuredGrid && featuredTrack) {
  let frame = 0;
  const updateFeatured = () => {
    frame = 0;
    if (mobileFeatured.matches) {
      featuredStage.style.height = "auto";
      featuredTrack.style.transform = "";
      featuredTrack.style.gridTemplateColumns = "";
      return;
    }
    const showAll = allFeaturedVisible.matches;
    const cards = [...featuredTrack.querySelectorAll(".featured-card")];
    if (!cards.length) {
      featuredStage.style.height = "auto";
      return;
    }
    const width = featuredGrid.clientWidth;
    const gap = showAll ? Math.max(12, Math.min(24, window.innerWidth * 0.0125)) : 24;
    const small = showAll ? Math.max(140, Math.min(250, window.innerWidth * 0.1302)) : 0;
    const otherCards = Math.max(0, cards.length - 1);
    const maxHeight = showAll ? (width - otherCards * (small + gap)) * 9 / 16 : width * 9 / 16;
    if (reducedMotion.matches) {
      featuredStage.style.height = "auto";
      featuredGrid.style.position = "static";
      featuredGrid.style.overflow = showAll ? "visible" : "auto";
      featuredTrack.style.transform = "";
      if (showAll) featuredTrack.style.gridTemplateColumns = cards.map((_, index) => `${index === 0 ? width - otherCards * (small + gap) : small}px`).join(" ");
      return;
    }
    featuredStage.style.height = `${window.innerHeight * 3 + maxHeight}px`;
    const start = featuredStage.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, window.innerHeight * 3);
    const progress = Math.max(0, Math.min(cards.length - 1, ((window.scrollY - start) / range) * (cards.length - 1)));
    const active = Math.min(cards.length - 1, Math.floor(progress));
    const blend = progress >= cards.length - 1 ? 0 : progress - active;
    if (showAll) {
      const large = width - otherCards * (small + gap);
      const sizes = cards.map((_, index) => index === active ? large + (small - large) * blend : index === active + 1 ? small + (large - small) * blend : small);
      featuredTrack.style.gridTemplateColumns = sizes.map((size) => `${Math.max(small, size)}px`).join(" ");
      featuredTrack.style.transform = "";
    } else {
      featuredTrack.style.gridTemplateColumns = "";
      featuredTrack.style.transform = `translateX(-${progress * (width + 24)}px)`;
    }
  };
  const scheduleFeaturedUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateFeatured);
  };
  window.addEventListener("scroll", scheduleFeaturedUpdate, { passive: true });
  window.addEventListener("resize", scheduleFeaturedUpdate);
  allFeaturedVisible.addEventListener?.("change", scheduleFeaturedUpdate);
  mobileFeatured.addEventListener?.("change", scheduleFeaturedUpdate);
  scheduleFeaturedUpdate();
}

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".featured-card").forEach((card) => {
    const tooltip = card.querySelector(".case-tooltip");
    document.body.append(tooltip);
    let hideTimer = 0;
    let pointerX = 0;
    let pointerY = 0;
    let hasPointerPosition = false;
    const hide = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      tooltip.classList.remove("is-visible");
      tooltip.style.display = "none";
    };
    const scheduleHide = () => {
      if (!hideTimer) hideTimer = window.setTimeout(hide, 500);
    };
    const pointerIsOverCard = () => {
      const rect = card.getBoundingClientRect();
      return pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;
    };
    const move = (x, y) => {
      const gap = 20;
      const box = tooltip.getBoundingClientRect();
      const left = Math.min(x + gap, window.innerWidth - box.width - 12);
      const top = Math.min(y + gap, window.innerHeight - box.height - 12);
      tooltip.style.left = `${Math.max(12, left)}px`;
      tooltip.style.top = `${Math.max(12, top)}px`;
    };
    card.addEventListener("pointerenter", (event) => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointerPosition = true;
      tooltip.style.display = "";
      tooltip.classList.add("is-visible");
      move(event.clientX, event.clientY);
    });
    card.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointerPosition = true;
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      move(pointerX, pointerY);
    });
    card.addEventListener("pointerleave", scheduleHide);
    window.addEventListener("scroll", () => {
      if (tooltip.classList.contains("is-visible") && hasPointerPosition && !pointerIsOverCard()) scheduleHide();
    }, { passive: true });
    card.addEventListener("focus", () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      tooltip.style.display = "";
      tooltip.classList.add("is-visible");
      const rect = card.getBoundingClientRect();
      move(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    card.addEventListener("blur", hide);
  });
}
