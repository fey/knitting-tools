<script setup lang="ts">
/**
 * Оболочка страницы. Порядок блоков — из спеки §6: вводка, ручки расчёта, схема, итог.
 * Схема стоит **под** ручками (§14 отменил обратный порядок): открытая страница обязана
 * сперва сказать, что это за инструмент и куда нажимать, а сетка значков этого не говорит.
 * Плашка прогресса прибита к низу экрана.
 *
 * **Ширина растёт в три шага, и оба порога считаются от схемы**, а не берутся готовыми
 * брейкпоинтами Tailwind. Дефолтный расчёт 60 → 20 — это схема в 702 px (сетка 660 плюс
 * полоса номеров 42) плюс поля блока, около 728 px:
 * - до 800 px — колонка в 576 px, схема прокручивается вбок (телефон, §7);
 * - от 800 px — колонка в 768 px: схема впервые встаёт целиком, горизонтальная
 *   прокрутка на дефолте пропадает, а страница перестаёт быть узкой полосой на ноутбуке;
 * - от 1240 px — две колонки: 400 px слева, схема справа, зазор 24 px и поля 32 px,
 *   то есть две колонки честны примерно с 1184 px, и порог взят с запасом.
 *
 * Телефонный порядок сверху вниз не меняется ни на одном шаге.
 *
 * Порядок в DOM — телефонный (ручки → схема → итог), а десктопная раскладка получается
 * явной расстановкой по клеткам грида: «Итог» уходит под ручки в левую колонку, схема
 * занимает правую целиком. Переставлять сам DOM ради десктопа нельзя — порядок чтения
 * с клавиатуры и голосом обязан совпадать с телефонным.
 */
import ToeChart from './calculators/toe/components/ToeChart.vue'
import IntroNote from './calculators/toe/components/IntroNote.vue'
import RhythmPresets from './calculators/toe/components/RhythmPresets.vue'
import RhythmBuilder from './calculators/toe/components/RhythmBuilder.vue'
import StitchFields from './calculators/toe/components/StitchFields.vue'
import SummaryPanel from './calculators/toe/components/SummaryPanel.vue'
import RowProgressBar from './calculators/toe/components/RowProgressBar.vue'
import ShareButton from './calculators/toe/components/ShareButton.vue'
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <!-- Запас снизу — под полосу прогресса и сброса, прибитую к низу экрана (тикет #9):
         дока растёт вверх, а не вниз, но место под неё в потоке страницы резервируется
         заранее, иначе последний блок на части экранов уезжает под полосу. -->
    <main
      class="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-4 pb-56 min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
    >
      <!-- «Поделиться» стоит в шапке, выше полей петель, и это не оформление (§10.4):
           подпись починки поля вставляется синхронным `blur`, который срабатывает
           раньше `click`. Кнопка ниже полей уехала бы от этой вставки между
           `mousedown` и `mouseup` одного касания, и клик промахнулся бы мимо. -->
      <header class="flex items-start justify-between gap-3">
        <h1 class="text-xl font-semibold">Калькулятор мыска носка</h1>
        <ShareButton />
      </header>

      <IntroNote />

      <div
        class="flex flex-col gap-4 min-[1240px]:grid min-[1240px]:grid-cols-[400px_minmax(0,1fr)] min-[1240px]:items-start min-[1240px]:gap-6"
        data-testid="layout-grid"
      >
        <div
          class="flex flex-col gap-4 min-[1240px]:col-start-1 min-[1240px]:row-start-1"
          data-testid="controls-column"
        >
          <StitchFields />
          <RhythmPresets />
          <RhythmBuilder />
        </div>

        <ToeChart
          class="min-[1240px]:col-start-2 min-[1240px]:row-start-1 min-[1240px]:row-span-2"
        />

        <SummaryPanel class="min-[1240px]:col-start-1 min-[1240px]:row-start-2" />
      </div>
    </main>

    <div
      class="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-2"
      data-testid="bottom-dock"
    >
      <div class="mx-auto max-w-xl min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]">
        <RowProgressBar />
      </div>
    </div>
  </div>
</template>
