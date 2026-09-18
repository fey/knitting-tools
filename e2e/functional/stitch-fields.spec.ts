import { expect, test } from '@playwright/test'

test('порядок на экране: петли, потом ритм, потом схема (§6, AC 8)', async ({ page }) => {
  await page.goto('./')

  const fieldsBox = await page.getByTestId('stitch-fields').boundingBox()
  const rhythmBox = await page.getByTestId('rhythm-presets').boundingBox()
  const chartBox = await page.getByTestId('toe-chart').boundingBox()

  expect(fieldsBox).not.toBeNull()
  expect(rhythmBox).not.toBeNull()
  expect(chartBox).not.toBeNull()

  // Петли выше ритма, ритм выше схемы: сперва факты о своём носке, потом выбор ритма,
  // и только затем то, по чему вяжут (§6, порядок правок §9.2 читается так же).
  expect(fieldsBox!.y).toBeLessThan(rhythmBox!.y)
  expect(rhythmBox!.y).toBeLessThan(chartBox!.y)
})

test('кнопка + у начальных петель двигает число рядов на экране', async ({ page }) => {
  await page.goto('./')

  const summary = page.getByTestId('summary-panel')
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')

  // 60 → 64, конечные и ритм («через ряд») не тронуты: N = 11, рядов 2×11−1 = 21.
  await page.getByTestId('initial-plus').click()

  await expect(summary.getByTestId('summary-total-rows')).toHaveText('21 ряд всего')
  await expect(summary.getByTestId('summary-dec-rows')).toHaveText('11 убавочных рядов')
  await expect(summary.getByTestId('summary-params')).toContainText('64 → 20 петель')
})

test('кнопка − у конечных петель двигает число рядов на экране', async ({ page }) => {
  await page.goto('./')

  const summary = page.getByTestId('summary-panel')

  // 20 → 16, начальные не тронуты: N = 11, рядов 2×11−1 = 21.
  await page.getByTestId('final-minus').click()

  await expect(summary.getByTestId('summary-total-rows')).toHaveText('21 ряд всего')
  await expect(summary.getByTestId('summary-params')).toContainText('60 → 16 петель')
})

test('несходящийся набор не трогает схему, сходящийся — пересчитывает живьём', async ({ page }) => {
  await page.goto('./')

  const summary = page.getByTestId('summary-panel')
  const initialInput = page.getByTestId('initial-stitches')

  await initialInput.fill('')
  // «6» на пути к «64» не сходится с конечными 20 (6 < 20) — расчёт остаётся дефолтным.
  await initialInput.pressSequentially('6', { delay: 30 })
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')

  // Дописанное «4» даёт сходящиеся 64 — расчёт пересчитывается живьём, без ухода фокуса.
  await initialInput.pressSequentially('4', { delay: 30 })
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('21 ряд всего')
})

test('кромка выбирается из 0 / 1 / 2, дефолт — 1, у двойки подпись «широкий мысок»', async ({ page }) => {
  await page.goto('./')

  const summary = page.getByTestId('summary-panel')
  await expect(page.getByTestId('edge-1')).toHaveAttribute('aria-pressed', 'true')

  const edgeTwo = page.getByTestId('edge-2')
  await expect(edgeTwo).toContainText('широкий мысок')

  await edgeTwo.click()
  await expect(edgeTwo).toHaveAttribute('aria-pressed', 'true')
  await expect(summary.getByTestId('summary-params')).toContainText('кромка 2')
})

test('поля петель несут подсказки словарём спеки', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByTestId('initial-hint')).toHaveText('чётное')
  await expect(page.getByTestId('final-hint')).toContainText('20 (шаг 4: 16, 20, 24)')
  await expect(page.getByTestId('final-hint')).toContainText('обычно 16–24')
  // Тикет #15: подпись называет оба закрытия с их числами — и только их. Рамку
  // «мысок один, различается закрытие» несут §1 и вводка: подпись у ручки отвечает
  // на «что мне сюда вписать», а не объясняет конструкцию (§4).
  const explainer = page.getByTestId('final-explainer')
  await expect(explainer).toContainText('трикотажный шов оставляют 16–24')
  await expect(explainer).toContainText('около 8')
  // Восьмёрка — обычное значение, а не другая конструкция: §9.6 её нормой и называет.
  await expect(explainer).not.toContainText('другой мысок')
})

// Тикет #14: кнопки ходят шагом 4 (§4), но на самих кнопках об этом не было сказано —
// куда прыгнет число, было видно только после нажатия. Шаг встал на подпись.
const STEPPERS = [
  { minus: 'initial-minus', input: 'initial-stitches', plus: 'initial-plus' },
  { minus: 'final-minus', input: 'final-stitches', plus: 'final-plus' },
]

test('кнопки петель показывают свой шаг: \u22124 и +4', async ({ page }) => {
  await page.goto('./')

  for (const { minus, plus } of STEPPERS) {
    // Минус — U+2212, а не дефис: знак тот же, что стоял на кнопке до подписи.
    await expect(page.getByTestId(minus)).toHaveText('\u22124')
    await expect(page.getByTestId(plus)).toHaveText('+4')
  }
})

test('подписанные кнопки держат мишень 44 px, ряд с полем не переносится', async ({ page }) => {
  await page.goto('./')

  for (const { minus, input, plus } of STEPPERS) {
    const minusBox = (await page.getByTestId(minus).boundingBox())!
    const inputBox = (await page.getByTestId(input).boundingBox())!
    const plusBox = (await page.getByTestId(plus).boundingBox())!

    for (const box of [minusBox, plusBox]) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }

    // Ряд «кнопка · поле · кнопка» стоит одной строкой: подпись числом, а не словом,
    // ровно затем, чтобы на телефонной ширине ничего не уехало вниз.
    expect(Math.abs(minusBox.y - plusBox.y)).toBeLessThan(1)
    expect(minusBox.x).toBeLessThan(inputBox.x)
    expect(inputBox.x).toBeLessThan(plusBox.x)
  }
})
