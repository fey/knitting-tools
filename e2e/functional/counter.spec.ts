import { expect, test } from '@playwright/test'

/**
 * Счётчик заходов (§11). Что видно только в браузере: скрипт GoatCounter есть на каждой
 * странице сборки, а когда он не загрузился (блокировщик, нет сети, §10.6), страница
 * работает как прежде. Сами заходы тест не шлёт: запросы к счётчику перехватываются
 * и в сеть не уходят.
 */

const PAGES = [
  { path: './', heading: 'Калькуляторы для вязания' },
  { path: './toe-band/', heading: 'Ленточный мысок носка' },
  { path: './french-heel/', heading: 'Поворот французской пятки' },
  { path: './sock-cast-on/', heading: 'Набор петель на носок' },
]

for (const { path, heading } of PAGES) {
  test(`${path}: скрипт счётчика на странице, а при блокировке страница работает без ошибок (§11)`, async ({
    page,
  }) => {
    const blocked: string[] = []
    await page.route(/gc\.zgo\.at|goatcounter\.com/, (route) => {
      blocked.push(route.request().url())
      return route.abort()
    })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })

    await page.goto(path)

    const script = page.locator('script[data-goatcounter]')
    await expect(script).toHaveCount(1)
    await expect(script).toHaveAttribute('data-goatcounter', 'https://feycot.goatcounter.com/count')
    await expect(script).toHaveAttribute('src', 'https://gc.zgo.at/count.js')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    expect(blocked.some((u) => u.includes('gc.zgo.at'))).toBe(true)
    // Заблокированный ресурс пишет в консоль сетевую ошибку самого браузера, не страницы:
    // её отсекаем, остальное должно быть пусто.
    expect(errors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e))).toEqual([])
  })
}
