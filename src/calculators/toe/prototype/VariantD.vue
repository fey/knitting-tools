<script setup lang="ts">
/**
 * ПРОТОТИП, вариант D — прячутся только настройки.
 *
 * Разбор претензии к B: там кнопка уносила с экрана и вводку, и «Итог» заодно
 * с ручками, хотя просили убрать ручки. Здесь кнопка трогает ровно свой блок.
 *
 * - **Вводка стоит сверху и живёт своей жизнью**: сворачивается собственной кнопкой
 *   (§6.1), кнопкой настроек не трогается вовсе.
 * - **Настройки — слева сверху, схема справа от них** (§6.2), свёрнутые оставляют
 *   на своём месте строку с числами расчёта.
 * - **«Итог» — часть схемы и идёт прямо под ней**, а не под ручками: он говорит
 *   про то, что нарисовано, и уезжать вместе с настройками ему незачем. Это и есть
 *   расхождение с §6.2, где «Итог» стоит в левой колонке под ручками.
 *
 * Телефонный порядок сверху вниз: вводка → настройки → схема → «Итог».
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
const hidden = ref(false)

/** Свёрнутые настройки оставляют свои числа: иначе непонятно, что именно убрано. */
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

      <!-- Вводка кнопкой настроек не трогается: у неё своя кнопка и своя память. -->
      <IntroNote />

      <div
        :class="
          hidden
            ? 'flex flex-col gap-4'
            : 'flex flex-col gap-4 min-[1240px]:grid min-[1240px]:grid-cols-[400px_minmax(0,1fr)] min-[1240px]:items-start min-[1240px]:gap-6'
        "
      >
        <div
          v-if="!hidden"
          class="flex flex-col gap-4 min-[1240px]:col-start-1 min-[1240px]:row-start-1"
          data-testid="proto-settings"
        >
          <button
            type="button"
            class="h-11 self-start rounded border border-slate-300 px-3 text-sm text-slate-700"
            data-testid="proto-focus-toggle"
            @click="hidden = true"
          >
            Убрать настройки
          </button>
          <StitchFields />
          <RhythmPresets />
          <RhythmBuilder />
        </div>

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
            @click="hidden = false"
          >
            Показать настройки
          </button>
        </div>

        <!-- Схема и «Итог» — один блок: «Итог» про то, что нарисовано выше,
             и в правой колонке он стоит под схемой, а не в левой под ручками. -->
        <div
          class="flex flex-col gap-4 min-[1240px]:col-start-2 min-[1240px]:row-start-1"
          data-testid="proto-chart-block"
        >
          <ToeChart />
          <SummaryPanel />
        </div>
      </div>
    </main>

    <div class="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-2">
      <div class="mx-auto max-w-xl min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]">
        <RowProgressBar />
      </div>
    </div>
  </div>
</template>
