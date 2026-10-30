# Можно ли подключить Claude к Ravelry и что это даст knitting-tools

Исследование к вопросу мастера «Можем ли мы как-то с Ravelry законнектиться?»: есть ли у Ravelry
API, как получить ключ, что разрешают условия, есть ли готовые MCP-серверы для Claude и что из
этого полезно калькулятору мыска и справочнику набора петель. Материал для решения; код и страницы
проекта не затрагиваются, аккаунты и приложения на Ravelry не заводились, формы не отправлялись.
Дата: 2026-10-28.

## Короткие ответы

> 1. **Подключиться можно, и готовое уже есть.** У Ravelry есть официальный REST API
>    (`https://api.ravelry.com`), а на GitHub — несколько MCP-серверов для него. Самый живой —
>    `gpaul-mcp/MCP_ravelry` (MIT, последний пуш 2026-10-23): умеет и публичный поиск паттернов и
>    пряжи, и личные stash, очередь и проекты мастера.
> 2. **Проще всего — подключить этот MCP как есть, одной командой, без своего кода.** Свой сервер
>    или `curl` с ключом нужны, только если чужому серверу не доверять.
> 3. **Ключ бесплатный, но получить его можно только из-под аккаунта Ravelry** на
>    `ravelry.com/pro/developer`: приложение «basic auth, read-only» или OAuth 2.0. Сама страница
>    документации API и страница ключей открываются только после входа, поэтому **официальные
>    условия API (лимиты, запреты на кеширование, на ИИ) проверить не удалось.**
> 4. **В публичных «Terms of Service» Ravelry (редакция 1 февраля 2017) нет ни слова про ИИ,
>    машинное обучение, скрейпинг и API.** Но есть общий запрет: не «распространять и не делать
>    производные работы» от паттернов и контента сайта без лицензии владельца. Отдельные условия
>    API, скорее всего, тоже есть и лежат за логином — их надо прочитать мастеру до любой публикации.
> 5. **Из браузера со статической страницы API отвечает по CORS, но ключ при этом уйдёт всем
>    посетителям.** Публиковать на GitHub Pages можно только данные, снятые заранее, а не живые
>    запросы с ключом.
> 6. **Проекту пригодится мало.** Толщины пряжи в API есть (`/yarn_weights.json`: `ply`, `wpi`,
>    `knit_gauge`), но это те же классы Craft Yarn Council, которые в исследовании
>    `cast-on-by-yarn.md` уже разобраны; нашей оси «400 м/100 г и 200 м/100 г» Ravelry не даёт.
>    Реальная польза — личные проекты и stash мастера через MCP, и она лежит вне сайта.

## 1. Что такое API Ravelry

**Адрес и формат.** Базовый адрес — `https://api.ravelry.com`, ответы — JSON, пути с суффиксом
`.json`. Это видно по рабочему клиенту
([`src/ravelry/client.ts`](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/src/ravelry/client.ts):
`DEFAULT_BASE_URL = 'https://api.ravelry.com'`).

**Эндпоинты, которые реально вызывает этот клиент** (список взят из кода клиента, а не из
официальной документации, которая за логином, поэтому полным он не является):

| Предмет | Путь |
|---|---|
| Поиск паттернов | `/patterns/search.json` |
| Паттерны по id (пачкой) | `/patterns.json?ids=…` |
| Поиск пряжи | `/yarns/search.json` |
| Пряжа по id (пачкой) | `/yarns.json?ids=…` |
| Справочник толщин пряжи | `/yarn_weights.json` |
| Категории паттернов | `/pattern_categories/list.json` |
| Магазины | `/shops/search.json` |
| Текущий пользователь | `/current_user.json` |
| Личное: stash, очередь, проекты, избранное, библиотека, спицы | клиент их тоже зовёт (типы `ApiStash`, `ApiQueueResponse`, `ApiProjectsResponse`, `ApiFavoritesResponse`, `ApiLibraryResponse`, `ApiNeedleRecord`) |

Источник: [client.ts](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/src/ravelry/client.ts),
[types.ts](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/src/ravelry/types.ts).

**Что отдаёт `/yarn_weights.json`.** По типу `ApiYarnWeight` в том же репозитории: `id`, `name`,
`ply`, `wpi`, `knit_gauge`, `crochet_gauge`. Поля `ply`/`wpi`/`knit_gauge` есть. Числовые значения
я не получил: запрос без ключа возвращает 401 (см. раздел 2), а ключа у меня нет. **Какие именно
числа лежат в `knit_gauge` и как они записаны (диапазон строкой или числом) — не проверено.**
Справочник самого MCP-сервера ссылается на то, что веса пряжи берутся «от Ravelry», а региональные
названия (US worsted = UK aran) добавлены поверх по диапазонам Craft Yarn Council
(`src/toolbox/reference-data.ts`).

**Что отдаёт пряжа.** По типу `ApiYarn`: `yarn_weight`, `yardage`, `grams`, `min_gauge`,
`machine_washable`, `discontinued`, `rating_average`, `yarn_company_name`. То есть метраж на моток и
граммовка есть, из них считается м/100 г.

**Лимиты.** Документированных чисел я не нашёл. Известно только, что API отвечает 429
(клиент превращает его в «Ravelry is rate limiting requests»,
[client.ts](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/src/ravelry/client.ts)); собственный
лимит чужого хостингового MCP — 60 запросов в минуту на пользователя, это его ограничение, не
Ravelry. **Лимиты API Ravelry — не проверено.**

## 2. Авторизация и ключ

Все факты ниже — из README и кода двух MCP-серверов; официальную страницу ключей я открыть не мог
(редирект на форму входа, проверено `curl` на `ravelry.com/api`, `ravelry.com/pro/developer`,
`ravelry.com/groups/ravelry-api`, `ravelry.com/wiki/pages/API`: все ведут на `/account/login`).

- **Где берётся ключ:** `https://www.ravelry.com/pro/developer`, нужен вход в аккаунт Ravelry. По
  README `gpaul-mcp/MCP_ravelry` «a free Pro account is created if you don't have one» — то есть
  бесплатно и автоматически.
  ([README, раздел «Get Ravelry API credentials»](https://github.com/gpaul-mcp/MCP_ravelry#get-ravelry-api-credentials))
- **Три способа:**
  1. **Basic auth, read-only** — выдаются «username» и «password» приложения; шлются в заголовке
     `Authorization: Basic …`. Доступны публичные данные (паттерны, пряжа, справочники).
  2. **Basic auth, read/write** — тот же механизм с записью; README `buzzsurr/ravelry-mcp` называет
     ключи «Access Key» и «Personal Key» и предупреждает, что для записи в очередь и избранное
     read-only приложение «will silently fail».
     ([README](https://github.com/buzzsurr/ravelry-mcp#1-create-a-ravelry-pro-app))
  3. **OAuth 2.0** — для доступа к данным конкретного мастера (stash, очередь, проекты). Адреса:
     `https://www.ravelry.com/oauth2/auth` и `https://www.ravelry.com/oauth2/token`, scope
     `offline` даёт refresh-токен, access-токен живёт 24 часа (комментарий в
     [ravelry-oauth.ts](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/src/auth/ravelry-oauth.ts)).
     OAuth 1.0a в этих источниках не упоминается — **есть ли он сейчас, не проверено.**
- **Модерация.** Из README `gpaul-mcp`: хостинговая версия работает на read-only ключе «with
  Ravelry's permission», а в `docs/self-hosting.md` стоит совет: прежде чем раздавать URL широко,
  написать на `api@ravelry.com` и уточнить, что хостинг-приложение допустимо. То есть для личного
  пользования ключ выдаётся сразу, а для публичного сервиса есть негласное согласование с
  Ravelry. Это пересказ автора клиента, не слова Ravelry.
  ([README](https://github.com/gpaul-mcp/MCP_ravelry),
  [self-hosting.md](https://github.com/gpaul-mcp/MCP_ravelry/blob/main/docs/self-hosting.md))
- **Без ключа API закрыт:** запрос `GET https://api.ravelry.com/yarn_weights.json` вернул 401,
  тело `{"error":"ApiError::InvalidToken"}` (проверено 2026-10-28, `curl`).

## 3. Условия использования

**Что проверено.** Публичные «Ravelry Terms of Service», редакция «terms updated Feb 1st, 2017»:
<https://www.ravelry.com/about/terms> (страница открывается без входа, я прочитал текст целиком,
28 тыс. знаков). Условия API на ней не воспроизведены: в подвале «API» — только ссылка на
страницу API (за логином).

**Что в ToS есть.**

- Раздел «Proprietary Rights»: «you agree not to modify, rent, lease, loan, sell, distribute or
  create derivative works based on the Services, the software, patterns or any Content, whether in
  whole or in part», кроме случаев, «expressly authorized by the Company».
- Раздел про паттерны: «You may not modify, rent, lease, loan, sell, distribute or create derivative
  works based on any pattern that you do not own unless you have been explicitly granted a license»
  владельцем паттерна.
- Раздел «Content»: контент (в нём названы «information, data, text, photographs…») принадлежит
  опубликовавшим его пользователям; Ravelry не отвечает за его точность.
- Запрет мешать работе сервиса «in the Company's sole judgment» — под него подпадает агрессивный
  обход лимитов.

**Чего в ToS нет.** По поиску по тексту (`api`, `scrap`, `crawl`, `robot`, `spider`, `automated`,
`machine learn`, `artificial`, `AI`, `train`, `commercial`) в публичных условиях нет ни слова про ИИ,
машинное обучение, обучение моделей, скрейпинг, роботов, коммерческое использование. Единственное
вхождение «API» — пункт навигации.

**Чего я не смог проверить — главное.**

- Условия самого API (developer/API terms): они, судя по ссылке из подвала и по README клиентов
  («you agree to the terms of use for the API» — пересказ в документации Ruby-гема), показываются
  при создании ключа за логином. Запрет или разрешение кеширования, републикации, использования с
  ИИ, коммерческого использования **не проверены**. Страницу `ravelry.com/api` Wayback Machine тоже
  не хранит (`archived_snapshots` пуст).
- Группа API на Ravelry (`/groups/ravelry-api`) за логином, не читалась.

**Вывод для республикации.** Данные паттернов и пряжи на Ravelry принадлежат пользователям и
дизайнерам, ToS запрещает их «распространять» и делать производные работы. Тиражировать на
публичном сайте таблицу, выгруженную из API, без чтения условий API нельзя. Факты вроде «класс
пряжи → wpi» — общие ремесленные сведения (их держат Craft Yarn Council и сами производители),
их можно брать из первоисточников, а не из Ravelry.

## 4. Пути подключения к Claude

**4.1. Готовые MCP-серверы** (проверено через `gh api`, 2026-10-28):

| Репозиторий | Звёзды | Последний пуш | Авторизация | Заметки |
|---|---|---|---|---|
| [gpaul-mcp/MCP_ravelry](https://github.com/gpaul-mcp/MCP_ravelry) | 4 | 2026-10-23 | read-only basic auth (свой хостинг) или OAuth 2.0 «Sign in with Ravelry» | MIT; TypeScript, Node 22+; 38 коммитов, один автор; есть хостинг-инстанс |
| [buzzsurfr/ravelry-mcp](https://github.com/buzzsurfr/ravelry-mcp) | 1 | 2026-05-13 | basic auth read/write (Access Key + Personal Key) | npm `ravelry-mcp` 0.1.0 от 2026-05-12; паттерны, пряжа, очередь, stash, проекты |
| [marenslider/ravelry-mcp](https://github.com/marenslider/ravelry-mcp) | 0 | 2026-05-25 | не выяснял | «Unofficial MCP server» |
| [alicegetmanchuk/ravelry-mcp-project](https://github.com/alicegetmanchuk/ravelry-mcp-project) | 0 | 2026-08-15 | не выяснял | |

Это всё нишевые проекты частных авторов; официального MCP от Ravelry я не нашёл. Звёзд мало, живость
у лидера хорошая — активная разработка в октябре.

**Что умеет лидер** (README `gpaul-mcp/MCP_ravelry`): поиск паттернов с фильтрами (материал,
вес пряжи, метраж, сложность, техника, например «toe up»), `get_pattern_details` с плотностью в
петлях на 10 см, поиск пряжи и подбор замены, калькуляторы (`adjust_for_gauge`, `spread_evenly`,
`yarn_needed`, `convert_yarn_amount`, `count_stitches`), личные stash, очередь, проекты, журнал
прогресса, счётчик рядов.

**Как подключить:**

- **Хостинговый инстанс автора** — без ключа и без аккаунта, одной командой:
  `claude mcp add --transport http ravelry https://ravelry-mcp.gonz-paul.dev/mcp` (то же — через
  «Settings → Connectors → Add custom connector» в claude.ai). Для личных данных — адрес
  `…/account/mcp` с входом через Ravelry. Это сервис третьего лица: он видит запросы и, для
  личного режима, хранит токены Ravelry мастера (зашифрованными, по словам автора). Доверять или
  нет — решение мастера.
- **Свой запуск того же сервера** с собственным read-only ключом:
  `claude mcp add ravelry -e RAVELRY_USERNAME=… -e RAVELRY_PASSWORD=… -- node /путь/dist/index.js`.
  Ключ остаётся у мастера. (README, раздел «Run it yourself».)
- **Claude Code зовёт API через `curl`** с ключом из переменной окружения. Технически просто
  (`Authorization: Basic base64(user:pass)`), но это разовые вызовы без схемы и без кеша; для
  единичного запроса достаточно.
- **Свой MCP-сервер.** Не нужен: чужой уже закрывает всё, что нужно. Писать имеет смысл, только
  если чужой код читать и запускать не хочется.

**4.2. Из браузера со статической страницы.** Проверено `curl`-ом на `api.ravelry.com`: ответ на
`OPTIONS` и на `GET` с заголовком `Origin: https://fey.github.io` содержит
`access-control-allow-origin: https://fey.github.io` (сервер возвращает присланный origin),
`access-control-allow-headers: Authorization,…`, `access-control-allow-methods: GET,POST,…`.
То есть CORS не мешает. **Мешает другое:** API без ключа отвечает 401, а ключ в коде статического
сайта виден любому. Read-only ключ можно перевыпустить, но выставлять его публично значит нарушить
чужой аккаунт приложения и, возможно, условия API (не проверены). Бэкенда у проекта нет, а прокси
(Cloudflare Worker и т. п.) нарушил бы принцип «статика без сервера» из CLAUDE.md. Вывод:
**живых запросов с публичной страницы не делать.**

## 5. Что полезно проекту

**Толщины пряжи.** `/yarn_weights.json` отдаёт `ply`, `wpi`, `knit_gauge` по классам. Для
справочника набора петель (`src/references/cast-on/`) это не новость: ось «пара размеров EU ×
толщина» уже построена на таблицах Opal и Regia и на классах Craft Yarn Council
(`.scratch/sock-sizes/research/cast-on-by-yarn.md`). Ravelry добавил бы в лучшем случае ещё одно
пересказывание тех же классов, причём под ToS, который запрещает перераспространять, а не под
первоисточником. **Не брать.**

**Пряжа конкретных марок.** В базе пряжи есть метраж на моток, граммы и `min_gauge`, откуда
получается «метров на 100 г» для любой марки. Теоретически — способ автоматически относить марку к
колонке 400 м или 200 м. Но выгрузка базы в наш репозиторий упирается в раздел 3 (условия API не
прочитаны), а справочнику нужны две колонки, а не каталог марок. **Не нужно сейчас.**

**Плотность паттернов.** Поиск по `toe up`, весу, метражу даёт реальные носки с плотностью на 10 см
из описаний дизайнеров — независимая проверка формулы «обхват × (1 − свобода) × плотность / 10»
против сотен живых паттернов. Это разовая сверка для исследования, а не данные для сайта; тоже под
вопросом по условиям.

**Личные проекты и stash мастера.** Тут польза настоящая: через MCP Claude может читать stash
(какая пряжа с каким метражом есть) и проекты и предлагать носок под имеющийся моток, а журнал
прогресса даёт «ряд N из M» рядом со счётом рядов мыска. Но это работа внутри Claude, а не фича
сайта: у сайта нет ни аккаунтов, ни бэкенда, ссылка на проект Ravelry в hash не нужна. Если
понадобится, то только ссылкой «найти в Ravelry» (простой URL поиска, без API).

**Итог.** Подключить Claude к Ravelry можно за минуту, если нужен поиск паттернов и разговор о
своём stash. Для самого сайта knitting-tools Ravelry-данные не нужны и юридически рискованны;
исследование носочных наборов уже опирается на первоисточники производителей.

## Что осталось непроверенным

- Условия API Ravelry (кеширование, республикация, ИИ, коммерция): доступны только после входа на
  `ravelry.com/pro/developer`; мастеру стоит прочитать их самому, если решит брать данные.
- Официальные лимиты запросов и официальный список эндпоинтов (`ravelry.com/api` за логином).
- Числовые значения `wpi` и `knit_gauge` в `/yarn_weights.json` (нужен ключ).
- Существует ли OAuth 1.0a у Ravelry сейчас.
- Безопасность и устойчивость хостингового MCP-инстанса автора: код открыт, но запущенный сервис я
  не аудировал; автор сам рекомендует согласовать хостинг с `api@ravelry.com`.

## Источники

Первоисточники (то, что сам владеет утверждением):

- Ravelry, Terms of Service (редакция 2017-02-01): <https://www.ravelry.com/about/terms>
- Ravelry API, поведение сервера (CORS, 401): `https://api.ravelry.com/yarn_weights.json`,
  собственные запросы `curl`, 2026-10-28
- Ravelry, страницы документации и ключей (за логином, прочитать не удалось):
  <https://www.ravelry.com/api>, <https://www.ravelry.com/pro/developer>,
  <https://www.ravelry.com/groups/ravelry-api>

Исходники и README клиентов (владеют фактами о своём коде и о том, что видели в API):

- <https://github.com/gpaul-mcp/MCP_ravelry> (README, `src/ravelry/client.ts`,
  `src/ravelry/types.ts`, `src/auth/ravelry-oauth.ts`, `docs/self-hosting.md`,
  `src/toolbox/reference-data.ts`)
- <https://github.com/buzzsurfr/ravelry-mcp>, npm `ravelry-mcp`
- <https://github.com/marenslider/ravelry-mcp>
- <https://github.com/alicegetmanchuk/ravelry-mcp-project>

Внутренние материалы проекта:

- `.scratch/sock-sizes/research/cast-on-by-yarn.md`
