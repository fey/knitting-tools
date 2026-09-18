import { describe, expect, it } from 'vitest'
import {
  CELL_SIZE,
  CHART_CELL_SIZES,
  CHART_SCROLL_GAP,
  DEFAULT_ZOOM_STEP,
  cellSizeAt,
  chartGuideLines,
  clampZoomStep,
  pageScrollTargetPx,
  shutterTopPx,
  stitchLinePoints,
  trianglePoints,
} from './constants'

describe('константы схемы', () => {
  it('клетка остаётся 22 px', () => {
    expect(CELL_SIZE).toBe(22)
  })
})

describe('шаги масштаба схемы (§7)', () => {
  it('дефолтный шаг — та самая клетка 22 px, с которой схема жила до зума', () => {
    expect(cellSizeAt(DEFAULT_ZOOM_STEP)).toBe(CELL_SIZE)
  })

  it('шаги идут по возрастанию и не спускаются к нечитаемым 13 px, отвергнутым тикетом #3', () => {
    const sizes = [...CHART_CELL_SIZES]
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(Math.min(...sizes)).toBeGreaterThan(13)
  })

  it('мельче и крупнее дефолта есть куда — иначе одна из кнопок мертва с порога', () => {
    expect(DEFAULT_ZOOM_STEP).toBeGreaterThan(0)
    expect(DEFAULT_ZOOM_STEP).toBeLessThan(CHART_CELL_SIZES.length - 1)
  })

  it('шаг зажимается в границы — на краях кнопка упирается, а не уводит за набор', () => {
    expect(clampZoomStep(-3)).toBe(0)
    expect(clampZoomStep(99)).toBe(CHART_CELL_SIZES.length - 1)
    expect(clampZoomStep(1)).toBe(1)
  })

  it('дробный шаг обрезается до целого — индекс набора, а не непрерывная величина', () => {
    expect(clampZoomStep(1.7)).toBe(1)
  })

  it('размер клетки читается через тот же зажим — шага вне набора не существует', () => {
    expect(cellSizeAt(-1)).toBe(CHART_CELL_SIZES[0])
    expect(cellSizeAt(99)).toBe(CHART_CELL_SIZES[CHART_CELL_SIZES.length - 1])
  })
})

describe('жирные линии каждые 5 петель — счёт от правого края', () => {
  it('на дефолтных 30 петлях в половине даёт тот же набор, что и счёт от левого края', () => {
    // cols = 60 / 2 = 30, кратно 5 — отсчёт от правого и левого края не расходится.
    expect(chartGuideLines(30)).toEqual([25, 20, 15, 10, 5])
  })

  it('на 31 петле расходится со счётом от левого края (5, 10, …, 30)', () => {
    expect(chartGuideLines(31)).toEqual([26, 21, 16, 11, 6, 1])
  })

  it('на кромке короче пяти петель линий нет', () => {
    expect(chartGuideLines(4)).toEqual([])
  })
})

describe('геометрия значков — один источник для сетки и легенды', () => {
  it('треугольник наклона влево: вертикальный катет слева, гипотенуза «\\»', () => {
    expect(trianglePoints('left', 0, 0)).toBe('0.22,0.8 0.22,0.2 0.78,0.8')
  })

  it('треугольник наклона вправо: вертикальный катет справа, гипотенуза «/»', () => {
    expect(trianglePoints('right', 0, 0)).toBe('0.78,0.8 0.78,0.2 0.22,0.8')
  })

  it('size масштабирует те же доли — легенда (14 px) и сетка (клетка) не расходятся', () => {
    const [near, top, far] = trianglePoints('left', 0, 0, 14)
      .split(' ')
      .map((point) => point.split(',').map(Number))
    expect(near).toEqual([0.22 * 14, 0.8 * 14])
    expect(top).toEqual([0.22 * 14, 0.2 * 14])
    expect(far).toEqual([0.78 * 14, 0.8 * 14])
  })

  it('штрих лицевой стоит по центру клетки', () => {
    expect(stitchLinePoints(2, 3)).toEqual({ x1: 2.5, x2: 2.5, y1: 3.2, y2: 3.8 })
  })
})

describe('положение кромки шторки прогресса (тикет #9, §8)', () => {
  it('ничего не отмечено — кромка у самого низа схемы', () => {
    expect(shutterTopPx(19, 0, 22)).toBe(19 * 22)
  })

  it('формула одна: (totalRows − done) × CELL_SIZE', () => {
    expect(shutterTopPx(19, 7, 22)).toBe((19 - 7) * 22)
  })

  it('масштаб ведёт кромку за клетками — иначе затенение отстаёт от схемы', () => {
    // Клетка вдвое крупнее — та же граница вдвое ниже: шторка лежит снаружи скроллера
    // и считается в экранных пикселях, а не в клетках.
    expect(shutterTopPx(19, 7, 44)).toBe((19 - 7) * 44)
  })

  it('отмечены все ряды — кромка у самого верха', () => {
    expect(shutterTopPx(19, 19, 22)).toBe(0)
  })

  it('зажимается в границы — лишнее сверху и снизу не даёт отрицательной высоты', () => {
    expect(shutterTopPx(19, 30, 22)).toBe(0)
    expect(shutterTopPx(19, -5, 22)).toBe(19 * 22)
  })
})

describe('разовая прокрутка страницы к текущему ряду (§8)', () => {
  // Схема кадра не имеет: подъезжает страница целиком, и низ текущего ряда встаёт
  // над плашкой прогресса, а не над нижней кромкой окна схемы.
  const CHART_TOP = 900
  const VIEWPORT = 844
  const DOCK = 120

  it('низ текущего ряда встаёт над плашкой, с зазором', () => {
    // 61 ряд, отмечено 10: низ текущего ряда — (61 − 10) × 22 = 1122 px от верха схемы.
    const target = pageScrollTargetPx(CHART_TOP, 61, 10, VIEWPORT, DOCK, 22)
    expect(target).toBe(CHART_TOP + 1122 - (VIEWPORT - DOCK - CHART_SCROLL_GAP))
  })

  it('высокая плашка поднимает страницу выше — замер живой, не константа', () => {
    const low = pageScrollTargetPx(CHART_TOP, 61, 10, VIEWPORT, 100, 22)
    const high = pageScrollTargetPx(CHART_TOP, 61, 10, VIEWPORT, 180, 22)
    expect(high - low).toBe(80)
  })

  it('короткий мысок целиком помещается над плашкой — страница остаётся вверху', () => {
    // Дефолт 60 → 20: 19 рядов, ничего не отмечено — прокручивать не к чему.
    expect(pageScrollTargetPx(0, 19, 0, VIEWPORT, DOCK, 22)).toBe(0)
  })

  it('отмечены все ряды — граница у верха схемы, страница остаётся вверху', () => {
    expect(pageScrollTargetPx(0, 61, 61, VIEWPORT, DOCK, 22)).toBe(0)
  })
})
