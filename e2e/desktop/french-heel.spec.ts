import { expect, test } from '@playwright/test'

// Раскладка страницы пятки (спека пятки §6.2): от 800 px — две колонки, слева поля,
// справа «Итог» и описание по рядам. Вьюпорт проекта 1280×900. Замеры блоков, а не
// скриншоты, и числа, не зависящие от шрифта раннера.

test.beforeEach(async ({ page }) => {
  await page.goto('./french-heel/')
})

test('поля слева, «Итог» и описание справа, обе колонки начинаются на одной высоте', async ({
  page,
}) => {
  const fields = await page.getByTestId('heel-fields').boundingBox()
  const summary = await page.getByTestId('heel-summary').boundingBox()
  const rows = await page.getByTestId('turn-description').boundingBox()

  expect(summary!.x).toBeGreaterThan(fields!.x + fields!.width - 1)
  expect(Math.abs(summary!.y - fields!.y)).toBeLessThan(2)
  // Описание — под «Итогом», в той же колонке.
  expect(Math.abs(rows!.x - summary!.x)).toBeLessThan(2)
  expect(rows!.y).toBeGreaterThan(summary!.y)
  expect(fields!.width).toBeCloseTo(300, 0)
})

test('дефолтный расчёт открывается без горизонтальной прокрутки', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('пересчёт на десктопе: «Итог» и описание следуют за полем', async ({ page }) => {
  await page.getByTestId('center-stitches').fill('10')
  await expect(page.getByTestId('summary-division')).toHaveText('10 · 10 · 10')
  await expect(page.getByTestId('turn-row')).toHaveCount(10)
})

test.describe('на 900 px', () => {
  test.use({ viewport: { width: 900, height: 900 } })

  test('две колонки держатся и строка описания не вылезает за колонку', async ({ page }) => {
    const fields = await page.getByTestId('heel-fields').boundingBox()
    const result = await page.getByTestId('result-column').boundingBox()
    expect(result!.x).toBeGreaterThan(fields!.x + fields!.width - 1)

    const row = await page.getByTestId('turn-row').first().boundingBox()
    expect(row!.x + row!.width).toBeLessThanOrEqual(result!.x + result!.width + 1)
  })
})
