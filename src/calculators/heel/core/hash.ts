/**
 * Параметры поворота в hash адреса (спека пятки §9). Канонический вид —
 * `#s=60&c=6&side=rs`: начальные петли, центральная часть, сторона ряда 1.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно. `location`
 * и `history` читает `useHeelCalculator.ts`, здесь только строки.
 */
import {
  centerRange,
  DEFAULT_INITIAL,
  defaultCenter,
  heelStitches,
  isCenterValid,
  isInitialValid,
} from './fieldRules'
import type { Side } from './turn'

export interface HeelParams {
  initial: number
  center: number
  firstSide: Side
}

export const DEFAULT_HEEL_PARAMS: Readonly<HeelParams> = Object.freeze({
  initial: DEFAULT_INITIAL,
  center: defaultCenter(heelStitches(DEFAULT_INITIAL)),
  firstSide: 'rs',
})

/** Hash расчёта вместе с решёткой. */
export function formatHash({ initial, center, firstSide }: HeelParams): string {
  return `#s=${initial}&c=${center}&side=${firstSide}`
}

function parseIntParam(raw: string | null): number | null {
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) ? n : null
}

/**
 * Центр по умолчанию, поставленный в границы пятки. На узкой пятке (6, 7, 8 петель)
 * дефолт 6 или 5 сам не сходится — берётся ближайший допустимый; чётность при этом
 * не ломается, у границ она та же, что у дефолта.
 */
function fallbackCenter(heel: number): number {
  const { min, max } = centerRange(heel)
  return Math.min(max, Math.max(min, defaultCenter(heel)))
}

/**
 * Разбирает hash в сходящиеся параметры (§9.2). Разбор идёт по параметру, в порядке
 * правок полей (начальные → центр от уже разобранных начальных → сторона): не прошедшее
 * заменяется дефолтом, остальное из ссылки живёт — молча. Подтягивания к ближайшему
 * здесь нет: это правило набранного в поле, а не пришедшего в ссылке (§8).
 */
export function parseHash(hash: string): HeelParams {
  const query = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)

  const rawInitial = parseIntParam(query.get('s'))
  const initial = rawInitial !== null && isInitialValid(rawInitial) ? rawInitial : DEFAULT_INITIAL

  const heel = heelStitches(initial)
  const rawCenter = parseIntParam(query.get('c'))
  const center = rawCenter !== null && isCenterValid(heel, rawCenter) ? rawCenter : fallbackCenter(heel)

  const side = query.get('side')
  const firstSide: Side = side === 'ws' ? 'ws' : 'rs'

  return { initial, center, firstSide }
}
