<script setup lang="ts">
/**
 * Четыре карточки готового ритма (тикет #5, §5.4, §6).
 *
 * Пресет живой: сегменты и число рядов выводятся от текущих петель при каждом
 * расчёте (`presetRowCount`), поэтому здесь ничего не кэшируется — подписи читают
 * `calculation` напрямую, и правка петель на другом конце страницы двигает их сама.
 *
 * Пресет, который при текущих убавочных рядах не собирается, — карточка неактивна
 * и несёт причину (`presetWhyOff`), а не пропадает из списка (§5.4, AC).
 *
 * Карточка «Свой ритм» — работа тикета #6, здесь её нет: сравнения сегментов
 * с пресетами в коде нет нигде (§5.5), имя ритма решает происхождение, а не форма.
 */
import { useToeCalculator } from '../useToeCalculator'
import { PRESETS, presetRowCount, presetWhyOff, type Preset } from '../core/presets'
import { rowsWord } from '../core/text'

const { params, calculation } = useToeCalculator()

function rows(preset: Preset): number | null {
  return presetRowCount(preset, calculation.value.decRowsNeeded, calculation.value.initial)
}

function isSelected(preset: Preset): boolean {
  return params.rhythm.kind === 'preset' && params.rhythm.name === preset.code
}

function select(preset: Preset): void {
  if (rows(preset) === null) return
  params.rhythm = { kind: 'preset', name: preset.code }
}
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="rhythm-presets">
    <h2 class="text-base font-semibold">Ритм убавок</h2>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        v-for="preset in PRESETS"
        :key="preset.code"
        type="button"
        class="rounded border p-3 text-left transition-opacity"
        :class="[
          isSelected(preset) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700',
          rows(preset) === null ? 'opacity-40' : '',
        ]"
        :data-testid="`preset-${preset.code}`"
        :aria-pressed="isSelected(preset)"
        :disabled="rows(preset) === null"
        @click="select(preset)"
      >
        <span class="block text-sm font-medium">{{ preset.name }}</span>
        <span class="mt-1 block text-xs font-semibold" data-testid="preset-status">
          <template v-if="rows(preset) !== null">{{ rowsWord(rows(preset)!) }}</template>
          <template v-else>{{ presetWhyOff(preset, calculation.decRowsNeeded) }}</template>
        </span>
        <span class="mt-1 block text-xs" :class="isSelected(preset) ? 'text-slate-300' : 'text-slate-500'">
          {{ preset.how }}
        </span>
      </button>
    </div>
  </section>
</template>
