/**
 * Раскладка схемы поворота «чашечкой» (спека пятки §7). Ядро — чистый TypeScript:
 * импортов из Vue здесь нет и быть не должно.
 *
 * **Схема строится из `Turn`, а не из своей симуляции**: те же `slip`, `plain`,
 * `after` и сторона, что у описания по рядам, поэтому разойтись с ним она не может.
 * Отсюда только положение петель: где ряд начинается и где поворачивает.
 *
 * Схема — вид с лицевой стороны. Координаты в клетках: `x` от левого края сетки,
 * `y` от верха, ряд 1 — нижний. Петли на спице считаются от правого края (`r = 0`):
 * лицевой ряд идёт справа налево (`r` растёт), изнаночный — слева направо.
 *
 * В каждом ряду нарисованы только петли, которые к его началу лежат на спице, и ряд
 * стоит по центру сетки: съеденные убавками петли выпадают, сетка сужается к верху.
 * Убавка — одна клетка шириной в две: две петли стали одной, и «нет петли» внутри
 * ряда не нужна.
 */
import { CHART_ICON_BOTTOM, CHART_ICON_INSET, CHART_ICON_TOP } from '../../toe/core/chart'
import type { Decrease, Side, Turn } from './turn'

/** Что в клетке шириной в одну петлю: провязана, снята или ждёт на спице. */
export type StitchKind = 'knit' | 'slip' | 'idle'

export interface ChartStitch {
  x: number
  kind: StitchKind
}

export interface TurnChartRow {
  n: number
  side: Side
  y: number
  /** Левый край ряда: ряд стоит по центру, поэтому сдвиг бывает и в полклетки. */
  x0: number
  /** Петель на спице к началу ряда. */
  width: number
  stitches: ChartStitch[]
  /** Убавка занимает две клетки, с `x` по `x + 2`. */
  decrease: { x: number; kind: Decrease }
  /** Где повернуть работу — граница клеток; у последнего ряда поворота нет. */
  turnX: number | null
}

/** Часть деления под рядом 1: боковая · центр · боковая. */
export interface ChartPart {
  x: number
  width: number
  center: boolean
}

export interface TurnChart {
  /** Ширина сетки — петли пятки, ширина ряда 1. */
  cols: number
  /** Ряды сверху вниз: последний ряд первым, ряд 1 — последним. */
  rows: TurnChartRow[]
  parts: ChartPart[]
}

export function turnChart(turn: Turn, heel: number, center: number): TurnChart {
  const count = turn.rows.length
  const rows: TurnChartRow[] = []
  let width = heel
  let start = turn.rows[0]?.side === 'ws' ? heel - 1 : 0

  for (const row of turn.rows) {
    const dir = row.side === 'rs' ? 1 : -1
    const kinds: StitchKind[] = Array(width).fill('idle')
    let i = start
    if (row.slip) {
      kinds[i] = 'slip'
      i += dir
    }
    for (let k = 0; k < row.plain; k++) {
      kinds[i] = 'knit'
      i += dir
    }
    // Пара убавки: `low` — её петля ближе к правому краю, она и остаётся на спице.
    const low = Math.min(i, i + dir)
    let last = i + dir
    i += 2 * dir
    if (row.after) {
      kinds[i] = 'knit'
      last = i
    }
    if (low < 0 || low + 1 >= width || last < 0 || last >= width) {
      throw new Error(`Ряд ${row.n} выходит за петли на спице`)
    }

    const x0 = (heel - width) / 2
    const xOf = (r: number) => x0 + width - 1 - r
    const stitches: ChartStitch[] = []
    for (let r = 0; r < width; r++) {
      if (r !== low && r !== low + 1) stitches.push({ x: xOf(r), kind: kinds[r] })
    }
    rows.push({
      n: row.n,
      side: row.side,
      y: count - row.n,
      x0,
      width,
      stitches,
      decrease: { x: xOf(low + 1), kind: row.decrease },
      // Лицевой ряд уходит влево — поворот у левой границы последней петли, изнаночный — у правой.
      turnX: row.last ? null : xOf(last) + (dir === 1 ? 0 : 1),
    })

    // Следующий ряд начинается с последней провязанной петли: после убавки её индекс
    // съезжает на одну, если она лежала за парой.
    start = last === low || last === low + 1 ? low : last > low + 1 ? last - 1 : last
    width -= 1
  }

  const sides = turn.sides
  return {
    cols: heel,
    rows: rows.reverse(),
    parts: [
      { x: 0, width: sides, center: false },
      { x: sides, width: center, center: true },
      { x: sides + center, width: sides, center: false },
    ],
  }
}

/**
 * Значки — те же доли клетки, что у мыска (§7.1 спеки мыска): один источник инсетов
 * на обе схемы. `size` — сторона клетки в единицах вызова: `1` для сетки, пиксели для легенды.
 */

/**
 * Убавка во всю ширину своих двух клеток: вертикальный катет со стороны наклона.
 * Протяжка наклонена влево; «2 вм. изн.» с лицевой стороны выглядит наклоном вправо.
 */
export function decreasePoints(kind: Decrease, x: number, y: number, size = 1): string {
  const left = x + CHART_ICON_INSET * size
  const right = x + (2 - CHART_ICON_INSET) * size
  const top = y + CHART_ICON_TOP * size
  const bottom = y + CHART_ICON_BOTTOM * size
  return kind === 'ssk'
    ? `${left},${bottom} ${left},${top} ${right},${bottom}`
    : `${right},${bottom} ${right},${top} ${left},${bottom}`
}

/** Снятая петля — «галочка» вершиной вниз, во всю высоту штриха лицевой. */
export function slipPoints(x: number, y: number, size = 1): string {
  const top = y + CHART_ICON_TOP * size
  const bottom = y + CHART_ICON_BOTTOM * size
  return `${x + 0.28 * size},${top} ${x + 0.5 * size},${bottom} ${x + 0.72 * size},${top}`
}
