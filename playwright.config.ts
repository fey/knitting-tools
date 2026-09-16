import { defineConfig, devices } from '@playwright/test'

/**
 * Страница живёт по base '/knitting-tools/', поэтому baseURL несёт этот путь целиком,
 * а спеки ходят относительным './' — абсолютный '/' попал бы мимо, в корень сервера.
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
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'functional',
      testDir: 'e2e/functional',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Скриншотные спеки. В CI НЕ гоняются и гоняться не должны: базлайны сняты
      // на машине мастера, шрифты и рендер на раннере другие, и первый же push
      // положил бы прогон, а вместе с ним деплой. Запускать руками: npm run test:screens.
      // Вьюпорт прибит намеренно — спека §12.2 называет это ценой скриншотов схемы.
      //
      // Базлайны лежат в репозитории, а не в .gitignore, и это существенно: иначе
      // прогон не может покраснеть — снял кадры и тут же ими же проверился, — а ревью
      // не видит картинок вовсе, хотя §12.2 п.6 требует скриншоты ровно под то, что
      // словами не проверяется. Положить CI они не могут: он их не гоняет. Пересняты
      // после правки экрана — `npx playwright test --project=screens -u`.
      name: 'screens',
      testDir: 'e2e/screens',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
})
