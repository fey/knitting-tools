<script setup lang="ts">
/**
 * Описание поворота словами по рядам (§6.3). Перед списком — строка про деление,
 * затем каждый ряд с подписью стороны. Изнаночные ряды выделены фоном: сторону видно
 * без чтения подписи (решение прототипа, §14).
 */
import { useHeelCalculator } from '../useHeelCalculator'
import { divisionText, rowText, sideLabel } from '../core/text'

const { params, heel, turn } = useHeelCalculator()
</script>

<template>
  <section class="flex flex-col gap-2" data-testid="turn-description">
    <h2 class="text-base font-semibold">Как вязать по рядам</h2>
    <p class="text-sm" data-testid="turn-division">
      {{ divisionText(heel, turn.sides, params.center) }}
    </p>
    <ol class="overflow-hidden rounded border border-slate-200" data-testid="turn-rows">
      <li
        v-for="row in turn.rows"
        :key="row.n"
        class="flex gap-3 border-b border-slate-200 px-3 py-2 last:border-b-0"
        :class="row.side === 'ws' ? 'bg-sky-100' : 'bg-white'"
        :data-side="row.side"
        data-testid="turn-row"
      >
        <span class="w-6 shrink-0 text-right tabular-nums text-slate-500">{{ row.n }}</span>
        <span>
          <b class="whitespace-nowrap" :class="row.side === 'ws' ? 'text-sky-900' : ''">{{
            sideLabel(row.side)
          }}</b
          >: {{ rowText(row) }}
        </span>
      </li>
    </ol>
    <p class="text-sm text-slate-500">
      Первая петля ряда 1 — крайняя петля стенки: она уже входит в число петель ряда.
    </p>
  </section>
</template>
