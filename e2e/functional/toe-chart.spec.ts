import { expect, test } from '@playwright/test'

// §7 схема, тикет #3. Дефолт первого экрана: 60 → 20 петель, кромка 1, через ряд —
// cols = 30, 19 рядов, ряд 1 убавочный (§12.1 случай 2).

test.describe('схема мыска', () => {
  test('стоит под ручками расчёта, но выше итога (§6)', async ({ page }) => {
    await page.goto('./')

    const intro = await page.getByTestId('intro').boundingBox()
    const fields = await page.getByTestId('stitch-fields').boundingBox()
    const presets = await page.getByTestId('rhythm-presets').boundingBox()
    const chart = await page.getByTestId('toe-chart').boundingBox()
    const summary = await page.getByTestId('summary-panel').boundingBox()
    for (const box of [intro, fields, presets, chart, summary]) expect(box).not.toBeNull()

    // Вводка → петли → ритм → схема → итог. Порядок правок §9.2 читается так же:
    // сперва факты о своём носке, потом выбор ритма, и только затем то, по чему вяжут.
    expect(intro!.y).toBeLessThan(fields!.y)
    expect(fields!.y).toBeLessThan(presets!.y)
    expect(presets!.y).toBeLessThan(chart!.y)
    expect(chart!.y).toBeLessThan(summary!.y)
  })

  test('схема растёт в естественную высоту — вертикальной прокрутки внутри неё нет', async ({
    page,
  }) => {
    await page.goto('./')

    const svg = page.getByTestId('toe-chart-svg')
    // cols = 30, LBL = 1.9, CELL = 22 → ширина ≈ 702 px; rows = 19 → высота = 418 px.
    await expect(svg).toHaveAttribute('width', '702')
    await expect(svg).toHaveAttribute('height', '418')

    // Кадра в 420 px больше нет (§6): окно схемы вмещает всю сетку по высоте, и внутри
    // схемы прокручивается только горизонталь — вертикально листают страницу целиком.
    const metrics = await page.getByTestId('toe-chart-scroll').evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(metrics.scrollHeight).toBe(metrics.clientHeight)
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

    // Живая клетка — та, что не помечена `data-empty` («нет петли»). У каждой такой
    // клетки должен найтись значок (штрих или треугольник) с теми же координатами —
    // сверка идёт по всей схеме, а не по одному ряду (§7.1).
    const liveCells = svg.locator('rect[data-row][data-col]:not([data-empty])')

    // Ожидаемое число живых клеток — от модели расчёта, а не от той же разметки, которую
    // проверяем: сумма активных петель (row.stitches / 2) по всем 19 рядам дефолта
    // 60 → 20 (§12.1 случай 2) — 28+28+26+26+24+24+22+22+20+20+18+18+16+16+14+14+12+12+10.
    await expect(liveCells).toHaveCount(370)

    const missing = await svg.evaluate((el) => {
      const cells = Array.from(el.querySelectorAll('rect[data-row][data-col]:not([data-empty])'))
      return cells.filter((cell) => {
        const row = cell.getAttribute('data-row')
        const col = cell.getAttribute('data-col')
        return !el.querySelector(`[data-symbol][data-row="${row}"][data-col="${col}"]`)
      }).length
    })
    expect(missing).toBe(0) // живая клетка без штриха или треугольника — и есть проваленный критерий

    // Обратная сторона той же проверки: значков не больше, чем живых клеток — иначе
    // на одну клетку мог бы прийтись задвоенный значок, а сверка координат его не ловит.
    await expect(svg.locator('[data-symbol]')).toHaveCount(370)
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

    await expect(page.getByTestId('toe-chart-caption-top')).toContainText('20 петель на закрытие')
    await expect(page.getByTestId('toe-chart-caption-bottom')).toContainText('Начало мыска, 60 петель')
  })
})
