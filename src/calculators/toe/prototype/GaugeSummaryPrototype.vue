<script setup lang="ts">
/**
 * ПРОТОТИП, тикет #27. «Итог» с сантиметрами: длина мыска и обхват на начальных петлях.
 * Обхват — числом, а не линейкой: сетка показывает половину, и мерка поперёк неё
 * читалась бы половиной обхвата (§4 держит против этой путаницы отдельную подпись).
 *
 * §9.6 при известной плотности меряет в сантиметрах, без неё — по-старому в рядах.
 */
import { computed } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { rhythmName } from '../core/presets'
import { coverageNote, lengthNote } from '../core/notes'
import { decRowsWord, rowsWord } from '../core/text'
import GaugeButtonPrototype from './GaugeButtonPrototype.vue'
import { cm, cmPerRow, cmPerStitch, gaugeFilled, lengthNoteCm } from './gauge'

const { calculation } = useToeCalculator()

const coverage = computed(() => coverageNote(calculation.value))
const finalShown = computed(() => calculation.value.finalReal)
const rhythm = computed(() => rhythmName(calculation.value.rhythm))

const lengthCm = computed(() => calculation.value.totalRows * cmPerRow.value)
const circumferenceCm = computed(() => calculation.value.initial * cmPerStitch.value)

const note = computed(() =>
  gaugeFilled.value ? lengthNoteCm(lengthCm.value) : lengthNote(calculation.value.totalRows),
)
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="proto-summary">
    <h2 class="text-base font-semibold">Итог</h2>
    <p class="mt-2 text-slate-700">
      Мысок: {{ calculation.initial }} → {{ finalShown }} петель, кромка {{ calculation.edge }},
      убавки {{ rhythm }}
    </p>
    <p class="mt-1 text-slate-900">
      <span>{{ decRowsWord(calculation.decRowsNeeded) }}</span>
      ·
      <span>{{ rowsWord(calculation.totalRows) }} всего</span>
    </p>

    <p v-if="gaugeFilled" class="mt-1 text-slate-900 tabular-nums" data-testid="proto-summary-cm">
      Длина мыска {{ cm(lengthCm) }} см · обхват на начальных петлях
      {{ cm(circumferenceCm) }} см
    </p>

    <p v-if="coverage.kind !== 'ok'" class="mt-1 text-sm text-amber-700">{{ coverage.text }}</p>
    <p v-if="note" class="mt-1 text-sm text-amber-700">{{ note }}</p>

    <!-- Зацепка в теле страницы: без неё плотность видна только тому, кто полез в шапку
         наугад — дефолта нет, шапка не липнет к верху (§6.4). -->
    <div class="mt-3">
      <GaugeButtonPrototype place="summary" />
    </div>
  </section>
</template>
