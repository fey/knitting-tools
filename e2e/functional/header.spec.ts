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

/** Ряды считаются по верхнему краю: у кнопок одной строки он общий. */
async function rowTop(page: import('@playwright/test').Page, testId: string): Promise<number> {
  const box = await page.getByTestId(testId).boundingBox()
  return box!.y
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
}

test('канал стоит последним в ряду кнопок шапки (§6.4)', async ({ page }) => {
  await page.goto('./toe-band/')

  const actions = page.getByTestId('header-actions')
  await expect(actions.getByRole('link').or(actions.getByRole('button'))).toHaveText([
    'Поделиться',
    'Оставить отзыв',
    'Телеграм-канал',
  ])
})

test('на телефоне шапка калькулятора встаёт в три строки, а не вылезает за экран (§6.4)', async ({
  page,
}) => {
  await page.goto('./toe-band/')

  // Замеры §6.4: 358 px под содержимое, «Поделиться» 115, «Оставить отзыв» 143,
  // «Телеграм-канал» 142 — втроём с зазорами 424. Возврат первой строкой, ряд кнопок
  // не влезает в одну и переносится сам: отзыв со «Поделиться» второй, канал третьей.
  const back = await rowTop(page, 'back-to-home')
  const share = await rowTop(page, 'share-button')
  const feedback = await rowTop(page, 'feedback-button')
  const channel = await rowTop(page, 'channel-link')

  expect(back).toBeLessThan(share)
  expect(feedback).toBe(share)
  expect(channel).toBeGreaterThan(share)

  // Перенос затем и заведён, чтобы пополнение ряда не выталкивало страницу за экран.
  expect(await overflow(page)).toBe(0)

  // Худший случай подписи: «Поделиться» распухает после нажатия, и ряд остаётся в мере.
  await page.getByTestId('share-button').click()
  expect(await overflow(page)).toBe(0)
})

test('на витрине шапка остаётся в одну строку (§6.4)', async ({ page }) => {
  await page.goto('./')

  // Слева пусто, кнопки две — «Оставить отзыв» и канал, вдвоём с зазором 297 из 358.
  expect(await rowTop(page, 'channel-link')).toBe(await rowTop(page, 'feedback-button'))
  expect(await overflow(page)).toBe(0)
})
