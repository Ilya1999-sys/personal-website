const loginomTasks = [
  {
    title: "Добавить ИИ-чат в компоненты, где используется код",
    problem: "Клиенты не готовы покупать приложение без ИИ-фич. Тем более они уже не хотят самостоятельно писать код или генерировать его в стороннем ИИ, потом копировать и вставлять в нужный компонент Loginom.",
    task: "Добавить ИИ-чат, в котором можно сгенерировать код, доработать его и вставить внутрь компонента, чтобы дальше с ним работать. Также предусмотреть полезные фичи, которые есть в привычных чатах.",
    process: "Исследовал ИИ-чаты конкурентов и стандартные ChatGPT, Perplexity и Gemini. Согласовал требования, создал новые дизайн-компоненты для чата и подготовил вайбкод-решение для программиста.",
    result: "ИИ-чат уже добавлен разработчиком и тестируется. Компонент презентовали клиентам, появились новые запросы на покупку продукта из-за постепенного внедрения ИИ-функционала.",
    prototypes: [1, 2, 3], design: [4, 5, 6],
  },
  {
    title: "Сделать редизайн компонента «Фильтр строк»",
    problem: "Пользователи мало пользуются компонентом из-за неудобства и непривычности. В техническую поддержку приходит много сообщений о багах.",
    task: "Сделать компонент привычным для пользователей, исправить текущие баги, протестировать решение на реальных пользователях и подготовить документацию для разработчиков.",
    process: "Пообщался с пользователями, изучил задачи с проблемами и реализацию конкурентов. Подготовил несколько прототипов и презентовал их команде и пользователям.",
    result: "Компонентом пользуются больше года. Пользователи чаще применяют его в сценариях, ошибки перестали воспроизводиться. Решение перенесли ещё в три связанных компонента.",
    prototypes: [7, 8, 9, 10, 11, 12], design: [13, 14, 15, 16, 17, 18],
  },
  {
    title: "Добавить триггеры в планировщик задач",
    problem: "Пользователи не могут настроить выполнение задачи по определённым триггерам, как в Windows. Это становится барьером для использования функционала и продажи продукта.",
    task: "Исследовать триггеры в других планировщиках и добавить их в существующий компонент, сохранив визуальный стиль и не нарушив текущую работу.",
    process: "Изучил Windows и приложения конкурентов, поговорил с аналитиками и собрал требования. Добавил три триггера в планировщик Loginom.",
    result: "Триггеры внедрили. Решение с вкладками презентовал команде; им уже пользуются клиенты и внутренние пользователи.",
    design: [19, 20, 21, 22, 23, 24],
  },
  {
    title: "Добавить редактор хранилища данных",
    problem: "Редактор хранилища данных использовался в старой версии приложения, до 2016 года. Его не внедряли снова, потому что было непонятно, как это сделать на клиентской и серверной части.",
    task: "Вернуть минимально необходимый функционал предыдущей версии, изучить решения конкурентов и востребованные возможности, найти место редактору в приложении и обновить визуальный стиль.",
    process: "Изучил старое приложение, документацию и клиентские сценарии, посмотрел решения конкурентов и провёл исследование с помощью ИИ. Собрал требования, обсудил прототипы с командой и подготовил дизайн в действующей дизайн-системе.",
    result: "Компонент находится в разработке. Дизайн презентовал команде и внутренним пользователям; он отвечает заявленным требованиям.",
    prototypes: [25, 26, 27], design: [28, 29, 30],
  },
  {
    title: "Сделать редизайн компонента «Замена»",
    problem: "Клиенты и внутренние пользователи жалуются в техническую поддержку: функционалом неудобно пользоваться, он кажется нелогичным и непривычным.",
    task: "Переработать компонент, протестировать решение на внутренних пользователях и предусмотреть понятный интерфейс для разных режимов работы.",
    process: "Изучил конкурентов и построил Job Story. Исследование показало, что для тех же действий в Loginom требуется в полтора-два раза больше шагов. Собрал требования, сделал редизайн и доработал дизайн-систему.",
    result: "Решение стало удобнее по мнению пользователей и работает интуитивно. Реализацию приостановили, когда программист ушёл из компании.",
    prototypes: [31, 32, 33, 34, 35, 36], design: [37, 38, 39, 40, 41, 42],
  },
  {
    title: "Добавить редактор Markdown в заметки и комментарии",
    problem: "Большинство пользователей знакомы с Markdown и хотят использовать форматирование. Сейчас в комментариях и заметках нельзя задать стили и сделать текст удобнее для чтения.",
    task: "Добавить привычный Markdown-функционал с возможностью масштабирования и предусмотреть загрузку изображений и управление ими в админке.",
    process: "Изучил решения конкурентов, собрал требования по связанным задачам, подготовил и презентовал прототип, добавил новые иконки Markdown и документацию.",
    result: "Решением пользуются больше года. На презентации клиенты благодарили за реализацию; убрался ещё один барьер для продажи продукта.",
    prototypes: [43, 44, 45], design: [46, 47, 48],
  },
];

const eventSections = [
  { title: "Референсы и дизайн-концепты", images: [1, 2, 3, 4, 5, 6] },
  { title: "Соцсети", images: [7, 8, 9, 10, 11, 12] },
  { title: "Рекламные креативы (в свободном стиле)", images: [13, 14, 15, 16] },
  { title: "Применение визуальной системы", images: [17, 18, 19, 20] },
];

const imagePath = (type, index) => `/images/cases/${type === "loginom" ? "loginom" : "event-visual"}/${type === "loginom" ? "loginom" : "event"}-${String(index).padStart(2, "0")}.png`;
const escape = (text = "") => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function imageGrid(type, indices, label) {
  return `<div class="case-detail__gallery" aria-label="${escape(label)}">${indices.map((index, position) => `<figure${type === "event" && index >= 18 ? ' class="is-square"' : ""}><img src="${imagePath(type, index)}" alt="${escape(label)} — экран ${position + 1}" loading="lazy" decoding="async" /></figure>`).join("")}</div>`;
}

function taskSection(task, index) {
  const cards = [
    ["Проблема", task.problem],
    ["Задача", task.task],
    ["Процесс", task.process],
  ].map(([title, body]) => `<article class="case-detail__text-card"><h3>${title}</h3><p>${escape(body)}</p></article>`).join("");
  const galleries = [
    task.prototypes?.length ? `<div class="case-detail__media"><h3>Прототипы и исследование</h3>${imageGrid("loginom", task.prototypes, `Кейс ${index + 1}: прототипы и исследование`)}</div>` : "",
    task.design?.length ? `<div class="case-detail__media"><h3>Дизайн</h3>${imageGrid("loginom", task.design, `Кейс ${index + 1}: дизайн`)}</div>` : "",
  ].join("");
  return `<section class="case-detail__task" aria-labelledby="loginom-task-${index + 1}">
    <div class="case-detail__task-heading"><span class="case-detail__eyebrow">Кейс ${String(index + 1).padStart(2, "0")}</span><h2 id="loginom-task-${index + 1}">${escape(task.title)}</h2></div>
    <div class="case-detail__text-grid">${cards}</div>
    ${galleries}
    <div class="case-detail__result"><h3>Результат</h3><p>${escape(task.result)}</p></div>
  </section>`;
}

function loginomPage(header, footer) {
  const intro = "Здесь я много делал исследований, смотрел конкурентов, общался с пользователями, делал прототипы и разные подходы к решению, взаимодействовал с 12 разработчиками и работал в GitLab, пересобирал дизайн-систему и готовил документацию.";
  return `<main class="page-content case-detail-content case-detail-content--loginom">
    <section class="case-detail__cover panel">${header()}<div class="case-detail__intro"><a class="case-detail__back" href="/cases/">← Все кейсы</a><span class="case-detail__eyebrow">Loginom · продуктовый дизайн</span><h1>Фичи для веб-приложения для аналитиков за 3 года работы</h1><p>${escape(intro)}</p></div></section>
    <div class="case-detail__tasks">${loginomTasks.map(taskSection).join("")}</div>
    ${footer()}
  </main>`;
}

function eventPage(header, footer) {
  const intro = "Продумал масштабируемый стиль, который используется на лендинге, в соцсетях, рекламных креативах и печатной продукции.";
  const sections = eventSections.map((section) => `<section class="case-detail__event-gallery"><h2>${escape(section.title)}</h2>${imageGrid("event", section.images, section.title)}</section>`).join("");
  return `<main class="page-content case-detail-content case-detail-content--event">
    <section class="case-detail__cover panel">${header()}<div class="case-detail__intro"><a class="case-detail__back" href="/cases/">← Все кейсы</a><span class="case-detail__eyebrow">Loginom Day · визуальная система</span><h1>Визуальная система для ежегодной конференции Loginom Day</h1><p>${escape(intro)}</p></div></section>
    <section class="case-detail__event-summary">
      <article class="case-detail__text-card"><h2>Проблема</h2><p>Для мероприятия каждый год создавался новый стиль, не связанный с брендом Loginom и выглядевший хаотично. Бизнес не хотел ежегодно тратить время и бюджет на разработку новой визуальной системы.</p></article>
      <article class="case-detail__text-card"><h2>Задача</h2><p>Создать современный и узнаваемый стиль, который не приестся за три года, покажет актуальность события и позволит обновлять материалы, не ломая общую систему.</p></article>
      <article class="case-detail__text-card"><h2>Процесс</h2><p>Исследовал визуальные стили десятка конференций, проанализировал тенденции и закономерности. Подобрал референсы, создал шесть дизайн-концептов, презентовал команде их масштабируемость и начал с лендинга.</p></article>
    </section>
    ${sections}
    <section class="case-detail__landing-links" aria-label="Лендинги Loginom Day">
      <a class="case-detail__landing-button" href="https://day.loginom.ru/2025/" target="_blank" rel="noopener noreferrer">Итоговый дизайн лендинга 2025 <span aria-hidden="true">→</span></a>
      <a class="case-detail__landing-button" href="https://day.loginom.ru/" target="_blank" rel="noopener noreferrer">Итоговый дизайн лендинга 2026 <span aria-hidden="true">→</span></a>
    </section>
    <section class="case-detail__result"><h2>Результат</h2><p>Новый визуальный стиль используется уже два года и поддерживался несколькими дизайнерами. Брендинг узнаваемый и нравится клиентам, а система помогает быстро создавать нужные для мероприятия материалы: визитки, презентации, изображения и лендинг.</p></section>
    ${footer()}
  </main>`;
}

export function caseDetailPage(type, header, footer) {
  return type === "event" ? eventPage(header, footer) : loginomPage(header, footer);
}
