import { expect, test } from '@playwright/test'

/**
 * Краевые случаи, починка ввода и предупреждения (тикет #7, §9).
 *
 * Здесь всё, на что ядро ответить не может (§12.2): момент правки — уход фокуса,
 * а не каждое нажатие; две ветки конфликта кромки, различимые только по DOM;
 * сосед как касаемая кнопка; дублирование предупреждения о недоборе.
 *
 * Состояния «результата нет» ни в одном сценарии не возникает — схема на экране
 * всегда, поэтому каждый тест проверяет ещё и то, что итог посчитан.
 */

test('починка срабатывает на уходе фокуса, а не на каждом нажатии', async ({ page }) => {
  await page.goto('./')

  const summary = page.getByTestId('summary-panel')
  const final = page.getByTestId('final-stitches')
  const rowLabels = page.getByTestId('toe-chart-row-label')
  const rowsBefore = await rowLabels.count()

  await final.click()
  await final.fill('')
  // «6» по дороге к «60»: само по себе оно ниже минимума при кромке 1 и починкой
  // на лету стало бы восьмёркой.
  await final.pressSequentially('6', { delay: 30 })
  await expect(final).toHaveValue('6')
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')
  await expect(page.getByTestId('final-fix')).toHaveCount(0)

  await final.pressSequentially('0', { delay: 30 })
  await expect(final).toHaveValue('60')
  // Схема не мигает и не прыгает: на экране остался последний сходящийся расчёт.
  await expect(summary.getByTestId('summary-total-rows')).toHaveText('19 рядов всего')
  expect(await rowLabels.count()).toBe(rowsBefore)

  // Уход фокуса — и только теперь конечные подтягиваются, с подписью.
  await page.getByTestId('initial-stitches').click()
  await expect(final).toHaveValue('56')
  await expect(page.getByTestId('final-fix')).toContainText(
    'Конечных должно быть меньше начальных. Ближайшее сходящееся — 56',
  )
  await expect(summary.getByTestId('summary-params')).toContainText('60 → 56 петель')
})

test('разница не кратна 4: подтягивание с подписью и сосед касаемой кнопкой', async ({ page }) => {
  await page.goto('./')

  const final = page.getByTestId('final-stitches')
  await final.fill('18')
  await final.press('Enter')

  await expect(final).toHaveValue('20')
  await expect(page.getByTestId('final-fix')).toContainText(
    '18 не сходится: 60 − 18 = 42, а убавки снимают по 4. Ближайшее сходящееся — 20',
  )

  // Сосед — кнопка, а не текст: одним касанием уходим к нему.
  await page.getByTestId('final-fix-alt').click()
  await expect(final).toHaveValue('16')
  await expect(page.getByTestId('summary-params')).toContainText('60 → 16 петель')
})

test('нечётные начальные: оба соседа предложены, конечные уступают следом', async ({ page }) => {
  await page.goto('./')

  const initial = page.getByTestId('initial-stitches')
  await initial.fill('61')
  await initial.press('Enter')

  await expect(initial).toHaveValue('60')
  await expect(page.getByTestId('initial-fix')).toContainText('61 не делится пополам. Ближайшее чётное — 60')
  await expect(page.getByTestId('initial-fix-alt')).toHaveText('62')

  // Уходим ко второму соседу: начальные — поле-факт, а конечные под них подтягиваются.
  await page.getByTestId('initial-fix-alt').click()
  await expect(initial).toHaveValue('62')
  await expect(page.getByTestId('final-stitches')).toHaveValue('22')
  await expect(page.getByTestId('final-fix')).toContainText('Ближайшее сходящееся — 22')
})

test('кромка 2 при конечных 8 неактивна с причиной, значение не меняется', async ({ page }) => {
  await page.goto('./')

  // 20 → 8 кнопкой шага: ниже кромка 1 не пускает.
  for (let i = 0; i < 3; i++) await page.getByTestId('final-minus').click()
  await expect(page.getByTestId('final-stitches')).toHaveValue('8')

  const edgeTwo = page.getByTestId('edge-2')
  await expect(edgeTwo).toBeDisabled()
  await expect(page.getByTestId('edge-2-why-off')).toHaveText('Широкий мысок — от 12 конечных петель')

  // Значение не меняется вовсе: ни кромка, ни конечные петли.
  await edgeTwo.click({ force: true })
  await expect(page.getByTestId('summary-params')).toContainText('кромка 1')
  await expect(page.getByTestId('final-stitches')).toHaveValue('8')
  // Восьмёрка сама по себе — не ошибка: предупреждения о числе конечных петель нет.
  await expect(page.getByTestId('final-fix')).toHaveCount(0)
})

test('кромка уже 2, набрали конечные 8 — число тянется до 12', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('edge-2').click()
  await expect(page.getByTestId('edge-2')).toHaveAttribute('aria-pressed', 'true')

  const final = page.getByTestId('final-stitches')
  await final.fill('8')
  await final.press('Enter')

  await expect(final).toHaveValue('12')
  await expect(page.getByTestId('final-fix')).toContainText(
    'При широком мыске конечных нужно минимум 12. Ближайшее сходящееся — 12',
  )
  await expect(page.getByTestId('summary-params')).toContainText('кромка 2')
})

test('пустое поле возвращает своё прошлое значение, а не дефолт', async ({ page }) => {
  await page.goto('./')

  const final = page.getByTestId('final-stitches')
  await page.getByTestId('final-minus').click()
  await expect(final).toHaveValue('16')

  await final.fill('')
  await final.press('Enter')

  await expect(final).toHaveValue('16')
  await expect(page.getByTestId('final-fix')).toHaveCount(0)
  await expect(page.getByTestId('summary-params')).toContainText('60 → 16 петель')

  // То же у начальных: пустое поле возвращает набранные 64, а не заводские 60.
  const initial = page.getByTestId('initial-stitches')
  await page.getByTestId('initial-plus').click()
  await expect(initial).toHaveValue('64')
  await initial.fill('')
  await initial.press('Enter')
  await expect(initial).toHaveValue('64')
  await expect(page.getByTestId('initial-fix')).toHaveCount(0)
})

test('недобор показан и в конструкторе, и у живого числа рядов', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('rhythm-builder-toggle').click()
  // Дефолт — один сегмент на все 10 убавочных рядов; снимаем четыре повтора.
  for (let i = 0; i < 4; i++) await page.getByTestId('rhythm-builder-step-0-repeats-minus').click()

  const text = 'Не хватает 4 убавочных рядов: останется 36 петель вместо 20'
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveText(text)
  await expect(page.getByTestId('rhythm-lack-note')).toHaveText(text)
  await expect(page.getByTestId('summary-coverage')).toHaveText(text)
  // Схема рисует то, что реально выйдет.
  await expect(page.getByTestId('summary-params')).toContainText('60 → 36 петель')

  // В подписях пресетов остаётся голое число рядов: четыре строки с предупреждениями
  // в списке выбора превращают подсказку в шум (§9.6).
  await expect(page.getByTestId('preset-even')).not.toContainText('Не хватает')
  await expect(page.getByTestId('preset-accel')).not.toContainText('Не хватает')

  // Конструктор сворачивается — строка у ручки ритма остаётся на экране.
  await page.getByTestId('rhythm-builder-toggle').click()
  await expect(page.getByTestId('rhythm-builder-coverage')).toHaveCount(0)
  await expect(page.getByTestId('rhythm-lack-note')).toHaveText(text)
  await expect(page.getByTestId('summary-coverage')).toHaveText(text)
})

test('перебор говорит, что до лишних шагов не дойдёт', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('preset-ramp').click()
  // 20 → 52: убавочных рядов остаётся два, а «с разгоном» несёт четыре.
  for (let i = 0; i < 8; i++) await page.getByTestId('final-plus').click()
  await expect(page.getByTestId('final-stitches')).toHaveValue('52')

  await expect(page.getByTestId('summary-coverage')).toHaveText(
    'Лишние 2 шага: мысок кончится раньше, до них не дойдёт',
  )
  // Дублировать строкой у числа рядов спека просит именно недобор (§9.5).
  await expect(page.getByTestId('rhythm-lack-note')).toHaveCount(0)
  // Мысок кончается на конечных петлях: до лишних убавок дело не доходит,
  // и итог не вправе называть петли, которых не будет.
  await expect(page.getByTestId('summary-params')).toContainText('60 → 52 петель')
})

test('мягкое замечание о длине — не красным и без запрета', async ({ page }) => {
  await page.goto('./')

  const note = page.getByTestId('summary-length-note')
  await expect(note).toHaveCount(0)

  // 60 → 36 через ряд: 6 убавочных рядов, 11 рядов всего.
  for (let i = 0; i < 4; i++) await page.getByTestId('final-plus').click()
  await expect(note).toHaveText('Меньше 12 рядов — мысок выйдет тупым')
  await expect(note).not.toHaveClass(/red/)
  // Замечание ничего не запрещает: расчёт на экране посчитан.
  await expect(page.getByTestId('summary-total-rows')).toHaveText('11 рядов всего')

  // 84 → 20 через ряд: 16 убавочных рядов, 31 ряд всего.
  for (let i = 0; i < 4; i++) await page.getByTestId('final-minus').click()
  for (let i = 0; i < 6; i++) await page.getByTestId('initial-plus').click()
  await expect(page.getByTestId('summary-total-rows')).toHaveText('31 ряд всего')
  await expect(note).toHaveText('Больше 30 рядов — мысок выйдет длинным, проверь ритм')
  await expect(note).not.toHaveClass(/red/)
})
