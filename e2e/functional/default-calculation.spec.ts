import { expect, test } from '@playwright/test'

test('первый экран открывается посчитанным дефолтом', async ({ page }) => {
  await page.goto('./toe-band/')

  const summary = page.getByTestId('summary-panel')
  await expect(summary.getByTestId('summary-dec-rows')).toHaveText('10 убавочных рядов')
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')
  await expect(summary.getByTestId('summary-params')).toContainText('60 → 20 петель')
  await expect(summary.getByTestId('summary-params')).toContainText('кромка 1')
  await expect(summary.getByTestId('summary-params')).toContainText('убавки через ряд')
})
