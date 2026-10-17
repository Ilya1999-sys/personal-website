export const links = {
  resume: "https://hirehi.ru/resume/94eIadaUqG",
  telegram: "https://t.me/ilya_uxui_design",
  telegramChannel: "https://t.me/justilyapolikarpov",
  projectChannel: "https://t.me/proeditor_figma",
  email: "iliyapolikarpov@gmail.com",
  extraEmail: "iliapolickarpov@yandex.ru",
  phone: "+7 910 503-97-48",
  phoneHref: "+79105039748",
};

export const categories = [
  { id: "all", label: "Все" },
  { id: "uxui", label: "UXUI" },
  { id: "web", label: "Веб-дизайн" },
  { id: "creative", label: "Креативы" },
  { id: "motion", label: "Моушен" },
  { id: "article", label: "Статьи" },
];

export const experience = [
  { year: "2021", entries: [
    { company: "Лидмашина", period: "3 месяца", title: "Дизайнер", text: "Проходил стажировку на последнем курсе университета. Здесь я изучал на практике основы дизайна, делал картинки для соцсетей и статей, дизайнил лендинги и страницы сайтов.", kind: "work" },
    { company: "АртаДжим", period: "8 месяцев", title: "Маркетолог", text: "Стал мультидисциплинарным. Снимал короткие видео, оформлял соцсети, запускал и контролировал рекламные кампании, организовывал мероприятия и отвечал за всех новых лидов для фитнес-центра.", kind: "work" },
    { company: "UPROCK", period: "6 месяцев", title: "Курс «UX/UI дизайнер»", text: "Получил базовые знания в создании лендингов и сайтов. Познакомился с композицией, типографикой и тем, как всё это можно превращать в цельный дизайн-продукт.", kind: "course" },
  ]},
  { year: "2022", entries: [
    { company: "Софтлекс", period: "3 месяца", title: "UX/UI дизайнер", text: "Делал аутсорс проект, где нужно было заредизайнить личный кабинет работодателя (внутренняя платформа). Также участвовал в дизайне лендинга и картинок.", kind: "work" },
    { company: "UPROCK", period: "6 месяцев", title: "Курс «Дизайнер мобильных приложений»", text: "Изучил продвинутую Figma — от стилей до компонентов. Сделал два концепта мобильных приложений.", kind: "course" },
  ]},
  { year: "2023", entries: [
    { company: "Дизайнерс", period: "11 месяцев", title: "Комьюнити-менеджер", text: "С нуля развивали платформу. Я искал авторов-дизайнеров, договаривался об условиях размещения, проверял статьи, договаривался о коллаборациях с агентствами и корпорациями, продавал рекламные слоты в сетке телеграм-каналов и на сайте.", kind: "work" },
  ]},
  { year: "2024", entries: [
    { company: "Бюро Горбунова", period: "9 месяцев", title: "Школа редакторов", text: "Изучил много дисциплин (управление, переговоры, редактура, интерфейс). Познакомился с крутыми ребятами, помогал им разбираться в Фигме и как итог — сделал курс по Фигме для редакторов.", kind: "course" },
  ]},
  { year: "2025", entries: [
    { company: "wannabe", period: "3 месяца", title: "Курс «Продуктовый дизайнер»", text: "Повторил основы графического дизайна, изучил обновления Фигмы и вступил в комьюнити. По итогу сделал большой кейс по редизайну личного кабинета авторов курсов на учебной платформе.", kind: "course" },
    { company: "Tilda Education", period: "1,5 года", title: "Автор и редактор статей по дизайну", text: "Написал уже более 10 статей. Начал с описания стилей в веб-дизайне, продолжил практическими гайдами по автолейаутам в Фигме и сейчас пишу фундаментальные статьи с экспертами (профессия ux/ui дизайнер, дизайнеры и нейросети, эмоциональный дизайн).", kind: "work" },
  ]},
  { year: "2026", entries: [
    { company: "wannabe", period: "3 месяца", title: "Курс «Next level concepts»", text: "Прошёл полный путь от идеи до реализации кодом с помощью ИИ своей задумки. По итогу получился работающий проект и лендинг, который его презентовал.", kind: "course" },
    { company: "Loginom", period: "3 года", title: "UX/UI дизайнер", text: "Выстраивал дизайн-процессы, погружался в техническую реализацию и разбирался с работой в Git. Что вообще делал:\n— проводил исследования;\n— общался со стейкхолдерами и пользователями для выявления требований к фичам;\n— презентовал идеи и обсуждал с командой;\n— отвечал за дизайн-репозиторий в GitLab и Redmine;\n— создавал шаблоны и автоматизации в Figma;\n— использовал ИИ-инструменты для вёрстки страниц сайта;\n— пересобрал дизайн-систему на токенах и переменных;\n— создавал масштабируемый визуал для мероприятий: лендинг, картинки в соцсети, печатная продукция, реклама;\n— взаимодействовал с маркетингом и настраивал рабочий процесс.", kind: "work" },
  ]},
];

export const programs = ["Figma", "Figma Motion", "After Effects", "Adobe Illustrator", "Codex", "AI", "Cinema4D", "Adobe Photoshop", "GitLab", "Redmine", "Vercel", "ChatGPT"];

export const contactCards = [
  { title: "личный тг", value: "@ilya_uxui_design", href: links.telegram, kind: "telegram" },
  { title: "почта", value: links.email, href: `mailto:${links.email}`, kind: "email" },
  { title: "другая почта", value: links.extraEmail, href: `mailto:${links.extraEmail}`, kind: "email" },
  { title: "телефон", value: links.phone, href: `tel:${links.phoneHref}`, kind: "phone" },
  { title: "личный тг-канал", value: "@justilyapolikarpov", href: links.telegramChannel, kind: "telegram" },
  { title: "тг-канал пет-проекта", value: "@proeditor_figma", href: links.projectChannel, kind: "telegram" },
];
