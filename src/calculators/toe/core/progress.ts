/**
 * Прогресс ряда (§8, §10.2): сколько рядов мыска отмечено и что из этого видно на
 * экране — текущий ряд, «всё готово», строка плашки, кромка шторки. Одно понятие —
 * один модуль: composable лишь связывает его с хранилищем и расчётом, а схема
 * и плашка читают готовый вид и сами ничего не выводят.
 *
 * Подробной построчной инструкции здесь нет и не будет (§7.2, §14) — только то, что
 * уместилось в «Ряд N из M» и одну короткую строку.
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

/**
 * Зажим под расчёт (§8): номер ряда сохраняется, а если рядов стало меньше —
 * подтягивается к последнему. Вверх сам не поднимается — клина вверх нет.
 */
export function clampDone(done: number, totalRows: number): number {
  return Math.max(0, Math.min(done, totalRows))
}

/** «Ряд N готов» — первое нажатие и есть начало счёта, отдельного включения нет (§8). */
export function markDone(done: number, totalRows: number): number {
  return clampDone(done + 1, totalRows)
}

/** «−1» (§8); автоповтор на удержании собирает `RowProgressBar.vue`. */
export function undoDone(done: number): number {
  return Math.max(0, done - 1)
}

export type ProgressView = {
  /** Отмечено рядов — уже зажатое под расчёт. */
  done: number
  /** Ряд, который вяжут сейчас; на завершении — последний. */
  current: number
  /** Отмечены все ряды мыска. */
  allDone: boolean
  /** Короткая строка плашки. */
  text: string
  /**
   * Кромка шторки в рядах от кончика мыска (схема перевёрнута, ряд 1 внизу):
   * отмеченное лежит ниже неё. Одна граница на затенение, обводку текущего ряда
   * (строка над ней) и разовую прокрутку страницы.
   */
  shutterRow: number
}

/** Что прогресс показывает на экране при `done` отмеченных рядах. */
export function progressView(
  calculation: Pick<ToeCalculation, 'rows' | 'decRowsNeeded' | 'totalRows' | 'finalReal'>,
  done: number,
): ProgressView {
  const total = calculation.totalRows
  const clamped = clampDone(done, total)
  return {
    done: clamped,
    current: Math.min(clamped + 1, total),
    allDone: clamped >= total,
    text: progressWhatText(calculation, clamped),
    shutterRow: total - clamped,
  }
}

/** Запись прогресса в `localStorage` (§10.2): ряд привязан к расчёту ключом `paramsKey`. */
export type ProgressRecord = { paramsKey: string; row: number }

/**
 * Запись `{ paramsKey, row }`, или `null` — тогда запись стирается. Ряд 0 не хранится:
 * до первой отметки хранить нечего (§10.2 «кручение ритма мусора не создаёт»), а «ряд 0»
 * не должен всплыть вторым источником правды для фолбэка на пустой hash (§10.3).
 */
export function formatProgressRecord(paramsKey: string, done: number): string | null {
  if (done <= 0) return null
  const record: ProgressRecord = { paramsKey, row: done }
  return JSON.stringify(record)
}

/** Запись из хранилища, или `null` — записи нет либо она повреждена. */
export function parseProgressRecord(raw: string | null): ProgressRecord | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const record = parsed as { paramsKey?: unknown; row?: unknown } | null
  const key = record?.paramsKey
  const row = record?.row
  if (typeof key !== 'string' || typeof row !== 'number' || !Number.isFinite(row)) return null
  return { paramsKey: key, row }
}

/**
 * Отмеченный ряд, восстановленный из записи для расчёта с ключом `paramsKey` (§10.2).
 * Битая запись или запись другого расчёта дают 0 — ровно как у расчёта, у которого
 * записи не было вовсе.
 */
export function restoreDone(raw: string | null, paramsKey: string, totalRows: number): number {
  const record = parseProgressRecord(raw)
  if (!record || record.paramsKey !== paramsKey) return 0
  return clampDone(record.row, totalRows)
}
