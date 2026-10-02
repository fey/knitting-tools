/**
 * Модель схемы мыска (§7): масштаб, геометрия значков и раскладка рядов в координаты
 * SVG. Здесь решается всё, в чём ошибиться проще всего, — нумерация петель справа
 * налево, место каждой убавки, кромка, развороты засечек, — чтобы зеркальную схему
 * ловил юнит-тест, а не только скриншот. Компонент (`ToeChart.vue`) берёт готовую
 * модель и привязывает её к SVG; палитра и толщины — у него (`chartStyle.ts`).
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Row, ToeCalculation } from './types'
import type { Gauge } from './gauge'
import { centimetreView } from './centimetres'

/**
 * Шаги масштаба схемы — сторона клетки в px (§7). Набор, а не непрерывная величина:
 * зум ходит двумя кнопками-лупами, и каждое нажатие обязано быть видно, иначе кнопку
 * жмут вслепую по десять раз.
 *
 * Пол набора — не «влезает в телефон», а «читается»: тикет #3 мерил вписывание схемы
 * в 390 px и получил клетку 13 px с вердиктом «нихуя не видно». Схема в 30 петель
 * в телефон не влезает ни на одном шаге, и это свойство задачи (§7), а не то, что
 * чинится зумом. Потолок — клетка вдвое с лишним от дефолтной: дальше в окно схемы
 * попадает меньше пяти петель, и счёт по жирным линиям разваливается.
 */
export const CHART_CELL_SIZES = [16, 22, 30, 40, 52] as const

/** Шаг, на котором открывается схема, — индекс в `CHART_CELL_SIZES` (§7, клетка 22 px). */
export const DEFAULT_ZOOM_STEP = 1

/**
 * Сторона клетки схемы на дефолтном шаге, px. Схема прокручивается вбок, а не
 * вписывается в ширину экрана; зум эту величину меняет, но открывается схема всегда
 * отсюда — масштаб не хранится ни в hash, ни в `localStorage` (§7, §10.5).
 */
export const CELL_SIZE = CHART_CELL_SIZES[DEFAULT_ZOOM_STEP]

/**
 * Зажим шага масштаба в границы набора. Дробное обрезается: шаг — индекс набора,
 * а не непрерывная величина, и половины шага не существует.
 */
export function clampZoomStep(step: number): number {
  return Math.max(0, Math.min(Math.trunc(step), CHART_CELL_SIZES.length - 1))
}

/** Сторона клетки на данном шаге, px. Шаг вне набора зажимается — иного размера нет. */
export function cellSizeAt(step: number): number {
  return CHART_CELL_SIZES[clampZoomStep(step)]
}

/**
 * Зазор разовой прокрутки к текущему ряду при открытии (§8, тикет #9), px: низ
 * текущего ряда встаёт не вплотную к нижней кромке видимого, а с небольшим
 * запасом — иначе обводка текущего ряда упирается точно в край и режется на
 * не-целочисленных экранных плотностях. Оценка, не замер: §14 отменил абсолютные
 * пиксельные величины прототипов как источник констант, значение переизмеряется
 * на живой вёрстке.
 */
export const CHART_SCROLL_GAP = 16

/**
 * Ширина полосы под номера рядов справа от сетки, **в клетках** (§7). Единица выбрана
 * намеренно: полоса растёт вместе с клеткой на каждом шаге масштаба, и номер остаётся
 * соразмерен ряду, который называет.
 *
 * Правило «подписи вне SVG, чтобы не масштабироваться» — не про неё, а про подписи над
 * и под схемой и про легенду: те живут в HTML и от масштаба не зависят вовсе.
 */
export const CHART_LABEL_WIDTH = 1.9

/**
 * Линейка в сантиметрах (§7, тикет #27), всё **в клетках** — по той же причине, что
 * и полоса номеров: засечки обязаны расти вместе с клеткой на каждом шаге масштаба
 * сами, без пересчёта в компоненте.
 */
/** Прибавка к полосе номеров под подписи сантиметров: засечка и «10 см». */
export const CHART_RULER_LABEL_WIDTH = 1.7
/** Высота полосы линейки под сеткой. */
export const CHART_RULER_BAND_HEIGHT = 1.1
/** Длина засечки. */
export const CHART_RULER_TICK = 0.42
/**
 * Геометрия значков — доли клетки (клетка = 1×1). Общий источник и для сетки схемы,
 * и для значков легенды: `trianglePoints` и координаты штриха принимают размер клетки
 * параметром, поэтому легенда (своя клетка в px) и сетка (клетка 1 в единицах viewBox)
 * читают одни и те же доли, не заводя вторых чисел (§11 «единый источник этих величин»).
 */

/** Отступ вертикального катета убавки от края клетки, доля клетки (§7.1). */
export const CHART_ICON_INSET = 0.22
/** Верх и низ штриха лицевой и вертикального катета убавки, доля клетки. */
export const CHART_ICON_TOP = 0.2
export const CHART_ICON_BOTTOM = 0.8
/** Штрих лицевой стоит по центру клетки, доля клетки. */
export const CHART_STITCH_X = 0.5

/**
 * Точки залитого треугольника убавки в единицах viewBox: вертикальный катет со стороны
 * наклона, гипотенуза — по диагонали клетки (§7.1).
 *
 * `size` — сторона клетки в тех же единицах, что и `x`, `y`: `1` для сетки схемы (клетки
 * viewBox), `14` для значка в легенде. Один источник инсета и высоты катета на оба места.
 */
export function trianglePoints(dir: 'left' | 'right', x: number, y: number, size = 1): string {
  const near = x + CHART_ICON_INSET * size
  const far = x + (1 - CHART_ICON_INSET) * size
  const top = y + CHART_ICON_TOP * size
  const bottom = y + CHART_ICON_BOTTOM * size
  return dir === 'left'
    ? `${near},${bottom} ${near},${top} ${far},${bottom}`
    : `${far},${bottom} ${far},${top} ${near},${bottom}`
}

/**
 * Координаты штриха лицевой (вертикальная линия по центру клетки), в тех же единицах
 * и с тем же параметром `size`, что и `trianglePoints`.
 */
export function stitchLinePoints(x: number, y: number, size = 1) {
  return {
    x1: x + CHART_STITCH_X * size,
    x2: x + CHART_STITCH_X * size,
    y1: y + CHART_ICON_TOP * size,
    y2: y + CHART_ICON_BOTTOM * size,
  }
}

/**
 * Позиции жирных линий счёта каждые 5 петель, в клетках сетки — считая **от правого края**
 * (`cols`), а не от левого (закрывает открытую мелочь прототипа): петли читаются
 * справа налево, начало ряда справа, счёт групп по пять идёт оттуда же. На `cols`, кратных 5,
 * набор позиций совпадает со счётом от левого края; расходится при `cols % 5 !== 0`.
 */
export function chartGuideLines(cols: number): number[] {
  const lines: number[] = []
  for (let x = cols - 5; x > 0; x -= 5) lines.push(x)
  return lines
}

/**
 * Положение кромки шторки прогресса (тикет #9, §8), в px содержимого схемы, считая
 * от верхнего края (кончик мыска): `(totalRows − done) × cellSize`. Отмеченные ряды
 * лежат ниже этой границы — схема перевёрнута, ряд 1 внизу. Формула одна на всё:
 * ей же ставится обводка текущего ряда в SVG (`y = totalRows − done − 1`) и разовая
 * прокрутка страницы при открытии (`pageScrollTargetPx`).
 *
 * `cellSize` — параметр обязательный, а не `CELL_SIZE` по умолчанию: бумага шторки
 * лежит снаружи скроллера и меряется экранными пикселями, поэтому забытый на дефолте
 * вызов не покраснел бы нигде — клетки уехали бы под зумом, а затенение осталось.
 */
export function shutterTopPx(totalRows: number, done: number, cellSize: number): number {
  const clamped = Math.max(0, Math.min(done, totalRows))
  return (totalRows - clamped) * cellSize
}

/**
 * Куда прокрутить **страницу** при открытии, чтобы текущий ряд оказался над плашкой
 * прогресса (§8). Схема кадра больше не имеет и растёт в естественную высоту, поэтому
 * подъезжает страница целиком, а не окно схемы: считать это в компоненте нельзя —
 * тогда правило не проверяется ничем, кроме браузера.
 *
 * `chartContentTopPx` — верх содержимого схемы в координатах документа, `viewportHeight`
 * и `dockHeight` — замеры живой вёрстки: высота плашки зависит от того, сколько строк
 * текста в ней сейчас стоит, и константой быть не может.
 *
 * Низ текущего ряда — та же граница `shutterTopPx`, что и у шторки: одна формула
 * на затенение, обводку и прокрутку.
 */
export function pageScrollTargetPx(
  chartContentTopPx: number,
  totalRows: number,
  done: number,
  viewportHeight: number,
  dockHeight: number,
  cellSize: number,
): number {
  const bottomOfCurrent = chartContentTopPx + shutterTopPx(totalRows, done, cellSize)
  const visibleBottom = viewportHeight - dockHeight - CHART_SCROLL_GAP
  return Math.max(0, Math.round(bottomOfCurrent - visibleBottom))
}

/** Что в клетке: обычная петля, петля кромки или «нет петли» (§7.1). Цвет — у отрисовки. */
export type CellKind = 'plain' | 'edge' | 'empty'

export type ChartCell = { j: number; kind: CellKind }
/** Лицевая: `p` — номер живой петли от начала половины, то есть от правого края. */
export type ChartStitch = { j: number; p: number; edge: boolean; line: ReturnType<typeof stitchLinePoints> }
export type ChartDecoration = { j: number; p: number; dir: 'left' | 'right'; points: string }
export type ChartRow = {
  row: Row
  /** Строка в развёрнутой сетке: кончик мыска сверху, ряд 1 — нижний. */
  y: number
  cells: ChartCell[]
  stitches: ChartStitch[]
  decorations: ChartDecoration[]
}

/**
 * Раскладывает один ряд на клетки, штрихи и треугольники. Перенос тела из
 * `prototypes/toe-visualization.html` (`renderD`) с единственной правкой
 * задачи: жирные линии считаются от правого края (в `chartGuideLines`, не здесь).
 */
function layoutRow(row: Row, y: number, cols: number, edge: number): ChartRow {
  const active = row.stitches / 2
  // active = cols − 2r всегда чётно-выравнено с cols той же чётности, off — целое.
  const off = (cols - active) / 2

  const cells: ChartCell[] = []
  const stitches: ChartStitch[] = []
  const decorations: ChartDecoration[] = []

  for (let j = 0; j < cols; j++) {
    const inside = j >= off && j < off + active
    if (!inside) {
      cells.push({ j, kind: 'empty' })
      continue
    }

    // Номер живой петли от начала половины — то есть от правого края (§7, круговое чтение).
    const p = off + active - 1 - j
    const isEdge = p < edge || p >= active - edge
    const decStart = row.type === 'dec' && p === edge
    // decStart/decEnd никогда не совпадают: minFinalStitches = 4 + 4×кромка держит
    // active − 1 − edge ≥ edge + 1.
    const decEnd = row.type === 'dec' && p === active - 1 - edge

    cells.push({ j, kind: isEdge ? 'edge' : 'plain' })

    if (decStart) {
      decorations.push({ j, p, dir: 'left', points: trianglePoints('left', j, y) })
    } else if (decEnd) {
      decorations.push({ j, p, dir: 'right', points: trianglePoints('right', j, y) })
    } else {
      // Лицевая — вертикальный штрих; пустая клетка означала бы изнаночную (§7.1).
      stitches.push({ j, p, edge: isEdge, line: stitchLinePoints(j, y) })
    }
  }

  return { row, y, cells, stitches, decorations }
}

export type ChartModel = {
  /** Ширина сетки в клетках — половина начальных петель, постоянна (§7). */
  cols: number
  /** Высота сетки в клетках — она же высота `viewBox`. */
  rowsCount: number
  /** Ряды кончиком вверх: индекс и есть `y`. */
  rows: ChartRow[]
  guideLines: number[]
  /** Ширина полосы номеров в клетках: с линейкой она шире (§7). */
  labelWidth: number
  cellSize: number
  gridWidthPx: number
  labelWidthPx: number
  /** Вся схема поперёк — сетка плюс полоса номеров; по ней меряется бумага шторки. */
  pixelWidth: number
  pixelHeight: number
  rulerBandPx: number
  zoom: { canZoomOut: boolean; canZoomIn: boolean }
  /**
   * Сантиметры — только с вписанной плотностью (§7, тикет #27). Засечки уже в координатах
   * SVG: вдоль — `y` от верха сетки, отсчёт снизу, от ряда 1; поперёк — `x` от левого
   * края, отсчёт справа, откуда читается ряд.
   */
  centimetres: {
    length: string
    rowTicks: { cm: number; y: number }[]
    stitchTicks: { cm: number; x: number }[]
  } | null
}

/**
 * Модель схемы на данном расчёте, плотности и шаге масштаба (§7). Координаты — в клетках
 * (`viewBox`), размеры — в пикселях: масштаб меняет только вторые, поэтому сетка, значки
 * и номера растут сами.
 */
export function chartModel(
  calculation: Pick<ToeCalculation, 'rows' | 'initial' | 'edge' | 'totalRows'>,
  gauge: Gauge | null,
  zoomStep: number,
): ChartModel {
  const cols = calculation.initial / 2
  // Кончик мыска сверху — ряды идут развёрнутым массивом, индекс и есть `y`.
  const rows = calculation.rows
    .slice()
    .reverse()
    .map((row, y) => layoutRow(row, y, cols, calculation.edge))
  const rowsCount = rows.length
  const cellSize = cellSizeAt(zoomStep)
  const cm = centimetreView(calculation, gauge).cm

  /**
   * Полоса номеров раздаётся под подписи сантиметров: засечки стоят **в ней**, правее
   * номера. Своей полосой линейка встать не может — прибитых к правому краю окна полос
   * не бывает двух, а на телефоне вторая полоса отъедала бы у сетки больше, чем раздача
   * этой: замер прототипа на 390 px дал 84 px против 79.
   */
  const labelWidth = cm ? CHART_LABEL_WIDTH + CHART_RULER_LABEL_WIDTH : CHART_LABEL_WIDTH
  const gridWidthPx = Math.round(cols * cellSize)
  const labelWidthPx = Math.round(labelWidth * cellSize)
  const step = clampZoomStep(zoomStep)

  return {
    cols,
    rowsCount,
    rows,
    guideLines: chartGuideLines(cols),
    labelWidth,
    cellSize,
    gridWidthPx,
    labelWidthPx,
    pixelWidth: gridWidthPx + labelWidthPx,
    pixelHeight: Math.round(rowsCount * cellSize),
    rulerBandPx: Math.round(CHART_RULER_BAND_HEIGHT * cellSize),
    zoom: { canZoomOut: step > 0, canZoomIn: step < CHART_CELL_SIZES.length - 1 },
    centimetres: cm && {
      length: cm.length,
      rowTicks: cm.rowTicks.map((tick) => ({ cm: tick.cm, y: rowsCount - tick.at })),
      stitchTicks: cm.stitchTicks.map((tick) => ({ cm: tick.cm, x: cols - tick.at })),
    },
  }
}

/** То из события колеса, на что смотрит решение: модификаторы и сдвиг по осям. */
export type WheelInput = { ctrlKey: boolean; shiftKey: boolean; deltaX: number; deltaY: number }

export type WheelAction =
  | { kind: 'zoom'; delta: 1 | -1 }
  | { kind: 'scroll'; delta: number }
  | { kind: 'none' }

/**
 * Что делает колесо над схемой (§7): `ctrl` (и щипок по тачпаду, который браузер шлёт
 * тем же событием) меняет масштаб, shift и горизонтальное колесо — прокручивают вбок
 * по преобладающей оси. Вертикальное колесо без shift схему не трогает: им листают
 * страницу.
 */
export function wheelAction(e: WheelInput): WheelAction {
  if (e.ctrlKey) return { kind: 'zoom', delta: e.deltaY < 0 ? 1 : -1 }
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
  return delta ? { kind: 'scroll', delta } : { kind: 'none' }
}

export type LegendItem = {
  key: string
  label: string
  cell: CellKind
  symbol: 'stitch' | 'dec-left' | 'dec-right' | null
}

/**
 * Легенда схемы — единственное место, где названы типы убавок (§7.2). Значка кромочной
 * (точка в центре) здесь нет — он означает другое (§2).
 */
export const CHART_LEGEND: readonly LegendItem[] = [
  { key: 'stitch', label: 'лицевая', cell: 'plain', symbol: 'stitch' },
  { key: 'edge', label: 'петля кромки, тоже лицевая', cell: 'edge', symbol: 'stitch' },
  {
    key: 'dec-left',
    label: '2 вместе лицевой с наклоном влево (протяжка)',
    cell: 'plain',
    symbol: 'dec-left',
  },
  { key: 'dec-right', label: '2 вместе лицевой с наклоном вправо', cell: 'plain', symbol: 'dec-right' },
  { key: 'empty', label: 'нет петли', cell: 'empty', symbol: null },
]
