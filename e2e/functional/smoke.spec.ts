import { expect, test } from '@playwright/test'

test('страница открывается и несёт блоки в порядке спеки', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('Калькулятор мыска носка')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Калькулятор мыска носка')

  const blocks = ['toe-chart', 'rhythm-presets', 'rhythm-builder', 'stitch-fields', 'summary-panel']
  for (const block of blocks) {
    await expect(page.getByTestId(block)).toBeVisible()
  }

  // Плашка прогресса стоит отдельно — она прибита к низу экрана.
  await expect(page.getByTestId('row-progress-bar')).toBeVisible()
})
