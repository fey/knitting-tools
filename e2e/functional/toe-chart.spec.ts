import { expect, test } from '@playwright/test'

// §7 схема, тикет #3. Дефолт первого экрана: 60 → 20 петель, кромка 1, через ряд —
// cols = 30, 19 рядов, ряд 1 убавочный (§12.1 случай 2).

test.describe('схема мыска', () => {
  test('стоит первой на экране, до пресетов ритма и остальных блоков', async ({ page }) => {
    await page.goto('./')

    const chartBox = await page.getByTestId('toe-chart').boundingBox()
    const presetsBox = await page.getByTestId('rhythm-presets').boundingBox()
    expect(chartBox).not.toBeNull()
    expect(presetsBox).not.toBeNull()
    expect(chartBox!.y).toBeLessThan(presetsBox!.y)
  })

  test('окно схемы — 420 px высотой, клетка не сжимается под ширину экрана', async ({ page }) => {
    await page.goto('./')

    const scroll = page.getByTestId('toe-chart-scroll')
    await expect(scroll).toHaveCSS('height', '420px')

    const svg = page.getByTestId('toe-chart-svg')
    // cols = 30, LBL = 1.9, CELL = 22 → ширина ≈ 702 px; rows = 19 → высота = 418 px.
    await expect(svg).toHaveAttribute('width', '702')
    await expect(svg).toHaveAttribute('height', '418')
  })

  test('горизонтальная прокрутка при открытии стоит на правом краю', async ({ page }) => {
    await page.goto('./')

    const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth) // схема реально шире окна
    expect(metrics.scrollLeft + metrics.clientWidth).toBeGreaterThanOrEqual(metrics.scrollWidth - 1)
  })

  test('ширина сетки постоянна и равна половине начальных петель — 30 колонок на 19 рядов', async ({
    page,
  }) => {
    await page.goto('./')

    const svg = page.getByTestId('toe-chart-svg')
    const cellCount = await svg.locator('rect[data-row][data-col]').count()
    expect(cellCount).toBe(30 * 19)

    // Верхний ряд (кончик мыска) — самый узкий, съеденные петли помечены «нет петли».
    const topRowCells = svg.locator('rect[data-row="19"][data-col]')
    const bottomRowCells = svg.locator('rect[data-row="1"][data-col]')
    await expect(topRowCells).toHaveCount(30)
    await expect(bottomRowCells).toHaveCount(30)

    const topLive = await svg.locator('[data-row="19"][data-stitch]').count()
    const bottomLive = await svg.locator('[data-row="1"][data-stitch]').count()
    expect(topLive).toBeLessThan(bottomLive) // клин сужается к кончику
  })

  test('лицевая — штрих, убавки — 2 треугольника на убавочный ряд, наклон не перепутан', async ({
    page,
  }) => {
    await page.goto('./')
    const svg = page.getByTestId('toe-chart-svg')

    // Ряд 1 — убавочный (дефолт: 10 убавочных рядов, ряд 1 первый из них).
    const decLeft = svg.locator('[data-row="1"][data-symbol="dec-left"]')
    const decRight = svg.locator('[data-row="1"][data-symbol="dec-right"]')
    await expect(decLeft).toHaveCount(1) // 2 треугольника на половину, не 4 (§7)
    await expect(decRight).toHaveCount(1)

    // Наклон влево стоит у начала половины — то есть у правого края живых петель
    // (петли читаются справа налево, §7). Перепутанный отсчёт зеркалил бы всю схему.
    const [leftCol, rightCol] = await Promise.all([
      decLeft.getAttribute('data-col'),
      decRight.getAttribute('data-col'),
    ])
    expect(Number(leftCol)).toBeGreaterThan(Number(rightCol))

    // Промежуточный ряд (ряд 2) убавок не несёт вовсе.
    await expect(svg.locator('[data-row="2"][data-symbol^="dec"]')).toHaveCount(0)
  })

  test('пустой клеткой лицевая не обозначается ни в одном месте схемы', async ({ page }) => {
    await page.goto('./')
    const svg = page.getByTestId('toe-chart-svg')

    // Каждая живая клетка (включая тонированную кромку) несёт значок — штрих или
    // треугольник; проверка идёт по всей схеме, а не по одному ряду (§7.1).
    const holes = await svg.evaluate(
      (el) =>
        el.querySelectorAll('[data-stitch]').length - el.querySelectorAll('[data-symbol]').length,
    )
    expect(holes).toBe(0)
  })

  test('жирные линии каждые 5 петель — 5 штук на дефолте; убавочные ряды выделены', async ({
    page,
  }) => {
    await page.goto('./')
    const svg = page.getByTestId('toe-chart-svg')

    await expect(svg.locator('[data-testid="toe-chart-guide"]')).toHaveCount(5)
    await expect(svg.locator('[data-testid="toe-chart-row-label"]')).toHaveCount(19)
    await expect(svg.locator('[data-testid="toe-chart-row-label"][data-row="1"]')).toHaveText('1')

    const label = (n: number) => svg.locator(`[data-testid="toe-chart-row-label"][data-row="${n}"]`)
    // Ряд 1 — убавочный (жирнее и темнее), ряд 2 — промежуточный (§7).
    await expect(label(1)).toHaveAttribute('font-weight', '600')
    await expect(label(2)).toHaveAttribute('font-weight', '400')
  })

  test('легенда называет типы убавок и петлю кромки, без значка кромочной', async ({ page }) => {
    await page.goto('./')
    const legend = page.getByTestId('toe-chart-legend')

    await expect(legend).toContainText('лицевая')
    await expect(legend).toContainText('петля кромки, тоже лицевая')
    await expect(legend).toContainText('2 вместе лицевой с наклоном влево (протяжка)')
    await expect(legend).toContainText('2 вместе лицевой с наклоном вправо')
    await expect(legend).toContainText('нет петли')

    // Пять строк ровно — значка кромочной (точка в центре клетки) среди них нет.
    await expect(legend.locator('> div')).toHaveCount(5)
  })

  test('подписи над и под схемой несут число петель на шов и начальные петли', async ({ page }) => {
    await page.goto('./')

    await expect(page.getByTestId('toe-chart-caption-top')).toContainText('20 петель на трикотажный шов')
    await expect(page.getByTestId('toe-chart-caption-bottom')).toContainText('Начало мыска, 60 петель')
  })
})
