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

# Порты стенда и preview разведены намеренно (docs/agents/local-stand.md):
# стенд — dev на 5173, прогон страницы — preview на 4173. Оставленный preview
# подхватится следующим прогоном e2e вместо своей сборки, и тот проверит вчерашний dist.
dev: ## Локальный стенд на 5173
	npm run dev

build: ## Проверка типов и сборка в dist
	npm run build

preview: ## Собранная страница на 4173. Под прогон e2e, стенд поднимают через dev
	npm run preview

test: test-unit test-e2e ## Оба шва разом — то же, что гоняет CI

test-unit: ## Ядро под Vitest
	npm run test:unit

test-e2e: ## Страница под Playwright: functional и desktop
	npm run test:e2e

test-screens: ## Скриншоты схемы. В CI не гоняются намеренно
	npm run test:screens

test-screens-update: ## Пересъёмка базлайнов после правки экрана
	npm run test:screens:update

.PHONY: help install browsers dev build preview test test-unit test-e2e test-screens test-screens-update
