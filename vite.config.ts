import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Project site: страница живёт не в корне домена, а по
  // https://fey.github.io/knitting-tools/ — корень занят блогом.
  base: '/knitting-tools/',
  plugins: [vue(), tailwindcss()],
  build: {
    // Многостраничная сборка вместо роутера (§11): корень — витрина разделов,
    // калькулятор — своим входом на `/toe-band/`. Роутер здесь не нужен вовсе:
    // в hash-режиме он занял бы тот же hash, где лежат параметры расчёта (§10.1),
    // а в history-режиме потребовал бы копию index.html в 404.html. Два настоящих
    // файла не требуют ни того, ни другого, и каждый несёт свой <title>.
    rollupOptions: {
      input: {
        home: new URL('index.html', import.meta.url).pathname,
        toeBand: new URL('toe-band/index.html', import.meta.url).pathname,
      },
    },
  },
  test: {
    // Шов ядра — чистый TypeScript, jsdom не нужен.
    environment: 'node',
    // Только юнит-тесты: браузерные спеки в e2e/ живут под Playwright
    // и под Vitest не запускаются.
    include: ['src/**/*.test.ts'],
  },
})
