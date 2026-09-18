import { expect, test } from '@playwright/test'

// §7: клетка 22 px — дефолт, а не приговор. Тикет #3 записал «22px по умолчанию,
// кнопки −/+», спека это потеряла и теперь несёт обратно. Дефолт 60 → 20: cols = 30,
// 19 рядов, ширина на дефолтном шаге ≈ 702 px.

const svgBox = (page: import('@playwright/test').Page) =>
  page.getByTestId('toe-chart-svg').evaluate((el) => ({
    width: Number(el.getAttribute('width')),
    height: Number(el.getAttribute('height')),
  }))

test.describe('масштаб схемы', () => {
  test('схема открывается на дефолтном шаге — клетка 22 px', async ({ page }) => {
    await page.goto('./')
    expect(await svgBox(page)).toEqual({ width: 702, height: 418 })
  })

  test('«крупнее» растит клетку, «мельче» возвращает к дефолту', async ({ page }) => {
    await page.goto('./')

    await page.getByTestId('toe-chart-zoom-in').click()
    const bigger = await svgBox(page)
    expect(bigger.width).toBeGreaterThan(702)
    expect(bigger.height).toBeGreaterThan(418)

    await page.getByTestId('toe-chart-zoom-out').click()
    expect(await svgBox(page)).toEqual({ width: 702, height: 418 })
  })

  test('мельче дефолта тоже есть куда — на телефоне схему хочется и обозреть целиком', async ({
    page,
  }) => {
    await page.goto('./')
    await page.getByTestId('toe-chart-zoom-out').click()
    const smaller = await svgBox(page)
    expect(smaller.width).toBeLessThan(702)
  })

  test('на краях набора кнопка заглушена — жать в пустоту нечего', async ({ page }) => {
    await page.goto('./')
    const out = page.getByTestId('toe-chart-zoom-out')
    const zin = page.getByTestId('toe-chart-zoom-in')

    // Вниз шаг один: дефолт стоит вторым в наборе.
    await out.click()
    await expect(out).toBeDisabled()
    await expect(zin).toBeEnabled()

    // Вверх — до упора; на потолке заглушается уже «крупнее».
    for (let i = 0; i < 10; i++) if (await zin.isEnabled()) await zin.click()
    await expect(zin).toBeDisabled()
    await expect(out).toBeEnabled()
  })

  // Ввод десктопный, но проверяется здесь: функциональный проект — тот же Desktop Chrome,
  // а десктопный несёт только спеки раскладки (§12.2). Щипок по тачпаду браузер шлёт
  // этим же событием, поэтому ветка одна на оба жеста.
  test('ctrl + колесо меняет масштаб, а не зумит страницу целиком (§7)', async ({ page }) => {
    await page.goto('./')
    await page.getByTestId('toe-chart-scroll').hover()

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    await expect.poll(async () => (await svgBox(page)).width).toBeGreaterThan(702)

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Control')
    await expect.poll(async () => (await svgBox(page)).width).toBe(702)
  })

  test('смена масштаба ставит прокрутку на правый край — там начало ряда (§7, тикет #8)', async ({
    page,
  }) => {
    await page.goto('./')
    const scroll = page.getByTestId('toe-chart-scroll')
    await scroll.evaluate((el) => {
      el.scrollLeft = 0
    })

    await page.getByTestId('toe-chart-zoom-in').click()

    await expect
      .poll(async () =>
        scroll.evaluate((el) => el.scrollLeft + el.clientWidth >= el.scrollWidth - 1),
      )
      .toBe(true)
  })

  test('шторка прогресса едет за клетками, а не остаётся на дефолтных 22 px (§8)', async ({
    page,
  }) => {
    await page.goto('./')
    // Отметить пару рядов — шторка встаёт на кромку отмеченного.
    await page.getByTestId('row-progress-mark').click()
    await page.getByTestId('row-progress-mark').click()

    const paperTop = () =>
      page.getByTestId('toe-chart-shutter-paper').evaluate((el) => (el as HTMLElement).style.top)

    const before = await paperTop()
    await page.getByTestId('toe-chart-zoom-in').click()
    const after = await paperTop()

    // 19 рядов, отмечено 2 → кромка на (19 − 2) клетках: 374 px на дефолте, больше на крупной.
    expect(before).toBe('374px')
    expect(Number.parseFloat(after)).toBeGreaterThan(374)
  })
})
