import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайн снимает мастер у себя.
// §12.2, пункт 6: обозначения и то, что схема стоит в естественную высоту целиком,
// а горизонтальная прокрутка при открытии встала на правый край.
test('схема мыска на прибитом вьюпорте — обозначения и рамка кадра', async ({ page }) => {
  await page.goto('./toe-band/')
  await expect(page.getByTestId('toe-chart')).toHaveScreenshot('toe-chart.png')
})

// Мысок от мыска (§7 спеки toe-up): ряд 1 внизу, у набора, «нет петли» над растущей зоной.
test('схема мыска от мыска — набор внизу, прибавки растят зону вверх', async ({ page }) => {
  await page.goto('./toe-up-band/')
  await expect(page.getByTestId('toe-chart')).toHaveScreenshot('toe-up-chart.png')
})
