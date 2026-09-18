<script setup lang="ts">
/**
 * Кнопка плотности — открывает диалог (§6.4, тикет #27). Стоит в «Итоге», и это
 * **зацепка, без которой плотность не нашли бы**: дефолта у неё нет, первый экран
 * о сантиметрах не говорит ничем, а вводке живые числа и ручки запрещены (§6.1).
 *
 * **В шапку кнопка не встала, и это замер, а не вкус.** Ряд там уже в три строки
 * на телефоне (возврат, «Поделиться», отзыв, значок кода, канал), пятая кнопка
 * уводит его в четвёртую — и вводка уезжает с первого экрана, чего §6.1 не допускает.
 * Место плотности среди кнопок страницы было верным по смыслу и неверным по мере.
 *
 * **Жёлтая со знаком, пока плотность не вписана, зелёная — когда вписана.** Знак
 * стоит рядом с цветом намеренно: цветом одним состояние не называют.
 *
 * Подпись у пустой плотности называет не ручку, а то, что получится: она же и есть
 * строка-приглашение, которой иначе пришлось бы стоять отдельно от кнопки.
 */
import { computed } from 'vue'
import { useToeCalculator } from '../useToeCalculator'

const { gauge, gaugeDialogOpen } = useToeCalculator()

const filled = computed(() => gauge.value !== null)
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm"
    :class="
      filled
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
        : 'border-amber-500 bg-amber-50 text-amber-900'
    "
    aria-haspopup="dialog"
    data-testid="gauge-button"
    @click="gaugeDialogOpen = true"
  >
    <span aria-hidden="true">{{ filled ? '✓' : '!' }}</span>
    <span>{{ filled ? 'Плотность вписана' : 'Сантиметры — впиши плотность' }}</span>
  </button>
</template>
