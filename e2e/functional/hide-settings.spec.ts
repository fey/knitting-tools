import { expect, test } from '@playwright/test'

// §6.2: досчитав, по схеме вяжут — ручки расчёта прячутся кнопкой. Прячутся только
// они: вводка и «Итог» остаются, у вводки своя кнопка (§6.1).

test.beforeEach(async ({ page }) => {
  await page.goto('./toe-band/')
})

test('кнопка убирает ручки и возвращает их', async ({ page }) => {
  const toggle = page.getByTestId('toggle-settings')
  await expect(toggle).toHaveText('Убрать настройки')
  await expect(page.getByTestId('stitch-fields')).toBeVisible()

  await toggle.click()

  await expect(page.getByTestId('stitch-fields')).toHaveCount(0)
  await expect(page.getByTestId('rhythm-presets')).toHaveCount(0)
  await expect(toggle).toHaveText('Показать настройки')

  await toggle.click()

  await expect(page.getByTestId('stitch-fields')).toBeVisible()
  await expect(toggle).toHaveText('Убрать настройки')
})

test('убранные ручки не уносят с собой ни вводку, ни «Итог»', async ({ page }) => {
  await page.getByTestId('toggle-settings').click()

  await expect(page.getByTestId('intro-body')).toBeVisible()
  await expect(page.getByTestId('intro-collapse')).toBeVisible()
  // «Итог» несёт предупреждения §9.5 и §9.6 — спрятанное предупреждение не предупреждает.
  await expect(page.getByTestId('summary-panel')).toBeVisible()
  await expect(page.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')
  // Плашка прогресса прибита к низу и стоит там всегда (§8).
  await expect(page.getByTestId('row-progress-mark')).toBeVisible()
})

test('кнопка стоит в строке кнопки вводки и с места не сходит (§6.1)', async ({ page }) => {
  const toggle = page.getByTestId('toggle-settings')

  const collapse = await page.getByTestId('intro-collapse').boundingBox()
  const expanded = (await toggle.boundingBox())!
  // Одна строка с кнопкой вводки: та же высота, кнопка правее.
  expect(Math.abs(expanded.y - collapse!.y)).toBeLessThan(2)
  expect(expanded.x).toBeGreaterThan(collapse!.x)

  await page.getByTestId('intro-collapse').click()
  await expect(page.getByTestId('intro-expand')).toBeVisible()

  // Блок вводки сменил ширину — кнопка настроек осталась на месте.
  const afterCollapse = (await toggle.boundingBox())!
  expect(Math.abs(afterCollapse.x - expanded.x)).toBeLessThan(2)
})

test('состояние не попадает ни в hash, ни в заход (§6.2, §10.5)', async ({ page }) => {
  await page.getByTestId('toggle-settings').click()
  await expect(page.getByTestId('stitch-fields')).toHaveCount(0)

  expect(await page.evaluate(() => location.hash)).toBe('#s=60&e=20&k=1&r=even')

  await page.reload()

  // Страница открывается с показанными ручками всегда — это состояние экрана, не расчёта.
  await expect(page.getByTestId('stitch-fields')).toBeVisible()
  await expect(page.getByTestId('toggle-settings')).toHaveText('Убрать настройки')
})
