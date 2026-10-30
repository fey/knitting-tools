/**
 * Правила полей пятки (спека пятки §4, §8): границы, чётность, починка ввода.
 *
 * Страница чинит ввод, а не запрещает его: каждое несходящееся число подтягивается
 * к ближайшему сходящемуся, и подпись говорит, что и почему изменилось. Порядок правок
 * тот же, что у мыска: сначала начальные петли — поле-факт, — потом центр.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */

export const MIN_INITIAL = 12
/** Потолок поля — защита от лишнего нуля в опечатке, а не валидация: сообщения у него нет. */
export const MAX_INITIAL = 200
export const DEFAULT_INITIAL = 60

/** Боковая часть не уже 2 петель — решение проекта, источники минимума не называют (§4). */
const MIN_SIDE = 2

export interface Fix {
  field: 'initial' | 'center'
  message: string
}

export interface HeelFields {
  initial: number
  center: number
}

export interface NormalizedFields extends HeelFields {
  fixes: Fix[]
}

/** На пятку идёт половина начальных петель. */
export function heelStitches(initial: number): number {
  return initial / 2
}

/** Центр по умолчанию: 6, а при нечётных петлях пятки — 5 (спека пятки §4). */
export function defaultCenter(heel: number): number {
  return heel % 2 === 0 ? 6 : 5
}

export interface CenterRange {
  min: number
  max: number
}

/** Допустимые центры — от `min` до `max` с шагом 2, чётности пятки. Непусты при пятке от 6. */
export function centerRange(heel: number): CenterRange {
  return { min: heel % 2 === 0 ? 2 : 3, max: heel - 2 * MIN_SIDE }
}

export function isInitialValid(initial: number): boolean {
  return Number.isInteger(initial) && initial % 2 === 0 && initial >= MIN_INITIAL && initial <= MAX_INITIAL
}

export function isCenterValid(heel: number, center: number): boolean {
  const { min, max } = centerRange(heel)
  return Number.isInteger(center) && center >= min && center <= max && (heel - center) % 2 === 0
}

/** Сходится ли пара целиком — только такую пару показывает страница. */
export function converges({ initial, center }: HeelFields): boolean {
  return isInitialValid(initial) && isCenterValid(heelStitches(initial), center)
}

function fixInitial(raw: number): { value: number; message: string | null } {
  if (raw > MAX_INITIAL) return { value: MAX_INITIAL, message: null }
  if (raw < MIN_INITIAL) {
    return {
      value: MIN_INITIAL,
      message: `Начальных должно быть не меньше ${MIN_INITIAL}: на пятку идёт половина, а ей нужны две боковые части и центр. Ближайшее — ${MIN_INITIAL}`,
    }
  }
  if (raw % 2 === 1) {
    return { value: raw - 1, message: `${raw} не делится пополам. Ближайшее чётное — ${raw - 1}` }
  }
  return { value: raw, message: null }
}

function fixCenter(heel: number, raw: number): { value: number; message: string | null } {
  const { min, max } = centerRange(heel)
  if (raw < min) {
    return { value: min, message: `Центр — не меньше ${min}. Ближайший сходящийся — ${min}` }
  }
  if (raw > max) {
    return {
      value: max,
      message: `Центр урезан до ${max}: на каждую боковую часть нужно хотя бы ${MIN_SIDE} петли`,
    }
  }
  if ((heel - raw) % 2 !== 0) {
    return {
      value: raw + 1,
      message: `Центр ${raw} не сходится: ${heel} − ${raw} = ${heel - raw}, боковые части выйдут неравными. Ближайший сходящийся — ${raw + 1}`,
    }
  }
  return { value: raw, message: null }
}

/**
 * Приводит пару к сходящейся. `null` — пустое или нечисловое поле: оно возвращается
 * к последнему сходящемуся значению молча, дефолт здесь ни при чём (§8). Если пятка
 * при этом сменилась и прошлый центр перестал сходиться, его чинят как обычное число.
 */
export function normalizeFields(
  raw: { initial: number | null; center: number | null },
  last: HeelFields,
): NormalizedFields {
  const fixes: Fix[] = []

  let initial = last.initial
  if (raw.initial !== null) {
    const fixed = fixInitial(Math.round(raw.initial))
    initial = fixed.value
    if (fixed.message) fixes.push({ field: 'initial', message: fixed.message })
  }

  const fixed = fixCenter(heelStitches(initial), raw.center === null ? last.center : Math.round(raw.center))
  if (fixed.message) fixes.push({ field: 'center', message: fixed.message })

  return { initial, center: fixed.value, fixes }
}
