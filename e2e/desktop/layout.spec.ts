import { expect, test } from '@playwright/test'

// §6: от 1240 px страница раскладывается в две колонки — слева ручки и «Итог», справа
// схема. Вьюпорт проекта 1280×900. Порог считается от ширины схемы: дефолтный расчёт
// 60 → 20 — это сетка в 702 px, и две колонки честны только там, где она встаёт целиком.

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('вводка стоит над обеими колонками и не режется в узкий столбец', async ({ page }) => {
  const intro = await page.getByTestId('intro').boundingBox()
  const controls = await page.getByTestId('controls-column').boundingBox()
  const chart = await page.getByTestId('toe-chart').boundingBox()

  expect(intro!.y).toBeLessThan(controls!.y)
  expect(intro!.y).toBeLessThan(chart!.y)

  // Вводка начинается на левом краю страницы и перехлёстывает вторую колонку: она
  // не заперта в колонке ручек. Ширина при этом ограничена длиной строки (§6.2),
  // поэтому «шире схемы» проверять нельзя — проверяется именно перехлёст.
  expect(Math.abs(intro!.x - controls!.x)).toBeLessThan(2)
  expect(intro!.x + intro!.width).toBeGreaterThan(chart!.x)
  expect(intro!.width).toBeGreaterThan(controls!.width)
})

test('ручки слева, схема справа — путь глазом тот же, что на телефоне сверху вниз', async ({
  page,
}) => {
  const controls = await page.getByTestId('controls-column').boundingBox()
  const chart = await page.getByTestId('toe-chart').boundingBox()

  expect(chart!.x).toBeGreaterThan(controls!.x + controls!.width - 1)
  // Обе колонки начинаются на одной высоте — это один ряд грида, а не блоки друг под другом.
  expect(Math.abs(chart!.y - controls!.y)).toBeLessThan(2)
})

test('«Итог» уходит под ручки, в левую колонку', async ({ page }) => {
  const controls = await page.getByTestId('controls-column').boundingBox()
  const summary = await page.getByTestId('summary-panel').boundingBox()
  const chart = await page.getByTestId('toe-chart').boundingBox()

  expect(Math.abs(summary!.x - controls!.x)).toBeLessThan(2)
  expect(summary!.y).toBeGreaterThan(controls!.y)
  expect(summary!.x).toBeLessThan(chart!.x)
})

test('на дефолтном расчёте схема помещается в колонку без горизонтальной прокрутки', async ({
  page,
}) => {
  const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }))
  expect(metrics.scrollWidth).toBe(metrics.clientWidth)
})

test('схема шире колонки всё равно прокручивается вбок — это свойство задачи (§7)', async ({
  page,
}) => {
  // 140 начальных петель — 70 клеток, 1540 px: в колонку не влезет ни на каком экране.
  // Переход, меняющий только hash, документ не перезагружает — расчёт остался бы дефолтным.
  await page.goto('./#s=140&e=16&k=1&r=even')
  await page.reload()
  const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollLeft: el.scrollLeft,
  }))
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  // Начало ряда справа — открытие встаёт на правый край (§7).
  expect(metrics.scrollLeft + metrics.clientWidth).toBeGreaterThanOrEqual(metrics.scrollWidth - 1)
})

// Средний шаг: от 800 px страница ещё одноколоночная, но уже не узкая полоса — схема
// на дефолтном расчёте встаёт целиком, и горизонтальная прокрутка пропадает (§6.2).
test.describe('средняя ширина: одна колонка, но схема уже помещается', () => {
  test.use({ viewport: { width: 900, height: 900 } })

  test('колонка одна — схема стоит под ручками, а не рядом с ними', async ({ page }) => {
    const controls = await page.getByTestId('controls-column').boundingBox()
    const chart = await page.getByTestId('toe-chart').boundingBox()

    expect(chart!.y).toBeGreaterThan(controls!.y)
    expect(Math.abs(chart!.x - controls!.x)).toBeLessThan(2)
  })

  test('схема на дефолтном расчёте помещается без горизонтальной прокрутки', async ({ page }) => {
    const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(metrics.scrollWidth).toBe(metrics.clientWidth)
  })
})
