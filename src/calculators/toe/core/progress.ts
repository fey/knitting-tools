/**
 * Тексты плашки прогресса (§8, тикет #9): короткая строка о текущем ряде и сообщение
 * по завершении мыска. Подробной построчной инструкции здесь нет и не будет (§7.2,
 * §14) — только то, что уместилось в «Ряд N из M» и одну короткую строку.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeCalculation } from './types'

/**
 * Короткая строка ряда: «убавочный 5 из 11 · в круге станет 40» для убавочного,
 * «промежуточный · в круге 40» для промежуточного.
 *
 * Слово «промежуточный» — из словаря §2, не «без убавок»: словарные слова идут
 * в интерфейс, синоним значит разойтись со спекой.
 */
export function rowShortText(
  calculation: Pick<ToeCalculation, 'rows' | 'decRowsNeeded'>,
  rowNumber: number,
): string {
  const row = calculation.rows[rowNumber - 1]
  if (!row) return ''
  if (row.type === 'dec') {
    return `убавочный ${row.dec} из ${calculation.decRowsNeeded} · в круге станет ${row.stitches}`
  }
  return `промежуточный · в круге ${row.stitches}`
}

/**
 * Сообщение по завершении мыска. **Способ закрытия не называется (тикет #15, §1):**
 * шов и стягивание — выбор мастера, и калькулятор считает петли до закрытия, а не само
 * закрытие. Число петель здесь — `finalReal`, то есть то, что реально осталось.
 *
 * Плашка прибита к низу экрана и стоит там всегда — отдельного состояния «выключено»
 * у неё нет (§8), поэтому у завершения тоже есть текст.
 */
export function toeDoneText(calculation: Pick<ToeCalculation, 'finalReal'>): string {
  return `Мысок связан — закрывай ${calculation.finalReal} петель`
}

/**
 * Короткая строка плашки для отмеченного числа рядов `done`: текущий ряд — `done + 1`,
 * а когда отмечены все ряды мыска — сообщение о завершении.
 */
export function progressWhatText(
  calculation: Pick<ToeCalculation, 'rows' | 'decRowsNeeded' | 'totalRows' | 'finalReal'>,
  done: number,
): string {
  if (done >= calculation.totalRows) return toeDoneText(calculation)
  return rowShortText(calculation, done + 1)
}
