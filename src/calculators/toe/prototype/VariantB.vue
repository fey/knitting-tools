<script setup lang="ts">
/**
 * ПРОТОТИП, вариант B — панель схлопывается на месте.
 *
 * Режима «поверх страницы» нет вовсе: страница остаётся страницей. Кнопка убирает
 * вводку, ручки и «Итог», оставляя строку-сводку с числами расчёта.
 *
 * **Кнопка показа-скрытия — часть панели настроек, а не полоса над страницей.**
 * Развёрнуто она первая строка панели, свёрнуто — стоит в том, что от панели
 * осталось, и на том же месте. Прятать себя умеет сама панель, тем же узором,
 * что вводка прячет себя кнопкой «Свернуть инструкцию» (§6.1). Схема стоит там же, где стояла, в естественную высоту (§6),
 * и забирает освободившуюся ширину — на десктопе всю левую колонку в 400 px.
 *
 * Вложенной вертикальной прокрутки не появляется: страница листается одна, как §6
 * и обещает. Взамен экран не очищается целиком — сверху остаётся шапка и строка-сводка.
 *
 * Схема не перемонтируется: свёрнутое состояние меняет только соседей и классы грида.
 */
import { computed, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import ToeChart from '../components/ToeChart.vue'
import IntroNote from '../components/IntroNote.vue'
import RhythmPresets from '../components/RhythmPresets.vue'
import RhythmBuilder from '../components/RhythmBuilder.vue'
import StitchFields from '../components/StitchFields.vue'
import SummaryPanel from '../components/SummaryPanel.vue'
import RowProgressBar from '../components/RowProgressBar.vue'
import ShareButton from '../components/ShareButton.vue'

const { calculation } = useToeCalculator()
const focus = ref(false)

/** Сводка вместо свёрнутых ручек: числа те же, что в «Итоге», одной строкой. */
const summary = computed(() => {
  const c = calculation.value
  return `${c.initial} → ${c.finalReal} петель · кромка ${c.edge} · ${c.totalRows} рядов`
})
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <main
      class="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-12 pb-56 min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
    >
      <header class="flex items-start justify-between gap-3">
        <h1 class="text-xl font-semibold">Калькулятор мыска носка</h1>
        <ShareButton />
      </header>

      <IntroNote v-if="!focus" />

      <div
        :class="
          focus
            ? 'flex flex-col gap-4'
            : 'flex flex-col gap-4 min-[1240px]:grid min-[1240px]:grid-cols-[400px_minmax(0,1fr)] min-[1240px]:items-start min-[1240px]:gap-6'
        "
      >
        <!-- Развёрнутая панель настроек: кнопка «Убрать» — её первая строка, а не
             отдельная полоса над страницей. Прятать умеет сама панель. -->
        <div
          v-if="!focus"
          class="flex flex-col gap-4 min-[1240px]:col-start-1 min-[1240px]:row-start-1"
        >
          <button
            type="button"
            class="h-11 self-start rounded border border-slate-300 px-3 text-sm text-slate-700"
            data-testid="proto-focus-toggle"
            @click="focus = true"
          >
            Убрать настройки
          </button>
          <StitchFields />
          <RhythmPresets />
          <RhythmBuilder />
        </div>

        <!-- Свёрнутая панель настроек: от неё остаётся строка с числами расчёта
             и кнопкой возврата, и стоит она там же, где стояла панель. -->
        <div
          v-else
          class="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2"
          data-testid="proto-summary-strip"
        >
          <span class="text-sm tabular-nums text-slate-700">{{ summary }}</span>
          <button
            type="button"
            class="ml-auto h-11 rounded border border-slate-300 px-3 text-sm text-slate-700"
            data-testid="proto-focus-toggle"
            @click="focus = false"
          >
            Показать настройки
          </button>
        </div>

        <ToeChart
          :class="focus ? '' : 'min-[1240px]:col-start-2 min-[1240px]:row-start-1 min-[1240px]:row-span-2'"
        />

        <SummaryPanel v-if="!focus" class="min-[1240px]:col-start-1 min-[1240px]:row-start-2" />
      </div>
    </main>

    <div class="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-2">
      <div class="mx-auto max-w-xl min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]">
        <RowProgressBar />
      </div>
    </div>
  </div>
</template>
