import { expect, test } from '@playwright/test'

/**
 * Шапка (§6.4, тикет #24) на широком экране: полоса во всю ширину окна, содержимое
 * внутри держит ту же меру, что и `main`, кнопки прижаты вправо, шапка не липнет.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('./toe-band/')
})

test('полоса идёт во всю ширину окна, а кнопки держат меру страницы', async ({ page }) => {
  const header = await page.getByTestId('app-header').boundingBox()
  const viewport = page.viewportSize()!

  expect(header!.x).toBe(0)
  expect(header!.width).toBe(viewport.width)

  // Правый край кнопок совпадает с правым краем содержимого страницы: шапка тянется
  // во всю ширину, но кнопки внутри неё стоят по той же мере, что ручки и схема.
  // Мера берётся по сетке раскладки, а не по самой схеме: схема уже колонки встаёт
  // по центру (§7), и её правый край мерой страницы не является.
  // Правый край держит последняя кнопка ряда — ссылка на канал (§6.4).
  const last = await page.getByTestId('channel-link').boundingBox()
  const grid = await page.getByTestId('layout-grid').boundingBox()
  expect(Math.abs(last!.x + last!.width - (grid!.x + grid!.width))).toBeLessThan(2)
})

test('слева возврат к витрине, кнопки прижаты вправо (§6.4)', async ({ page }) => {
  const back = await page.getByTestId('back-to-home').boundingBox()
  const grid = await page.getByTestId('layout-grid').boundingBox()
  const share = await page.getByTestId('share-button').boundingBox()
  const feedback = await page.getByTestId('feedback-button').boundingBox()
  const source = await page.getByTestId('source-link').boundingBox()
  const channel = await page.getByTestId('channel-link').boundingBox()

  // Резерв левого края занят возвратом к витрине, и стоит он по мере страницы,
  // а не по краю окна.
  expect(Math.abs(back!.x - grid!.x)).toBeLessThan(2)

  // «Поделиться» первой, «Оставить отзыв» второй, значок кода предпоследним, канал
  // последним, и все — правее возврата, с пустотой между ним и рядом больше половины полосы.
  expect(share!.x).toBeLessThan(feedback!.x)
  expect(feedback!.x).toBeLessThan(source!.x)
  expect(source!.x).toBeLessThan(channel!.x)
  expect(share!.x - (back!.x + back!.width)).toBeGreaterThan(grid!.width / 2)
})

test('шапка стоит над заголовком и уезжает при прокрутке — она не липнет (§6.4)', async ({
  page,
}) => {
  const title = await page.getByRole('heading', { name: 'Ленточный мысок носка' }).boundingBox()
  const before = await page.getByTestId('app-header').boundingBox()
  expect(before!.y + before!.height).toBeLessThanOrEqual(title!.y)

  await page.evaluate(() => window.scrollTo(0, 600))
  const after = await page.getByTestId('app-header').boundingBox()

  // Липкая шапка осталась бы на месте; эта уезжает вместе со страницей.
  expect(after!.y).toBeLessThan(before!.y - 500)
})
