import { expect, test } from '@playwright/test'

// §6: от 1240 px страница раскладывается в две колонки — слева ручки и «Итог», справа
// схема. Вьюпорт проекта 1280×900. Порог считается от ширины схемы: дефолтный расчёт
// 60 → 20 — это схема в 702 px (сетка 660 плюс полоса номеров 42), и две колонки честны
// только там, где она встаёт целиком.

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

test('схема уже окна встаёт по центру, а не жмётся влево (§7)', async ({ page }) => {
  // На 1280 колонка шире дефолтной схемы: 702 px схемы в окне около 800 px.
  // Прижатая влево схема оставляла бы белое поле справа от номеров рядов — тем более
  // заметное на мелком шаге зума, где сетка всего 510 px.
  const gaps = await page.getByTestId('toe-chart-scroll').evaluate((el) => {
    // Центруется дорожка целиком — сетка вместе с полосой номеров, а не сетка отдельно.
    const track = el.querySelector('[data-testid="toe-chart-track"]')!
    const box = el.getBoundingClientRect()
    const grid = track.getBoundingClientRect()
    return {
      left: grid.left - box.left,
      right: box.right - grid.right,
      fits: el.scrollWidth === el.clientWidth,
    }
  })

  expect(gaps.fits).toBe(true) // предпосылка: схема действительно уже окна
  expect(gaps.left).toBeGreaterThan(1)
  expect(Math.abs(gaps.left - gaps.right)).toBeLessThan(2)
})

test('шторка прогресса не тонирует пустые поля по бокам центрованной схемы (§8)', async ({
  page,
}) => {
  const widths = await page.getByTestId('toe-chart-box').evaluate((el) => {
    const track = el.querySelector('[data-testid="toe-chart-track"]')!
    const paper = el.querySelector('[data-testid="toe-chart-shutter-paper"]')!
    return {
      grid: track.getBoundingClientRect().width,
      paper: paper.getBoundingClientRect().width,
    }
  })
  // Бумага шторки шириной в схему, а не в окно: иначе затенение ложилось бы на белое.
  expect(Math.abs(widths.paper - widths.grid)).toBeLessThan(2)
})

test('крупный шаг зума возвращает прокрутку и на широком экране — это выбор, а не поломка (§6.2)', async ({
  page,
}) => {
  // Обещание раскладки — «без горизонтальной прокрутки» на дефолтном расчёте И дефолтном
  // масштабе. Нажатый «+» его снимает осознанно, и проверяется это здесь: утверждение
  // про раскладку живёт в десктопном проекте, а не в телефонном.
  const metrics = () =>
    page.getByTestId('toe-chart-scroll').evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))

  const before = await metrics()
  expect(before.scrollWidth).toBe(before.clientWidth)

  await page.getByTestId('toe-chart-zoom-in').click()

  await expect.poll(async () => (await metrics()).scrollWidth > (await metrics()).clientWidth).toBe(
    true,
  )
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
