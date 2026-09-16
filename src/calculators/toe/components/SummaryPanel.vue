<script setup lang="ts">
/**
 * Итог расчёта — повтор для тех, кто долистал: живое число рядов у ручки ритма
 * выкладывают тикеты #5 и #6. Тексты безличные, словарь §2 спеки.
 */
import { computed } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { presetByCode } from '../core/presets'
import { decRowsWord, rowsWord } from '../core/text'

const { calculation } = useToeCalculator()

const rhythmName = computed(() => {
  const rhythm = calculation.value.rhythm
  return rhythm.kind === 'preset' ? presetByCode(rhythm.name).name.toLowerCase() : 'свой ритм'
})
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="summary-panel">
    <h2 class="text-base font-semibold">Итог</h2>
    <p class="mt-2 text-slate-700" data-testid="summary-params">
      Мысок: {{ calculation.initial }} → {{ calculation.final }} петель, кромка {{ calculation.edge }},
      убавки {{ rhythmName }}
    </p>
    <p class="mt-1 text-slate-900">
      <span data-testid="summary-dec-rows">{{ decRowsWord(calculation.decRowsNeeded) }}</span>
      ·
      <span data-testid="summary-total-rows">{{ rowsWord(calculation.totalRows) }} всего</span>
    </p>
  </section>
</template>
