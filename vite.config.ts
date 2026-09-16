import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Project site: страница живёт не в корне домена, а по
  // https://fey.github.io/knitting-tools/ — корень занят блогом.
  base: '/knitting-tools/',
  plugins: [vue(), tailwindcss()],
  test: {
    // Шов ядра — чистый TypeScript, jsdom не нужен.
    environment: 'node',
    // Только юнит-тесты: браузерные спеки в e2e/ живут под Playwright
    // и под Vitest не запускаются.
    include: ['src/**/*.test.ts'],
  },
})
