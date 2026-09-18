import { defineConfig, devices } from '@playwright/test'

/**
 * Сайт живёт по base '/knitting-tools/', поэтому baseURL несёт этот путь целиком,
 * а спеки ходят относительными адресами — абсолютный '/' попал бы мимо, в корень сервера.
 * По baseURL стоит витрина разделов, калькулятор — на './toe-band/' (§11).
 */
const BASE_URL = 'http://127.0.0.1:4173/knitting-tools/'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    // В CI сборка идёт после тестов, так что прогон собирает себе dist сам.
    command: 'make build && make preview',
    // Прогон идёт по production-сборке, а кнопки отзыва без подставленной ссылки на форму
    // на экране нет вовсе (§11) — значит ссылку надо подставить и сюда. Она заведомо
    // ненастоящая: сами запросы спеки перехватывают `page.route`, к живой форме тесты
    // не ходят никогда, иначе таблица ответов заполнялась бы мусором на каждый прогон.
    env: {
      VITE_FEEDBACK_PREFILL_URL:
        'https://docs.google.com/forms/d/e/e2e-fake-form/viewform' +
        '?entry.1=message&entry.2=contact&entry.3=url',
    },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      // Телефонный вьюпорт прибит намеренно. Почти все требования §12.2, живущие только
      // в DOM, — телефонные (починка по уходу фокуса, плашка не прыгает, шторка на
      // отмеченном ряду), и проверять их на десктопной ширине значит проверять не тот
      // экран. Раскладка от 1240 px — отдельный проект ниже.
      name: 'functional',
      testDir: 'e2e/functional',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      // Десктопная раскладка (§6): две колонки, вводка на всю ширину, схема без
      // горизонтальной прокрутки на дефолтном расчёте. Проверяется по DOM, а не
      // скриншотом: замеры блоков читаются в CI, картинки — нет.
      name: 'desktop',
      testDir: 'e2e/desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      // Скриншотные спеки. В CI НЕ гоняются и гоняться не должны: базлайны сняты
      // на машине мастера, шрифты и рендер на раннере другие, и первый же push
      // положил бы прогон, а вместе с ним деплой. Запускать руками: make test-screens.
      // Вьюпорт прибит намеренно — спека §12.2 называет это ценой скриншотов схемы.
      //
      // Базлайны лежат в репозитории, а не в .gitignore, и это существенно: иначе
      // прогон не может покраснеть — снял кадры и тут же ими же проверился, — а ревью
      // не видит картинок вовсе, хотя §12.2 п.6 требует скриншоты ровно под то, что
      // словами не проверяется. Положить CI они не могут: он их не гоняет. Пересняты
      // после правки экрана — `make test-screens-update`.
      name: 'screens',
      testDir: 'e2e/screens',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
    {
      // Съёмка карточки для соцсетей (§11), не проверка: спека пишет `public/og.png`.
      // В CI не гоняется — карточка едет в репозиторий картинкой, как базлайны схемы.
      // Вьюпорт десктопный и шире порога в 1240 px: карточку смотрят в ленте, где кадр
      // широкий, и две колонки показывают за раз и ручки, и схему. Масштаб 1, чтобы
      // размер файла совпал с объявленным в `og:image:width`.
      name: 'social',
      testDir: 'e2e/social',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
})
