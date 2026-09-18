import { expect, test } from '@playwright/test'

// §7: клетка 22 px — дефолт, а не приговор. Тикет #3 записал «22px по умолчанию,
// кнопки −/+», спека это потеряла и теперь несёт обратно. Дефолт 60 → 20: cols = 30,
// 19 рядов; на дефолтном шаге сетка 660 px, полоса номеров ещё 42 px.

const svgBox = (page: import('@playwright/test').Page) =>
  page.getByTestId('toe-chart-svg').evaluate((el) => ({
    width: Number(el.getAttribute('width')),
    height: Number(el.getAttribute('height')),
  }))

test.describe('масштаб схемы', () => {
  test('схема открывается на дефолтном шаге — клетка 22 px', async ({ page }) => {
    await page.goto('./toe-band/')
    expect(await svgBox(page)).toEqual({ width: 660, height: 418 })
  })

  test('«крупнее» растит клетку, «мельче» возвращает к дефолту', async ({ page }) => {
    await page.goto('./toe-band/')

    await page.getByTestId('toe-chart-zoom-in').click()
    const bigger = await svgBox(page)
    expect(bigger.width).toBeGreaterThan(660)
    expect(bigger.height).toBeGreaterThan(418)

    await page.getByTestId('toe-chart-zoom-out').click()
    expect(await svgBox(page)).toEqual({ width: 660, height: 418 })
  })

  test('мельче дефолта тоже есть куда — на телефоне схему хочется и обозреть целиком', async ({
    page,
  }) => {
    await page.goto('./toe-band/')
    await page.getByTestId('toe-chart-zoom-out').click()
    const smaller = await svgBox(page)
    expect(smaller.width).toBeLessThan(660)
  })

  test('на краях набора кнопка заглушена — жать в пустоту нечего', async ({ page }) => {
    await page.goto('./toe-band/')
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
    await page.goto('./toe-band/')
    await page.getByTestId('toe-chart-scroll').hover()

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    await expect.poll(async () => (await svgBox(page)).width).toBeGreaterThan(660)

    await page.keyboard.down('Control')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Control')
    await expect.poll(async () => (await svgBox(page)).width).toBe(660)
  })

  test('смена масштаба ставит прокрутку на правый край — там начало ряда (§7, тикет #8)', async ({
    page,
  }) => {
    await page.goto('./toe-band/')
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
    await page.goto('./toe-band/')
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

// Кнопки зума стоят рядом со степперами конструктора ритма и раньше повторяли их знаки
// «−»/«+» — на экране это читалось прибавками к расчёту, а не масштабом. Значок лупы
// разводит их обратно (§7); мишень 44 px и заглушение на краях набора остаются.
test.describe('зум помечен лупой', () => {
  test('на кнопках значок, а не текстовый знак — зум не читается прибавкой (§7)', async ({
    page,
  }) => {
    await page.goto('./toe-band/')

    for (const testId of ['toe-chart-zoom-out', 'toe-chart-zoom-in']) {
      const button = page.getByTestId(testId)
      // Текста на кнопке нет вовсе: «−» и «+» теперь живут внутри лупы, штрихами SVG.
      await expect(button).toHaveText('')
      await expect(button.locator('svg')).toHaveCount(1)
    }
  })

  test('лупы различаются между собой — иначе значок не называет шаг (§7)', async ({ page }) => {
    await page.goto('./toe-band/')

    // Линзы одинаковы, знак внутри — нет: у «мельче» ручка и штрих «−», у «крупнее»
    // к ним добавлен вертикальный штрих. Без этой проверки две неразличимые лупы
    // прошли бы весь функциональный прогон зелёными.
    await expect(page.getByTestId('toe-chart-zoom-out').locator('line')).toHaveCount(2)
    await expect(page.getByTestId('toe-chart-zoom-in').locator('line')).toHaveCount(3)
  })

  test('кнопка без текста всё равно называет себя — имя держится на aria-label (§7)', async ({
    page,
  }) => {
    await page.goto('./toe-band/')

    await expect(page.getByRole('button', { name: 'Схема крупнее' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Схема мельче' })).toBeEnabled()

    // Имя рабочее: по нему и жмут.
    await page.getByRole('button', { name: 'Схема крупнее' }).click()
    expect((await svgBox(page)).width).toBeGreaterThan(660)
  })
})
