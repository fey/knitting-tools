/**
 * Ряды мыска (§5.2, §5.3). Перенос из прототипа `prototypes/rhythm-input.html`,
 * расширен направлением вязания (§11 спеки toe-up): у cuff-down ряды убывают,
 * у toe-up растут, и оба направления строятся одним циклом.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Direction, Row, Segment } from './types'

/** Убавочный (прибавочный) ряд меняет круг на 4 петли — по 2 с каждой половины (§3). */
export const STITCHES_PER_DEC_ROW = 4

/**
 * Сколько убавочных (прибавочных) рядов нужно: `N = |начальные − конечные| / 4` (§3).
 * У toe-up начальных меньше конечных, поэтому модуль.
 */
export function decRowsFor(initial: number, final: number): number {
  const diff = Math.abs(initial - final)
  return diff > 0 ? Math.floor(diff / STITCHES_PER_DEC_ROW) : 0
}

/**
 * Раскладывает сегменты в ряды. Первым идёт рабочий ряд (убавочный или прибавочный),
 * потом `interval` промежуточных, и так `repeats` раз.
 *
 * Оба направления строятся одним циклом:
 *
 * - cuff-down: первый ряд — убавочный, петли убывают; хвост промежуточных перед
 *   закрытием не провязывается (дефолт 19 рядов, а не 20);
 * - toe-up: перед всем стоит **промежуточный ряд 1** (§3 спеки toe-up), петли растут;
 *   хвост промежуточных перед стопой не провязывается, поэтому мысок кончается
 *   прибавочным рядом.
 *
 * Хвост срезается циклом, а не закрытой формулой `Σ повторов × (1 + интервал)
 * − интервал последнего`: на сегменте с нулём повторов формула уходит в минус,
 * а цикл — нет.
 */
export function buildRows(initial: number, segments: Segment[], direction: Direction = 'cuff-down'): Row[] {
  const rows: Omit<Row, 'n'>[] = []
  const dec = direction === 'toe-up'
  let stitches = initial
  let counter = 0

  if (dec) rows.push({ type: 'plain', stitches })

  for (const segment of segments) {
    for (let r = 0; r < segment.repeats; r++) {
      stitches += dec ? STITCHES_PER_DEC_ROW : -STITCHES_PER_DEC_ROW
      counter++
      rows.push(dec ? { type: 'inc', inc: counter, stitches } : { type: 'dec', dec: counter, stitches })
      for (let i = 0; i < segment.interval; i++) rows.push({ type: 'plain', stitches })
    }
  }

  while (rows.length && rows[rows.length - 1].type === 'plain') rows.pop()

  return rows.map((row, i) => ({ ...row, n: i + 1 }))
}

/** Петель в половине после `r` убавочных (прибавочных) рядов (§5.3). */
export function halfStitchesAfter(initial: number, decRows: number, direction: Direction = 'cuff-down'): number {
  return direction === 'toe-up'
    ? initial / 2 + 2 * decRows
    : initial / 2 - 2 * decRows
}

/** Петель в круге после `r` убавочных (прибавочных) рядов (§5.3). */
export function roundStitchesAfter(initial: number, decRows: number, direction: Direction = 'cuff-down'): number {
  return direction === 'toe-up'
    ? initial + STITCHES_PER_DEC_ROW * decRows
    : initial - STITCHES_PER_DEC_ROW * decRows
}
