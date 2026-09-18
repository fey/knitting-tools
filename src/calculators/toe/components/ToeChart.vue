<script setup lang="ts">
/**
 * Схема мыска — настоящая вязальная схема с условными обозначениями (§7). Стоит под
 * ручками расчёта (§6): первым идёт текст вводки, потом петли и ритм, и только затем
 * схема — по ней уже вяжут. Декларативный SVG: `v-for` по рядам и клеткам, пересчёт
 * реактивностью (§11).
 *
 * Ряд 1 — внизу, кончик мыска — сверху, поэтому ряды обходятся развёрнутым массивом.
 * Петли читаются справа налево (круговое вязание): `p` — порядковый номер живой петли
 * от начала половины, то есть от правого края. Перепутать сторону значило бы зеркально
 * отразить всю схему — ловит это только скриншот, поэтому геометрия и её отсчёт
 * зафиксированы константами в `core/constants.ts`, а не пересчитаны здесь на глаз.
 *
 * **Масштаб (§7)** — шаг из `CHART_CELL_SIZES`, дефолт 22 px. Меняются только атрибуты
 * `width`/`height` у SVG: `viewBox` остаётся в клетках, поэтому сетка, значки, номера
 * рядов и обводка текущего ряда растут сами, править внутри SVG нечего. Легенда живёт
 * на своём `LEGEND_CELL_SIZE` и за сеткой не тянется — подписи вне SVG (§7).
 *
 * Масштаб — состояние экрана, а не расчёта: в hash не попадает (§10.5) и в `localStorage`
 * не хранится, схема открывается на дефолтном шаге всегда.
 *
 * **Подпись над схемой несёт числа расчёта** (§7) — «60 → 20 петель · кромка 1 · 19 рядов».
 * Ручки прячутся кнопкой (§6.2), и схема обязана сама сказать, что на ней нарисовано.
 *
 * **Схема уже окна встаёт по центру** (§7) — автополями на дорожке, а не `justify-content`:
 * у флексбокса центрированное содержимое, переросшее контейнер, вылезает в обе стороны,
 * и левый край становится недостижим прокруткой. Автополя при переполнении честно обнуляются.
 *
 * **Номера рядов прибиты к правому краю окна и вбок не едут** (§7). Ради этого схема
 * разрезана на два SVG — сетку и полосу номеров — внутри одной флекс-дорожки: полоса
 * стоит `position: sticky` с `right: 0`, то есть на месте, пока схема прокручена вправо,
 * и прилипает к краю окна, когда сетку увели влево. Подпись обязана быть непрозрачной:
 * сетка проезжает **под** ней. Одним SVG это не делается — `sticky` на узлы внутри SVG
 * не действует, а держать номера скриптом значило бы гонять их на каждый кадр прокрутки.
 *
 * **Шторка прогресса (тикет #9, §8)** несёт два слоя, и путать их нельзя (перенос
 * из `prototypes/row-progress.html`, вариант E):
 * - контур текущего ряда рисует сама сетка — обычный `<rect>` в SVG, часть содержимого,
 *   поэтому он переживает и горизонтальную, и вертикальную прокрутку бесплатно;
 * - затенение связанного — бумага `toe-chart-shutter-paper`, положенная в обёртку
 *   `toe-chart-box` (со `position: relative`, приготовлена тикетом #3) рядом со
 *   скроллером, а не внутри него. Схема прокручивается только вбок, а в высоту растёт
 *   целиком (§6, кадр 420 px отменён), поэтому верхний край бумаги — прямо
 *   `shutterTopPx` в пикселях содержимого: вертикального `scrollTop`, за которым
 *   пришлось бы следить, у скроллера больше нет.
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
  LEGEND_CELL_SIZE,
  cellSizeAt,
  chartGuideLines,
  clampZoomStep,
  pageScrollTargetPx,
  shutterTopPx,
  stitchLinePoints,
  trianglePoints,
} from '../core/constants'
import { rowsWord, stitchesWord } from '../core/text'

/** Цвет шторки — перенесён буквально из прототипа (`row-progress.html`), это выбор
 * акцента, а не геометрия: в палитру §7.1 «Вязаный.рф» не входит, у значков схемы
 * своя роль. */
const SHUTTER_ACCENT = '#b4472a'

const { calculation, progressRow } = useToeCalculator()

/**
 * Значок лупы на кнопках масштаба (§7). Сторона поля и доли внутри него — хром кнопки,
 * а не величина спеки: в `core/` эта геометрия не едет, там живут доли клетки, общие
 * у сетки и легенды. 24 px в 44-пиксельной мишени — значок виден, кромка кнопки не жмёт.
 */
const ZOOM_ICON_SIZE = 24
const ZOOM_LENS = {
  cx: 10.5,
  cy: 10.5,
  r: 6.5,
  /** Ручка лупы — по диагонали от окружности к нижнему правому углу поля. */
  handleFrom: 15.5,
  handleTo: 21,
  /** Полудлина штриха знака внутри линзы: «−» — один штрих, «+» — два. */
  mark: 3.2,
  stroke: 2,
} as const

/** Ширина сетки постоянна и равна половине начальных петель (§7), сетка не сужается. */
const cols = computed(() => calculation.value.initial / 2)
const edge = computed(() => calculation.value.edge)

/** Кончик мыска сверху — ряды идут развёрнутым массивом, индекс и есть `y`. */
const displayRows = computed(() => calculation.value.rows.slice().reverse())
const rowsCount = computed(() => displayRows.value.length)

/**
 * Шаг масштаба (§7) — индекс в `CHART_CELL_SIZES`, не размер клетки: на краях набора
 * кнопка заглушается, а для этого надо знать, где край.
 */
const zoomStep = ref(DEFAULT_ZOOM_STEP)
const cellSize = computed(() => cellSizeAt(zoomStep.value))
const canZoomOut = computed(() => zoomStep.value > 0)
const canZoomIn = computed(() => zoomStep.value < CHART_CELL_SIZES.length - 1)

/** Две кнопки одним списком: рисунок у них общий, расходятся знаком внутри линзы и шагом. */
const zoomButtons = computed(() => [
  { testId: 'toe-chart-zoom-out', label: 'Схема мельче', delta: -1, enabled: canZoomOut.value },
  { testId: 'toe-chart-zoom-in', label: 'Схема крупнее', delta: 1, enabled: canZoomIn.value },
])

const viewHeight = computed(() => rowsCount.value)
/** Сетка и полоса номеров — два SVG, поэтому и ширины две (см. шапку про прибитые номера). */
const gridWidthPx = computed(() => Math.round(cols.value * cellSize.value))
const labelWidthPx = computed(() => Math.round(CHART_LABEL_WIDTH * cellSize.value))
/** Вся схема поперёк — сетка плюс полоса номеров; по ней меряется бумага шторки. */
const pixelWidth = computed(() => gridWidthPx.value + labelWidthPx.value)
const pixelHeight = computed(() => Math.round(viewHeight.value * cellSize.value))

const guideLines = computed(() => chartGuideLines(cols.value))

type Cell = { j: number; fill: string; stroke: string; strokeWidth: number; empty: boolean }
type Stitch = { j: number; p: number; edge: boolean; line: ReturnType<typeof stitchLinePoints> }
type Decoration = { j: number; p: number; dir: 'left' | 'right'; points: string }
type RowLayer = { row: Row; y: number; cells: Cell[]; stitches: Stitch[]; decorations: Decoration[] }

/**
 * Раскладывает один ряд на клетки, штрихи и треугольники. Перенос тела из
 * `prototypes/toe-visualization.html` (`renderD`) с единственной правкой
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

/**
 * Числа расчёта в подписи схемы (§7). Второго источника правды тут нет: строка
 * считается из того же `calculation`, что сама сетка, и разойтись с ней не может.
 * Конечные петли берутся как `finalReal` — те, на которых мысок действительно
 * кончится, тем же правилом, что в «Итоге» (§9.5).
 */
const paramsLine = computed(() => {
  const c = calculation.value
  return `${c.initial} → ${stitchesWord(c.finalReal)} · кромка ${c.edge} · ${rowsWord(c.totalRows)}`
})

/** Строка контура текущего ряда в развёрнутой сетке — та же индексация, что у `displayRows`. */
const currentRowY = computed(() => rowsCount.value - progressRow.value - 1)
const hasCurrentRow = computed(() => progressRow.value < rowsCount.value)

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

// Горизонтальная прокрутка при открытии стоит на правом краю — там начало ряда (§7).
// Перетаскивание мышью и shift+колесо переносятся из `wireChartScroll` того же прототипа.
const scrollEl = ref<HTMLDivElement | null>(null)
/** Верх сетки в документе — точка отсчёта разовой прокрутки страницы (§8). */
const svgEl = ref<SVGSVGElement | null>(null)
let dragging = false
let startX = 0
let startLeft = 0

/**
 * Ставит горизонтальную прокрутку на правый край — там начало ряда (§7). Зовётся ровно
 * дважды: на открытии и на смене масштаба. Отметка ряда прокрутку не трогает намеренно
 * (тикет #8: схема, возвращающаяся вправо на каждое «связала», читается как свойство
 * отметки). Смена расчёта её тоже не трогает — тот же тикет называл и этот повод, но
 * на экране его не было никогда, и зум ничего здесь не менял (§7).
 */
function scrollChartToRowStart(): void {
  const el = scrollEl.value
  if (el) el.scrollLeft = el.scrollWidth
}

/**
 * Шаг масштаба вверх или вниз (§7). На краю набора выходит холостым — `clampZoomStep`
 * вернёт то же значение, и прокрутка зря не дёрнется.
 *
 * `nextTick` не роскошь: правый край считается от `scrollWidth`, а тот обновится
 * только после перерисовки SVG с новой шириной.
 */
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

/**
 * Колесо: `ctrl` (и щипок по тачпаду, который браузер шлёт тем же событием) меняет
 * масштаб, shift и горизонтальное колесо — прокручивают. `preventDefault` на ветке
 * масштаба обязателен: без него браузер вдобавок зумит страницу целиком.
 */
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

/**
 * Верхний край бумаги шторки, в пикселях содержимого. Зажим сверху — по высоте сетки,
 * а не по высоте обёртки: обёртка ниже на высоту горизонтальной полосы прокрутки,
 * и без зажима бумага заходила бы на полосу, затеняя её вместе со схемой.
 */
const shutterPaperTopPx = computed(() =>
  Math.max(
    0,
    Math.min(shutterTopPx(rowsCount.value, progressRow.value, cellSize.value), pixelHeight.value),
  ),
)

/**
 * Разовая прокрутка **страницы** к текущему ряду при открытии (§8). Кадра у схемы нет,
 * она стоит под ручками расчёта, поэтому подъезжает страница, а не окно схемы.
 *
 * Случается только тогда, когда прогресс восстановлен из `localStorage` при загрузке:
 * `progressRow` на монтаже больше нуля ровно в этом случае — починенная ссылка даёт
 * другой `paramsKey`, и прогресс не подхватывается вовсе (§10.4). Чистый заход
 * открывается сверху, на вводке, ради которой порядок экрана и переставлен.
 *
 * Читает прогресс один раз и не подписывается на него дальше: реактивная привязка
 * воскресила бы отклонённый §8 вариант — автопрокрутку на каждое нажатие.
 *
 * Откладывается на кадр после монтажа намеренно: браузер восстанавливает позицию
 * страницы после перезагрузки сам и делает это позже, чем срабатывает `onMounted`, —
 * прокрутка, выставленная в монтаже, была бы им тут же затёрта нулём.
 *
 * Замеры (`dock`, высота окна, положение схемы в документе) живые; арифметика —
 * в `pageScrollTargetPx`, чтобы правило проверялось швом ядра, а не только браузером.
 */
function scrollPageToCurrentRow(): void {
  if (progressRow.value <= 0) return
  const svg = svgEl.value
  if (!svg || typeof window === 'undefined') return

  const dock = document.querySelector('[data-testid="bottom-dock"]')
  const dockHeight = dock ? dock.getBoundingClientRect().height : 0
  const chartContentTopPx = svg.getBoundingClientRect().top + window.scrollY

  const target = pageScrollTargetPx(
    chartContentTopPx,
    rowsCount.value,
    progressRow.value,
    window.innerHeight,
    dockHeight,
    cellSize.value,
  )
  requestAnimationFrame(() => window.scrollTo(0, target))
}

onMounted(() => {
  const el = scrollEl.value
  if (!el) return
  scrollChartToRowStart()

  scrollPageToCurrentRow()

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
    <!-- Подпись и масштаб стоят одной строкой над сеткой: кнопки нужны у самой схемы,
         а подпись обязана оставаться вплотную к её верхнему краю (§7). Внутрь
         `toe-chart-box` их класть нельзя — там бумага шторки на `absolute inset-x-0`
         накрыла бы мишени. -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <p class="text-sm text-slate-600" data-testid="toe-chart-caption-top">
          ↑ {{ finalReal }} петель на закрытие
        </p>
        <!-- Числа расчёта стоят у самой схемы и не зависят от того, показаны ли
             ручки (§7): по ним читают, что именно нарисовано ниже. -->
        <p class="text-sm tabular-nums text-slate-500" data-testid="toe-chart-params">
          {{ paramsLine }}
        </p>
      </div>

      <!-- Мишень 44 px — размером та же, что у степперов конструктора ритма (§6.3), а знак
           другой: голые «−» и «+» рядом с ручками расчёта читались прибавкой к петлям,
           а не масштабом. Знак ушёл внутрь лупы (§7). Текста на кнопке нет вовсе — имя
           держится на `aria-label`, значок от читалки спрятан. -->
      <div class="flex shrink-0 items-center gap-1" data-testid="toe-chart-zoom">
        <button
          v-for="button in zoomButtons"
          :key="button.testId"
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded border border-slate-300 text-slate-700 disabled:opacity-40"
          :disabled="!button.enabled"
          :aria-label="button.label"
          :title="button.label"
          :data-testid="button.testId"
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
            <line
              :x1="ZOOM_LENS.handleFrom"
              :y1="ZOOM_LENS.handleFrom"
              :x2="ZOOM_LENS.handleTo"
              :y2="ZOOM_LENS.handleTo"
            />
            <line
              :x1="ZOOM_LENS.cx - ZOOM_LENS.mark"
              :y1="ZOOM_LENS.cy"
              :x2="ZOOM_LENS.cx + ZOOM_LENS.mark"
              :y2="ZOOM_LENS.cy"
            />
            <line
              v-if="button.delta > 0"
              :x1="ZOOM_LENS.cx"
              :y1="ZOOM_LENS.cy - ZOOM_LENS.mark"
              :x2="ZOOM_LENS.cx"
              :y2="ZOOM_LENS.cy + ZOOM_LENS.mark"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Обёртка со `position: relative` — докует шторку прогресса (тикет #9), сама схема её не рисует. -->
    <div class="relative mt-2" data-testid="toe-chart-box">
      <!-- Схема растёт в естественную высоту: кадра в 420 px больше нет (§6), поэтому
           прокрутка здесь только горизонтальная — вертикально страницу листают целиком. -->
      <div
        ref="scrollEl"
        class="chartscroll overflow-x-auto rounded border border-slate-200"
        data-testid="toe-chart-scroll"
      >
        <!-- Дорожка держит сетку и полосу номеров одной строкой. `w-max` — ширина по
             содержимому, `mx-auto` центрует её, когда схема уже окна (§7); при
             переполнении автополя обнуляются сами, и левый край остаётся достижим. -->
        <div class="mx-auto flex w-max" data-testid="toe-chart-track">
          <svg
            ref="svgEl"
            :viewBox="`0 0 ${cols} ${viewHeight}`"
            :width="gridWidthPx"
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

            <!-- Контур текущего ряда (тикет #9, §8) — часть содержимого схемы, поэтому
                 переживает и горизонтальную, и вертикальную прокрутку сама, без JS. -->
            <rect
              v-if="hasCurrentRow"
              x="0"
              :y="currentRowY"
              :width="cols"
              height="1"
              fill="none"
              :stroke="SHUTTER_ACCENT"
              stroke-width="0.12"
              data-testid="toe-chart-current-row"
            />
          </svg>

          <!-- Полоса номеров рядов (§7 «номера рядов справа»). Прилипает к правому краю
               окна: сетка проезжает под ней, поэтому фон непрозрачный, а левая грань
               отчёркнута — иначе номера висели бы прямо на клетках. -->
          <svg
            class="sticky right-0 shrink-0 bg-white"
            :viewBox="`0 0 ${CHART_LABEL_WIDTH} ${viewHeight}`"
            :width="labelWidthPx"
            :height="pixelHeight"
            style="display: block"
            data-testid="toe-chart-row-labels"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              :y2="viewHeight"
              :stroke="CHART_COLORS.guideLine"
              :stroke-width="CHART_STROKE.gridBorder"
            />
            <text
              v-for="layer in grid"
              :key="`label-${layer.row.n}`"
              x="0.35"
              :y="layer.y + 0.7"
              font-size="0.55"
              :fill="layer.row.type === 'dec' ? CHART_COLORS.decRowLabel : CHART_COLORS.plainRowLabel"
              :font-weight="layer.row.type === 'dec' ? 600 : 400"
              data-testid="toe-chart-row-label"
              :data-row="layer.row.n"
            >{{ layer.row.n }}</text>
          </svg>
        </div>
      </div>

      <!-- Бумага шторки: затенение связанного (§8). Снаружи скроллера, потому что закрывать
           она должна видимую ширину схемы независимо от горизонтальной прокрутки, а не
           ширину содержимого. Вертикаль теперь совпадает с содержимым один в один:
           схема не прокручивается вниз, она вся на странице.

           Ширина — `min(сетка, окно)` с теми же автополями, что у самой сетки: схема уже
           окна стоит по центру (§7), и бумага в полную ширину тонировала бы пустые поля
           по бокам. Схема шире окна — `min` возвращает 100%, то есть прежнее поведение. -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 mx-auto bg-slate-900/30"
        :style="{ top: `${shutterPaperTopPx}px`, width: `min(${pixelWidth}px, 100%)` }"
        data-testid="toe-chart-shutter-paper"
      />
    </div>

    <p class="mt-2 text-sm text-slate-600" data-testid="toe-chart-caption-bottom">
      Начало мыска, {{ initial }} петель. Ряды читаются снизу вверх, петли справа налево.
    </p>

    <div class="mt-3 flex flex-col gap-1 text-sm text-slate-700" data-testid="toe-chart-legend">
      <div v-for="item in legend" :key="item.key" class="flex items-center gap-2">
        <svg :width="LEGEND_CELL_SIZE" :height="LEGEND_CELL_SIZE" aria-hidden="true">
          <rect
            x="0.5"
            y="0.5"
            :width="LEGEND_CELL_SIZE - 1"
            :height="LEGEND_CELL_SIZE - 1"
            :fill="item.box"
            :stroke="CHART_COLORS.cellStroke"
          />
          <line
            v-if="item.kind === 'stitch'"
            v-bind="stitchLinePoints(0, 0, LEGEND_CELL_SIZE)"
            :stroke="CHART_COLORS.stitchStroke"
            stroke-width="1.4"
            stroke-linecap="round"
          />
          <polygon
            v-if="item.kind === 'dec'"
            :points="trianglePoints(item.dir!, 0, 0, LEGEND_CELL_SIZE)"
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
   клеток из core/constants.ts, поэтому живут здесь литералами. */
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
