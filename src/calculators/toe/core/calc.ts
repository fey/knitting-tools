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
 * Сегменты, которые мысок успеет выполнить: убавочных рядов в них не больше, чем нужно
 * (§9.5, перебор). Лишние шаги не выполняются — схема кончается на конечных петлях,
 * ровно как о том говорит текст предупреждения «до них не дойдёт».
 *
 * Усечение живёт только здесь, на пути построения рядов. `calculation.segments` остаются
 * набранными целиком: их читает конструктор ритма, и усечённый список заставил бы
 * набранные шаги молча исчезнуть с экрана — а управление последним шагом спека отнимать
 * запрещает (§9.5).
 */
function executedSegments(segments: Segment[], decRows: number): Segment[] {
  const done: Segment[] = []
  let left = decRows

  for (const segment of segments) {
    if (left <= 0) break
    const repeats = Math.min(segment.repeats, left)
    done.push({ ...segment, repeats })
    left -= repeats
  }

  return done
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
 *
 * Недобор рисуется честно: мысок встанет на 36 петлях вместо 20. Перебор — наоборот,
 * упирается в конечные петли: лишние шаги не выполняются, и число рядов их не считает.
 */
export function calculateToe(params: ToeParams): ToeCalculation {
  const { initial, final, edge, rhythm } = params
  const decRowsNeeded = decRowsFor(initial, final)
  const segments = segmentsOf(rhythm, decRowsNeeded)
  const decRowsCovered = segments.reduce((sum, s) => sum + s.repeats, 0)
  // Выполненных убавочных рядов не больше, чем нужно: при переборе лишние шаги
  // не выполняются (§9.5). Величина держится локальной — наружу она выходит
  // числом рядов и `finalReal`, а `lack` считается по набранному покрытию.
  const decRowsDone = Math.min(decRowsCovered, decRowsNeeded)
  const rows = buildRows(initial, executedSegments(segments, decRowsDone))

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
    finalReal: initial - decRowsDone * STITCHES_PER_DEC_ROW,
  }
}
