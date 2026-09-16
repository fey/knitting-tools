/**
 * Ряды мыска (§5.2, §5.3). Перенос из прототипа `prototypes/rhythm-input.html`.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Row, Segment } from './types'

/** Убавочный ряд снимает 4 петли с круга — по 2 с каждой половины (§3). */
export const STITCHES_PER_DEC_ROW = 4

/** Сколько убавочных рядов нужно: `N = (начальные − конечные) / 4` (§3). */
export function decRowsFor(initial: number, final: number): number {
  const diff = initial - final
  return diff > 0 ? Math.floor(diff / STITCHES_PER_DEC_ROW) : 0
}

/**
 * Раскладывает сегменты в ряды: убавочный, потом `interval` промежуточных, и так
 * `repeats` раз.
 *
 * Хвост промежуточных перед швом не провязывается — поэтому дефолт даёт 19 рядов,
 * а не 20, а свой ритм одним сегментом `{ интервал 2, повторов 3 }` — 7, а не 8:
 * снимается интервал последнего сегмента целиком. Хвост срезается циклом, а не
 * закрытой формулой `Σ повторов × (1 + интервал) − интервал последнего`: на сегменте
 * с нулём повторов формула уходит в минус, а цикл — нет.
 */
export function buildRows(initial: number, segments: Segment[]): Row[] {
  const rows: Omit<Row, 'n'>[] = []
  let stitches = initial
  let dec = 0

  for (const segment of segments) {
    for (let r = 0; r < segment.repeats; r++) {
      stitches -= STITCHES_PER_DEC_ROW
      dec++
      rows.push({ type: 'dec', dec, stitches })
      for (let i = 0; i < segment.interval; i++) rows.push({ type: 'plain', stitches })
    }
  }

  while (rows.length && rows[rows.length - 1].type === 'plain') rows.pop()

  return rows.map((row, i) => ({ ...row, n: i + 1 }))
}

/** Петель в половине после `r` убавочных рядов (§5.3). */
export function halfStitchesAfter(initial: number, decRows: number): number {
  return initial / 2 - 2 * decRows
}

/** Петель в круге после `r` убавочных рядов (§5.3). */
export function roundStitchesAfter(initial: number, decRows: number): number {
  return initial - STITCHES_PER_DEC_ROW * decRows
}
