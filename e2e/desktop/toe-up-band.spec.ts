import { expect, test } from '@playwright/test'

// Раскладка §6.2 действует и на мыске от мыска (§11 спеки toe-up): две колонки на 1280 px,
// схема дефолтного расчёта 24 → 64 встаёт без горизонтальной прокрутки.

test.beforeEach(async ({ page }) => {
  await page.goto('./toe-up-band/')
})

test('ручки слева, схема справа, на одной высоте', async ({ page }) => {
  const controls = await page.getByTestId('controls-column').boundingBox()
  const chart = await page.getByTestId('toe-chart').boundingBox()

  expect(chart!.x).toBeGreaterThan(controls!.x + controls!.width - 1)
  expect(Math.abs(chart!.y - controls!.y)).toBeLessThan(2)
})

test('схема дефолтного расчёта без горизонтальной прокрутки', async ({ page }) => {
  const scroll = page.getByTestId('toe-chart-scroll')
  const { scrollWidth, clientWidth } = await scroll.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})
