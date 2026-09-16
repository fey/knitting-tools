<script setup lang="ts">
/**
 * Схема мыска — настоящая вязальная схема с условными обозначениями (§7), первый блок
 * на экране. Декларативный SVG: `v-for` по рядам и клеткам, пересчёт реактивностью (§11).
 *
 * Ряд 1 — внизу, кончик мыска — сверху, поэтому ряды обходятся развёрнутым массивом.
 * Петли читаются справа налево (круговое вязание): `p` — порядковый номер живой петли
 * от начала половины, то есть от правого края. Перепутать сторону значило бы зеркально
 * отразить всю схему — ловит это только скриншот, поэтому геометрия и её отсчёт
 * зафиксированы константами в `core/constants.ts`, а не пересчитаны здесь на глаз.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import type { Row } from '../core/types'
import {
  CELL_SIZE,
  CHART_COLORS,
  CHART_LABEL_WIDTH,
  CHART_STROKE,
  CHART_VIEWPORT_HEIGHT,
  chartGuideLines,
  stitchLinePoints,
  trianglePoints,
} from '../core/constants'

const { calculation } = useToeCalculator()

/** Ширина сетки постоянна и равна половине начальных петель (§7), сетка не сужается. */
const cols = computed(() => calculation.value.initial / 2)
const edge = computed(() => calculation.value.edge)

/** Кончик мыска сверху — ряды идут развёрнутым массивом, индекс и есть `y`. */
const displayRows = computed(() => calculation.value.rows.slice().reverse())
const rowsCount = computed(() => displayRows.value.length)

const viewWidth = computed(() => cols.value + CHART_LABEL_WIDTH)
const viewHeight = computed(() => rowsCount.value)
const pixelWidth = computed(() => Math.round(viewWidth.value * CELL_SIZE))
const pixelHeight = computed(() => Math.round(viewHeight.value * CELL_SIZE))

const guideLines = computed(() => chartGuideLines(cols.value))

type Cell = { j: number; fill: string; stroke: string; strokeWidth: number; empty: boolean }
type Stitch = { j: number; p: number; edge: boolean; line: ReturnType<typeof stitchLinePoints> }
type Decoration = { j: number; p: number; dir: 'left' | 'right'; points: string }
type RowLayer = { row: Row; y: number; cells: Cell[]; stitches: Stitch[]; decorations: Decoration[] }

/**
 * Раскладывает один ряд на клетки, штрихи и треугольники. Перенос тела из
 * `prototypes/toe-visualization.html` (`renderD`, chart.md §2) с единственной правкой
 * задачи: жирные линии считаются от правого края (в `chartGuideLines`, не здесь).
 */
function buildRowLayer(row: Row, y: number, colsN: number, edgeN: number): RowLayer {
  const active = row.stitches / 2
  // active = cols − 2r всегда чётно-выравнено с cols той же чётности, off — целое.
  const off = (colsN - active) / 2

  const cells: Cell[] = []
  const stitches: Stitch[] = []
  const decorations: Decoration[] = []

  for (let j = 0; j < colsN; j++) {
    const inside = j >= off && j < off + active
    if (!inside) {
      cells.push({
        j,
        fill: CHART_COLORS.emptyCell,
        stroke: CHART_COLORS.emptyCellStroke,
        strokeWidth: CHART_STROKE.emptyCell,
        empty: true,
      })
      continue
    }

    // Номер живой петли от начала половины — то есть от правого края (§7, круговое чтение).
    const p = off + active - 1 - j
    const isEdge = p < edgeN || p >= active - edgeN
    const decStart = row.type === 'dec' && p === edgeN
    // decStart/decEnd никогда не совпадают: minFinalStitches = 4 + 4×кромка держит
    // active − 1 − edge ≥ edge + 1.
    const decEnd = row.type === 'dec' && p === active - 1 - edgeN

    cells.push({
      j,
      fill: isEdge ? CHART_COLORS.edgeCell : CHART_COLORS.cell,
      stroke: CHART_COLORS.cellStroke,
      strokeWidth: CHART_STROKE.cell,
      empty: false,
    })

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

const grid = computed(() =>
  displayRows.value.map((row, i) => buildRowLayer(row, i, cols.value, edge.value)),
)

const finalReal = computed(() => calculation.value.finalReal)
const initial = computed(() => calculation.value.initial)

type LegendItem = {
  key: string
  label: string
  box: string
  kind: 'stitch' | 'dec' | 'none'
  dir: 'left' | 'right' | null
}

// Ряд легенды — единственное место, где названы типы убавок (§7.2); значка кромочной
// (точка в центре) здесь нет — он означает другое (§2).
const legend: LegendItem[] = [
  { key: 'stitch', label: 'лицевая', box: CHART_COLORS.cell, kind: 'stitch', dir: null },
  {
    key: 'edge',
    label: 'петля кромки, тоже лицевая',
    box: CHART_COLORS.edgeCell,
    kind: 'stitch',
    dir: null,
  },
  {
    key: 'dec-left',
    label: '2 вместе лицевой с наклоном влево (протяжка)',
    box: CHART_COLORS.cell,
    kind: 'dec',
    dir: 'left',
  },
  {
    key: 'dec-right',
    label: '2 вместе лицевой с наклоном вправо',
    box: CHART_COLORS.cell,
    kind: 'dec',
    dir: 'right',
  },
  { key: 'empty', label: 'нет петли', box: CHART_COLORS.emptyCell, kind: 'none', dir: null },
]
const LEGEND_BOX = 14

// Горизонтальная прокрутка при открытии стоит на правом краю — там начало ряда (§7).
// Перетаскивание мышью и shift+колесо переносятся из `wireChartScroll` (chart.md §6).
const scrollEl = ref<HTMLDivElement | null>(null)
let dragging = false
let startX = 0
let startLeft = 0

function onPointerDown(e: PointerEvent) {
  const el = scrollEl.value
  if (!el) return
  dragging = true
  startX = e.clientX
  startLeft = el.scrollLeft
  el.classList.add('dragging')
  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    // Захват указателя недоступен (напр. в тестовом окружении) — перетаскивание просто не сработает.
  }
}

function onPointerMove(e: PointerEvent) {
  const el = scrollEl.value
  if (!dragging || !el) return
  el.scrollLeft = startLeft - (e.clientX - startX)
  e.preventDefault()
}

function stopDragging() {
  dragging = false
  scrollEl.value?.classList.remove('dragging')
}

function onWheel(e: WheelEvent) {
  const el = scrollEl.value
  if (!el) return
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
  if (!delta) return
  el.scrollLeft += delta
  e.preventDefault()
}

onMounted(() => {
  const el = scrollEl.value
  if (!el) return
  el.scrollLeft = el.scrollWidth
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', stopDragging)
  el.addEventListener('pointercancel', stopDragging)
  el.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  const el = scrollEl.value
  if (!el) return
  el.removeEventListener('pointerdown', onPointerDown)
  el.removeEventListener('pointermove', onPointerMove)
  el.removeEventListener('pointerup', stopDragging)
  el.removeEventListener('pointercancel', stopDragging)
  el.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <section class="rounded border border-slate-200 p-3" data-testid="toe-chart">
    <p class="text-sm text-slate-600" data-testid="toe-chart-caption-top">
      ↑ {{ finalReal }} петель на трикотажный шов
    </p>

    <!-- Обёртка со `position: relative` — докует шторку прогресса (тикет #9), сама схема её не рисует. -->
    <div class="relative mt-2" data-testid="toe-chart-box">
      <div
        ref="scrollEl"
        class="chartscroll overflow-auto rounded border border-slate-200"
        :style="{ height: `${CHART_VIEWPORT_HEIGHT}px` }"
        data-testid="toe-chart-scroll"
      >
        <svg
          :viewBox="`0 0 ${viewWidth} ${viewHeight}`"
          :width="pixelWidth"
          :height="pixelHeight"
          style="display: block"
          data-testid="toe-chart-svg"
        >
          <template v-for="layer in grid" :key="layer.row.n">
            <rect
              v-for="cell in layer.cells"
              :key="`cell-${layer.row.n}-${cell.j}`"
              :x="cell.j"
              :y="layer.y"
              width="1"
              height="1"
              :fill="cell.fill"
              :stroke="cell.stroke"
              :stroke-width="cell.strokeWidth"
              :data-row="layer.row.n"
              :data-col="cell.j"
              :data-empty="cell.empty ? '' : null"
            />
            <line
              v-for="stitch in layer.stitches"
              :key="`stitch-${layer.row.n}-${stitch.j}`"
              :x1="stitch.line.x1"
              :y1="stitch.line.y1"
              :x2="stitch.line.x2"
              :y2="stitch.line.y2"
              :stroke="CHART_COLORS.stitchStroke"
              :stroke-width="CHART_STROKE.stitch"
              stroke-linecap="round"
              :data-row="layer.row.n"
              :data-col="stitch.j"
              :data-stitch="stitch.p"
              data-symbol="stitch"
            />
            <polygon
              v-for="dec in layer.decorations"
              :key="`dec-${layer.row.n}-${dec.j}`"
              :points="dec.points"
              :fill="CHART_COLORS.decorFill"
              :data-row="layer.row.n"
              :data-col="dec.j"
              :data-stitch="dec.p"
              :data-symbol="`dec-${dec.dir}`"
            />
            <text
              :x="cols + 0.35"
              :y="layer.y + 0.7"
              font-size="0.55"
              :fill="layer.row.type === 'dec' ? CHART_COLORS.decRowLabel : CHART_COLORS.plainRowLabel"
              :font-weight="layer.row.type === 'dec' ? 600 : 400"
              data-testid="toe-chart-row-label"
              :data-row="layer.row.n"
            >{{ layer.row.n }}</text>
          </template>

          <line
            v-for="x in guideLines"
            :key="`guide-${x}`"
            :x1="x"
            y1="0"
            :x2="x"
            :y2="viewHeight"
            :stroke="CHART_COLORS.guideLine"
            :stroke-width="CHART_STROKE.guideLine"
            data-testid="toe-chart-guide"
            :data-x="x"
          />
          <rect
            x="0"
            y="0"
            :width="cols"
            :height="viewHeight"
            fill="none"
            :stroke="CHART_COLORS.guideLine"
            :stroke-width="CHART_STROKE.gridBorder"
          />
        </svg>
      </div>
    </div>

    <p class="mt-2 text-sm text-slate-600" data-testid="toe-chart-caption-bottom">
      Начало мыска, {{ initial }} петель. Ряды читаются снизу вверх, петли справа налево.
    </p>

    <div class="mt-3 flex flex-col gap-1 text-sm text-slate-700" data-testid="toe-chart-legend">
      <div v-for="item in legend" :key="item.key" class="flex items-center gap-2">
        <svg :width="LEGEND_BOX" :height="LEGEND_BOX" aria-hidden="true">
          <rect
            x="0.5"
            y="0.5"
            :width="LEGEND_BOX - 1"
            :height="LEGEND_BOX - 1"
            :fill="item.box"
            :stroke="CHART_COLORS.cellStroke"
          />
          <line
            v-if="item.kind === 'stitch'"
            v-bind="stitchLinePoints(0, 0, LEGEND_BOX)"
            :stroke="CHART_COLORS.stitchStroke"
            stroke-width="1.4"
            stroke-linecap="round"
          />
          <polygon
            v-if="item.kind === 'dec'"
            :points="trianglePoints(item.dir!, 0, 0, LEGEND_BOX)"
            :fill="CHART_COLORS.decorFill"
          />
        </svg>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Видимая полоса прокрутки (§7 требует её видимой); цвета — тема прокрутки, не палитра
   клеток из core/constants.ts, поэтому живут здесь литералами (chart.md §6). */
.chartscroll {
  cursor: grab;
  overscroll-behavior-x: contain;
  scrollbar-width: auto;
  scrollbar-color: #b0a89a #e9e5dd;
}
.chartscroll.dragging {
  cursor: grabbing;
}
.chartscroll::-webkit-scrollbar {
  height: 11px;
  width: 11px;
}
.chartscroll::-webkit-scrollbar-track {
  background: #e9e5dd;
  border-radius: 6px;
}
.chartscroll::-webkit-scrollbar-thumb {
  background: #b0a89a;
  border-radius: 6px;
}
</style>
