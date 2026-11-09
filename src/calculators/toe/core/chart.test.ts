import { describe, expect, it } from 'vitest'
import {
  CELL_SIZE,
  CHART_CELL_SIZES,
  CHART_SCROLL_GAP,
  DEFAULT_ZOOM_STEP,
  cellSizeAt,
  chartGuideLines,
  chartLegend,
  chartModel,
  clampZoomStep,
  pageScrollTargetPx,
  stitchLinePoints,
  trianglePoints,
  wheelAction,
} from './chart'
import { calculateToe } from './calc'
import type { Gauge } from './gauge'
import type { ToeParams } from './types'

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

describe('разовая прокрутка страницы к текущему ряду (§8)', () => {
  // Схема кадра не имеет: подъезжает страница целиком, и низ текущего ряда встаёт
  // над плашкой прогресса, а не над нижней кромкой окна схемы.
  const CHART_TOP = 900
  const VIEWPORT = 844
  const DOCK = 120

  it('низ текущего ряда встаёт над плашкой, с зазором', () => {
    // 61 ряд, отмечено 10: низ текущего ряда — (61 − 10) × 22 = 1122 px от верха схемы.
    const target = pageScrollTargetPx(CHART_TOP, 61 - 10, VIEWPORT, DOCK, 22)
    expect(target).toBe(CHART_TOP + 1122 - (VIEWPORT - DOCK - CHART_SCROLL_GAP))
  })

  it('высокая плашка поднимает страницу выше — замер живой, не константа', () => {
    const low = pageScrollTargetPx(CHART_TOP, 61 - 10, VIEWPORT, 100, 22)
    const high = pageScrollTargetPx(CHART_TOP, 61 - 10, VIEWPORT, 180, 22)
    expect(high - low).toBe(80)
  })

  it('короткий мысок целиком помещается над плашкой — страница остаётся вверху', () => {
    // Дефолт 60 → 20: 19 рядов, ничего не отмечено — прокручивать не к чему.
    expect(pageScrollTargetPx(0, 19, VIEWPORT, DOCK, 22)).toBe(0)
  })

  it('отмечены все ряды — граница у верха схемы, страница остаётся вверху', () => {
    expect(pageScrollTargetPx(0, 0, VIEWPORT, DOCK, 22)).toBe(0)
  })
})

/** Дефолт первого экрана: 60 → 20, через ряд — 30 колонок, 19 рядов, ряд 1 убавочный. */
function defaultWithEdge(edge: number) {
  const params: ToeParams = { initial: 60, final: 20, edge, rhythm: { kind: 'preset', name: 'even' } }
  return calculateToe(params)
}

/** Носочная плотность из §9.6: 19 рядов — 4,75 см. */
const GAUGE: Gauge = { rows: 40, stitches: 31, base: 10 }

/** Ряд схемы по номеру ряда мыска — схема хранит их развёрнутыми, кончиком вверх. */
function row(model: ReturnType<typeof chartModel>, n: number) {
  const found = model.rows.find((r) => r.row.n === n)
  if (!found) throw new Error(`нет ряда ${n}`)
  return found
}

describe('модель схемы: раскладка рядов (§7)', () => {
  it('кончик мыска сверху: ряд 19 на y = 0, ряд 1 — нижний', () => {
    const model = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP)
    expect(model.cols).toBe(30)
    expect(model.rowsCount).toBe(19)
    expect(model.rows[0].row.n).toBe(19)
    expect(row(model, 19).y).toBe(0)
    expect(row(model, 1).y).toBe(18)
  })

  it('петли нумеруются справа налево: правая живая клетка — петля 0', () => {
    const model = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP)
    // Ряд 2 промежуточный, в круге 56 — живых 28 в половине, по клетке пусто с краёв.
    const symbols = row(model, 2).stitches
    expect(symbols).toHaveLength(28)
    expect(symbols.find((s) => s.p === 0)?.j).toBe(28)
    expect(symbols.find((s) => s.p === 27)?.j).toBe(1)
    expect(row(model, 2).cells.filter((c) => c.kind === 'empty').map((c) => c.j)).toEqual([0, 29])
  })

  it.each([
    { edge: 0, left: 28, right: 1 },
    { edge: 1, left: 27, right: 2 },
    { edge: 2, left: 26, right: 3 },
  ])('кромка $edge: протяжка у начала половины, справа — колонка $left, наклон вправо — $right', ({
    edge,
    left,
    right,
  }) => {
    const model = chartModel(defaultWithEdge(edge), null, DEFAULT_ZOOM_STEP)
    const decs = row(model, 1).decorations
    expect(decs).toEqual([
      expect.objectContaining({ dir: 'right', j: right, p: 27 - edge }),
      expect.objectContaining({ dir: 'left', j: left, p: edge }),
    ])
    // Кромка — `edge` петель с каждого края половины, тоже лицевые.
    const edgeCols = row(model, 1).cells.filter((c) => c.kind === 'edge').map((c) => c.j)
    expect(edgeCols).toHaveLength(2 * edge)
    expect(row(model, 1).stitches.filter((s) => s.edge)).toHaveLength(2 * edge)
  })

  it('промежуточный ряд убавок не несёт', () => {
    const model = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP)
    expect(row(model, 2).decorations).toEqual([])
  })

  it('значки стоят в своих клетках: штрих — по центру клетки ряда', () => {
    const model = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP)
    const stitch = row(model, 1).stitches.find((s) => s.p === 0)!
    expect(stitch.line).toEqual({ x1: 28.5, x2: 28.5, y1: 18.2, y2: 18.8 })
  })

  it('жирные линии — от правого края', () => {
    expect(chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP).guideLines).toEqual([25, 20, 15, 10, 5])
  })
})

describe('модель схемы: размеры и линейка (§7)', () => {
  it('без плотности — линейки нет, полоса номеров узкая', () => {
    const model = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP)
    expect(model.centimetres).toBeNull()
    expect(model.gridWidthPx).toBe(660)
    expect(model.pixelHeight).toBe(418)
    expect(model.labelWidthPx).toBe(42)
    expect(model.pixelWidth).toBe(702)
  })

  it('с плотностью засечки уже развёрнуты в координаты SVG: вдоль от низа, поперёк от правого края', () => {
    const model = chartModel(defaultWithEdge(1), GAUGE, DEFAULT_ZOOM_STEP)
    expect(model.centimetres?.length).toBe('4,75 см')
    // 4 ряда на сантиметр: засечка 1 см — четыре ряда над низом сетки в 19 рядов.
    expect(model.centimetres?.rowTicks).toEqual([
      { cm: 1, y: 15 },
      { cm: 2, y: 11 },
      { cm: 3, y: 7 },
      { cm: 4, y: 3 },
    ])
    const across = model.centimetres!.stitchTicks
    expect(across).toHaveLength(9)
    expect(across[0].cm).toBe(1)
    expect(across[0].x).toBeCloseTo(30 - 3.1, 6)
    // Полоса номеров раздаётся под подписи сантиметров.
    expect(model.labelWidthPx).toBe(79)
    expect(model.rulerBandPx).toBe(24)
  })

  it('масштаб меняет пиксели, а координаты в клетках остаются', () => {
    const big = chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP + 1)
    expect(big.cellSize).toBe(30)
    expect(big.gridWidthPx).toBe(900)
    expect(row(big, 1).y).toBe(18)
  })

  it('на краях набора соответствующая кнопка масштаба заглушена', () => {
    expect(chartModel(defaultWithEdge(1), null, 0).zoom).toEqual({ canZoomOut: false, canZoomIn: true })
    expect(chartModel(defaultWithEdge(1), null, DEFAULT_ZOOM_STEP).zoom).toEqual({
      canZoomOut: true,
      canZoomIn: true,
    })
    expect(chartModel(defaultWithEdge(1), null, 99).zoom).toEqual({ canZoomOut: true, canZoomIn: false })
  })
})

describe('решение по колесу (§7)', () => {
  const wheel = (patch: Partial<Parameters<typeof wheelAction>[0]>) =>
    wheelAction({ ctrlKey: false, shiftKey: false, deltaX: 0, deltaY: 0, ...patch })

  it('ctrl — масштаб: колесо от себя крупнее, на себя мельче', () => {
    expect(wheel({ ctrlKey: true, deltaY: -100 })).toEqual({ kind: 'zoom', delta: 1 })
    expect(wheel({ ctrlKey: true, deltaY: 100 })).toEqual({ kind: 'zoom', delta: -1 })
  })

  it('ctrl побеждает горизонталь: щипок тачпада идёт тем же событием', () => {
    expect(wheel({ ctrlKey: true, deltaX: 200, deltaY: 5 })).toEqual({ kind: 'zoom', delta: -1 })
  })

  it('горизонтальное колесо прокручивает по преобладающей оси', () => {
    expect(wheel({ deltaX: 40, deltaY: 10 })).toEqual({ kind: 'scroll', delta: 40 })
  })

  it('вертикальное колесо со shift прокручивает вбок', () => {
    expect(wheel({ shiftKey: true, deltaY: 30 })).toEqual({ kind: 'scroll', delta: 30 })
  })

  it('вертикальное колесо без shift схему не трогает — листается страница', () => {
    expect(wheel({ deltaY: 30 })).toEqual({ kind: 'none' })
    expect(wheel({})).toEqual({ kind: 'none' })
  })
})

/* -------------------------------------------------------------------------
 * Схема от мыска (§7, §7.1 спеки toe-up): ширина сетки постоянна и равна
 * конечные / 2, «нет петли» там, где петель ещё нет, значки прибавок с наклоном
 * влево в начале половины и вправо в конце.
 * ------------------------------------------------------------------------- */

/** Дефолт toe-up: 24 → 64, кромка 1, через ряд — 32 колонки, 20 рядов, ряд 1 промежуточный. */
function toeUpWithEdge(edge: number) {
  const params: ToeParams = { initial: 24, final: 64, edge, rhythm: { kind: 'preset', name: 'even' } }
  return calculateToe(params, 'toe-up')
}

describe('модель схемы от мыска: раскладка рядов (§7 спеки toe-up)', () => {
  it('сетка шириной конечные / 2: ряд 1 у набора снизу, последний прибавочный сверху', () => {
    const model = chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up')
    expect(model.cols).toBe(32)
    expect(model.rowsCount).toBe(20)
    // Схема хранит ряды развёрнутыми: кончик мыска (последний ряд) сверху.
    expect(model.rows[0].row.n).toBe(20)
    expect(row(model, 1).y).toBe(19)
  })

  it('«нет петли» там, где петель ещё нет: у ряда 1 живых 12 из 32, пусто по краям', () => {
    const model = chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up')
    const first = row(model, 1)
    expect(first.stitches).toHaveLength(12)
    expect(first.cells.filter((c) => c.kind === 'empty').map((c) => c.j)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    ])
  })

  it('каждый прибавочный ряд расширяет живую зону на 2 клетки, промежуточный стоит на месте', () => {
    const model = chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up')
    // Ряд 1 — промежуточный на 24 петлях: живых 12. Ряд 2 — прибавочный на 28: живых
    // 14, из них две клетки несут значки прибавок, штрихов 12.
    expect(row(model, 2).stitches).toHaveLength(12)
    expect(row(model, 2).cells.filter((c) => c.kind !== 'empty')).toHaveLength(14)
    // Промежуточный ряд 3 стоит на 28 петлях: живых 14, значков нет.
    expect(row(model, 3).stitches).toHaveLength(14)
    expect(row(model, 4).stitches).toHaveLength(14)
  })

  it('прибавки с наклоном влево в начале половины и вправо в конце: значки стоят там, где ниже была «нет петли»', () => {
    const model = chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up')
    // Ряд 2 — прибавочный: живая зона 14 клеток с off = 9. Значок в конце половины
    // стоит правее (j меньше), в начале — левее; клетка значка рядом ниже была «нет петли».
    const incs = row(model, 2).decorations
    expect(incs).toEqual([
      expect.objectContaining({ dir: 'right', j: 10, p: 12 }),
      expect.objectContaining({ dir: 'left', j: 21, p: 1 }),
    ])
  })

  it('кромка отсчитывается от краёв живой зоны: при кромке 2 у ряда 1 по две кромочные с краёв', () => {
    const model = chartModel(toeUpWithEdge(2), null, DEFAULT_ZOOM_STEP, 'toe-up')
    const first = row(model, 1)
    expect(first.cells.filter((c) => c.kind === 'edge').map((c) => c.j)).toEqual([10, 11, 20, 21])
    expect(first.stitches.filter((s) => s.edge)).toHaveLength(4)
  })

  it('кромка на арифметику схемы не влияет: значки прибавок за кромкой', () => {
    const model = chartModel(toeUpWithEdge(2), null, DEFAULT_ZOOM_STEP, 'toe-up')
    expect(row(model, 2).decorations).toEqual([
      expect.objectContaining({ dir: 'right', j: 11, p: 11 }),
      expect.objectContaining({ dir: 'left', j: 20, p: 2 }),
    ])
  })

  it('жирные линии — по-прежнему от правого края сетки', () => {
    expect(chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up').guideLines).toEqual([27, 22, 17, 12, 7, 2])
  })

  it('размеры считаются от той же сетки: 32 колонки на дефолтной клетке', () => {
    const model = chartModel(toeUpWithEdge(1), null, DEFAULT_ZOOM_STEP, 'toe-up')
    expect(model.gridWidthPx).toBe(32 * CELL_SIZE)
    expect(model.pixelHeight).toBe(20 * CELL_SIZE)
  })
})

describe('легенда от мыска (§7.2 спеки toe-up)', () => {
  it('значки убавок заменены на значки прибавок, названия описательные', () => {
    const legend = chartLegend('toe-up')
    expect(legend.map((item) => item.key)).toEqual(['stitch', 'edge', 'inc-left', 'inc-right', 'empty', 'note'])
    expect(legend.find((item) => item.key === 'inc-left')?.label).toBe('прибавка из протяжки с наклоном влево')
    expect(legend.find((item) => item.key === 'inc-right')?.label).toBe('прибавка из протяжки с наклоном вправо')
  })

  it('про наклоны сказано, что их можно поменять местами', () => {
    const legend = chartLegend('toe-up')
    expect(legend.find((item) => item.key === 'note')?.label).toContain('наклоны можно поменять местами')
  })

  it('легенда cuff-down не изменилась', () => {
    expect(chartLegend('cuff-down').map((item) => item.key)).toEqual(['stitch', 'edge', 'dec-left', 'dec-right', 'empty'])
  })
})
