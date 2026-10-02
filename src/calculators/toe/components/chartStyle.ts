/**
 * Палитра и толщины схемы мыска (§7.1) — то, чем модель схемы рисуется. Лежат рядом
 * с отрисовкой, а не в `core/`: модель (`core/chart.ts`) говорит, **что** в клетке —
 * пустая, кромка, обычная петля, — а цвет и толщину подставляет компонент.
 *
 * Все величины, кроме `LEGEND_CELL_SIZE`, — в долях клетки: схема живёт в единицах
 * `viewBox`, и линии растут вместе с клеткой на каждом шаге масштаба сами.
 */
import type { CellKind } from '../core/chart'

/** Толщины линий, доли клетки (§7.1). */
export const CHART_STROKE = {
  /** Штрих лицевой. */
  stitch: 0.09,
  /** Обводка обычной клетки (в т.ч. кромки). */
  cell: 0.04,
  /** Обводка клетки «нет петли». */
  emptyCell: 0.03,
  /** Жирные линии каждые 5 петель. */
  guideLine: 0.07,
  /** Рамка сетки. */
  gridBorder: 0.09,
} as const

/** Палитра «Вязаный.рф» (§7.1). */
export const CHART_COLORS = {
  /** Штрих лицевой. */
  stitchStroke: '#4a453d',
  /** Заливка треугольников убавки и номера убавочного ряда. */
  decorFill: '#1c1a17',
  /** Клетка, обычная петля. */
  cell: '#fff',
  /** Клетка, петля кромки — тонирована, но несёт тот же штрих лицевой. */
  edgeCell: '#f7f4ee',
  /** Клетка «нет петли». */
  emptyCell: '#e4dfd5',
  /** Обводка клетки «нет петли». */
  emptyCellStroke: '#d5cec2',
  /** Обводка обычной клетки. */
  cellStroke: '#c9c2b6',
  /** Жирные линии каждые 5 петель и рамка сетки. */
  guideLine: '#8f887c',
  /** Номер убавочного ряда. */
  decRowLabel: '#1c1a17',
  /** Номер промежуточного ряда. */
  plainRowLabel: '#9a948a',
} as const

/** Как рисуется клетка каждого смысла: заливка, обводка и её толщина. */
export const CELL_STYLE: Record<CellKind, { fill: string; stroke: string; strokeWidth: number }> = {
  plain: { fill: CHART_COLORS.cell, stroke: CHART_COLORS.cellStroke, strokeWidth: CHART_STROKE.cell },
  edge: { fill: CHART_COLORS.edgeCell, stroke: CHART_COLORS.cellStroke, strokeWidth: CHART_STROKE.cell },
  empty: {
    fill: CHART_COLORS.emptyCell,
    stroke: CHART_COLORS.emptyCellStroke,
    strokeWidth: CHART_STROKE.emptyCell,
  },
}

/** Кегль подписи сантиметров, доля клетки, — тот же, что у номера ряда. */
export const CHART_RULER_FONT = 0.5

/**
 * Цвет линейки. В палитру §7.1 не входит намеренно: «Вязаный.рф» — это цвета условных
 * обозначений, а линейка обозначением не является и обязана от них отличаться, иначе
 * засечка читается значком.
 */
export const CHART_RULER_COLOR = '#2f6f8f'

/**
 * Сторона клетки значка в легенде, px. Легенда за масштабом не тянется — подписи
 * вне SVG (§7), — поэтому размер у неё свой и в пикселях.
 */
export const LEGEND_CELL_SIZE = 14
