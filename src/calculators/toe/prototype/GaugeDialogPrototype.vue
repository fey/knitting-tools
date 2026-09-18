<script setup lang="ts">
/**
 * ПРОТОТИП, тикет #27. Диалог плотности: три поля — ряды, петли, база в сантиметрах
 * (дефолт 10). Механика снята с диалога отзыва (§6.4): родной `<dialog>`, Esc,
 * фокус-ловушка и возврат фокуса достаются от платформы.
 *
 * Дефолта у плотности нет: поля пустые, пока не вписали. Ничего не хранится —
 * прототипы не персистят, а решение «только localStorage» проверяется не здесь.
 */
import { ref, watch } from 'vue'
import { base, dialogOpen, rowsPer, stitchesPer } from './gauge'

const el = ref<HTMLDialogElement | null>(null)

watch(dialogOpen, (open) => {
  const d = el.value
  if (!d) return
  if (open && !d.open) d.showModal()
  if (!open && d.open) d.close()
})

/** Поля пустые, пока не вписали: пустая строка значит «плотности нет», а не ноль. */
function num(e: Event): number | null {
  const raw = (e.target as HTMLInputElement).value.replace(',', '.').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}
</script>

<template>
  <dialog
    ref="el"
    class="rounded border border-slate-300 p-0 backdrop:bg-slate-900/40"
    data-testid="proto-gauge-dialog"
    @close="dialogOpen = false"
    @click.self="dialogOpen = false"
  >
    <div class="flex w-[min(92vw,26rem)] flex-col gap-3 p-4">
      <h2 class="text-base font-semibold">Плотность вязания</h2>
      <p class="text-sm text-slate-600">
        Считается по образцу. Пока не вписана, калькулятор считает только в петлях и рядах.
      </p>

      <label class="flex items-center justify-between gap-3 text-sm">
        <span>Рядов</span>
        <input
          class="h-11 w-28 rounded border border-slate-300 px-2 text-right tabular-nums"
          inputmode="decimal"
          :value="rowsPer ?? ''"
          data-testid="proto-gauge-rows"
          @input="rowsPer = num($event)"
        />
      </label>

      <label class="flex items-center justify-between gap-3 text-sm">
        <span>Петель</span>
        <input
          class="h-11 w-28 rounded border border-slate-300 px-2 text-right tabular-nums"
          inputmode="decimal"
          :value="stitchesPer ?? ''"
          data-testid="proto-gauge-stitches"
          @input="stitchesPer = num($event)"
        />
      </label>

      <label class="flex items-center justify-between gap-3 text-sm">
        <span>На скольких сантиметрах считали</span>
        <input
          class="h-11 w-28 rounded border border-slate-300 px-2 text-right tabular-nums"
          inputmode="decimal"
          :value="base"
          data-testid="proto-gauge-base"
          @input="base = num($event) ?? 10"
        />
      </label>

      <div class="mt-1 flex justify-end gap-2">
        <button
          type="button"
          class="h-11 rounded border border-slate-300 px-3 text-sm"
          @click="((rowsPer = null), (stitchesPer = null), (base = 10))"
        >
          Очистить
        </button>
        <button
          type="button"
          class="h-11 rounded bg-slate-900 px-4 text-sm text-white"
          @click="dialogOpen = false"
        >
          Готово
        </button>
      </div>
    </div>
  </dialog>
</template>
