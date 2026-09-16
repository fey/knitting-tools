import { expect, test } from '@playwright/test'

/**
 * Отметка текущего ряда на схеме (тикет #9, §8). Здесь всё, на что ядро ответить
 * не может (§12.2): реальный `localStorage`, реальная перезагрузка, реальный DOM
 * шторки и плашки.
 *
 * Дефолт первого экрана: 60 → 20, кромка 1, через ряд — 19 рядов, 10 убавочных,
 * ряд 1 убавочный (в круге станет 56), ряд 2 промежуточный.
 */

const PROGRESS_KEY = 'knitting-tools:toe-progress'

test('первое «Ряд 1 готов» и есть начало — отметка переживает перезагрузку', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 1 из 19')
  await expect(page.getByTestId('row-progress-what')).toHaveText('убавочный 1 из 10 · в круге станет 56')

  await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')
  await expect(page.getByTestId('row-progress-what')).toHaveText('промежуточный · в круге 56')

  const stored = await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)
  expect(JSON.parse(stored ?? 'null')).toEqual({ paramsKey: 's=60&e=20&k=1&r=even', row: 1 })

  await page.reload()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')
})

test('до первой отметки кручение расчёта не пишет ничего в localStorage', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('final-minus').click() // 20 → 16, ритм пересчитался, отметки не было
  await expect(page.getByTestId('summary-params')).toContainText('60 → 16 петель')

  const stored = await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)
  expect(stored).toBeNull()
})

test('плашка не прыгает: кнопка отметки стоит на месте при смене ряда', async ({ page }) => {
  await page.goto('./')

  const markButton = page.getByTestId('row-progress-mark')
  const before = await markButton.boundingBox()
  expect(before).not.toBeNull()

  await markButton.click() // ряд 1 → 2, текст «что» меняется с убавочного на промежуточный
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')

  const afterMark = await markButton.boundingBox()
  expect(afterMark).not.toBeNull()
  expect(afterMark!.y).toBeCloseTo(before!.y, 0)
  expect(afterMark!.x).toBeCloseTo(before!.x, 0)
})

test('плашка не прыгает: блок растёт вверх — строка подтверждения сброса не двигает кнопку отметки', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByTestId('row-progress-mark').click() // иначе «Сбросить счёт» заглушена, не откроет подтверждение

  const markButton = page.getByTestId('row-progress-mark')
  const before = await markButton.boundingBox()
  expect(before).not.toBeNull()

  // Строка подтверждения сброса — гарантированный рост блока: она добавляет целую
  // строку текста и две кнопки над плашкой, а не просто меняет длину одной строки.
  await page.getByTestId('reset-progress').click()
  await expect(page.getByTestId('reset-progress-confirm')).toBeVisible()

  const after = await markButton.boundingBox()
  expect(after).not.toBeNull()
  expect(after!.y).toBeCloseTo(before!.y, 0)
  expect(after!.x).toBeCloseTo(before!.x, 0)

  await page.getByTestId('reset-progress-confirm-cancel').click()
})

test('отмена «−1» возвращает ряд назад, не уходит ниже нуля', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 3 из 19')

  const undo = page.getByTestId('row-progress-undo')
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')
  await undo.click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 1 из 19')
  await expect(undo).toBeDisabled()
})

test('отмена с удержанием — автоповтор после задержки уводит счёт дальше одного шага', async ({ page }) => {
  await page.goto('./')

  for (let i = 0; i < 5; i++) await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 6 из 19')

  const undo = page.getByTestId('row-progress-undo')
  await undo.dispatchEvent('pointerdown')
  // 400 мс до старта автоповтора + несколько шагов по 120 мс — с запасом.
  await page.waitForTimeout(900)
  await undo.dispatchEvent('pointerup')

  const current = await page.getByTestId('row-progress-current').textContent()
  const n = Number(current?.match(/\d+/)?.[0])
  // Один клик снял бы ряд 6 → 5; автоповтор снимает больше одного шага.
  expect(n).toBeLessThan(5)
})

test('шторка стоит на отмеченном ряду: контур совпадает с текущим рядом', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()
  // Ряд 4 из 19 — текущий; развёрнутая сетка: y = totalRows − done − 1 = 19 − 3 − 1 = 15.
  await expect(page.getByTestId('toe-chart-current-row')).toHaveAttribute('y', '15')
})

test('сброс: кнопка заглушена, пока сбрасывать нечего, требует подтверждения', async ({ page }) => {
  await page.goto('./')

  const reset = page.getByTestId('reset-progress')
  await expect(reset).toBeDisabled()
  await expect(page.getByTestId('reset-progress-confirm')).toHaveCount(0)

  await page.getByTestId('row-progress-mark').click()
  await expect(reset).toBeEnabled()

  await reset.click()
  await expect(page.getByTestId('reset-progress-confirm')).toBeVisible()
  // Сброс не случился по одному касанию — расчёт и ряд ждут подтверждения.
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')

  await page.getByTestId('reset-progress-confirm-cancel').click()
  await expect(page.getByTestId('reset-progress-confirm')).toHaveCount(0)
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 2 из 19')

  await reset.click()
  await page.getByTestId('reset-progress-confirm-yes').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 1 из 19')
  await expect(reset).toBeDisabled()

  const stored = await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)
  expect(stored).toBeNull()
})

test('не совпал paramsKey — прогресса нет, схема чистая', async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: PROGRESS_KEY, value: JSON.stringify({ paramsKey: 's=60&e=16&k=1&r=even', row: 5 }) },
  )

  // Явный hash — приоритет hash → localStorage (§10.3) не даёт сохранённым 60 → 16
  // стать расчётом на экране; на экране дефолт 60 → 20, а сохранённый paramsKey
  // остаётся про другой расчёт — прогресс не восстанавливается.
  await page.goto('./#s=60&e=20&k=1&r=even')

  await expect(page.getByTestId('summary-params')).toContainText('60 → 20 петель')
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 1 из 19')
  await expect(page.getByTestId('reset-progress')).toBeDisabled()
})

test('смена расчёта на ходу номер ряда сохраняет, пока рядов хватает', async ({ page }) => {
  await page.goto('./')

  for (let i = 0; i < 15; i++) await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 16 из 19')

  // 60 → 16 через ряд: 21 ряд, больше 19 — номер не трогается, просто хватает места.
  await page.getByTestId('final-minus').click()
  await expect(page.getByTestId('summary-params')).toContainText('60 → 16 петель')
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 16 из 21')
})

test('смена расчёта на ходу: рядов стало меньше отмеченных — номер подтягивается к последнему', async ({ page }) => {
  await page.goto('./')

  for (let i = 0; i < 15; i++) await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 16 из 19')

  // Открыть конструктор и сжать один сегмент до {interval: 2, repeats: 1} — по правилу
  // хвоста (§12.1 случай 7) это 1 ряд всего, заведомо меньше уже отмеченных 15 —
  // зажим обязан сработать, и дальше отмечать нечего.
  await page.getByTestId('rhythm-builder-toggle').click()
  await page.getByTestId('rhythm-builder-step-0-interval-plus').click()
  for (let i = 0; i < 9; i++) await page.getByTestId('rhythm-builder-step-0-repeats-minus').click()
  await expect(page.getByTestId('summary-total-rows')).toContainText('1 ряд всего')

  await expect(page.getByTestId('row-progress-current')).toHaveText('Готово')
  await expect(page.getByTestId('row-progress-mark')).toBeDisabled()
})

test('на дефолте мысок помещается в окно целиком — прокрутка при открытии не нужна', async ({ page }) => {
  await page.goto('./')
  const scrollTop = await page.getByTestId('toe-chart-scroll').evaluate((el) => el.scrollTop)
  expect(scrollTop).toBe(0)
})

test('окно схемы один раз подъезжает к текущему ряду при открытии — на длинном мыске', async ({ page }) => {
  // 140 → 16, через ряд: N = 31, even даёт 2N−1 = 61 рядов, пиксельная высота 61×22 = 1342.
  await page.goto('./#s=140&e=16&k=1&r=even')
  for (let i = 0; i < 10; i++) await page.getByTestId('row-progress-mark').click()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 11 из 61')

  // Разовая прокрутка случается при монтаже — перезагрузка воспроизводит открытие
  // с уже отмеченными 10 рядами: низ текущего ряда — (61 − 10) × 22 = 1122 px от
  // верха содержимого. `clientHeight` меряется на живом элементе, а не берётся
  // константой 420 — горизонтальная полоса прокрутки отъедает часть высоты окна
  // (в схеме 140 → 16 она есть: сетка шире вьюпорта), и ровно на эту разницу
  // «зазор от нижней кромки» отличался бы, будь он посчитан на глаз.
  await page.reload()
  await expect(page.getByTestId('row-progress-current')).toHaveText('Ряд 11 из 61')
  const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
    scrollTop: el.scrollTop,
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
  }))
  const GAP = 16
  const expected = Math.max(0, Math.min(1122 - metrics.clientHeight + GAP, metrics.scrollHeight - metrics.clientHeight))
  expect(metrics.scrollTop).toBe(expected)
})

test('прогресс в ссылку не попадает никогда', async ({ page }) => {
  await page.goto('./')

  await page.getByTestId('row-progress-mark').click()
  await page.getByTestId('row-progress-mark').click()

  await expect(page).toHaveURL(/#s=60&e=20&k=1&r=even$/)
})
