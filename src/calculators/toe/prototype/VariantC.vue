<script setup lang="ts">
/**
 * ПРОТОТИП, вариант C — схема первична всегда, ручки живут в шторке.
 *
 * Здесь нет кнопки «развернуть»: разворачивать нечего, страница и так несёт только
 * схему, зум и плашку прогресса. Ручки расчёта, вводка и «Итог» уехали в шторку,
 * которую вызывают кнопкой «Настройки» в верхней полосе, — на телефоне она
 * наезжает сверху, на широком экране выезжает слева, на месте той самой левой колонки.
 *
 * В шторку уехали вводка и ручки, но не «Итог»: он стоит под схемой, потому что несёт
 * предупреждения о покрытии и длине мыска, а спрятанное предупреждение не предупреждает.
 *
 * Вариант переворачивает вопрос: не «как спрятать панель», а «зачем она открыта».
 * Цена названа заранее: первый заход открывается сеткой значков — ровно то, что §6
 * запрещает («сперва текст, потом ручки, и только потом схема»). Выиграет C — §6
 * придётся править, либо шторку открывать на первом заходе.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const open = ref(false)

const summary = computed(() => {
  const c = calculation.value
  return `${c.initial} → ${c.finalReal} · кромка ${c.edge} · ${c.totalRows} рядов`
})

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="min-h-screen bg-white pt-9 text-slate-900">
    <!-- Верхняя полоса и есть вся «панель», оставшаяся на экране: имя расчёта, числа,
         вход в ручки. Липкая — кнопка настроек нужна с любого места длинной схемы. -->
    <header
      class="sticky top-9 z-30 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2"
      data-testid="proto-top-bar"
    >
      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded border border-slate-300 px-3 text-sm text-slate-700"
        data-testid="proto-focus-toggle"
        @click="open = true"
      >
        <span aria-hidden="true">☰</span>
        Настройки
      </button>
      <span class="truncate text-sm tabular-nums text-slate-600">{{ summary }}</span>
      <div class="ml-auto"><ShareButton /></div>
    </header>

    <main class="mx-auto flex max-w-[1400px] flex-col gap-4 px-3 pt-3 pb-56">
      <ToeChart />
      <!-- «Итог» остаётся на экране схемы, а не уезжает в шторку вместе с ручками:
           он несёт предупреждения о покрытии и длине, а спрятанное предупреждение
           не предупреждает. -->
      <SummaryPanel />
    </main>

    <!-- Шторка: сверху на телефоне, слева от 1024 px. Подложка гасит схему, чтобы
         открытые ручки читались как отдельный слой, а не как вернувшаяся колонка. -->
    <div
      v-if="open"
      class="fixed inset-x-0 top-9 bottom-0 z-40 bg-slate-900/40"
      data-testid="proto-drawer-backdrop"
      @click="open = false"
    />
    <aside
      v-if="open"
      class="fixed inset-x-0 top-9 z-50 max-h-[80vh] overflow-y-auto rounded-b-2xl bg-white p-3 shadow-xl min-[1024px]:bottom-0 min-[1024px]:right-auto min-[1024px]:max-h-none min-[1024px]:w-[420px] min-[1024px]:rounded-none"
      data-testid="proto-drawer"
    >
      <div class="flex items-start justify-between gap-3">
        <h1 class="text-xl font-semibold">Калькулятор мыска носка</h1>
        <button
          type="button"
          class="h-11 rounded border border-slate-300 px-3 text-sm text-slate-700"
          data-testid="proto-drawer-close"
          @click="open = false"
        >
          К схеме
        </button>
      </div>

      <div class="mt-3 flex flex-col gap-4">
        <IntroNote />
        <StitchFields />
        <RhythmPresets />
        <RhythmBuilder />
      </div>
    </aside>

    <div class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 py-2">
      <div class="mx-auto max-w-[1400px]">
        <RowProgressBar />
      </div>
    </div>
  </div>
</template>
