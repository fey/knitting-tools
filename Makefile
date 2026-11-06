# Единая точка входа: всё гоняется через make, а не напрямую.
# Сами команды описаны скриптами в package.json, Makefile их только зовёт —
# так команда записана в одном месте, а не продублирована здесь и там.
# Флаги (порты стенда и preview, набор проектов Playwright) живут там же,
# в скриптах: JSON комментариев не держит, поэтому «почему так» — здесь.

.DEFAULT_GOAL := help

help: ## Список команд
	@awk -F' ## ' '/^[a-z0-9-]+:.*## /{ split($$1, n, ":"); printf "  %-22s %s\n", n[1], $$2 }' $(MAKEFILE_LIST)

# Единственная цель без скрипта-пары: `npm run install` столкнулся бы с одноимённым
# жизненным циклом npm, поэтому `npm ci` зовётся здесь напрямую.
install: ## Зависимости из lock-файла
	npm ci

browsers: ## Chromium под прогон страницы
	npm run browsers

# Версия @playwright/test из lock-файла, а не из package.json: тильда там пускает патч,
# а образ CI (.github/workflows/deploy.yml) должен совпасть с тем, что реально стоит.
# Вывод — одна строка с версией, без эха команды и баннера npm: его читает шаг CI.
playwright-version: ## Версия Playwright из lock-файла — тег образа CI
	@npm run --silent playwright:version

# Порты стенда и preview разведены намеренно (docs/agents/local-stand.md):
# стенд — dev на 5173, прогон страницы — preview на 4173. Оставленный preview
# подхватится следующим прогоном e2e вместо своей сборки, и тот проверит вчерашний dist.
dev: ## Локальный стенд на 5173
	npm run dev

build: ## Проверка типов и сборка в dist
	npm run build

typecheck: ## Проверка типов без сборки — на ходу работы, быстрее build
	npm run typecheck

# Структурные правила ast-grep (sgconfig.yml): граница core/ — без Vue и без браузера.
# Вторым шагом прогоняются примеры самих правил, чтобы правило не промахивалось молча.
lint: ## Правила ast-grep и их примеры
	npm run lint

preview: ## Собранная страница на 4173. Под прогон e2e, стенд поднимают через dev
	npm run preview

test: test-unit test-e2e ## Оба шва разом — то же, что гоняет CI

# F сужает прогон до файлов или каталогов: `make test-unit F=src/calculators/heel/core/`,
# `make test-e2e F=e2e/functional/french-heel.spec.ts`. Без F — весь набор. Сужение
# идёт через make, а не через npx, чтобы набор проектов Playwright оставался в скрипте.
test-unit: ## Ядро под Vitest; F= — только эти файлы
	npm run test:unit -- $(F)

test-e2e: ## Страница под Playwright: functional и desktop; F= — только эти файлы
	npm run test:e2e -- $(F)

test-screens: ## Скриншоты схемы. В CI не гоняются намеренно; F= — только эти файлы
	npm run test:screens -- $(F)

test-screens-update: ## Пересъёмка базлайнов после правки экрана; F= — только эти файлы
	npm run test:screens:update -- $(F)

# Заголовок PR при squash-мерже становится коммитом в main и записью в заметках
# к релизу, поэтому проверяется именно он. Заголовок приходит переменной PR_TITLE:
# в CI — из события pull_request, локально — `make lint-pr-title PR_TITLE='feat: …'`.
lint-pr-title: ## Заголовок PR из PR_TITLE — Conventional Commits
	printf '%s\n' "$$PR_TITLE" | npm run --silent lint:title

# Карточка для соцсетей снимается с живой страницы, поэтому цель — рядом со съёмкой
# базлайнов, а не со сборкой. Оставленный на 4173 preview подхватится и здесь
# (reuseExistingServer), и карточка снимется со вчерашнего dist — гасить перед съёмкой.
og: ## Пересъёмка карточки для соцсетей в public/og.png
	npm run og

.PHONY: help install browsers playwright-version dev build typecheck lint preview test test-unit test-e2e test-screens test-screens-update lint-pr-title og
