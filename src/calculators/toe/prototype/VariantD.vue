<script setup lang="ts">
/**
 * ПРОТОТИП, вариант D — прячутся только настройки.
 *
 * Разбор претензии к B: там кнопка уносила с экрана и вводку, и «Итог» заодно
 * с ручками, хотя просили убрать ручки. Здесь кнопка трогает ровно свой блок.
 *
 * - **Вводка стоит сверху и живёт своей жизнью**: сворачивается собственной кнопкой
 *   (§6.1), кнопкой настроек не трогается вовсе.
 * - **Настройки — слева сверху, схема справа от них** (§6.2). Кнопка «Убрать» стоит
 *   одной строкой с кнопкой вводки — и держится её нижнего края (`items-end`), так что
 *   встаёт рядом и с «Показать инструкцию» у свёрнутой, и со «Свернуть инструкцию»
 *   у развёрнутой. Столбик из двух кнопок читался плохо, а кнопка, уплывающая вверх
 *   при развороте вводки, — ещё хуже.
 * - **Числа расчёта стоят в подписи схемы всегда** — и с настройками, и без них,
 *   одной строкой с «N петель на закрытие». Отдельной полосы, всплывающей вместо
 *   убранных ручек, нет: по этой строке читают, что именно нарисовано, а такое
 *   не показывают через раз.
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

/** Числа расчёта в подписи схемы: что нарисовано. Стоят там всегда, в обоих состояниях. */
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

      <!-- Вводка кнопкой настроек не трогается: у неё своя кнопка и своя память.
           Обе кнопки стоят одной строкой: свёрнутая вводка — это одна кнопка, и
           вторая кнопка под ней читалась столбиком кнопок ни к чему не приписанных. -->
      <div class="flex flex-wrap items-end gap-3">
        <IntroNote />
        <button
          type="button"
          class="h-11 shrink-0 rounded border border-slate-300 px-3 text-sm text-slate-700"
          data-testid="proto-focus-toggle"
          @click="hidden = !hidden"
        >
          {{ hidden ? 'Показать настройки' : 'Убрать настройки' }}
        </button>
      </div>

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
          <StitchFields />
          <RhythmPresets />
          <RhythmBuilder />
        </div>

        <!-- Схема и «Итог» — один блок: «Итог» про то, что нарисовано выше,
             и в правой колонке он стоит под схемой, а не в левой под ручками. -->
        <div
          class="flex flex-col gap-2 min-[1240px]:col-start-2 min-[1240px]:row-start-1"
          data-testid="proto-chart-block"
        >
          <!-- Числа расчёта — внутри схемы, в одной строке с подписью закрытия:
               по ним читают, что именно нарисовано, и отдельной строкой над рамкой
               они читались подписью к пустому месту. -->
          <ToeChart>
            <template #params>
              <p class="text-sm tabular-nums text-slate-500" data-testid="proto-chart-params">
                {{ summary }}
              </p>
            </template>
          </ToeChart>
          <SummaryPanel class="mt-2" />
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
