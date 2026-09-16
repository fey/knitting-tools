<script setup lang="ts">
/**
 * Конструктор своего ритма по шагам (тикет #6, §5.1, §5.5, §6.1).
 *
 * Свёрнут за кнопку — первый экран несёт только пресеты (§6.1). Внутри —
 * список сегментов: строка на сегмент со степперами интервала и повторов,
 * нумерация, «Убрать» и «+ ещё шаг».
 *
 * **Имя ритма решает происхождение, а не форма (§5.5).** Любая правка — стрелка
 * степпера, «Убрать» или «+ ещё шаг» — коммитит `params.rhythm` как
 * `{ kind: 'custom', segments }` напрямую, без экшн-обёртки (так же поступают
 * карточки пресетов в RhythmPresets.vue). Сравнения сегментов с пресетами здесь
 * нет и не будет: обратного пути «совпало — вернули пресет» не существует,
 * назад к пресету можно только кликом по карточке пресета.
 *
 * Карточка «Свой ритм» встаёт первым блоком в этой секции — в DOM она сразу
 * после четырёх карточек RhythmPresets.vue, то есть визуально под ними, ровно
 * как требует §6.1. RhythmPresets.vue при этом не тронут: она ничего не знает
 * про свой ритм.
 *
 * Недобор и перебор сегментов конструкцией не запрещены (§9.5) — счётчик покрытия
 * здесь несёт только сходящийся случай «Сегменты покрывают все N убавочных
 * рядов»; тексты недобора и перебора и дублирование строки у числа рядов — тикет #7.
 */
import { computed, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import type { Segment } from '../core/types'
import { decRowsWord, plainRowsWord, rowsWord, timesWord } from '../core/text'

/** Потолок интервала (§6.1): шаг 1, потолок 6. */
const INTERVAL_MAX = 6
/** Пол повторов (§6.1): шаг 1, пола ниже 1 нет. */
const REPEATS_MIN = 1

const { params, calculation } = useToeCalculator()

/**
 * Сегменты, которые видит и правит конструктор. Читает всегда `calculation.segments` —
 * это снимок, живой для пресета и набранный для своего ритма (см. `calc.ts`), поэтому
 * подмены источника между режимами не нужно.
 *
 * Нулевой `repeats` возможен у живого пресета за нижней границей `min` («с разгоном»
 * при N = 2 даёт хвостовой сегмент `{0, 0}`, см. `presets.test.ts`) — пол конструктора
 * 1, поэтому такой сегмент отфильтрован и здесь, и как основа для правок: он не несёт
 * ни одного ряда, показывать степпер на «0 раз» при заявленном полу 1 было бы враньём.
 */
const segments = computed<Segment[]>(() => calculation.value.segments.filter((s) => s.repeats > 0))

const expanded = ref(false)

function clampInterval(value: number): number {
  return Math.min(INTERVAL_MAX, Math.max(0, value))
}

function clampRepeats(value: number): number {
  return Math.max(REPEATS_MIN, value)
}

/** Свежая копия текущих сегментов — правки никогда не идут по ссылке результата расчёта. */
function copySegments(): Segment[] {
  return segments.value.map((s) => ({ ...s }))
}

function commit(next: Segment[]): void {
  params.rhythm = { kind: 'custom', segments: next }
}

function stepInterval(index: number, delta: number): void {
  const next = copySegments()
  next[index] = { ...next[index], interval: clampInterval(next[index].interval + delta) }
  commit(next)
}

function stepRepeats(index: number, delta: number): void {
  const next = copySegments()
  next[index] = { ...next[index], repeats: clampRepeats(next[index].repeats + delta) }
  commit(next)
}

function removeStep(index: number): void {
  if (segments.value.length <= 1) return
  commit(copySegments().filter((_, i) => i !== index))
}

function addStep(): void {
  commit([...copySegments(), { interval: 0, repeats: 1 }])
}

function toggle(): void {
  expanded.value = !expanded.value
}

/** «Сегменты покрывают все 10 убавочных рядов» — только сходящийся случай (§9.5, тикет #7 — остальное). */
const coverageText = computed<string | null>(() => {
  if (calculation.value.lack !== 0) return null
  return `Сегменты покрывают все ${decRowsWord(calculation.value.decRowsNeeded)}`
})
</script>

<template>
  <section data-testid="rhythm-builder">
    <div
      v-if="params.rhythm.kind === 'custom'"
      class="rounded border border-slate-300 bg-slate-50 p-3"
      data-testid="rhythm-custom-card"
    >
      <p class="text-sm font-medium">Свой ритм</p>
      <ul class="mt-1 space-y-0.5 text-xs text-slate-600">
        <li v-for="(segment, i) in segments" :key="i">
          Убавочный ряд, потом {{ plainRowsWord(segment.interval) }}, повторить {{ timesWord(segment.repeats) }}
        </li>
      </ul>
      <p class="mt-1 text-xs font-semibold text-slate-900" data-testid="rhythm-custom-card-rows">
        {{ rowsWord(calculation.totalRows) }}
      </p>
    </div>

    <button
      type="button"
      class="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
      data-testid="rhythm-builder-toggle"
      :aria-expanded="expanded"
      @click="toggle"
    >
      {{ expanded ? 'Свернуть конструктор' : 'Настроить ритм по шагам' }}
    </button>

    <div v-if="expanded" class="mt-3 rounded border border-slate-200 p-3" data-testid="rhythm-builder-panel">
      <div
        v-for="(segment, i) in segments"
        :key="i"
        class="border-b border-slate-100 py-3 last:border-b-0"
        :data-testid="`rhythm-builder-step-${i}`"
      >
        <p class="text-xs font-semibold text-slate-500">Шаг {{ i + 1 }} из {{ segments.length }}</p>

        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-sm text-slate-700">Убавочный ряд, потом {{ plainRowsWord(segment.interval) }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-11 w-11 shrink-0 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
              :data-testid="`rhythm-builder-step-${i}-interval-minus`"
              :disabled="segment.interval <= 0"
              @click="stepInterval(i, -1)"
            >
              −
            </button>
            <span class="w-6 text-center text-sm" :data-testid="`rhythm-builder-step-${i}-interval-value`">{{
              segment.interval
            }}</span>
            <button
              type="button"
              class="h-11 w-11 shrink-0 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
              :data-testid="`rhythm-builder-step-${i}-interval-plus`"
              :disabled="segment.interval >= INTERVAL_MAX"
              @click="stepInterval(i, 1)"
            >
              +
            </button>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-sm text-slate-700">Повторить {{ timesWord(segment.repeats) }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-11 w-11 shrink-0 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
              :data-testid="`rhythm-builder-step-${i}-repeats-minus`"
              :disabled="segment.repeats <= REPEATS_MIN"
              @click="stepRepeats(i, -1)"
            >
              −
            </button>
            <span class="w-6 text-center text-sm" :data-testid="`rhythm-builder-step-${i}-repeats-value`">{{
              segment.repeats
            }}</span>
            <button
              type="button"
              class="h-11 w-11 shrink-0 rounded border border-slate-300 text-lg leading-none"
              :data-testid="`rhythm-builder-step-${i}-repeats-plus`"
              @click="stepRepeats(i, 1)"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          class="mt-2 text-xs text-slate-500 underline disabled:no-underline disabled:opacity-40"
          :data-testid="`rhythm-builder-step-${i}-remove`"
          :disabled="segments.length <= 1"
          @click="removeStep(i)"
        >
          Убрать
        </button>
      </div>

      <button
        type="button"
        class="mt-3 w-full rounded border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
        data-testid="rhythm-builder-add-step"
        @click="addStep"
      >
        + ещё шаг
      </button>

      <p v-if="coverageText" class="mt-3 text-sm text-slate-700" data-testid="rhythm-builder-coverage">
        {{ coverageText }}
      </p>
    </div>
  </section>
</template>
