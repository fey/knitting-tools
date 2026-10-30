import { expect, test } from '@playwright/test'

/**
 * Страница поворота французской пятки (спека пятки §6, §8, §10). Проверяется то, что
 * живёт только в DOM: дефолт на открытии, пересчёт по полям, стороны рядов, починка
 * по уходу фокуса. Арифметику рядов проверяет ядро.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('./french-heel/')
})

test('страница открывается посчитанной на дефолте: 60 → пятка 30, центр 6', async ({ page }) => {
  await expect(page).toHaveTitle('Калькулятор поворота французской пятки')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Поворот французской пятки')

  await expect(page.getByTestId('initial-stitches')).toHaveValue('60')
  await expect(page.getByTestId('center-stitches')).toHaveValue('6')

  await expect(page.getByTestId('summary-heel')).toHaveText('30')
  await expect(page.getByTestId('summary-division')).toHaveText('12 · 6 · 12')
  await expect(page.getByTestId('summary-rows')).toHaveText('12')
  await expect(page.getByTestId('summary-left')).toHaveText('18')

  await expect(page.getByTestId('turn-division')).toHaveText(
    'Раздели 30 петель пятки на три части: 12 · 6 · 12',
  )
  await expect(page.getByTestId('turn-row')).toHaveCount(12)
  await expect(page.getByTestId('turn-row').first()).toHaveText(
    /Лицевой ряд ←: 17 лиц., протяжка, 1 лиц., поверни/,
  )
  await expect(page.getByTestId('turn-row').last()).toHaveText(
    /Изнаночный ряд →: сн. 1, 15 изн., 2 вм. изн., 1 изн\.$/,
  )
})

test('у каждого ряда подписана сторона, изнаночные ряды выделены', async ({ page }) => {
  const rows = page.getByTestId('turn-row')
  const count = await rows.count()
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i)
    const isWrongSide = i % 2 === 1
    await expect(row).toHaveAttribute('data-side', isWrongSide ? 'ws' : 'rs')
    await expect(row).toContainText(isWrongSide ? 'Изнаночный ряд' : 'Лицевой ряд')
  }

  // Выделение — фон, а не только подпись: сторона читается без чтения.
  const bg = (i: number) => rows.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(await bg(1)).not.toBe(await bg(0))
  expect(await bg(3)).toBe(await bg(1))
})

test('начальные петли пересчитывают итог и описание сразу, без ухода из поля', async ({ page }) => {
  await page.getByTestId('initial-stitches').fill('40')

  await expect(page.getByTestId('summary-heel')).toHaveText('20')
  await expect(page.getByTestId('summary-division')).toHaveText('7 · 6 · 7')
  await expect(page.getByTestId('summary-rows')).toHaveText('8')
  await expect(page.getByTestId('summary-left')).toHaveText('12')
  await expect(page.getByTestId('turn-row')).toHaveCount(8)
  // Нечётная боковая часть: два последних ряда без «1 петли».
  await expect(page.getByTestId('turn-row').nth(7)).toHaveText(
    /Изнаночный ряд →: сн. 1, 10 изн., 2 вм. изн\.$/,
  )
})

test('центральная часть пересчитывает итог и описание сразу', async ({ page }) => {
  await page.getByTestId('center-stitches').fill('10')

  await expect(page.getByTestId('summary-division')).toHaveText('10 · 10 · 10')
  await expect(page.getByTestId('summary-rows')).toHaveText('10')
  await expect(page.getByTestId('summary-left')).toHaveText('20')
  await expect(page.getByTestId('turn-division')).toHaveText(
    'Раздели 30 петель пятки на три части: 10 · 10 · 10',
  )
})

test('«6» по дороге к «60» схему не трогает: починка только на уходе фокуса', async ({ page }) => {
  const initial = page.getByTestId('initial-stitches')
  await initial.fill('')
  await initial.pressSequentially('4')

  // 4 не сходится — расчёт остаётся последним сходящимся, подписи ещё нет.
  await expect(page.getByTestId('summary-heel')).toHaveText('30')
  await expect(page.getByTestId('initial-fix')).toHaveCount(0)

  await initial.blur()
  await expect(initial).toHaveValue('12')
  await expect(page.getByTestId('initial-fix')).toContainText('не меньше 12')
  await expect(page.getByTestId('summary-heel')).toHaveText('6')
})

test('нечётные начальные тянутся вниз с подписью', async ({ page }) => {
  const initial = page.getByTestId('initial-stitches')
  await initial.fill('61')
  await initial.press('Enter')

  await expect(initial).toHaveValue('60')
  await expect(page.getByTestId('initial-fix')).toHaveText('61 не делится пополам. Ближайшее чётное — 60')
})

test('центр, при котором боковые части неравны, чинится с подписью', async ({ page }) => {
  const center = page.getByTestId('center-stitches')
  await center.fill('7')
  await center.blur()

  await expect(center).toHaveValue('8')
  await expect(page.getByTestId('center-fix')).toContainText('Центр 7 не сходится')
  await expect(page.getByTestId('summary-division')).toHaveText('11 · 8 · 11')
})

test('слишком широкий центр урезается: на каждую боковую часть хотя бы 2 петли', async ({ page }) => {
  const center = page.getByTestId('center-stitches')
  await center.fill('29')
  await center.blur()

  await expect(center).toHaveValue('26')
  await expect(page.getByTestId('center-fix')).toContainText('Центр урезан до 26')
  await expect(page.getByTestId('summary-division')).toHaveText('2 · 26 · 2')
  await expect(page.getByTestId('summary-rows')).toHaveText('2')
})

test('нечётные петли пятки: начальные 62 тянут центр к 7 с подписью', async ({ page }) => {
  const initial = page.getByTestId('initial-stitches')
  await initial.fill('62')
  await initial.blur()

  await expect(page.getByTestId('summary-heel')).toHaveText('31')
  await expect(page.getByTestId('center-stitches')).toHaveValue('7')
  await expect(page.getByTestId('center-fix')).toBeVisible()
  await expect(page.getByTestId('turn-division')).toHaveText(
    'Раздели 31 петлю пятки на три части: 12 · 7 · 12',
  )
})

test('пустое поле возвращается к прошлому значению, молча', async ({ page }) => {
  const center = page.getByTestId('center-stitches')
  await center.fill('')
  await center.blur()

  await expect(center).toHaveValue('6')
  await expect(page.getByTestId('center-fix')).toHaveCount(0)
})

test('сторона ряда 1 зеркалит поворот: изнаночный старт, убавки по стороне, итог тот же', async ({
  page,
}) => {
  await expect(page.getByTestId('first-side-rs')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('first-side-ws').click()
  await expect(page.getByTestId('first-side-ws')).toHaveAttribute('aria-pressed', 'true')

  await expect(page.getByTestId('turn-row').first()).toHaveAttribute('data-side', 'ws')
  await expect(page.getByTestId('turn-row').first()).toHaveText(
    /Изнаночный ряд →: 17 изн., 2 вм. изн., 1 изн., поверни/,
  )
  await expect(page.getByTestId('turn-row').nth(1)).toHaveText(
    /Лицевой ряд ←: сн. 1, 5 лиц., протяжка, 1 лиц., поверни/,
  )
  await expect(page.getByTestId('turn-row').last()).toHaveAttribute('data-side', 'rs')
  await expect(page.getByTestId('summary-rows')).toHaveText('12')
  await expect(page.getByTestId('summary-left')).toHaveText('18')
})

test('схема поворота на дефолте: ряд на петлю уже, поворот на каждом ряду, кроме последнего (§7)', async ({
  page,
}) => {
  const rows = page.getByTestId('turn-chart-row')
  await expect(rows).toHaveCount(12)
  // В модели ряды сверху вниз: последний — первым, ряд 1 — нижним.
  await expect(rows.last()).toHaveAttribute('data-row', '1')
  await expect(rows.first()).toHaveAttribute('data-row', '12')

  // Ширина ряда — петли на спице: две клетки убавки плюс остальные клетки ряда.
  for (const [n, width] of [
    [1, 30],
    [2, 29],
    [12, 19],
  ] as const) {
    const row = page.locator(`[data-testid="turn-chart-row"][data-row="${n}"]`)
    await expect(row.locator('rect[data-kind="knit"], rect[data-kind="slip"], rect[data-kind="idle"]')).toHaveCount(
      width - 2,
    )
    await expect(row.getByTestId('turn-chart-decrease')).toHaveCount(1)
  }

  await expect(page.getByTestId('turn-chart-turn')).toHaveCount(11)
  await expect(page.locator('[data-row="12"]').getByTestId('turn-chart-turn')).toHaveCount(0)
  await expect(page.getByTestId('turn-chart-label').last()).toHaveText('1 лиц. ←')
  await expect(page.getByTestId('turn-chart-label').nth(10)).toHaveText('2 изн. →')
  await expect(page.getByTestId('turn-chart-parts')).toContainText('12')
  await expect(page.getByTestId('turn-chart-parts')).toContainText('6')
  await expect(page.getByTestId('turn-chart-top')).toHaveText('Вверху: 18 петель на спице после поворота')
})

test('схема открывается на начале ряда 1: лицевой старт — у правого края, изнаночный — у левого', async ({
  page,
}) => {
  const scroll = page.getByTestId('turn-chart-scroll')
  const atRight = () => scroll.evaluate((el) => el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  const atLeft = () => scroll.evaluate((el) => el.scrollLeft === 0)
  // На телефоне дефолтная схема шире колонки — иначе проверять было бы нечего.
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  expect(await atRight()).toBe(true)

  await page.getByTestId('first-side-ws').click()
  await expect(page.getByTestId('turn-chart-label').last()).toHaveText('1 изн. →')
  await expect.poll(atLeft).toBe(true)
  // Убавка ряда 1 — по стороне: «2 вм. изн.».
  await expect(page.locator('[data-row="1"]').getByTestId('turn-chart-decrease')).toHaveAttribute(
    'data-kind',
    'p2tog',
  )
})

test('схема идёт за центральной частью', async ({ page }) => {
  const center = page.getByTestId('center-stitches')
  await center.fill('10')
  await center.blur()
  await expect(page.getByTestId('turn-chart-row')).toHaveCount(10)
  await expect(page.getByTestId('turn-chart-turn')).toHaveCount(9)
  await expect(page.getByTestId('turn-chart-top')).toHaveText('Вверху: 20 петель на спице после поворота')
})

test('возврат на витрину', async ({ page }) => {
  await page.getByTestId('back-to-home').click()
  await expect(page).toHaveURL(/\/knitting-tools\/$/)
})
