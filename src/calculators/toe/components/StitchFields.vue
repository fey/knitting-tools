<script setup lang="ts">
/**
 * Поля петель и кромки (тикеты #4 и #7). Три ручки, которые двигают схему и число
 * рядов живьём: начальные и конечные петли, кромка.
 *
 * **Момент правки — уход фокуса и `Enter`, без таймера (§9.3).** Пока поле в фокусе,
 * набранное сходящееся значение коммитится живьём, а несходящееся не трогает схему
 * вовсе: на экране остаётся последний сходящийся расчёт, и «6» по дороге к «60»
 * не превращается в «8». Кнопки `−4`/`+4` и кромка коммитят сразу — они шагают
 * по сходящимся значениям по построению.
 *
 * Подписи-пояснения (что за петли, что за кромка) живут здесь же, у своих ручек, а не
 * во вводке: вводка отвечает на «что это за инструмент», подпись — на «что мне сюда
 * вписать», и второй вопрос возникает уже у поля (§6.1).
 *
 * **Подпись у конечных петель называет оба закрытия — числами, и только ими (тикет #15).**
 * Шов и стягивание — не два разных мыска, а один и тот же мысок с разным концом, но эту
 * рамку несут §1 и вводка: подпись у ручки отвечает на «что мне сюда вписать». Предупреждения
 * здесь нет и не будет — восьмёрка названа нормой русской практики в §9.6.
 *
 * **Кнопки `−4` и `+4` несут свой шаг на себе (тикет #14).** Шаг 4 стоял в §4
 * с самого начала, но на кнопках об этом не было сказано ни слова: куда прыгнет
 * число, было видно только после нажатия. Подпись — числом, а не словом: мишень
 * остаётся 44 px, и ряд «кнопка · поле · кнопка» не расползается на телефоне.
 *
 * **Числа чинятся подтягиванием с подписью, выборы — гашением с причиной (§9.2).**
 * Оба поля петель чинит нормализатор ядра, кромка чинится не подменой значения,
 * а неактивной кнопкой с причиной. Вторая ветка того же конфликта — конечные,
 * набранные при уже выбранной кромке 2, — идёт через нормализатор и подтягивается.
 */
import { computed, ref, watch } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { minFinalStitches } from '../core/calc'
import {
  converges,
  edgeWhyOff,
  finalCandidates,
  MAX_STITCHES,
  normalizeStitchFields,
  type EdgeValue,
  type Fix,
  type NormalizedFields,
} from '../core/fieldRules'

const STEP = 4

const { params, setStitches } = useToeCalculator()

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

/** Подпись починки — по одной на поле: две подписи под одним полем показывать негде. */
const initialFix = ref<Fix | null>(null)
const finalFix = ref<Fix | null>(null)

function commitIfConverges(patch: Partial<{ initial: number; final: number }>): void {
  const next = { initial: params.initial, final: params.final, edge: params.edge, ...patch }
  if (!converges(next)) return
  setStitches(next)
}

function parseDraft(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/**
 * Применяет отчёт нормализатора к полям.
 *
 * Черновики выставляются явно, а не через `watch` за `params`: пустое поле
 * возвращает прошлое значение, `params` при этом не меняются, watcher не срабатывает —
 * и поле осталось бы пустым на экране.
 *
 * Подписи только ставятся и не гасятся: `Enter` и следующий за ним уход фокуса
 * приходят парой, второй проход видит уже починенное значение и стёр бы подпись,
 * поставленную первым.
 */
function apply(result: NormalizedFields): void {
  // Пара идёт одной сменой расчёта: два присвоения подряд провели бы расчёт через
  // несходящееся промежуточное состояние и стёрли бы отмеченный ряд (§8).
  setStitches({ initial: result.initial, final: result.final })
  initialDraft.value = String(result.initial)
  finalDraft.value = String(result.final)

  const nextInitial = result.fixes.find((fix) => fix.field === 'initial')
  const nextFinal = result.fixes.find((fix) => fix.field === 'final')
  if (nextInitial) initialFix.value = nextInitial
  if (nextFinal) finalFix.value = nextFinal
}

/**
 * Починка поля: уход фокуса или `Enter`. Поле, которого не трогали, идёт в нормализатор
 * своим сходящимся значением из `params`, а не черновиком — правится набранное,
 * а не то, что человек уже отпустил.
 */
function repair(field: 'initial' | 'final'): void {
  apply(
    normalizeStitchFields(
      {
        initial: field === 'initial' ? parseDraft(initialDraft.value) : params.initial,
        final: field === 'final' ? parseDraft(finalDraft.value) : params.final,
        edge: params.edge,
      },
      params,
    ),
  )
}

/** Сосед из подписи — касаемая кнопка: тот же путь починки, но с выбранным значением. */
function pickNeighbour(field: 'initial' | 'final', value: number): void {
  if (field === 'initial') {
    initialDraft.value = String(value)
    initialFix.value = null
  } else {
    finalDraft.value = String(value)
    finalFix.value = null
  }
  repair(field)
}

/** Подпись держится до следующего касания поля — дальше она говорит о прошлом. */
function clearFixes(): void {
  initialFix.value = null
  finalFix.value = null
}

function onInitialInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  initialDraft.value = raw
  initialFix.value = null
  const n = parseDraft(raw)
  if (n !== null) commitIfConverges({ initial: n })
}

function onFinalInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  finalDraft.value = raw
  finalFix.value = null
  const n = parseDraft(raw)
  if (n !== null) commitIfConverges({ final: n })
}

function stepInitial(delta: number): void {
  clearFixes()
  params.initial += delta
}

function stepFinal(delta: number): void {
  clearFixes()
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

/**
 * Почему кромка недоступна, или `null`. Выбор гасится с причиной, а конечные петли
 * при этом не трогаются вовсе (§9.5): подтягивание — ветка обратного конфликта,
 * когда кромка уже выбрана, а конечные набирают заново.
 */
function whyOff(value: EdgeValue): string | null {
  return edgeWhyOff(value, params.final)
}

function setEdge(value: EdgeValue): void {
  if (whyOff(value)) return
  clearFixes()
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
          −4
        </button>
        <input
          id="initial-stitches"
          type="text"
          inputmode="numeric"
          class="w-20 rounded border border-slate-300 px-2 py-2 text-center"
          data-testid="initial-stitches"
          :value="initialDraft"
          @input="onInitialInput"
          @blur="repair('initial')"
          @keyup.enter="repair('initial')"
        />
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="initial-plus"
          :disabled="!canIncInitial"
          @click="stepInitial(STEP)"
        >
          +4
        </button>
      </div>
      <p class="mt-1 text-sm text-slate-500" data-testid="initial-hint">чётное</p>
      <p v-if="initialFix" class="mt-1 text-sm text-amber-700" data-testid="initial-fix">
        {{ initialFix.message }}<template v-if="initialFix.neighbour !== null">
          ·
          <button
            type="button"
            class="rounded border border-amber-700 px-2 py-1 text-sm leading-none"
            data-testid="initial-fix-alt"
            @click="pickNeighbour('initial', initialFix.neighbour)"
          >
            {{ initialFix.neighbour }}
          </button></template
        >
      </p>
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
          −4
        </button>
        <input
          id="final-stitches"
          type="text"
          inputmode="numeric"
          class="w-20 rounded border border-slate-300 px-2 py-2 text-center"
          data-testid="final-stitches"
          :value="finalDraft"
          @input="onFinalInput"
          @blur="repair('final')"
          @keyup.enter="repair('final')"
        />
        <button
          type="button"
          class="h-11 w-11 rounded border border-slate-300 text-lg leading-none disabled:opacity-40"
          data-testid="final-plus"
          :disabled="!canIncFinal"
          @click="stepFinal(STEP)"
        >
          +4
        </button>
      </div>
      <p class="mt-1 text-sm text-slate-500" data-testid="final-hint">
        {{ params.final }}<template v-if="finalHintCandidates.length">
          (шаг 4: {{ finalHintCandidates.join(', ') }})</template
        >
        · обычно 16–24
      </p>
      <p class="mt-1 text-sm text-slate-500" data-testid="final-explainer">
        Под трикотажный шов оставляют 16–24 петли, для стягивания — около 8.
      </p>
      <p v-if="finalFix" class="mt-1 text-sm text-amber-700" data-testid="final-fix">
        {{ finalFix.message }}<template v-if="finalFix.neighbour !== null">
          ·
          <button
            type="button"
            class="rounded border border-amber-700 px-2 py-1 text-sm leading-none"
            data-testid="final-fix-alt"
            @click="pickNeighbour('final', finalFix.neighbour)"
          >
            {{ finalFix.neighbour }}
          </button></template
        >
      </p>
    </div>

    <div class="mt-4">
      <span class="block text-sm font-medium text-slate-700">Кромка</span>
      <!-- Объяснение кромки стоит здесь, а не во вводке (§6.1): вводка называет инструмент
           и конструкцию целиком, а подпись у ручки читают в момент выбора. Двойка названа
           отдельной конструкцией, а не «на петлю больше», — так её называют источники (§2). -->
      <p class="mt-1 text-sm text-slate-500" data-testid="edge-explainer">
        Кромка — сколько петель остаётся с краю половины до места убавки. Единица — обычный
        ленточный мысок, двойка — широкий мысок, отдельная конструкция, а не «на петлю больше».
      </p>
      <div class="mt-2 flex gap-2" role="radiogroup" aria-label="Кромка">
        <button
          v-for="option in edgeOptions"
          :key="option.value"
          type="button"
          class="rounded border px-3 py-2 text-left text-sm"
          :class="[
            params.edge === option.value
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 text-slate-700',
            whyOff(option.value) ? 'opacity-40' : '',
          ]"
          :data-testid="`edge-${option.value}`"
          :aria-pressed="params.edge === option.value"
          :disabled="whyOff(option.value) !== null"
          @click="setEdge(option.value)"
        >
          <span class="block">{{ option.label }}</span>
          <span
            v-if="whyOff(option.value)"
            class="mt-1 block text-xs text-slate-500"
            :data-testid="`edge-${option.value}-why-off`"
            >{{ whyOff(option.value) }}</span
          >
        </button>
      </div>
    </div>
  </section>
</template>
