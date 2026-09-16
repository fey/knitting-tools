/**
 * Правила полей ввода (§4, §9.3, §9.4) — но только та часть, что не чинит ввод.
 *
 * `converges` отвечает на вопрос «схема пересчитывается живьём от этого набора
 * значений или нет» (§9.3): поле в фокусе двигает схему, только пока набранное
 * сходится само с собой. Починка несходящегося — уже тикет #7, здесь её нет:
 * ни подтягивания к ближайшему значению, ни текстов вида «18 не сходится».
 *
 * `finalCandidates` — числа для живой подсказки у конечных петель (§4):
 * `20 (шаг 4: 16, 20, 24)`. Подсказка не чинит и не выбирает «лучшее» значение —
 * она просто перечисляет, какие конечные петли вообще достижимы от текущих
 * начальных и попадают в обычный диапазon 16–24, без арбитража тай-брейков.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeParams } from './types'
import { minFinalStitches } from './calc'

/** Потолок полей — защита от лишнего нуля в опечатке, без сообщений (§9.4). */
export const MAX_STITCHES = 200

/** Обычный диапазон конечных петель под трикотажный шов (§4). */
const TYPICAL_FINAL_MIN = 16
const TYPICAL_FINAL_MAX = 24

function isPositiveEvenInt(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n % 2 === 0
}

/**
 * Сходится ли набор параметров сам с собой (§9.4): оба чётные, конечные меньше
 * начальных, разница кратна 4, конечных хватает на кромку, оба в пределах потолка.
 *
 * Это чистый предикат — он не выбирает, что подставить вместо несходящегося
 * значения. Выбор ближайшего сходящегося и его текст — тикет #7.
 */
export function converges(params: Pick<ToeParams, 'initial' | 'final' | 'edge'>): boolean {
  const { initial, final, edge } = params
  if (!isPositiveEvenInt(initial) || !isPositiveEvenInt(final)) return false
  if (initial > MAX_STITCHES || final > MAX_STITCHES) return false
  if (final >= initial) return false
  if ((initial - final) % 4 !== 0) return false
  if (final < minFinalStitches(edge)) return false
  return true
}

/**
 * Достижимые конечные петли от текущих начальных (§4): значения, кратные шагу
 * убавок и попадающие в диапазон 16–24. Список пересчитывается от `initial`
 * и `edge`, а не выбирает «ближайшее к 20» — так подсказке не нужен тай-брейк
 * на нечётном остатке, тай-брейки — дело тикета #7.
 *
 * Диапазон тесен для маленького мыска (детский, кукольный) — тогда подсказка
 * отдаёт всё, что вообще достижимо, самое близкое к диапазону сверху.
 */
export function finalCandidates(initial: number, edge: number): number[] {
  const min = minFinalStitches(edge)
  const achievable: number[] = []
  for (let v = initial - 4; v >= min; v -= 4) achievable.push(v)
  achievable.reverse()

  const typical = achievable.filter((v) => v >= TYPICAL_FINAL_MIN && v <= TYPICAL_FINAL_MAX)
  return typical.length > 0 ? typical : achievable.slice(-3)
}
