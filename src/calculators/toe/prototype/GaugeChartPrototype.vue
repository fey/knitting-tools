<script setup lang="ts">
/**
 * ПРОТОТИП, тикет #27. Копия `ToeChart.vue` с линейкой. Схема, зум, полоса номеров,
 * прокрутка и шторка — хост, вынуты как есть и оценке не подлежат. Предмет — линейка.
 *
 * Выброшено против оригинала как к вопросу не относящееся: разовая прокрутка страницы
 * к текущему ряду при открытии (§8) и легенда.
 *
 * Геометрия линейки. Ряд занимает клетку в высоту, петля — клетку в ширину, но
 * сантиметров в них разное число: `cmPerRow` и `cmPerStitch`. Отсюда разный шаг
 * засечек — это и есть вторая ось вопроса.
 *
 * Отсчёт вертикали идёт **снизу**, от ряда 1: там начало мыска. Отсчёт горизонтали —
 * **справа**, оттуда же читается ряд (§7).
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import type { Row } from '../core/types'
import {
  CHART_CELL_SIZES,
  CHART_COLORS,
  CHART_LABEL_WIDTH,
  CHART_STROKE,
  DEFAULT_ZOOM_STEP,
  cellSizeAt,
  chartGuideLines,
  clampZoomStep,
  shutterTopPx,
  stitchLinePoints,
  trianglePoints,
} from '../core/constants'
import { rowsWord, stitchesWord } from '../core/text'
import { cm, cmPerRow, cmPerStitch, gaugeFilled, variant } from './gauge'

const SHUTTER_ACCENT = '#b4472a'
/** Цвет линейки — предмет прототипа, не палитра §7.1: линейка не обозначение петли. */
const RULER = '#2f6f8f'
/** Ширина полосы линейки в клетках — столько же, сколько у полосы номеров. */
const RULER_WIDTH = 1.7
/** Высота горизонтальной полосы линейки в клетках. */
const RULER_HEIGHT = 1.1

const { calculation, progressRow } = useToeCalculator()

const ZOOM_ICON_SIZE = 24
const ZOOM_LENS = { cx: 10.5, cy: 10.5, r: 6.5, handleFrom: 15.5, handleTo: 21, mark: 3.2, stroke: 2 } as const

const cols = computed(() => calculation.value.initial / 2)
const edge = computed(() => calculation.value.edge)
const displayRows = computed(() => calculation.value.rows.slice().reverse())
const rowsCount = computed(() => displayRows.value.length)

const zoomStep = ref(DEFAULT_ZOOM_STEP)
const cellSize = computed(() => cellSizeAt(zoomStep.value))
const canZoomOut = computed(() => zoomStep.value > 0)
const canZoomIn = computed(() => zoomStep.value < CHART_CELL_SIZES.length - 1)
const zoomButtons = computed(() => [
  { testId: 'proto-zoom-out', label: 'Схема мельче', delta: -1, enabled: canZoomOut.value },
  { testId: 'proto-zoom-in', label: 'Схема крупнее', delta: 1, enabled: canZoomIn.value },
])

const viewHeight = computed(() => rowsCount.value)
const gridWidthPx = computed(() => Math.round(cols.value * cellSize.value))

/** Полоса номеров у B раздаётся под подписи сантиметров, у остальных остаётся прежней. */
const labelWidth = computed(() =>
  variant.value === 'B' && gaugeFilled.value ? CHART_LABEL_WIDTH + RULER_WIDTH : CHART_LABEL_WIDTH,
)
const labelWidthPx = computed(() => Math.round(labelWidth.value * cellSize.value))
/** Своя полоса линейки — у C (засечки) и у D (размерная линия). */
const ownStripOn = computed(() => variant.value === 'C' && gaugeFilled.value)
const dimStripOn = computed(() => variant.value === 'D' && gaugeFilled.value)
const extraStripOn = computed(() => ownStripOn.value || dimStripOn.value)
const ownStripPx = computed(() => Math.round(RULER_WIDTH * cellSize.value))
const pixelWidth = computed(
  () => gridWidthPx.value + labelWidthPx.value + (extraStripOn.value ? ownStripPx.value : 0),
)
/** Двух полос, прибитых к одному краю, быть не может — номера отступают на ширину линейки. */
const labelStickyRightPx = computed(() => (extraStripOn.value ? ownStripPx.value : 0))
const pixelHeight = computed(() => Math.round(viewHeight.value * cellSize.value))
const rulerBandPx = computed(() => Math.round(RULER_HEIGHT * cellSize.value))

const guideLines = computed(() => chartGuideLines(cols.value))

/** Засечки на круглых сантиметрах, снизу вверх от ряда 1. */
const vTicks = computed(() => {
  if (!gaugeFilled.value) return []
  const total = rowsCount.value * cmPerRow.value
  const out: { c: number; y: number }[] = []
  for (let c = 1; c <= Math.floor(total + 1e-9); c++) {
    out.push({ c, y: viewHeight.value - c / cmPerRow.value })
  }
  return out
})

/** Засечки поперёк, справа налево: там начало ряда (§7). */
const hTicks = computed(() => {
  if (!gaugeFilled.value) return []
  const total = cols.value * cmPerStitch.value
  const out: { c: number; x: number }[] = []
  for (let c = 1; c <= Math.floor(total + 1e-9); c++) {
    out.push({ c, x: cols.value - c / cmPerStitch.value })
  }
  return out
})

const totalLengthCm = computed(() => rowsCount.value * cmPerRow.value)
const halfWidthCm = computed(() => cols.value * cmPerStitch.value)

/** Подписи размерной линии варианта D — счёт клеток и его перевод одной фразой. */
const dVertical = computed(() => `${rowsWord(rowsCount.value)} = ${cm(totalLengthCm.value)} см`)
const dHorizontal = computed(
  () => `${stitchesWord(cols.value)} половины = ${cm(halfWidthCm.value)} см`,
)

const rulerOn = computed(() => gaugeFilled.value && variant.value !== 'A')
const ticksOn = computed(() => rulerOn.value && variant.value !== 'D')

type Cell = { j: number; fill: string; stroke: string; strokeWidth: number; empty: boolean }
type Stitch = { j: number; p: number; edge: boolean; line: ReturnType<typeof stitchLinePoints> }
type Decoration = { j: number; p: number; dir: 'left' | 'right'; points: string }
type RowLayer = { row: Row; y: number; cells: Cell[]; stitches: Stitch[]; decorations: Decoration[] }

function buildRowLayer(row: Row, y: number, colsN: number, edgeN: number): RowLayer {
  const active = row.stitches / 2
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
    const p = off + active - 1 - j
    const isEdge = p < edgeN || p >= active - edgeN
    const decStart = row.type === 'dec' && p === edgeN
    const decEnd = row.type === 'dec' && p === active - 1 - edgeN

    cells.push({
      j,
      fill: isEdge ? CHART_COLORS.edgeCell : CHART_COLORS.cell,
      stroke: CHART_COLORS.cellStroke,
      strokeWidth: CHART_STROKE.cell,
      empty: false,
    })

    if (decStart) decorations.push({ j, p, dir: 'left', points: trianglePoints('left', j, y) })
    else if (decEnd) decorations.push({ j, p, dir: 'right', points: trianglePoints('right', j, y) })
    else stitches.push({ j, p, edge: isEdge, line: stitchLinePoints(j, y) })
  }

  return { row, y, cells, stitches, decorations }
}

const grid = computed(() =>
  displayRows.value.map((row, i) => buildRowLayer(row, i, cols.value, edge.value)),
)

const finalReal = computed(() => calculation.value.finalReal)
const initial = computed(() => calculation.value.initial)

/** Строка расчёта у схемы. Длина дописана в неё тикетом #27 — по ней вяжут с убранными ручками. */
const paramsLine = computed(() => {
  const c = calculation.value
  const head = `${c.initial} → ${stitchesWord(c.finalReal)} · кромка ${c.edge} · ${rowsWord(c.totalRows)}`
  return gaugeFilled.value ? `${head} · ${cm(totalLengthCm.value)} см` : head
})

const currentRowY = computed(() => rowsCount.value - progressRow.value - 1)
const hasCurrentRow = computed(() => progressRow.value < rowsCount.value)

const scrollEl = ref<HTMLDivElement | null>(null)
let dragging = false
let startX = 0
let startLeft = 0

function scrollChartToRowStart(): void {
  const el = scrollEl.value
  if (el) el.scrollLeft = el.scrollWidth
}

function zoomBy(delta: number): void {
  const next = clampZoomStep(zoomStep.value + delta)
  if (next === zoomStep.value) return
  zoomStep.value = next
  void nextTick(scrollChartToRowStart)
}

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
    // Захват недоступен — перетаскивание просто не сработает.
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
  if (e.ctrlKey) {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1 : -1)
    return
  }
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
  if (!delta) return
  el.scrollLeft += delta
  e.preventDefault()
}

const shutterPaperTopPx = computed(() =>
  Math.max(
    0,
    Math.min(shutterTopPx(rowsCount.value, progressRow.value, cellSize.value), pixelHeight.value),
  ),
)

onMounted(() => {
  const el = scrollEl.value
  if (!el) return
  scrollChartToRowStart()
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
  <section class="rounded border border-slate-200 p-3" data-testid="proto-chart">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <p class="text-sm text-slate-600">↑ {{ finalReal }} петель на закрытие</p>
        <p class="text-sm tabular-nums text-slate-500" data-testid="proto-params">{{ paramsLine }}</p>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          v-for="button in zoomButtons"
          :key="button.testId"
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded border border-slate-300 text-slate-700 disabled:opacity-40"
          :disabled="!button.enabled"
          :aria-label="button.label"
          :title="button.label"
          @click="zoomBy(button.delta)"
        >
          <svg
            :width="ZOOM_ICON_SIZE"
            :height="ZOOM_ICON_SIZE"
            :viewBox="`0 0 ${ZOOM_ICON_SIZE} ${ZOOM_ICON_SIZE}`"
            fill="none"
            stroke="currentColor"
            :stroke-width="ZOOM_LENS.stroke"
            stroke-linecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle :cx="ZOOM_LENS.cx" :cy="ZOOM_LENS.cy" :r="ZOOM_LENS.r" />
            <line :x1="ZOOM_LENS.handleFrom" :y1="ZOOM_LENS.handleFrom" :x2="ZOOM_LENS.handleTo" :y2="ZOOM_LENS.handleTo" />
            <line :x1="ZOOM_LENS.cx - ZOOM_LENS.mark" :y1="ZOOM_LENS.cy" :x2="ZOOM_LENS.cx + ZOOM_LENS.mark" :y2="ZOOM_LENS.cy" />
            <line v-if="button.delta > 0" :x1="ZOOM_LENS.cx" :y1="ZOOM_LENS.cy - ZOOM_LENS.mark" :x2="ZOOM_LENS.cx" :y2="ZOOM_LENS.cy + ZOOM_LENS.mark" />
          </svg>
        </button>
      </div>
    </div>

    <div class="relative mt-2" data-testid="proto-chart-box">
      <div ref="scrollEl" class="chartscroll overflow-x-auto rounded border border-slate-200">
        <div class="mx-auto w-max">
          <div class="flex">
            <!-- Сетка: хост, как в живой схеме. -->
            <svg
              :viewBox="`0 0 ${cols} ${viewHeight}`"
              :width="gridWidthPx"
              :height="pixelHeight"
              style="display: block"
              data-testid="proto-grid"
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
                />
                <polygon
                  v-for="dec in layer.decorations"
                  :key="`dec-${layer.row.n}-${dec.j}`"
                  :points="dec.points"
                  :fill="CHART_COLORS.decorFill"
                />
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
              />
              <rect x="0" y="0" :width="cols" :height="viewHeight" fill="none" :stroke="CHART_COLORS.guideLine" :stroke-width="CHART_STROKE.gridBorder" />
              <rect v-if="hasCurrentRow" x="0" :y="currentRowY" :width="cols" height="1" fill="none" :stroke="SHUTTER_ACCENT" stroke-width="0.12" />
            </svg>

            <!-- Полоса номеров. У B в неё же подмешаны сантиметры, у остальных она прежняя. -->
            <svg
              class="sticky shrink-0 bg-white"
              :style="{ right: `${labelStickyRightPx}px` }"
              :viewBox="`0 0 ${labelWidth} ${viewHeight}`"
              :width="labelWidthPx"
              :height="pixelHeight"
              style="display: block"
              data-testid="proto-row-labels"
            >
              <line x1="0" y1="0" x2="0" :y2="viewHeight" :stroke="CHART_COLORS.guideLine" :stroke-width="CHART_STROKE.gridBorder" />
              <text
                v-for="layer in grid"
                :key="`label-${layer.row.n}`"
                x="0.35"
                :y="layer.y + 0.7"
                font-size="0.55"
                :fill="layer.row.type === 'dec' ? CHART_COLORS.decRowLabel : CHART_COLORS.plainRowLabel"
                :font-weight="layer.row.type === 'dec' ? 600 : 400"
              >{{ layer.row.n }}</text>

              <!-- B: засечка и подпись правее номера, только на круглых сантиметрах. -->
              <template v-if="variant === 'B' && ticksOn">
                <template v-for="tick in vTicks" :key="`vb-${tick.c}`">
                  <line :x1="CHART_LABEL_WIDTH" :y1="tick.y" :x2="CHART_LABEL_WIDTH + 0.45" :y2="tick.y" :stroke="RULER" stroke-width="0.07" />
                  <text :x="CHART_LABEL_WIDTH + 0.55" :y="tick.y + 0.2" font-size="0.5" :fill="RULER">{{ tick.c }} см</text>
                </template>
              </template>
            </svg>

            <!-- C: линейка своей полосой, за номерами. -->
            <svg
              v-if="ownStripOn"
              class="sticky right-0 shrink-0 bg-sky-50"
              :viewBox="`0 0 ${RULER_WIDTH} ${viewHeight}`"
              :width="ownStripPx"
              :height="pixelHeight"
              style="display: block"
              data-testid="proto-ruler-strip"
            >
              <line x1="0" y1="0" x2="0" :y2="viewHeight" :stroke="RULER" stroke-width="0.06" />
              <template v-for="tick in vTicks" :key="`vc-${tick.c}`">
                <line x1="0" :y1="tick.y" x2="0.4" :y2="tick.y" :stroke="RULER" stroke-width="0.07" />
                <text x="0.5" :y="tick.y + 0.2" font-size="0.5" :fill="RULER">{{ tick.c }} см</text>
              </template>
            </svg>

            <!-- D: размерная линия во всю высоту, без засечек. -->
            <svg
              v-if="dimStripOn"
              class="sticky right-0 shrink-0 bg-white"
              :viewBox="`0 0 ${RULER_WIDTH} ${viewHeight}`"
              :width="ownStripPx"
              :height="pixelHeight"
              style="display: block"
              data-testid="proto-dim-vertical"
            >
              <line x1="0.55" y1="0.12" x2="0.55" :y2="viewHeight - 0.12" :stroke="RULER" stroke-width="0.07" />
              <polygon :points="`0.55,0.02 0.38,0.4 0.72,0.4`" :fill="RULER" />
              <polygon :points="`0.55,${viewHeight - 0.02} 0.38,${viewHeight - 0.4} 0.72,${viewHeight - 0.4}`" :fill="RULER" />
              <text
                :transform="`translate(1.25 ${viewHeight / 2}) rotate(-90)`"
                text-anchor="middle"
                font-size="0.55"
                :fill="RULER"
              >{{ dVertical }}</text>
            </svg>
          </div>

          <!-- Горизонталь стоит под сеткой и едет вместе с ней: полоса номеров прибита
               к краю окна намеренно, а засечка, стоящая на месте, мерила бы пустоту. -->
          <svg
            v-if="rulerOn"
            :viewBox="`0 0 ${cols} ${RULER_HEIGHT}`"
            :width="gridWidthPx"
            :height="rulerBandPx"
            :class="variant === 'C' ? 'block border-t border-sky-300 bg-sky-50' : 'block'"
            data-testid="proto-ruler-bottom"
          >
            <template v-if="ticksOn">
              <line x1="0" y1="0.08" :x2="cols" y2="0.08" :stroke="RULER" stroke-width="0.05" />
              <template v-for="tick in hTicks" :key="`h-${tick.c}`">
                <line :x1="tick.x" y1="0.08" :x2="tick.x" y2="0.42" :stroke="RULER" stroke-width="0.06" />
                <text :x="tick.x" y="0.95" text-anchor="middle" font-size="0.5" :fill="RULER">{{ tick.c }} см</text>
              </template>
            </template>
            <template v-else>
              <line x1="0.12" y1="0.4" :x2="cols - 0.12" y2="0.4" :stroke="RULER" stroke-width="0.06" />
              <polygon points="0.02,0.4 0.4,0.23 0.4,0.57" :fill="RULER" />
              <polygon :points="`${cols - 0.02},0.4 ${cols - 0.4},0.23 ${cols - 0.4},0.57`" :fill="RULER" />
              <text :x="cols / 2" y="1.0" text-anchor="middle" font-size="0.5" :fill="RULER">{{ dHorizontal }}</text>
            </template>
          </svg>
        </div>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 mx-auto bg-slate-900/30"
        :style="{
          top: `${shutterPaperTopPx}px`,
          bottom: `${rulerOn ? rulerBandPx : 0}px`,
          width: `min(${pixelWidth}px, 100%)`,
        }"
      />
    </div>

    <p class="mt-2 text-sm text-slate-600">
      Начало мыска, {{ initial }} петель. Ряды читаются снизу вверх, петли справа налево.
    </p>
  </section>
</template>

<style scoped>
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
