/**
 * Состояние калькулятора поворота пятки, одно на страницу. Здесь и только здесь —
 * Vue и браузер (`location`, `history`): ядро в `core/` про них не знает.
 *
 * Состояния «расчёта нет» не бывает: параметры всегда сходящиеся (§8), потому что
 * несходящийся ввод `fieldRules.ts` чинит до того, как он сюда попадёт, а несходящуюся
 * ссылку — `parseHash` (§9.2).
 */
import { computed, reactive, readonly, watch } from 'vue'
import { heelStitches } from './core/fieldRules'
import { formatHash, parseHash, type HeelParams } from './core/hash'
import { shareText } from './core/text'
import { computeTurn } from './core/turn'
import type { SharePayload } from '../../shared/share'

/** Параметры из hash, а без него — дефолт (§9.3). Битый hash чинится по параметру. */
const params = reactive<HeelParams>(parseHash(typeof location === 'undefined' ? '' : location.hash))

const heel = computed(() => heelStitches(params.initial))
const turn = computed(() =>
  computeTurn({ heel: heel.value, center: params.center, firstSide: params.firstSide }),
)

/**
 * Переписывает hash живьём (§9.1). Сравнение с текущим — чтобы не писать в адрес
 * холостую запись там, где он уже канонический.
 */
function syncHash(): void {
  if (typeof history === 'undefined' || typeof location === 'undefined') return
  const canonical = formatHash(params)
  if (location.hash !== canonical) history.replaceState(null, '', canonical)
}

// Битая входящая ссылка и пустой hash отражаются в адресе сразу при загрузке.
syncHash()

// Дефолтный `flush: 'pre'` сводит пару «начальные + центр» в одну запись адреса.
watch(params, syncHash, { deep: true })

/**
 * **Один вход правки расчёта.** Пара «начальные + центр» меняется одним присвоением:
 * промежуточное состояние не сходится.
 */
function setParams(patch: Partial<HeelParams>): void {
  Object.assign(params, patch)
}

/** Что уходит в «Поделиться» (§9.4): зовётся в момент клика, расчёт уже починен. */
function sharePayload(): SharePayload {
  return {
    hash: formatHash(params),
    text: shareText({ heel: heel.value, center: params.center, rows: turn.value.rows.length }),
  }
}

export function useHeelCalculator() {
  return { params: readonly(params), heel, turn, setParams, sharePayload }
}
