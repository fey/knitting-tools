<script setup lang="ts">
/**
 * Справочник «набор петель на носок по размеру» — подстраница `/sock-cast-on/` (§11).
 *
 * Вид — вариант A прототипа `.scratch/sock-sizes/prototypes/cast-on-table.html`: все пары
 * EU разом, а наборы трёх источников стоят рядом. Одного «правильного» числа здесь нет:
 * на 400 м/100 г Opal и Regia расходятся на ступень в половине размеров, а формула с 10 %
 * свободы выше обоих. Справочник показывает расхождение, а не прячет его — выбор за мастером.
 *
 * Толщина выбирается переключателем, а не стоит колонками рядом: шесть числовых колонок
 * на телефоне в ширину не встают. Выбор — состояние экрана: в адрес не пишется, делиться
 * здесь нечем, страница открывается на носочной пряже 400 м/100 г.
 *
 * Шапка — как на витрине, без «Поделиться»: расчёта на странице нет.
 */
import { computed, ref } from 'vue'
import AppHeader from '../../../shared/AppHeader.vue'
import FeedbackButton from '../../../shared/feedback/FeedbackButton.vue'
import AppFooter from '../../../shared/AppFooter.vue'
import { PAIRS, YARNS, castOn } from '../core/castOn'

const yarnIndex = ref(0)
const yarn = computed(() => YARNS[yarnIndex.value]!)

/** Opal и Regia совпали во всех строках — колонка одна, «Opal = Regia». */
const sameTables = computed(() => yarn.value.opal.every((n, i) => n === yarn.value.regia[i]))

const rows = computed(() =>
  PAIRS.map((pair, i) => ({
    pair,
    opal: yarn.value.opal[i]!,
    regia: yarn.value.regia[i]!,
    formula: castOn(pair, yarn.value.gauge),
  })),
)
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <AppHeader>
      <template #nav>
        <a class="text-sm text-slate-700" href="../" data-testid="back-to-home">← Все разделы</a>
      </template>
      <FeedbackButton />
    </AppHeader>

    <main class="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-4 pb-12">
      <h1 class="text-xl font-semibold">Набор петель на носок</h1>

      <p class="text-sm text-slate-600">
        Сколько начальных петель набрать на носок сверху вниз — по паре обувных размеров
        и толщине пряжи. Рядом три источника: таблицы Opal и Regia и формула от обхвата стопы.
        Числа — ориентир: точнее всего считать по своему образцу.
      </p>

      <div class="grid grid-cols-3 gap-2" role="group" aria-label="Толщина пряжи" data-testid="yarn-switch">
        <button
          v-for="(y, i) in YARNS"
          :key="y.key"
          type="button"
          class="flex flex-col items-center rounded-lg border px-1 py-2 text-sm leading-tight"
          :class="
            i === yarnIndex
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-white text-slate-900'
          "
          :aria-pressed="i === yarnIndex"
          :data-testid="`yarn-${y.key}`"
          @click="yarnIndex = i"
        >
          <span class="font-medium">{{ y.name }}</span>
          <span class="text-xs" :class="i === yarnIndex ? 'text-slate-300' : 'text-slate-500'">
            {{ y.tag }}
          </span>
        </button>
      </div>

      <p class="-mt-2 text-sm text-slate-600" data-testid="yarn-brands">{{ yarn.brands }}</p>

      <table class="w-full border-collapse tabular-nums" data-testid="cast-on-table">
        <thead>
          <tr class="border-b-2 border-slate-200 align-bottom text-xs font-semibold text-slate-500">
            <th class="py-2 pr-1 text-left">Пара EU</th>
            <th class="px-1 py-2 text-right">
              Стопа, см
              <span class="block font-normal">по ГОСТ</span>
            </th>
            <template v-if="sameTables">
              <th class="px-1 py-2 text-right" data-testid="col-maker">Opal = Regia</th>
            </template>
            <template v-else>
              <th class="px-1 py-2 text-right" data-testid="col-maker">Opal</th>
              <th class="px-1 py-2 text-right" data-testid="col-maker">Regia</th>
            </template>
            <th class="py-2 pl-1 text-right text-red-800" data-testid="col-formula">
              Формула
              <span class="block font-normal text-slate-500">{{ yarn.gauge }} п., 10 %</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.pair.eu"
            class="border-b border-slate-200"
            data-testid="cast-on-row"
          >
            <td class="py-2 pr-1 text-left">
              <span class="font-semibold">{{ row.pair.eu }}</span>
              <span class="block text-xs text-slate-500">носок {{ row.pair.sock }}</span>
            </td>
            <td class="px-1 py-2 text-right text-sm text-slate-600">{{ row.pair.gostCm }}</td>
            <td
              class="px-1 py-2 text-right"
              :class="{ 'bg-emerald-50': row.opal === row.formula }"
            >
              {{ row.opal }}
            </td>
            <td
              v-if="!sameTables"
              class="px-1 py-2 text-right"
              :class="{ 'bg-emerald-50': row.regia === row.formula }"
            >
              {{ row.regia }}
            </td>
            <td class="py-2 pl-1 text-right font-bold text-red-800" data-testid="formula-cell">
              {{ row.formula }}
            </td>
          </tr>
        </tbody>
      </table>

      <p class="-mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span class="inline-block size-3 rounded-sm border border-emerald-200 bg-emerald-50" />
        совпало с формулой
      </p>

      <p
        v-if="yarn.caveat"
        class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        data-testid="yarn-caveat"
      >
        {{ yarn.caveat }}
      </p>

      <section class="flex flex-col gap-2 text-sm text-slate-600">
        <h2 class="font-semibold text-slate-900">Откуда числа</h2>
        <p>
          <b class="font-medium text-slate-900">Opal и Regia</b> — таблицы производителей как есть,
          сами они называют их ориентиром. На пряже 400 м/100 г их носок облегает туже формулы:
          на стопе от 25 см он уже стопы на 14–21 %.
        </p>
        <p>
          <b class="font-medium text-slate-900">Формула</b> — обхват стопы минус 10 % на облегание
          гладью, умноженный на плотность и округлённый до кратного 4. Обхват — средний для этой
          длины стопы по таблицам Kate Atherley. Своя мерка стопы точнее средней.
        </p>
        <p>
          Все числа кратны 4: так набор делится на четыре спицы, пополам на пятку, и ленточный мысок
          сходится без подгонки.
        </p>
      </section>

      <AppFooter />
    </main>
  </div>
</template>
