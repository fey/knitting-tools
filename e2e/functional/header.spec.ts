import { expect, test } from '@playwright/test'

/**
 * Шапка на телефоне (§6.4): ссылка на канал и обещанный перенос ряда кнопок.
 * Десктопная раскладка шапки — в `e2e/desktop/header.spec.ts`, здесь вьюпорт телефонный,
 * и проверяется ровно то, ради чего перенос заводили.
 *
 * Ссылка на канал не в слоте: она одна и та же на всём сайте и приходит вместе с самой
 * шапкой, а не расставляется по страницам.
 */

const CHANNEL = 'https://t.me/feycot_the_knitterman'
const SOURCE = 'https://github.com/fey/knitting-tools'

/**
 * Ряды считаются по середине, а не по верхнему краю: значок исходного кода выше подписанных
 * кнопок, элементы ряда выровнены по центру, и общая у них середина.
 */
async function rowMiddle(page: import('@playwright/test').Page, testId: string): Promise<number> {
  const box = await page.getByTestId(testId).boundingBox()
  return box!.y + box!.height / 2
}

async function overflow(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

for (const [where, path] of [
  ['витрине', './'],
  ['калькуляторе', './toe-band/'],
] as const) {
  test(`на ${where} шапка ведёт на канал`, async ({ page }) => {
    await page.goto(path)

    const link = page.getByTestId('channel-link')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', CHANNEL)
    // Канал — внешний адрес: уход на него не обязан стирать открытый расчёт.
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test(`на ${where} шапка ведёт на исходный код`, async ({ page }) => {
    await page.goto(path)

    const link = page.getByTestId('source-link')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', SOURCE)
    // Адрес чужой, как и у канала: уход на него не обязан стирать открытый расчёт.
    await expect(link).toHaveAttribute('target', '_blank')
    // Значок без подписи безымянен — имя ему даёт `aria-label` (§6.4).
    await expect(link).toHaveAccessibleName('Исходный код на GitHub')

    // Мера значка — под палец: 44 px по §6.4.
    const box = await link.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
}

test('ряд кнопок шапки замыкает значок исходного кода, канал перед ним (§6.4)', async ({ page }) => {
  await page.goto('./toe-band/')

  // Имена, а не тексты: у значка исходного кода подписи нет, его имя — в `aria-label`.
  const actions = page.getByTestId('header-actions')
  const names = await actions
    .getByRole('link')
    .or(actions.getByRole('button'))
    .evaluateAll((items) =>
      items.map((item) => (item.getAttribute('aria-label') ?? item.textContent ?? '').trim()),
    )

  expect(names).toEqual([
    'Поделиться',
    'Оставить отзыв',
    'Телеграм-канал',
    'Исходный код на GitHub',
  ])
})

test('на телефоне шапка калькулятора встаёт в три строки, а не вылезает за экран (§6.4)', async ({
  page,
}) => {
  await page.goto('./toe-band/')

  // Замеры §6.4: 358 px под содержимое, «Поделиться» 115, «Оставить отзыв» 143,
  // «Телеграм-канал» 142, значок кода 44 — вчетвером с зазорами 480. Возврат первой строкой,
  // ряд кнопок не влезает в одну и переносится сам: «Поделиться» с отзывом второй строкой
  // (270 из 358), канал со значком третьей (198).
  const back = await rowMiddle(page, 'back-to-home')
  const share = await rowMiddle(page, 'share-button')
  const feedback = await rowMiddle(page, 'feedback-button')
  const source = await rowMiddle(page, 'source-link')
  const channel = await rowMiddle(page, 'channel-link')

  expect(back).toBeLessThan(share)
  expect(feedback).toBe(share)
  expect(channel).toBeGreaterThan(share)
  expect(source).toBe(channel)

  // Перенос затем и заведён, чтобы пополнение ряда не выталкивало страницу за экран.
  expect(await overflow(page)).toBe(0)

  // Худший случай подписи: «Поделиться» распухает после нажатия, и ряд остаётся в мере.
  await page.getByTestId('share-button').click()
  expect(await overflow(page)).toBe(0)
})

test('на витрине шапка остаётся в одну строку (§6.4)', async ({ page }) => {
  await page.goto('./')

  // Слева пусто, в ряду трое — «Оставить отзыв», канал и значок кода, вместе 353 из 358.
  expect(await rowMiddle(page, 'channel-link')).toBe(await rowMiddle(page, 'feedback-button'))
  expect(await rowMiddle(page, 'source-link')).toBe(await rowMiddle(page, 'feedback-button'))
  expect(await overflow(page)).toBe(0)
})
