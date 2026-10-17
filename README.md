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

Интерфейс находится по адресу `/admin/`. Он редактирует заголовок, описание, обложку, ссылку на проект, категории фильтрации и до пяти тегов. Для защиты доступа и хранения используются Cloudflare Access, Pages Functions, D1 и R2. Файлы `functions/` содержат API, `migrations/0001_create_cases.sql` создаёт и заполняет базу начальными данными. Файл `.pages.yml` относится к прежней Pages CMS интеграции; новая админка использует D1 как единственный источник актуальных кейсов.

Перед включением админки в Cloudflare Pages нужно:

1. Создать D1 database `portfolio-cases` и применить начальную схему и данные командой `npx wrangler d1 execute portfolio-cases --remote --file=migrations/0001_create_cases.sql`.
2. Создать R2 bucket `portfolio-case-images`.
3. В Pages-проекте добавить D1 binding `DB` → `portfolio-cases` и R2 binding `BUCKET` → `portfolio-case-images`.
4. В Cloudflare Access создать две Self-hosted application с email allowlist для личного адреса: `ilyapolikarpov.ru/admin*` и `ilyapolikarpov.ru/api/admin*`.
5. Добавить Pages environment variables `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUDS` (оба Application Audience Tag через запятую) и `ADMIN_EMAIL`.
6. Повторно задеплоить Pages-проект после добавления bindings и переменных.

Pages Functions также проверяют подпись Cloudflare Access JWT, его issuer, audience, срок действия и email. Поэтому одного открытого Pages URL недостаточно для доступа к экрану или изменяющим API. Не добавляй секреты в Git и не отправляй пароли или API-токены в чат.
