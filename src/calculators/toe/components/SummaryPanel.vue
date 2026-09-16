<script setup lang="ts">
/**
 * Итог расчёта — повтор для тех, кто долистал: живое число рядов у ручки ритма
 * выкладывают тикеты #5 и #6. Тексты безличные, словарь §2 спеки.
 *
 * Итог называет петли, на которых мысок **действительно кончится**. При недоборе
 * это `finalReal`: мысок встанет на 36 петлях вместо 20, и строка «60 → 20» соврала бы
 * ровно там, где рядом стоит предупреждение о недоборе. При переборе — запрошенные
 * `final`: лишние шаги не выполняются, мысок кончается на конечных петлях (§9.5),
 * а `finalReal` показал бы петли, до которых не дойдёт.
 *
 * Предупреждение о покрытии дублируется здесь намеренно: первое место — счётчик
 * в конструкторе, но конструктор сворачивается, и единственная строка ушла бы
 * с экрана вместе с ним. Текст обоих мест собирает `coverageNote` — одна сборка
 * на две точки показа.
 *
 * Замечание о длине — **не красным: это замечание, а не ошибка** (§9.6). Запрета
 * за ним нет, расчёт не придерживается.
 */
import { computed } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { presetByCode } from '../core/presets'
import { coverageNote, lengthNote } from '../core/notes'
import { decRowsWord, rowsWord } from '../core/text'

const { calculation } = useToeCalculator()

const coverage = computed(() => coverageNote(calculation.value))
const finalShown = computed(() =>
  calculation.value.lack > 0 ? calculation.value.finalReal : calculation.value.final,
)
const length = computed(() => lengthNote(calculation.value.totalRows))

const rhythmName = computed(() => {
  const rhythm = calculation.value.rhythm
  return rhythm.kind === 'preset' ? presetByCode(rhythm.name).name.toLowerCase() : 'свой ритм'
})
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="summary-panel">
    <h2 class="text-base font-semibold">Итог</h2>
    <p class="mt-2 text-slate-700" data-testid="summary-params">
      Мысок: {{ calculation.initial }} → {{ finalShown }} петель, кромка {{ calculation.edge }},
      убавки {{ rhythmName }}
    </p>
    <p class="mt-1 text-slate-900">
      <span data-testid="summary-dec-rows">{{ decRowsWord(calculation.decRowsNeeded) }}</span>
      ·
      <span data-testid="summary-total-rows">{{ rowsWord(calculation.totalRows) }} всего</span>
    </p>
    <p v-if="coverage.kind !== 'ok'" class="mt-1 text-sm text-amber-700" data-testid="summary-coverage">
      {{ coverage.text }}
    </p>
    <p v-if="length" class="mt-1 text-sm text-amber-700" data-testid="summary-length-note">{{ length }}</p>
  </section>
</template>
