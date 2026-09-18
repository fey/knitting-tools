import { expect, test } from '@playwright/test'

test('страница открывается и несёт блоки в порядке спеки', async ({ page }) => {
  await page.goto('./toe-band/')

  await expect(page).toHaveTitle('Калькулятор ленточного мыска носка')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ленточный мысок носка')

  const blocks = ['intro', 'stitch-fields', 'rhythm-presets', 'rhythm-builder', 'toe-chart', 'summary-panel']
  for (const block of blocks) {
    await expect(page.getByTestId(block)).toBeVisible()
  }

  // Плашка прогресса стоит отдельно — она прибита к низу экрана.
  await expect(page.getByTestId('row-progress-bar')).toBeVisible()
})
