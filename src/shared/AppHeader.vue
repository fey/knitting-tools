<script setup lang="ts">
/**
 * Шапка страницы (§6.4, тикет #24) — полоса над заголовком, общая на весь проект:
 * она пережила появление витрины разделов и переживёт второй калькулятор, поэтому
 * живёт в `shared/`, а не внутри мыска.
 *
 * **Два гнезда: слева навигация, справа кнопки.** Левый край был резервом «под то, что
 * бывает слева, — название сайта, возврат к витрине разделов», и витрина этот резерв заняла:
 * на подстранице калькулятора слева стоит возврат к витрине. На самой витрине гнездо пусто —
 * возвращаться с корня некуда, а название сайта стоит её заголовком. Кнопки остались
 * прижатыми вправо.
 *
 * **Ряд с переносом.** Замеры на телефоне: доступно 358 px, «Поделиться» 115 (распухает
 * до 177 на «Ссылка скопирована»), «Оставить отзыв» 143, «Телеграм-канал» 142 — втроём
 * с зазорами 424. На странице калькулятора шапка честно встаёт в три строки: возврат
 * сверху, под ним ряд кнопок, который не влезает в одну строку и переносится сам.
 * Это и есть обещанный перенос — он лучше горизонтальной прокрутки и лучше урезанной
 * до стрелки навигации, по которой не понять, куда ведёт. На витрине слева пусто,
 * кнопки две — там шапка в одну строку.
 *
 * **Шапка не липнет к верху.** Кнопки в ней не нужны для работы с калькулятором, а низ
 * экрана уже занят плашкой прогресса (§8): прибить ещё и верх значит зажать схему
 * с двух сторон на телефоне, где её и листают.
 *
 * **Ссылка на канал стоит прямо здесь, а не в слоте.** Слоты в шапке есть затем, что
 * содержимое гнёзд у страниц разное: «Поделиться» живёт только там, где есть чем делиться.
 * Канал же один на весь сайт и пришёл бы на каждую новую страницу сам — расставлять его
 * по страницам значит заводить обязанность, о которой забудут. Идёт он последним в ряду:
 * первыми стоят ручки самой страницы, и только за ними — уход наружу.
 *
 * **Исходный код — значком, и стоит он замыкающим.** Подпись словами стоила бы ряду
 * ещё полторы сотни пикселей, а на витрине ряд идёт в одну строку с запасом меньше
 * полусотни: значок влезает, слово — нет. Значок один на весь сайт и приходит вместе
 * с шапкой, как и канал. Место в конце — про вид ряда: значок между подписанными
 * кнопками разрывает их строй, а замыкающим читается как точка. Правый край полосы
 * держит теперь он.
 *
 * Линия снизу — не оформление: полоса с кнопками, не относящимися к расчёту, обязана
 * отличаться от расчёта, иначе «Оставить отзыв» читается как ручка калькулятора.
 * Та же граница, что у плашки прогресса, только с другой стороны.
 */

// ПРОТОТИП (prototype/settings-entry): четыре варианта входа в «Настройки», `?variant=A..D`.
import { computed } from 'vue'
import SettingsDialog from './settings/SettingsDialog.vue'
import PrototypeSwitcher from './settings/PrototypeSwitcher.vue'
import { gaugeWords, useSettings } from './settings/useSettings'
import { variant } from './settings/variant'

/** Страница пересчитывает экран по плотности — только тогда вход жёлтый (Q13). */
const props = defineProps<{ usesGauge?: boolean }>()
const { gauge, settingsOpen } = useSettings()
const warn = computed(() => props.usesGauge && !gauge.value)
const dev = import.meta.env.DEV

const PILL = 'shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-sm'
const ICON = 'relative flex size-11 shrink-0 items-center justify-center rounded-full border shadow-sm'
const tone = computed(() =>
  warn.value ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white text-slate-900',
)
function open(): void {
  settingsOpen.value = true
}
</script>

<template>
  <header class="border-b border-slate-200" data-testid="app-header">
    <div
      class="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 px-4 py-2 min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
    >
      <div class="flex items-center gap-3" data-testid="header-nav">
        <slot name="nav" />
        <button
          v-if="variant === 'C' || variant === 'F'"
          type="button"
          :class="[PILL, tone, 'flex items-center gap-1.5 px-3']"
          aria-haspopup="dialog"
          @click="open"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg><span>Настройки</span><span v-if="warn" aria-hidden="true">!</span>
        </button>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-3" data-testid="header-actions">
        <button
          v-if="variant === 'A' || variant === 'E'"
          type="button"
          :class="[PILL, tone, 'flex items-center gap-1.5']"
          aria-haspopup="dialog"
          @click="open"
        >
          <span v-if="warn" aria-hidden="true">!</span><span>Настройки</span>
        </button>
        <slot />
        <!-- Новая вкладка: канал — адрес чужого сайта, и уход на него не обязан
             уносить с собой открытый расчёт. -->
        <a
          class="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-900 shadow-sm"
          href="https://t.me/feycot_the_knitterman"
          target="_blank"
          rel="noopener"
          data-testid="channel-link"
        >
          Телеграм-канал
        </a>

        <button
          v-if="variant === 'B'"
          type="button"
          :class="[ICON, tone]"
          aria-haspopup="dialog"
          :aria-label="warn ? 'Настройки: плотность не вписана' : 'Настройки'"
          @click="open"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span
            v-if="warn"
            class="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
            aria-hidden="true"
            >!</span
          >
        </button>

        <!-- Значок вместо подписи: ряд на витрине идёт в одну строку, и слово
             «Исходный код» её бы разорвало. Имя ссылке даёт `aria-label` — без него
             значок безымянен. Мера 44 px — под палец на телефоне.
             Стоит он замыкающим: значок в середине ряда разрывает строй подписанных
             кнопок, а в конце читается как точка. -->
        <a
          class="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 shadow-sm"
          href="https://github.com/fey/knitting-tools"
          target="_blank"
          rel="noopener"
          aria-label="Исходный код на GitHub"
          data-testid="source-link"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </a>
      </div>
    </div>
    <!-- D: полоса под шапкой — состояние плотности словами и вход в настройки. -->
    <div
      v-if="variant === 'D'"
      class="border-t"
      :class="warn ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'"
    >
      <div
        class="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-1.5 text-sm min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
      >
        <span>
          <template v-if="gauge">Плотность: {{ gaugeWords(gauge) }}</template>
          <template v-else-if="warn">! Плотность не вписана — сантиметров нет</template>
          <template v-else>Плотность не вписана</template>
        </span>
        <button type="button" class="shrink-0 font-medium underline underline-offset-2" aria-haspopup="dialog" @click="open">
          Настройки
        </button>
      </div>
    </div>
    <!-- E, F: плашка-предупреждение только там, где плотность пересчитывает экран, и только пока её нет. -->
    <div
      v-if="(variant === 'E' || variant === 'F') && warn"
      class="border-t border-amber-300 bg-amber-50 text-amber-900"
      data-testid="gauge-warning"
    >
      <div
        class="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2 text-sm min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
      >
        <span><span aria-hidden="true">! </span>Плотность не вписана — сантиметров нет, счёт в петлях и рядах</span>
        <button
          type="button"
          class="shrink-0 rounded-full border border-amber-500 bg-white px-3 py-1 font-medium"
          aria-haspopup="dialog"
          @click="open"
        >
          Вписать
        </button>
      </div>
    </div>
    <SettingsDialog />
    <PrototypeSwitcher v-if="dev" />
  </header>
</template>
