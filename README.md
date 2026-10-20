# Портфолио Ильи Поликарпова

Портфолио на HTML, CSS и JavaScript с Cloudflare Pages Functions для админки. До подключения D1 сайт берёт кейсы из `content/cases.json`; после настройки базы читает их через `/api/cases`. Остальные данные — в `scripts/data.js`; исходные изображения и локальные шрифты — в `images/` и `fonts/`.

## Локальный просмотр

Из папки `website` запустить:

```sh
python3 -m http.server 4173
```

Открыть `http://localhost:4173`. Этот статический preview проверяет публичный интерфейс; Pages Functions и D1 локально через `python -m http.server` не запускаются.

## Cloudflare Pages

В настройках проекта оставить framework preset `None`, build command пустой и build output directory `.` (корень подключённого репозитория). Функции размещаются в `functions/`.

После покупки домена его можно добавить в настройках Pages в разделе Custom domains и обновить DNS у регистратора. Домен покупается отдельно от хостинга.

## Админка кейсов

Интерфейс находится по адресу `/admin/`. В нём можно менять кейсы, отмечать до четырёх кейсов для главной, редактировать категории, добавлять и удалять вкладки фильтра, менять их названия и порядок, а также управлять тегами кейсов. Pages Functions проверяют пароль и выдают подписанную HttpOnly-сессию; для входа задайте secret `ADMIN_PASSWORD` в Cloudflare Pages → Settings → Variables and Secrets. Не добавляйте пароль в Git и не отправляйте его в чат. Попытки входа ограничиваются через D1. До подключения R2 изображения можно указывать по HTTPS-ссылке или использовать локальные файлы из `images/`; загрузка файлов через форму требует R2 binding `BUCKET`.

Перед включением админки в Cloudflare Pages нужно:

1. Создать D1 database `portfolio-cases` и применить схему и данные командами `npx wrangler d1 execute portfolio-cases --remote --file=migrations/0001_create_cases.sql`, `npx wrangler d1 execute portfolio-cases --remote --file=migrations/0002_featured_cases.sql` и `npx wrangler d1 execute portfolio-cases --remote --file=migrations/0003_case_categories.sql`. Сайт также создаёт таблицу категорий при первом запросе, если она отсутствует.
2. В Pages-проекте добавить D1 binding `DB` → `portfolio-cases`.
3. Добавить secret `ADMIN_PASSWORD` в production environment. Используйте уникальную длинную парольную фразу; Cloudflare Access и платёжная настройка для входа не нужны.
4. Для загрузки изображений добавить R2 bucket `portfolio-case-images` и binding `BUCKET` → `portfolio-case-images` (необязательно; это требует включить R2 billing).
5. Повторно задеплоить Pages-проект после добавления binding и секрета.

Публичная оболочка `/admin/` не содержит данных; список и изменение кейсов доступны только после проверки серверной сессии. Не добавляйте секреты в Git и не отправляйте пароли или API-токены в чат.

## Вариант размещения на REG.RU

Для переноса на Linux-хостинг REG.RU с PHP/MySQL см. [`regru-backend/README.md`](regru-backend/README.md). Сначала экспортируйте актуальные данные с Cloudflare Pages, затем соберите отдельный web root через `node scripts/package-regru.mjs`. PHP-источники отделены от статического сайта и на Cloudflare Pages закрыты маршрутом.
