<script setup lang="ts">
/**
 * Диалог плотности вязания (§4, §6.4, тикет #27). Родной `<dialog>` с `showModal()` —
 * Esc, фокус-ловушка и возврат фокуса на кнопку достаются от платформы, ровно как
 * у диалога отзыва. Закрывают Esc, крестик и клик по подложке, **сразу и без
 * подтверждения**: вписанное уже записано и закрытие переживает.
 *
 * Клик по подложке приходит на сам элемент `<dialog>`, клик по содержимому — на
 * что-то внутри; цель события их и различает.
 *
 * **Поля живут строками, а не числами.** `type="number"` в русской раскладке
 * теряет «37,5»: запятую он либо не принимает, либо отдаёт пустое `value`. Разбор
 * с запятой стоит в ядре (`parseGaugeField`), а поле остаётся текстовым
 * с `inputmode="decimal"` — цифровая клавиатура на телефоне от этого не пропадает.
 *
 * **Плотность ставится живьём, на правку поля**, а не по кнопке «Готово»: «Итог»
 * и схема за диалогом пересчитываются на глазах, и закрытие ничего не решает.
 * Обе плотности пустые — записи нет вовсе (§10.2), и сантиметров на экране нет.
 */
import { ref, watch } from 'vue'
import { DEFAULT_GAUGE_BASE, parseGaugeField } from '../core/gauge'
import { useToeCalculator } from '../useToeCalculator'

const { gauge, setGauge, gaugeDialogOpen } = useToeCalculator()

const dialog = ref<HTMLDialogElement>()

/** Строки полей. Заводятся из записи и переживают закрытие вместе с ней. */
const rowsField = ref(gauge.value ? String(gauge.value.rows) : '')
const stitchesField = ref(gauge.value ? String(gauge.value.stitches) : '')
const baseField = ref(String(gauge.value?.base ?? DEFAULT_GAUGE_BASE))

watch(gaugeDialogOpen, (open) => {
  if (open) dialog.value?.showModal()
  else dialog.value?.close()
})

/**
 * Собирает плотность из трёх полей. Сантиметры появляются **только при обеих
 * плотностях** (§4): по одной половине образца обе оси не переводятся, и показывать
 * длину без обхвата значило бы решить за мастера, что вторую он мерить не станет.
 * База пустая читается как база по умолчанию — её и так никто не меняет.
 */
function apply(): void {
  const rows = parseGaugeField(rowsField.value)
  const stitches = parseGaugeField(stitchesField.value)
  const base = parseGaugeField(baseField.value) ?? DEFAULT_GAUGE_BASE
  setGauge(rows && stitches ? { rows, stitches, base } : null)
}

watch([rowsField, stitchesField, baseField], apply)

/** Убирает плотность целиком: поля пустеют, запись стирается, сантиметры пропадают. */
function clear(): void {
  rowsField.value = ''
  stitchesField.value = ''
  baseField.value = String(DEFAULT_GAUGE_BASE)
}

function onDialogClick(event: MouseEvent): void {
  if (event.target === dialog.value) gaugeDialogOpen.value = false
}

const fields = [
  { key: 'rows', label: 'Рядов', model: rowsField, testId: 'gauge-rows' },
  {
    key: 'stitches',
    label: 'Петель',
    model: stitchesField,
    testId: 'gauge-stitches',
  },
  {
    key: 'base',
    label: 'На скольких сантиметрах считали',
    model: baseField,
    testId: 'gauge-base',
  },
] as const
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="gauge-title"
    class="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl p-5 backdrop:bg-slate-900/40"
    data-testid="gauge-dialog"
    @click="onDialogClick"
    @close="gaugeDialogOpen = false"
  >
    <div class="flex items-start justify-between gap-3">
      <h2 id="gauge-title" class="text-lg font-semibold">Плотность вязания</h2>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500"
        aria-label="Закрыть"
        data-testid="gauge-close"
        @click="gaugeDialogOpen = false"
      >
        ✕
      </button>
    </div>

    <p class="mt-1 text-sm text-slate-600">
      Считается по образцу. Пока не вписана, калькулятор считает в петлях и рядах — сантиметров на
      экране нет.
    </p>

    <div class="mt-4 flex flex-col gap-3">
      <label
        v-for="field in fields"
        :key="field.key"
        class="flex items-center justify-between gap-3 text-sm"
      >
        <span>{{ field.label }}</span>
        <input
          v-model="field.model.value"
          type="text"
          inputmode="decimal"
          class="h-11 w-28 rounded border border-slate-300 px-2 text-right tabular-nums"
          :data-testid="field.testId"
        />
      </label>
    </div>

    <div class="mt-5 flex justify-end gap-2">
      <button
        type="button"
        class="h-11 rounded-full border border-slate-300 px-4 text-sm text-slate-700"
        data-testid="gauge-clear"
        @click="clear"
      >
        Убрать плотность
      </button>
      <button
        type="button"
        class="h-11 rounded-full bg-slate-900 px-5 text-sm font-medium text-white"
        data-testid="gauge-done"
        @click="gaugeDialogOpen = false"
      >
        Готово
      </button>
    </div>
  </dialog>
</template>
