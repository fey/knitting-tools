<script setup lang="ts">
/**
 * Оболочка страницы. Порядок блоков — из спеки §6 и меняться дальше почти не должен:
 * схема идёт первой, до всех кнопок; плашка прогресса прибита к низу экрана.
 * Содержимое блоков выкладывают отдельные тикеты, каждый в своём файле.
 */
import ToeChart from './calculators/toe/components/ToeChart.vue'
import RhythmPresets from './calculators/toe/components/RhythmPresets.vue'
import RhythmBuilder from './calculators/toe/components/RhythmBuilder.vue'
import StitchFields from './calculators/toe/components/StitchFields.vue'
import SummaryPanel from './calculators/toe/components/SummaryPanel.vue'
import RowProgressBar from './calculators/toe/components/RowProgressBar.vue'
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <!-- Запас снизу — под полосу прогресса и сброса, прибитую к низу экрана (тикет #9):
         дока растёт вверх, а не вниз, но место под неё в потоке страницы резервируется
         заранее, иначе последний блок «Итог» на части экранов уезжает под полосу. -->
    <main class="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-4 pb-56">
      <h1 class="text-xl font-semibold">Калькулятор мыска носка</h1>

      <ToeChart />
      <RhythmPresets />
      <RhythmBuilder />
      <StitchFields />
      <SummaryPanel />
    </main>

    <div class="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-2">
      <div class="mx-auto max-w-xl">
        <RowProgressBar />
      </div>
    </div>
  </div>
</template>
