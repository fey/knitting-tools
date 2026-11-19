import { expect, test } from '@playwright/test'

/**
 * Мысок от мыска — `/toe-up-band/` (§11 спеки toe-up). Код у страницы общий с `/toe-band/`,
 * поэтому здесь не повторяется весь объём той страницы, а проверяется то, чем toe-up
 * отличается: расчёт и подписи, тексты вводки и полей, легенда, «Поделиться» и раздельность
 * записей в `localStorage` (§10.2 спеки toe-up).
 */

const URL = './toe-up-band/'
const DEFAULT_HASH = '#s=24&e=64&k=1&r=even'

test('открывается дефолтом 24 → 64: 10 прибавочных рядов, 20 рядов, адрес несёт расчёт', async ({ page }) => {
  await page.goto(URL)

  await expect(page).toHaveTitle('Калькулятор ленточного мыска от мыска')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ленточный мысок от мыска')
  await expect(page).toHaveURL(new RegExp(`${DEFAULT_HASH}$`))
  await expect(page.getByTestId('summary-dec-rows')).toHaveText('10 прибавочных рядов')
  await expect(page.getByTestId('summary-total-rows')).toHaveText('20 рядов всего')
})

test('схема: набор внизу, вверху «мысок готов, дальше стопа», ряд 1 — промежуточный', async ({ page }) => {
  await page.goto(URL)

  await expect(page.getByTestId('toe-chart-caption-top')).toContainText('64 петли — мысок готов, дальше стопа')
  await expect(page.getByTestId('toe-chart-params')).toContainText('24 → 64 петли · кромка 1 · 20 рядов')
  await expect(page.getByTestId('toe-chart-caption-bottom')).toContainText('Набор, 24 петли')

  // Ряд 1 — без значков прибавок, ряд 2 — с двумя; ряд 1 стоит внизу схемы.
  await expect(page.locator('[data-row="1"][data-symbol^="inc"]')).toHaveCount(0)
  await expect(page.locator('[data-row="2"][data-symbol^="inc"]')).toHaveCount(2)
  const row1 = await page.locator('[data-row="1"]').first().boundingBox()
  const row20 = await page.locator('[data-row="20"]').first().boundingBox()
  expect(row1!.y).toBeGreaterThan(row20!.y)
})

test('легенда называет прибавки и говорит, что наклоны можно поменять местами', async ({ page }) => {
  await page.goto(URL)

  const legend = page.getByTestId('toe-chart-legend')
  await expect(legend).toContainText('прибавка из протяжки с наклоном влево')
  await expect(legend).toContainText('прибавка из протяжки с наклоном вправо')
  await expect(legend).toContainText('наклоны можно поменять местами — счёт рядов и петель от этого не меняется')
  await expect(legend).not.toContainText('2 вместе')
})

test('поля: живая подсказка у начальных, у конечных — круг стопы и ссылка на справочник, «широкого мыска» нет', async ({
  page,
}) => {
  await page.goto(URL)

  await expect(page.getByTestId('initial-hint')).toContainText('24 (шаг 4:')
  await expect(page.getByTestId('initial-hint')).toContainText('обычно 16–28: чем больше набор, тем тупее и короче мысок')
  await expect(page.getByTestId('final-hint')).toContainText('круг стопы, в круге, а не с одной стороны')
  await expect(page.getByTestId('final-cast-on-link')).toHaveAttribute('href', '../sock-cast-on/')
  await expect(page.getByTestId('edge-explainer')).toContainText('до места прибавки')
  await expect(page.getByTestId('stitch-fields')).not.toContainText('широкий мысок')
})

test('кнопки ходят шагом 4: начальные +4 → 28 → 64, ритм пересчитался', async ({ page }) => {
  await page.goto(URL)

  await page.getByTestId('initial-plus').click()
  await expect(page).toHaveURL(/#s=28&e=64&k=1&r=even$/)
  await expect(page.getByTestId('summary-dec-rows')).toHaveText('9 прибавочных рядов')
})

test('пресеты toe-up: «через ряд» и «с замедлением», без «с ускорением»', async ({ page }) => {
  await page.goto(URL)
  await expect(page.getByTestId('rhythm-presets')).toContainText('С замедлением')
  await expect(page.getByTestId('rhythm-presets')).not.toContainText('С ускорением')
})

test('чужой пресет из ссылки заменяется дефолтом молча (§10.4)', async ({ page }) => {
  await page.goto(`${URL}#s=24&e=64&k=1&r=accel`)
  await expect(page).toHaveURL(new RegExp(`${DEFAULT_HASH}$`))
})

test('вводка: ссылка на мысок от манжеты, граница мыска и стопы', async ({ page }) => {
  await page.goto(URL)

  const intro = page.getByTestId('intro')
  await expect(intro).toContainText('Мысок кончается последним прибавочным рядом')
  await expect(page.getByTestId('intro-sibling-link')).toHaveAttribute('href', '../toe-band/')
})

test('«Поделиться» говорит про мысок от мыска', async ({ page }) => {
  await page.addInitScript(() => {
    ;(navigator as unknown as { share: (data: unknown) => Promise<void> }).share = async (data) => {
      ;(window as unknown as { __shared: unknown }).__shared = data
    }
  })
  await page.goto(URL)
  await page.getByTestId('share-button').click()

  const shared = await page.evaluate(() => (window as unknown as { __shared: { url: string; text: string } }).__shared)
  expect(shared.url).toContain(DEFAULT_HASH)
  expect(shared.text).toBe('Мысок от мыска: 24 → 64 петли, прибавки через ряд, 20 рядов')
})

test('прогресс страниц раздельный: ряд на мыске от мыска не виден на мыске от манжеты', async ({ page }) => {
  await page.goto(URL)
  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 20')

  await page.reload()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 20')

  await page.goto('./toe-band/')
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 1 из 19')
})

test('вводка сворачивается отдельно от соседней страницы', async ({ page }) => {
  await page.goto(URL)
  await page.getByTestId('intro-collapse').click()
  await page.reload()
  await expect(page.getByTestId('intro-expand')).toBeVisible()

  await page.goto('./toe-band/')
  await expect(page.getByTestId('intro-body')).toBeVisible()
})
