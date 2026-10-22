<script setup lang="ts">
/**
 * Поля поворота (§6.1): начальные петли, центральная часть и сторона ряда 1.
 *
 * **Момент правки — тот же, что у мыска: уход фокуса и `Enter`, без таймера (§8).**
 * Пока поле в фокусе, набранное сходящееся значение пересчитывает страницу живьём,
 * а несходящееся её не трогает: «6» по дороге к «60» не превращается в «12».
 * Починка случается один раз, на выходе из поля, и подпись говорит, что изменилось.
 *
 * Начальные петли чинятся первыми, центр — следом, от уже починенных начальных:
 * смена пятки может сама сделать прошлый центр несходящимся.
 */
import { computed, ref, watch } from 'vue'
import { useHeelCalculator } from '../useHeelCalculator'
import {
  centerRange,
  converges,
  DEFAULT_INITIAL,
  normalizeFields,
  type Fix,
} from '../core/fieldRules'
import type { Side } from '../core/turn'

const { params, heel, setParams } = useHeelCalculator()

const initialDraft = ref(String(params.initial))
const centerDraft = ref(String(params.center))

watch(
  () => params.initial,
  (value) => (initialDraft.value = String(value)),
)
watch(
  () => params.center,
  (value) => (centerDraft.value = String(value)),
)

/** Подпись починки — по одной на поле; держится до следующего касания поля. */
const initialFix = ref<Fix | null>(null)
const centerFix = ref<Fix | null>(null)

function parseDraft(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function onInput(field: 'initial' | 'center', event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  if (field === 'initial') {
    initialDraft.value = raw
    initialFix.value = null
  } else {
    centerDraft.value = raw
    centerFix.value = null
  }
  const n = parseDraft(raw)
  if (n === null) return
  const next = { initial: params.initial, center: params.center, [field]: n }
  if (converges(next)) setParams(next)
}

function repair(): void {
  const result = normalizeFields(
    { initial: parseDraft(initialDraft.value), center: parseDraft(centerDraft.value) },
    { initial: params.initial, center: params.center },
  )
  setParams({ initial: result.initial, center: result.center })
  // Черновик подхватывает значение следом, но если оно не изменилось, `watch` молчит.
  initialDraft.value = String(result.initial)
  centerDraft.value = String(result.center)
  // Подпись, уже стоящая под другим полем, не стирается: уход из второго поля
  // не должен гасить сообщение о первом, пока его не успели прочитать.
  initialFix.value = result.fixes.find((fix) => fix.field === 'initial') ?? initialFix.value
  centerFix.value = result.fixes.find((fix) => fix.field === 'center') ?? centerFix.value
}

function setSide(side: Side): void {
  params.firstSide = side
}

const range = computed(() => centerRange(heel.value))
const centerHint = computed(
  () =>
    `${heel.value % 2 === 0 ? 'чётный' : 'нечётный'}, от ${range.value.min} до ${range.value.max}`,
)

const SIDES: Array<{ value: Side; label: string; testid: string }> = [
  { value: 'rs', label: 'Лицевой', testid: 'first-side-rs' },
  { value: 'ws', label: 'Изнаночный', testid: 'first-side-ws' },
]
</script>

<template>
  <section class="rounded border border-slate-200 p-4" data-testid="heel-fields">
    <h2 class="text-base font-semibold">Петли и центр</h2>

    <div class="mt-3">
      <label class="block text-sm font-medium text-slate-700" for="initial-stitches">
        Начальные петли
      </label>
      <input
        id="initial-stitches"
        type="text"
        inputmode="numeric"
        class="mt-1 w-24 rounded border border-slate-300 px-2 py-2 text-center"
        data-testid="initial-stitches"
        :value="initialDraft"
        @input="onInput('initial', $event)"
        @blur="repair"
        @keyup.enter="repair"
      />
      <p class="mt-1 text-sm text-slate-500" data-testid="initial-hint">
        чётные, весь круг носка · на пятку идёт половина — {{ heel }}
        (по умолчанию {{ DEFAULT_INITIAL }})
      </p>
      <p v-if="initialFix" class="mt-1 text-sm text-amber-700" data-testid="initial-fix">
        {{ initialFix.message }}
      </p>
    </div>

    <div class="mt-4">
      <label class="block text-sm font-medium text-slate-700" for="center-stitches">
        Центральная часть
      </label>
      <input
        id="center-stitches"
        type="text"
        inputmode="numeric"
        class="mt-1 w-24 rounded border border-slate-300 px-2 py-2 text-center"
        data-testid="center-stitches"
        :value="centerDraft"
        @input="onInput('center', $event)"
        @blur="repair"
        @keyup.enter="repair"
      />
      <p class="mt-1 text-sm text-slate-500" data-testid="center-hint">
        петель в середине пятки: {{ centerHint }}
      </p>
      <p v-if="centerFix" class="mt-1 text-sm text-amber-700" data-testid="center-fix">
        {{ centerFix.message }}
      </p>
    </div>

    <fieldset class="mt-4">
      <legend class="text-sm font-medium text-slate-700">Ряд 1</legend>
      <div class="mt-1 flex gap-2" data-testid="first-side">
        <button
          v-for="side in SIDES"
          :key="side.value"
          type="button"
          class="h-11 flex-1 rounded border px-3 text-sm"
          :class="
            params.firstSide === side.value
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700'
          "
          :aria-pressed="params.firstSide === side.value"
          :data-testid="side.testid"
          @click="setSide(side.value)"
        >
          {{ side.label }}
        </button>
      </div>
      <p class="mt-1 text-sm text-slate-500">
        Лицевой ряд 1 — после стенки, законченной изнаночным рядом, и наоборот. Число рядов и
        петель от стороны не зависит.
      </p>
    </fieldset>
  </section>
</template>
