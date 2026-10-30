/**
 * Состояние калькулятора поворота пятки, одно на страницу. Здесь и только здесь —
 * Vue: ядро в `core/` про него не знает.
 *
 * Состояния «расчёта нет» не бывает: параметры всегда сходящиеся (§8), потому что
 * несходящийся ввод `fieldRules.ts` чинит до того, как он сюда попадёт. Параметры
 * живут только в памяти страницы — hash и «Поделиться» вне области первой версии (§1).
 */
import { computed, reactive } from 'vue'
import { DEFAULT_INITIAL, defaultCenter, heelStitches } from './core/fieldRules'
import { computeTurn, type Side } from './core/turn'

interface HeelParams {
  initial: number
  center: number
  firstSide: Side
}

const params = reactive<HeelParams>({
  initial: DEFAULT_INITIAL,
  center: defaultCenter(heelStitches(DEFAULT_INITIAL)),
  firstSide: 'rs',
})

const heel = computed(() => heelStitches(params.initial))
const turn = computed(() =>
  computeTurn({ heel: heel.value, center: params.center, firstSide: params.firstSide }),
)

/** Пара «начальные + центр» меняется одним присвоением: промежуточное состояние не сходится. */
function setParams(patch: Partial<HeelParams>): void {
  Object.assign(params, patch)
}

export function useHeelCalculator() {
  return { params, heel, turn, setParams }
}
