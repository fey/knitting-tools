/**
 * Расчёт мыска целиком (§5). Перенос из прототипа `prototypes/rhythm-input.html`.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Rhythm, Segment, ToeCalculation, ToeParams } from './types'
import { buildRows, decRowsFor, STITCHES_PER_DEC_ROW } from './rows'
import { presetByCode } from './presets'

/** Дефолтный расчёт первого экрана (§4): 60 → 20, кромка 1, через ряд. */
export const DEFAULT_PARAMS: ToeParams = {
  initial: 60,
  final: 20,
  edge: 1,
  rhythm: { kind: 'preset', name: 'even' },
}

/**
 * Сегменты ритма. У пресета они выводятся от числа убавочных рядов при каждом расчёте —
 * поэтому пресет пересчитывается живьём сам; свой ритм отдаётся как набран (§5.4, §5.5).
 */
export function segmentsOf(rhythm: Rhythm, decRowsNeeded: number): Segment[] {
  // Свой ритм копируется: результат расчёта — снимок, а не та же память, что у
  // набранных сегментов. Иначе правка сегмента меняла бы уже посчитанное.
  if (rhythm.kind === 'custom') return rhythm.segments.map((s) => ({ ...s }))
  return presetByCode(rhythm.name).segments(decRowsNeeded)
}

/**
 * Минимум конечных петель при этой кромке: `4 + 4 × кромка` — 4 / 8 / 12 (§9.4).
 * Убавочному ряду на половине нужно `кромка + 2 + 2 + кромка` петель.
 *
 * Это предикат, а не запрет: состояния «расчёт не строится» в калькуляторе нет (§9.1),
 * сочетание петель и кромки чинит интерфейс.
 */
export function minFinalStitches(edge: number): number {
  return STITCHES_PER_DEC_ROW + STITCHES_PER_DEC_ROW * edge
}

/**
 * Считает мысок. Результат строится всегда — недобор и перебор сегментов приходят
 * величинами `lack` и `finalReal`, а не отказом считать (§9.5).
 */
export function calculateToe(params: ToeParams): ToeCalculation {
  const { initial, final, edge, rhythm } = params
  const decRowsNeeded = decRowsFor(initial, final)
  const segments = segmentsOf(rhythm, decRowsNeeded)
  const decRowsCovered = segments.reduce((sum, s) => sum + s.repeats, 0)
  const rows = buildRows(initial, segments)

  return {
    initial,
    final,
    edge,
    rhythm,
    segments,
    decRowsNeeded,
    decRowsCovered,
    rows,
    totalRows: rows.length,
    lack: decRowsNeeded - decRowsCovered,
    finalReal: initial - decRowsCovered * STITCHES_PER_DEC_ROW,
  }
}
