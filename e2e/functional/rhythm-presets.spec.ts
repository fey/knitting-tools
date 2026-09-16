import { expect, test } from '@playwright/test'

test('дефолт — «через ряд», выбран и несёт 19 рядов в подписи', async ({ page }) => {
  await page.goto('./')

  const even = page.getByTestId('preset-even')
  await expect(even).toHaveAttribute('aria-pressed', 'true')
  await expect(even.getByTestId('preset-status')).toHaveText('19 рядов')
})

test('живое число рядов у карточки двигается вместе с петлями, без выбора карточки', async ({ page }) => {
  await page.goto('./')

  // 60 → 16 даёт N = 11: «через ряд» — 21 ряд, «с ускорением» — 17, «по третям» — 20, «с разгоном» — 21.
  await page.getByTestId('final-minus').click()

  await expect(page.getByTestId('preset-even').getByTestId('preset-status')).toHaveText('21 ряд')
  await expect(page.getByTestId('preset-accel').getByTestId('preset-status')).toHaveText('17 рядов')
  await expect(page.getByTestId('preset-thirds').getByTestId('preset-status')).toHaveText('20 рядов')
  await expect(page.getByTestId('preset-ramp').getByTestId('preset-status')).toHaveText('21 ряд')

  // Ритм не тронут кликом — расчёт остаётся на «через ряд», выбор карточки не съехал сам.
  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'true')
})

test('карточка «с разгоном» гасится с причиной при недостатке убавочных рядов и не выбирается кликом', async ({
  page,
}) => {
  await page.goto('./')

  // 60 → 52: N = 2, у «с разгоном» нужно 5.
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()
  await page.getByTestId('final-plus').click()

  const summary = page.getByTestId('summary-panel')
  await expect(summary.getByTestId('summary-dec-rows')).toHaveText('2 убавочных ряда')

  const ramp = page.getByTestId('preset-ramp')
  await expect(ramp.getByTestId('preset-status')).toHaveText('нужно 5 убавочных рядов, сейчас 2')
  await expect(ramp).toBeDisabled()

  await ramp.click({ force: true })
  await expect(ramp).not.toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'true')
})

test('выбранный ритм гасится с причиной, если петли сузили N ниже минимума, — расчёт не врёт', async ({
  page,
}) => {
  await page.goto('./')

  // N = 10 у дефолта — «с разгоном» собирается (min 5), выбираем его.
  await page.getByTestId('preset-ramp').click()
  await expect(page.getByTestId('preset-ramp')).toHaveAttribute('aria-pressed', 'true')

  // 20 → 52 петель: N = 2, «с разгоном» больше не собирается — фиксированный хвост
  // в 4 ряда сам превышает N.
  for (let i = 0; i < 8; i++) await page.getByTestId('final-plus').click()

  const ramp = page.getByTestId('preset-ramp')
  await expect(ramp.getByTestId('preset-status')).toHaveText('нужно 5 убавочных рядов, сейчас 2')
  await expect(ramp).toBeDisabled()
  // Выбор не откатывается сам: карточка остаётся нажатой, хоть и гашена, — имя ритма
  // в итоге не подменяется молча на «через ряд» (§5.5, имя определяется происхождением).
  await expect(ramp).toHaveAttribute('aria-pressed', 'true')

  const summary = page.getByTestId('summary-panel')
  await expect(summary.getByTestId('summary-params')).toContainText('убавки с разгоном')
})

test('выбор карточки «с ускорением» меняет ритм в итоге', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('preset-accel').click()

  await expect(page.getByTestId('preset-accel')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('preset-even')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('summary-panel').getByTestId('summary-params')).toContainText(
    'убавки с ускорением',
  )
})
