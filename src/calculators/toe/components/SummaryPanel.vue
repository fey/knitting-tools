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
 * Предупреждение о покрытии стоит здесь повтором для тех, кто долистал: блок «Итог»
 * на телефоне всегда за экраном (§6), поэтому требование §9.5 «дублируется строкой
 * у числа рядов» закрывает не он, а строка у ручки ритма (`RhythmPresets.vue`);
 * первое место — счётчик в сворачивающемся конструкторе. Текст всех трёх мест
 * собирает `coverageNote` — одна сборка на все точки показа.
 *
 * Замечание о длине — **не красным: это замечание, а не ошибка** (§9.6). Запрета
 * за ним нет, расчёт не придерживается. С вписанной плотностью оно меряет
 * в сантиметрах и вливается в строку указания «Мысок займёт … — начинай его за столько
 * до конца носка» (тикеты #27, #36); без плотности стоит отдельной строкой в рядах.
 * Ориентир по ноге стоит всегда, вторым планом.
 *
 * **Сантиметры и кнопка плотности стоят здесь, и только здесь.** Дефолта у плотности
 * нет, первый экран о сантиметрах не говорит ничем — без зацепки в теле страницы
 * о них не узнали бы вовсе. В шапку кнопка не встала по мере ряда, см. `GaugeButton.vue`.
 */
import { computed } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { centimetreView } from '../core/centimetres'
import { FOOT_CHECK, coverageNote } from '../core/notes'
import { decRowsWord, rowsWord } from '../core/plural'
import { summaryLine } from '../core/text'
import GaugeButton from './GaugeButton.vue'

const { calculation, gauge } = useToeCalculator()

const coverage = computed(() => coverageNote(calculation.value))
/**
 * Сантиметры и замечание о длине — из одного вида (`centimetreView`): выбор «см или
 * ряды» решается там, а не здесь. Обхват назван обхватом, а не шириной: петли
 * считаются в круге (§4), а схема показывает половину.
 */
const view = computed(() => centimetreView(calculation.value, gauge.value))
const centimetres = computed(() => view.value.cm)
const length = computed(() => view.value.lengthNote)

/** Строка расчёта — общая сборка ядра (§7), одна на итог, схему и «Поделиться». */
const params = computed(() => summaryLine(calculation.value))
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="summary-panel">
    <h2 class="text-base font-semibold">Итог</h2>
    <p class="mt-2 text-slate-700" data-testid="summary-params">
      {{ params }}
    </p>
    <p class="mt-1 text-slate-900">
      <span data-testid="summary-dec-rows">{{ decRowsWord(calculation.decRowsNeeded) }}</span>
      ·
      <span data-testid="summary-total-rows">{{ rowsWord(calculation.totalRows) }} всего</span>
    </p>
    <template v-if="centimetres">
      <p class="mt-1 text-slate-900 tabular-nums" data-testid="summary-start-hint">{{ centimetres.startHint }}</p>
      <p class="mt-1 text-slate-900 tabular-nums" data-testid="summary-circumference">
        Обхват на начальных петлях {{ centimetres.circumference }}
      </p>
    </template>
    <p v-if="coverage.kind !== 'ok'" class="mt-1 text-sm text-amber-700" data-testid="summary-coverage">
      {{ coverage.text }}
    </p>
    <p v-if="length" class="mt-1 text-sm text-amber-700" data-testid="summary-length-note">{{ length }}</p>
    <p class="mt-1 text-sm text-slate-600" data-testid="summary-foot-check">{{ FOOT_CHECK }}</p>

    <!-- Зацепка: без неё плотность не нашли бы вовсе — дефолта у неё нет,
         и первый экран о сантиметрах не говорит ничем (тикет #27). -->
    <div class="mt-3">
      <GaugeButton />
    </div>
  </section>
</template>
