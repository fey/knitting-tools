import { expect, test } from '@playwright/test'

/**
 * Плотность вязания и сантиметры (тикет #27, §4, §7, §9.6, §10.2). Здесь всё, на что
 * ядро ответить не может (§12.2): реальный `localStorage`, реальная перезагрузка,
 * реальный диалог и реальные засечки в SVG.
 *
 * Дефолт первого экрана: 60 → 20, кромка 1, через ряд — 19 рядов. Плотность
 * 40 рядов и 31 петля на 10 см даёт длину 4,75 см и обхват 19,35 см.
 */

const GAUGE_KEY = 'knitting-tools:gauge'

/** Вписывает плотность через диалог — тем же путём, каким это делает мастер. */
async function fillGauge(page: import('@playwright/test').Page, rows = '40', stitches = '31') {
  await page.getByTestId('gauge-button').click()
  await page.getByTestId('gauge-rows').fill(rows)
  await page.getByTestId('gauge-stitches').fill(stitches)
  await page.getByTestId('gauge-done').click()
}

test('без плотности сантиметров нет нигде, и кнопка зовёт её вписать', async ({ page }) => {
  await page.goto('./toe-band/')

  // Расчёт остаётся посчитанным с первого кадра (§4) — сантиметры надстройка, не условие.
  await expect(page.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')
  await expect(page.getByTestId('toe-chart-params')).toHaveText(
    '60 → 20 петель · кромка 1 · 19 рядов',
  )

  await expect(page.getByTestId('summary-centimetres')).toHaveCount(0)
  await expect(page.getByTestId('toe-chart-ruler-bottom')).toHaveCount(0)
  await expect(page.getByTestId('toe-chart-ruler-row')).toHaveCount(0)

  // Зацепка в теле страницы: без неё о сантиметрах узнал бы только тот, кто полез в шапку.
  await expect(page.getByTestId('gauge-button')).toHaveText(/Сантиметры — впиши плотность/)
})

test('вписанная плотность называет длину и обхват и ставит засечки на схеме', async ({ page }) => {
  await page.goto('./toe-band/')
  await fillGauge(page)

  await expect(page.getByTestId('summary-centimetres')).toHaveText(
    'Длина мыска 4,75 см · обхват на начальных петлях 19,35 см',
  )
  // Длина дописана в строку у схемы: по ней вяжут с убранными ручками (§7).
  await expect(page.getByTestId('toe-chart-params')).toHaveText(
    '60 → 20 петель · кромка 1 · 19 рядов · 4,75 см',
  )

  // 4,75 см вверх — засечки на 1, 2, 3 и 4 см; поперёк 30 петель по 0,32 см — девять.
  await expect(page.getByTestId('toe-chart-ruler-row')).toHaveCount(4)
  await expect(page.getByTestId('toe-chart-ruler-stitch')).toHaveCount(9)
  await expect(page.locator('[data-testid="toe-chart-ruler-row"][data-cm="4"]')).toHaveText('4 см')
})

test('обе плотности нужны: одна половина образца сантиметров не даёт (§4)', async ({ page }) => {
  await page.goto('./toe-band/')

  await page.getByTestId('gauge-button').click()
  await page.getByTestId('gauge-rows').fill('40')
  await expect(page.getByTestId('summary-centimetres')).toHaveCount(0)

  await page.getByTestId('gauge-stitches').fill('31')
  await expect(page.getByTestId('summary-centimetres')).toBeVisible()
})

test('плотность живёт в localStorage и в hash не попадает (§10.1, §10.2)', async ({ page }) => {
  await page.goto('./toe-band/#s=60&e=20&k=1&r=even')
  await fillGauge(page)

  // Делятся расчётом: чужая плотность в ссылке соврала бы про чужую пряжу.
  expect(new URL(page.url()).hash).toBe('#s=60&e=20&k=1&r=even')

  const stored = await page.evaluate((key) => localStorage.getItem(key), GAUGE_KEY)
  expect(JSON.parse(stored ?? 'null')).toEqual({
    rows: 40,
    stitches: 31,
    base: 10,
  })

  await page.reload()
  await expect(page.getByTestId('summary-centimetres')).toContainText('4,75 см')
})

test('смена плотности не сбрасывает отмеченный ряд — она не параметр расчёта (§8)', async ({
  page,
}) => {
  await page.goto('./toe-band/')

  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 19')

  await fillGauge(page)
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 19')

  // И правка плотности на ходу — тоже.
  await page.getByTestId('gauge-button').click()
  await page.getByTestId('gauge-rows').fill('44')
  await page.getByTestId('gauge-done').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 19')
})

test('«Убрать плотность» возвращает экран к счёту в петлях', async ({ page }) => {
  await page.goto('./toe-band/')
  await fillGauge(page)
  await expect(page.getByTestId('gauge-button')).toHaveText(/Плотность вписана/)

  await page.getByTestId('gauge-button').click()
  await page.getByTestId('gauge-clear').click()
  await page.getByTestId('gauge-done').click()

  await expect(page.getByTestId('summary-centimetres')).toHaveCount(0)
  await expect(page.getByTestId('toe-chart-ruler-bottom')).toHaveCount(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), GAUGE_KEY)).toBeNull()
})

test('замечание о длине при известной плотности меряет в сантиметрах (§9.6)', async ({ page }) => {
  await page.goto('./toe-band/')

  // 19 рядов внутри коридора 12–30, замечания нет и в рядах.
  await expect(page.getByTestId('summary-length-note')).toHaveCount(0)

  // Та же схема на рыхлой плотности — 19 рядов это уже 9,5 см.
  await fillGauge(page, '20', '16')
  await expect(page.getByTestId('summary-length-note')).toHaveText(
    'Больше 7 см — мысок выйдет длинным, проверь ритм',
  )
})

test('диалог закрывается Esc без подтверждения, вписанное остаётся (§6.4)', async ({ page }) => {
  await page.goto('./toe-band/')

  await page.getByTestId('gauge-button').click()
  await expect(page.getByTestId('gauge-dialog')).toBeVisible()
  await page.getByTestId('gauge-rows').fill('40')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('gauge-dialog')).toBeHidden()

  // Вписанное закрытие переживает: оно уже записано, терять нечего.
  await page.getByTestId('gauge-button').click()
  await expect(page.getByTestId('gauge-rows')).toHaveValue('40')
})
