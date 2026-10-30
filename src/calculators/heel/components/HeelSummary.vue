<script setup lang="ts">
/**
 * «Итог» (§6.2): петли пятки, деление «боковая · центр · боковая», число рядов поворота
 * и сколько петель остаётся на спице после него. Четыре числа считаются одним расчётом
 * с описанием по рядам и отвечают за то, что описано под ними.
 */
import { useHeelCalculator } from '../useHeelCalculator'

const { params, heel, turn } = useHeelCalculator()
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="heel-summary">
    <h2 class="text-base font-semibold">Итог</h2>
    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <dd class="text-xl font-semibold tabular-nums" data-testid="summary-heel">{{ heel }}</dd>
        <dt class="text-sm text-slate-600">петли пятки</dt>
      </div>
      <div>
        <dd class="text-xl font-semibold tabular-nums" data-testid="summary-division">
          {{ turn.sides }} · {{ params.center }} · {{ turn.sides }}
        </dd>
        <dt class="text-sm text-slate-600">боковая · центр · боковая</dt>
      </div>
      <div>
        <dd class="text-xl font-semibold tabular-nums" data-testid="summary-rows">
          {{ turn.rows.length }}
        </dd>
        <dt class="text-sm text-slate-600">рядов поворота</dt>
      </div>
      <div>
        <dd class="text-xl font-semibold tabular-nums" data-testid="summary-left">{{ turn.left }}</dd>
        <dt class="text-sm text-slate-600">петель на спице после поворота</dt>
      </div>
    </dl>
  </section>
</template>
