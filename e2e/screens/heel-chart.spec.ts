import { expect, test } from '@playwright/test'

// Скриншотный проект: в CI не гоняется, базлайн снимает мастер у себя.
// Спека пятки §7: чашечка, стороны рядов, отметки поворота, скобка под рядом 1 и легенда;
// прокрутка при открытии стоит у правого края — там начинается лицевой ряд 1.
test('схема поворота пятки на дефолте', async ({ page }) => {
  await page.goto('./french-heel/')
  await expect(page.getByTestId('turn-chart')).toHaveScreenshot('heel-chart.png')
})

test('схема поворота пятки с изнаночным рядом 1 — зеркально, прокрутка у левого края', async ({ page }) => {
  await page.goto('./french-heel/')
  await page.getByTestId('first-side-ws').click()
  await expect(page.getByTestId('turn-chart')).toHaveScreenshot('heel-chart-ws.png')
})
