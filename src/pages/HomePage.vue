<script setup lang="ts">
/**
 * Витрина разделов — корень сайта (§11). Отложенная, пока калькулятор был один,
 * она понадобилась вместе со вторым мыском: конструкций у мыска несколько, и каждой
 * нужен свой адрес и своя страница.
 *
 * **Роутера здесь нет и не появилось.** Витрина — отдельный вход многостраничной
 * сборки Vite, ссылки на калькуляторы обычные, относительные. Hash целиком остаётся
 * расчёту (§10.1), и переход между страницами — обычная навигация браузера.
 *
 * **Разделов два: калькуляторы и справочники.** Калькулятор считает расчёт мастера
 * и несёт его в адресе; справочник — готовая таблица, в нём считать нечего.
 *
 * **Списки стоят прямо в разметке**, а не в данных: строк в них одна-две, и таблица
 * купила бы только лишний файл. Станет больше — переедут в данные.
 *
 * Шапка та же, что у калькулятора (§6.4), но левое гнездо пусто: возвращаться с корня некуда,
 * а название сайта стоит заголовком страницы в сантиметре ниже — повторять его в шапке значит
 * написать одно и то же дважды подряд. «Поделиться» на витрине нет — делятся расчётом, а расчёта
 * здесь нет; «Оставить отзыв» есть, он про сайт целиком. Ссылка на канал приходит вместе
 * с самой шапкой, страница её не расставляет.
 */
import AppHeader from '../shared/AppHeader.vue'
import FeedbackButton from '../shared/feedback/FeedbackButton.vue'
import AppFooter from '../shared/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <AppHeader>
      <FeedbackButton />
    </AppHeader>

    <main class="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-4 pb-12 min-[800px]:max-w-3xl">
      <h1 class="text-xl font-semibold">Калькуляторы для вязания</h1>

      <p class="max-w-[42rem] text-sm text-slate-600">
        Расчёты, которые обычно считают на бумаге в клетку, и таблицы, которые ищут по чужим
        описаниям. Каждый раздел живёт на своей странице.
      </p>

      <section class="flex flex-col gap-3">
        <h2 class="font-semibold">Калькуляторы</h2>
        <p class="max-w-[42rem] text-sm text-slate-600">
          Параметры расчёта лежат в адресе — ссылкой делятся как есть.
        </p>
        <ul class="flex flex-col gap-3" data-testid="calculator-list">
          <li>
            <!-- Ссылка относительная: страница стоит в `/knitting-tools/`, и абсолютный
                 путь пришлось бы повторять базой сборки. -->
            <a
              class="flex flex-col gap-1 rounded-lg border border-slate-300 p-4 max-w-[42rem]"
              href="toe-band/"
              data-testid="calculator-link-toe-band"
            >
              <span class="font-medium">Ленточный мысок носка</span>
              <span class="text-sm text-slate-600">
                Вязание сверху вниз: начальные и конечные петли, кромка и ритм убавок — на выходе
                схема, число рядов и счёт связанного.
              </span>
            </a>
          </li>
          <li>
            <a
              class="flex flex-col gap-1 rounded-lg border border-slate-300 p-4 max-w-[42rem]"
              href="french-heel/"
              data-testid="calculator-link-french-heel"
            >
              <span class="font-medium">Поворот французской пятки</span>
              <span class="text-sm text-slate-600">
                Начальные петли и центральная часть — на выходе итог, схема поворота и описание по рядам:
                сколько петель вязать до убавки и сколько останется.
              </span>
            </a>
          </li>
        </ul>
        <p class="max-w-[42rem] text-sm text-slate-600">
          Круглый мысок, звёздочка, вязание от мыска, стенка пятки и клинья пока не считаются —
          под них встанут отдельные калькуляторы.
        </p>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="font-semibold">Справочники</h2>
        <ul class="flex flex-col gap-3" data-testid="reference-list">
          <li>
            <a
              class="flex flex-col gap-1 rounded-lg border border-slate-300 p-4 max-w-[42rem]"
              href="sock-cast-on/"
              data-testid="reference-link-sock-cast-on"
            >
              <span class="font-medium">Набор петель на носок</span>
              <span class="text-sm text-slate-600">
                Сколько начальных петель набрать по паре размеров EU — под пряжу 400, 200
                и 250–280 м/100 г. Таблицы Opal и Regia и формула от обхвата стопы рядом.
              </span>
            </a>
          </li>
        </ul>
      </section>

      <AppFooter />
    </main>
  </div>
</template>
