<script setup lang="ts">
/**
 * Поля петель и кромки (тикет #4). Три ручки, которые двигают схему и число
 * рядов живьём: начальные и конечные петли, кромка.
 *
 * Починка несходящегося ввода — тикет #7, здесь её нет: поля принимают любое
 * чётное число с клавиатуры, и, пока значение не сходится само с собой
 * (§9.4), схема остаётся на последнем сходящемся расчёте (§9.3) — набранное
 * просто не коммитится в состояние. Ни подтягивания к ближайшему значению,
 * ни текстов вида «18 не сходится», ни гашения кромки 2 — здесь.
 *
 * Кнопки `−`/`+` и кромка коммитят сразу: шаг 4 и границы степперов устроены
 * так, что они «шагают по сходящимся значениям по построению» (§9.3) — им
 * незачем ждать проверки.
 */
import { computed, ref, watch } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { minFinalStitches } from '../core/calc'
import { converges, finalCandidates, MAX_STITCHES } from '../core/fieldRules'

const STEP = 4

const { params } = useToeCalculator()

/** Черновики полей: то, что реально набрано, может не совпадать со сходящимся `params`. */
const initialDraft = ref(String(params.initial))
const finalDraft = ref(String(params.final))

// Кнопки, кромка и разбор ссылки меняют params напрямую — черновик подхватывает следом.
watch(
  () => params.initial,
  (value) => {
    initialDraft.value = String(value)
  },
)
watch(
  () => params.final,
  (value) => {
    finalDraft.value = String(value)
  },
)

function commitIfConverges(patch: Partial<{ initial: number; final: number }>): void {
  const next = { initial: params.initial, final: params.final, edge: params.edge, ...patch }
  if (!converges(next)) return
  params.initial = next.initial
  params.final = next.final
}

function onInitialInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  initialDraft.value = raw
  if (raw.trim() === '') return
  const n = Number(raw)
  if (Number.isFinite(n)) commitIfConverges({ initial: n })
}

function onFinalInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  finalDraft.value = raw
  if (raw.trim() === '') return
  const n = Number(raw)
  if (Number.isFinite(n)) commitIfConverges({ final: n })
}

function stepInitial(delta: number): void {
  params.initial += delta
}

function stepFinal(delta: number): void {
  params.final += delta
}

const canDecInitial = computed(() => params.initial - STEP > params.final)
const canIncInitial = computed(() => params.initial + STEP <= MAX_STITCHES)
const canDecFinal = computed(() => params.final - STEP >= minFinalStitches(params.edge))
const canIncFinal = computed(() => params.final + STEP < params.initial && params.final + STEP <= MAX_STITCHES)

const finalHintCandidates = computed(() => finalCandidates(params.initial, params.edge))

const edgeOptions = [
  { value: 0 as const, label: '0' },
  { value: 1 as const, label: '1' },
  { value: 2 as const, label: '2 · широкий мысок' },
]

function setEdge(value: 0 | 1 | 2): void {
  params.edge = value
}
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="stitch-fields">
    <h2 class="text-base font-semibold">Петли и кромка</h2>

    <div class="mt-3">
      <label class="block text-sm font-medium text-slate-700" for="initial-stitches">Начальные петли</label>
      <div class="mt-1 flex items-center gap-2">
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="initial-minus"
          :disabled="!canDecInitial"
          @click="stepInitial(-STEP)"
        >
          −
        </button>
        <input
          id="initial-stitches"
          type="text"
          inputmode="numeric"
          class="w-20 rounded border border-slate-300 px-2 py-2 text-center"
          data-testid="initial-stitches"
          :value="initialDraft"
          @input="onInitialInput"
        />
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="initial-plus"
          :disabled="!canIncInitial"
          @click="stepInitial(STEP)"
        >
          +
        </button>
      </div>
      <p class="mt-1 text-sm text-slate-500" data-testid="initial-hint">чётное</p>
    </div>

    <div class="mt-4">
      <label class="block text-sm font-medium text-slate-700" for="final-stitches">Конечные петли</label>
      <div class="mt-1 flex items-center gap-2">
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="final-minus"
          :disabled="!canDecFinal"
          @click="stepFinal(-STEP)"
        >
          −
        </button>
        <input
          id="final-stitches"
          type="text"
          inputmode="numeric"
          class="w-20 rounded border border-slate-300 px-2 py-2 text-center"
          data-testid="final-stitches"
          :value="finalDraft"
          @input="onFinalInput"
        />
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="final-plus"
          :disabled="!canIncFinal"
          @click="stepFinal(STEP)"
        >
          +
        </button>
      </div>
      <p class="mt-1 text-sm text-slate-500" data-testid="final-hint">
        {{ params.final }}<template v-if="finalHintCandidates.length">
          (шаг 4: {{ finalHintCandidates.join(', ') }})</template
        >
        · обычно 16–24
      </p>
      <p class="mt-1 text-sm text-slate-500" data-testid="final-explainer">
        Под трикотажный шов оставляют 16–24 петли. Привычное стягивание с 8 петлями — другой мысок.
      </p>
    </div>

    <div class="mt-4">
      <span class="block text-sm font-medium text-slate-700">Кромка</span>
      <div class="mt-1 flex gap-2" role="radiogroup" aria-label="Кромка">
        <button
          v-for="option in edgeOptions"
          :key="option.value"
          type="button"
          class="rounded border px-3 py-2 text-sm"
          :class="
            params.edge === option.value
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700'
          "
          :data-testid="`edge-${option.value}`"
          :aria-pressed="params.edge === option.value"
          @click="setEdge(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </section>
</template>
