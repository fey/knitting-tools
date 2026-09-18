import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайн снимает мастер у себя.
// §12.2, пункт 6: линейка в сантиметрах (тикет #27) — засечки в полосе номеров и полоса
// под сеткой. Словами это не проверяется: тест считает засечки и читает их подписи,
// но не видит, что вертикальный шаг гуще горизонтального и что схема от линейки
// не поехала.
test('схема с линейкой в сантиметрах', async ({ page }) => {
  await page.goto('./toe-band/')

  // 40 рядов и 31 петля на 10 см — носочная плотность §9.6: 4,75 см вверх, 9,68 поперёк.
  await page.getByTestId('gauge-button').click()
  await page.getByTestId('gauge-rows').fill('40')
  await page.getByTestId('gauge-stitches').fill('31')
  await page.getByTestId('gauge-done').click()

  await expect(page.getByTestId('toe-chart')).toHaveScreenshot('toe-chart-gauge.png')
})
