<script setup lang="ts">
/**
 * Схема поворота «чашечкой» (спека пятки §7), над описанием по рядам. Раскладка — в ядре
 * (`core/chart.ts`) под юнит-тестами, здесь только SVG.
 *
 * Ряд 1 — внизу. Сетка в клетках `viewBox`, клетка на экране — 22 px, как дефолт мыска.
 * Схема шире колонки прокручивается вбок и открывается на стороне, где начинается
 * ряд 1: лицевой старт — у правого края, изнаночный — у левого. Схема уже колонки
 * встаёт по центру автополями: при переполнении они обнуляются, и левый край остаётся
 * достижим прокруткой (§7 спеки мыска).
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useHeelCalculator } from '../useHeelCalculator'
import { decreasePoints, slipPoints, turnChart } from '../core/chart'
import { stitchLinePoints } from '../../toe/core/chart'
import { plural } from '../../toe/core/plural'
import {
  CHART_COLORS,
  CHART_STROKE,
  HEEL_CHART_COLORS as C,
  LABEL_FONT,
  LABEL_WIDTH,
  PARTS_HEIGHT,
  TURN_MARK_WIDTH,
} from './chartStyle'
import { LEGEND_CELL_SIZE } from '../../toe/components/chartStyle'

const CELL = 22

const { params, heel, turn } = useHeelCalculator()

const chart = computed(() => turnChart(turn.value, heel.value, params.center))
const viewWidth = computed(() => chart.value.cols + LABEL_WIDTH)
/**
 * Номера рядов стоят на стороне, где начинается ряд 1: туда схема и открывается, и номер
 * виден сразу. При изнаночном старте полоса номеров слева — `viewBox` начинается левее сетки.
 */
const labelsLeft = computed(() => params.firstSide === 'ws')
const viewX = computed(() => (labelsLeft.value ? -LABEL_WIDTH : 0))
const labelX = computed(() => (labelsLeft.value ? -0.3 : chart.value.cols + 0.3))
const viewHeight = computed(() => chart.value.rows.length + PARTS_HEIGHT)
const partsY = computed(() => chart.value.rows.length)

function cellFill(kind: string, side: string): string {
  if (kind === 'idle') return 'url(#heel-idle)'
  return side === 'ws' ? C.wsCell : CHART_COLORS.cell
}

function rowLabel(n: number, side: string): string {
  return `${n} ${side === 'rs' ? 'лиц. ←' : 'изн. →'}`
}

/** «18 петель», «21 петля», «32 петли». */
function stitchesWord(n: number): string {
  return `${n} ${plural(n, 'петля', 'петли', 'петель')}`
}

const scrollEl = ref<HTMLDivElement | null>(null)

/**
 * Прокрутка к началу ряда 1 — на открытии, на смене стороны и на смене петель пятки:
 * у схемы новая ширина, и прежний `scrollLeft` увёл бы начало ряда за рамку.
 * Центральная часть ширину не меняет и прокрутку не трогает.
 */
function scrollToRowStart(): void {
  const el = scrollEl.value
  if (el) el.scrollLeft = params.firstSide === 'rs' ? el.scrollWidth : 0
}

onMounted(scrollToRowStart)
watch(
  () => [params.firstSide, heel.value],
  () => void nextTick(scrollToRowStart),
)

const L = LEGEND_CELL_SIZE
</script>

<template>
  <section class="flex min-w-0 flex-col gap-2" data-testid="turn-chart">
    <h2 class="text-base font-semibold">Схема поворота</h2>
    <p class="text-sm text-slate-600" data-testid="turn-chart-top">
      Вверху: {{ stitchesWord(turn.left) }} на спице после поворота
    </p>

    <div ref="scrollEl" class="overflow-x-auto rounded border border-slate-200 py-2" data-testid="turn-chart-scroll">
      <svg
        class="mx-auto block"
        :width="viewWidth * CELL"
        :height="viewHeight * CELL"
        :viewBox="`${viewX} 0 ${viewWidth} ${viewHeight}`"
        role="img"
        aria-label="Схема поворота пятки"
        data-testid="turn-chart-svg"
      >
        <defs>
          <pattern id="heel-idle" width="0.3" height="0.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="0.3" height="0.3" :fill="C.idleCell" />
            <line x1="0" y1="0" x2="0" y2="0.3" :stroke="C.idleHatch" stroke-width="0.1" />
          </pattern>
        </defs>

        <g v-for="row in chart.rows" :key="row.n" :data-row="row.n" :data-side="row.side" data-testid="turn-chart-row">
          <template v-for="s in row.stitches" :key="s.x">
            <rect
              :x="s.x"
              :y="row.y"
              width="1"
              height="1"
              :fill="cellFill(s.kind, row.side)"
              :stroke="CHART_COLORS.cellStroke"
              :stroke-width="CHART_STROKE.cell"
              :data-kind="s.kind"
            />
            <line
              v-if="s.kind === 'knit'"
              v-bind="stitchLinePoints(s.x, row.y)"
              :stroke="CHART_COLORS.stitchStroke"
              :stroke-width="CHART_STROKE.stitch"
              stroke-linecap="round"
            />
            <polyline
              v-else-if="s.kind === 'slip'"
              :points="slipPoints(s.x, row.y)"
              fill="none"
              :stroke="CHART_COLORS.stitchStroke"
              :stroke-width="CHART_STROKE.stitch"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </template>
          <rect
            :x="row.decrease.x"
            :y="row.y"
            width="2"
            height="1"
            :fill="cellFill('knit', row.side)"
            :stroke="CHART_COLORS.cellStroke"
            :stroke-width="CHART_STROKE.cell"
            :data-kind="row.decrease.kind"
            data-testid="turn-chart-decrease"
          />
          <polygon :points="decreasePoints(row.decrease.kind, row.decrease.x, row.y)" :fill="CHART_COLORS.decorFill" />
          <rect
            v-if="row.turnX !== null"
            :x="row.turnX - TURN_MARK_WIDTH / 2"
            :y="row.y + 0.05"
            :width="TURN_MARK_WIDTH"
            height="0.9"
            :fill="C.accent"
            data-testid="turn-chart-turn"
          />
          <text
            :x="labelX"
            :y="row.y + 0.68"
            :text-anchor="labelsLeft ? 'end' : 'start'"
            :font-size="LABEL_FONT"
            :fill="row.side === 'ws' ? C.wsLabel : CHART_COLORS.decRowLabel"
            font-variant-numeric="tabular-nums"
            data-testid="turn-chart-label"
          >
            {{ rowLabel(row.n, row.side) }}
          </text>
        </g>

        <g data-testid="turn-chart-parts">
          <template v-for="part in chart.parts" :key="part.x">
            <path
              :d="`M${part.x + 0.1} ${partsY + 0.1} V${partsY + 0.35} H${part.x + part.width - 0.1} V${partsY + 0.1}`"
              fill="none"
              :stroke="part.center ? C.accent : C.muted"
              stroke-width="0.07"
            />
            <text
              :x="part.x + part.width / 2"
              :y="partsY + 1.05"
              :font-size="LABEL_FONT"
              text-anchor="middle"
              :fill="part.center ? C.accent : C.muted"
              :font-weight="part.center ? 600 : 400"
            >
              {{ part.width }}
            </text>
          </template>
        </g>
      </svg>
    </div>

    <p class="text-sm text-slate-600" data-testid="turn-chart-bottom">
      Внизу: {{ stitchesWord(heel) }} пятки. Под рядом 1 — деление: боковая · центр · боковая
    </p>

    <ul class="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm min-[480px]:grid-cols-2" data-testid="turn-chart-legend">
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect width="1" height="1" :fill="CHART_COLORS.cell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
          <line v-bind="stitchLinePoints(0, 0)" :stroke="CHART_COLORS.stitchStroke" :stroke-width="CHART_STROKE.stitch" />
        </svg>
        лицевая; на изнаночном ряду — изнаночная
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect width="1" height="1" :fill="CHART_COLORS.cell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
          <polyline :points="slipPoints(0, 0)" fill="none" :stroke="CHART_COLORS.stitchStroke" :stroke-width="CHART_STROKE.stitch" />
        </svg>
        снять петлю, не провязывая
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L * 2" :height="L" viewBox="0 0 2 1" aria-hidden="true" class="shrink-0">
          <rect width="2" height="1" :fill="CHART_COLORS.cell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
          <polygon :points="decreasePoints('ssk', 0, 0)" :fill="CHART_COLORS.decorFill" />
        </svg>
        протяжка: 2 петли вместе с наклоном влево
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L * 2" :height="L" viewBox="0 0 2 1" aria-hidden="true" class="shrink-0">
          <rect width="2" height="1" :fill="C.wsCell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
          <polygon :points="decreasePoints('p2tog', 0, 0)" :fill="CHART_COLORS.decorFill" />
        </svg>
        2 вместе изнаночной
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect width="1" height="1" fill="url(#heel-idle)" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
        </svg>
        петля на спице, в этом ряду не вяжется
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect :x="0.5 - TURN_MARK_WIDTH" y="0" :width="TURN_MARK_WIDTH * 2" height="1" :fill="C.accent" />
        </svg>
        здесь повернуть работу
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect width="1" height="1" :fill="CHART_COLORS.cell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
        </svg>
        лицевой ряд: читается справа налево ←
      </li>
      <li class="flex items-center gap-2">
        <svg :width="L" :height="L" viewBox="0 0 1 1" aria-hidden="true" class="shrink-0">
          <rect width="1" height="1" :fill="C.wsCell" :stroke="CHART_COLORS.cellStroke" :stroke-width="CHART_STROKE.cell * 2" />
        </svg>
        изнаночный ряд: читается слева направо →
      </li>
    </ul>
  </section>
</template>
