<script setup lang="ts">
/**
 * Плашка прогресса и кнопка сброса (тикет #9, §8). Оба блока живут в одном компоненте,
 * потому что оба стоят в общей полосе, прибитой к низу экрана `App.vue` уже сейчас
 * (`class="fixed inset-x-0 bottom-0 ..."`) — заводить второй корень страницы, как
 * `ShareButton.vue`, здесь незачем: спека не разводит их по разным веткам владения.
 *
 * **Плашка не прыгает (§8) — без единой строчки JS под это.** Кнопка отметки — самая
 * нижняя строка внутри `.fixed …  bottom-0`: контейнер растёт от нижнего края вверх
 * по построению CSS (`position: fixed; bottom: 0`, высота авто), поэтому что бы ни
 * появилось выше кнопки — вторая строка короткого текста, строка подтверждения сброса —
 * сама кнопка остаётся на том же расстоянии от низа экрана. «Растёт вверх» — это
 * следствие вёрстки, а не отдельная мера.
 *
 * Плашка прибита к низу и стоит там всегда (§8): отдельного состояния «выключено» нет,
 * первое нажатие «Ряд 1 готов» и есть начало — поэтому дока `RowProgressBar` не прячет
 * себя ни при каком счёте, только меняет подпись кнопки.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { progressWhatText } from '../core/progress'

const HOLD_DELAY = 400 // §8: задержка до старта автоповтора «−1»
const HOLD_STEP = 120 // §8: шаг автоповтора

const { calculation, progressRow, markRow, undoRow, resetProgress } = useToeCalculator()

const current = () => Math.min(progressRow.value + 1, calculation.value.totalRows)
const allDone = () => progressRow.value >= calculation.value.totalRows

/* --- отмена «−1» с автоповтором на удержании --- */
let holdTimer: ReturnType<typeof setTimeout> | undefined
let holdTick: ReturnType<typeof setInterval> | undefined

function clearHold(): void {
  clearTimeout(holdTimer)
  clearInterval(holdTick)
  holdTimer = undefined
  holdTick = undefined
}

function startUndoHold(): void {
  if (progressRow.value <= 0) return
  undoRow() // первое «−1» — сразу на pointerdown, короткий тап тоже должен отменять
  clearHold()
  holdTimer = setTimeout(() => {
    holdTick = setInterval(() => {
      if (progressRow.value <= 0) {
        clearHold()
        return
      }
      undoRow()
    }, HOLD_STEP)
  }, HOLD_DELAY)
}

function stopUndoHold(): void {
  clearHold()
}

onMounted(() => {
  // Таймеры гасятся и на потере фокуса окна — иначе счёт продолжает тикать, пока
  // телефон лежит экраном вверх без отпущенного пальца (например, после блокировки).
  window.addEventListener('blur', stopUndoHold)
})
onUnmounted(() => {
  window.removeEventListener('blur', stopUndoHold)
  clearHold()
})

/* --- сброс: отдельная кнопка вне плашки, с подтверждением на экране --- */
const confirmingReset = ref(false)

function askReset(): void {
  if (progressRow.value <= 0) return
  confirmingReset.value = true
}
function cancelReset(): void {
  confirmingReset.value = false
}
function confirmReset(): void {
  resetProgress()
  confirmingReset.value = false
}
</script>

<template>
  <section data-testid="row-progress-bar" class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2" data-testid="row-progress-reset-row">
      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40"
        data-testid="reset-progress"
        :disabled="progressRow === 0"
        @click="askReset"
      >
        Сбросить счёт
      </button>
      <div
        v-if="confirmingReset"
        class="flex flex-wrap items-center gap-2 text-sm text-slate-700"
        data-testid="reset-progress-confirm"
      >
        <span>Ряд вернётся к нулю, расчёт останется.</span>
        <button
          type="button"
          class="rounded bg-amber-700 px-2 py-1 text-white"
          data-testid="reset-progress-confirm-yes"
          @click="confirmReset"
        >
          Сбросить
        </button>
        <button
          type="button"
          class="rounded border border-slate-300 px-2 py-1"
          data-testid="reset-progress-confirm-cancel"
          @click="cancelReset"
        >
          Отмена
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-3" data-testid="row-progress-dock">
      <div class="flex items-baseline gap-2">
        <span class="text-xl font-bold tabular-nums" data-testid="row-progress-current">
          {{ allDone() ? 'Готово' : `Ряд ${current()} из ${calculation.totalRows}` }}
        </span>
        <span class="ml-auto text-right text-sm text-slate-600" data-testid="row-progress-what">
          {{ progressWhatText(calculation, progressRow) }}
        </span>
      </div>
      <div class="mt-2 flex gap-2">
        <button
          type="button"
          class="h-11 w-16 rounded border border-slate-300 text-base leading-none disabled:opacity-40"
          data-testid="row-progress-undo"
          :disabled="progressRow === 0"
          @pointerdown="startUndoHold"
          @pointerup="stopUndoHold"
          @pointercancel="stopUndoHold"
        >
          −1
        </button>
        <button
          type="button"
          class="h-11 flex-1 rounded bg-slate-900 text-base font-semibold text-white disabled:bg-slate-300"
          data-testid="row-progress-mark"
          :disabled="allDone()"
          @click="markRow"
        >
          {{ allDone() ? 'Готово' : `Ряд ${current()} готов` }}
        </button>
      </div>
    </div>
  </section>
</template>
