import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

// Счётчик заходов (§11). Скрипт кладёт плагин, а не сами html: каждая страница
// сборки, и будущая тоже, получает его без ручной вставки. Только в `build` —
// `vite dev` счётчика не несёт вовсе. Прогон e2e идёт по production-сборке с
// 127.0.0.1, и тут скрипт уже на странице, но сам не считает: count.js молчит на
// localhost, 127.*, 10.*, 172.16–31.*, 192.168.* и file: (`filter`, пока не задан
// `allow_local`). Код сайта виден в коде страницы в любом случае, секретом не прячется.
const goatCounter: Plugin = {
  name: 'goatcounter',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'script',
      attrs: {
        'data-goatcounter': 'https://feycot.goatcounter.com/count',
        async: true,
        src: 'https://gc.zgo.at/count.js',
      },
      injectTo: 'head',
    },
  ],
}

export default defineConfig({
  // Project site: страница живёт не в корне домена, а по
  // https://fey.github.io/knitting-tools/ — корень занят блогом.
  base: '/knitting-tools/',
  plugins: [vue(), tailwindcss(), goatCounter],
  build: {
    // Многостраничная сборка вместо роутера (§11): корень — витрина разделов,
    // калькулятор — своим входом на `/toe-band/`, справочник набора петель —
    // на `/sock-cast-on/`. Роутер здесь не нужен вовсе:
    // в hash-режиме он занял бы тот же hash, где лежат параметры расчёта (§10.1),
    // а в history-режиме потребовал бы копию index.html в 404.html. Настоящие
    // файлы не требуют ни того, ни другого, и каждый несёт свой <title>.
    rollupOptions: {
      input: {
        home: new URL('index.html', import.meta.url).pathname,
        toeBand: new URL('toe-band/index.html', import.meta.url).pathname,
        sockCastOn: new URL('sock-cast-on/index.html', import.meta.url).pathname,
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
