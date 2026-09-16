<script setup lang="ts">
/**
 * Итог расчёта — повтор для тех, кто долистал: живое число рядов у ручки ритма
 * выкладывают тикеты #5 и #6. Тексты безличные, словарь §2 спеки.
 *
 * Итог называет петли, на которых мысок **действительно кончится**, — это `finalReal`
 * и только он. При недоборе мысок встанет на 36 петлях вместо 20, и строка «60 → 20»
 * соврала бы ровно там, где рядом стоит предупреждение о недоборе. При переборе
 * `finalReal` сам равен конечным: лишние шаги ядро не выполняет, схема кончается
 * на конечных петлях (§9.5). Развилки здесь нет — второй источник правды на одно
 * число разъехался бы со схемой.
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
import { rhythmName } from '../core/presets'
import { coverageNote, lengthNote } from '../core/notes'
import { decRowsWord, rowsWord } from '../core/text'

const { calculation } = useToeCalculator()

const coverage = computed(() => coverageNote(calculation.value))
const finalShown = computed(() => calculation.value.finalReal)
const length = computed(() => lengthNote(calculation.value.totalRows))

/** Имя ритма — общее правило ядра (§5.5), одно на итог и на текст «Поделиться». */
const rhythm = computed(() => rhythmName(calculation.value.rhythm))
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="summary-panel">
    <h2 class="text-base font-semibold">Итог</h2>
    <p class="mt-2 text-slate-700" data-testid="summary-params">
      Мысок: {{ calculation.initial }} → {{ finalShown }} петель, кромка {{ calculation.edge }},
      убавки {{ rhythm }}
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
