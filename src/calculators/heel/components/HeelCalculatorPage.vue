<script setup lang="ts">
/**
 * Страница калькулятора поворота французской пятки — подстраница `/french-heel/` (§11).
 * Вход многостраничной сборки, как у мыска: роутера нет.
 *
 * Порядок блоков (§6): шапка, заголовок, вводка, поля, «Итог», схема, описание по рядам.
 * Телефонный порядок сверху вниз — порядок в DOM. От 800 px страница встаёт в две
 * колонки: слева поля, справа «Итог», схема и описание. Ширина левой колонки — число, а не
 * шрифтовая единица, чтобы замеры в e2e не зависели от раннера.
 */
import HeelFields from './HeelFields.vue'
import HeelSummary from './HeelSummary.vue'
import TurnChart from './TurnChart.vue'
import TurnRows from './TurnRows.vue'
import AppHeader from '../../../shared/AppHeader.vue'
import FeedbackButton from '../../../shared/feedback/FeedbackButton.vue'
import AppFooter from '../../../shared/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <AppHeader>
      <template #nav>
        <a class="text-sm text-slate-700" href="../" data-testid="back-to-home">← Калькуляторы</a>
      </template>
      <FeedbackButton />
    </AppHeader>

    <main class="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-4 pb-12 min-[800px]:max-w-3xl">
      <h1 class="text-xl font-semibold">Поворот французской пятки</h1>

      <p class="max-w-[42rem] text-sm text-slate-600" data-testid="intro">
        Поворот пятки — короткие ряды поверх связанной стенки: центральная часть забирает петли
        боковых, и после каждой убавки провязывается ещё одна петля. Впиши начальные петли носка и
        центральную часть — ниже схема поворота и расписано по рядам, как вязать. Стенка и клинья
        здесь не считаются.
      </p>

      <div
        class="flex flex-col gap-4 min-[800px]:grid min-[800px]:grid-cols-[300px_minmax(0,1fr)] min-[800px]:items-start min-[800px]:gap-6"
        data-testid="layout-grid"
      >
        <HeelFields class="min-[800px]:col-start-1" />
        <div class="flex flex-col gap-4 min-[800px]:col-start-2" data-testid="result-column">
          <HeelSummary />
          <TurnChart />
          <TurnRows />
        </div>
      </div>

      <AppFooter class="mt-4" />
    </main>
  </div>
</template>
