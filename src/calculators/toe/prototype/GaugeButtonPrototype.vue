<script setup lang="ts">
/**
 * ПРОТОТИП, тикет #27. Кнопка, открывающая настройки плотности. Жёлтая со знаком, пока
 * плотность не вписана, зелёная — когда вписана.
 *
 * Прототип ставит её **сразу в двух местах** — в шапке и в «Итоге»: текст решения
 * говорит «в итого», а диалог открывает шапка, и какое из двух мест живое, дешевле
 * увидеть, чем обсудить. В работу пойдёт одно.
 */
import { dialogOpen, gaugeFilled } from './gauge'

defineProps<{ place: 'header' | 'summary' }>()
</script>

<template>
  <button
    type="button"
    class="flex h-11 items-center gap-2 rounded border px-3 text-sm"
    :class="
      gaugeFilled
        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
        : 'border-amber-400 bg-amber-50 text-amber-900'
    "
    :data-testid="`proto-gauge-button-${place}`"
    @click="dialogOpen = true"
  >
    <span aria-hidden="true">{{ gaugeFilled ? '✓' : '!' }}</span>
    <span>{{ gaugeFilled ? 'Плотность вписана' : 'Плотность не вписана' }}</span>
  </button>
</template>
