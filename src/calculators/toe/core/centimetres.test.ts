import { describe, expect, it } from 'vitest'
import { calculateToe } from './calc'
import { centimetreView } from './centimetres'
import type { Gauge } from './gauge'

/** Дефолт первого экрана: 60 → 20, кромка 1, через ряд — 19 рядов. */
const DEFAULT = calculateToe({ initial: 60, final: 20, edge: 1, rhythm: { kind: 'preset', name: 'even' } })
/** Носочная плотность из §9.6. */
const GAUGE: Gauge = { rows: 40, stitches: 31, base: 10 }

describe('сантиметровый вид расчёта (§4, §7, §9.6)', () => {
  it('без плотности сантиметров нет, а замечание о длине меряет в рядах', () => {
    const long = calculateToe({ initial: 60, final: 20, edge: 1, rhythm: { kind: 'custom', segments: [{ interval: 3, repeats: 10 }] } })
    expect(centimetreView(DEFAULT, null)).toEqual({ lengthNote: null, cm: null })
    expect(centimetreView(long, null).lengthNote).toBe('Больше 30 рядов — мысок выйдет длинным, проверь ритм')
  })

  it('с плотностью — длина, обхват и засечки обеих линеек', () => {
    const view = centimetreView(DEFAULT, GAUGE)
    expect(view.lengthNote).toBeNull()
    expect(view.cm?.length).toBe('4,75 см')
    expect(view.cm?.circumference).toBe('19,35 см')
    // Вдоль — 19 рядов по 0,25 см; поперёк — половина круга, 30 петель по 0,32 см.
    expect(view.cm?.rowTicks.map((t) => t.at)).toEqual([4, 8, 12, 16])
    expect(view.cm?.stitchTicks).toHaveLength(9)
  })

  it('с плотностью замечание о длине меряет в сантиметрах, а не в рядах', () => {
    // 19 рядов внутри коридора в рядах, но на рыхлой плотности это 9,5 см.
    expect(centimetreView(DEFAULT, { rows: 20, stitches: 16, base: 10 }).lengthNote).toBe(
      'Больше 7 см — мысок выйдет длинным, проверь ритм',
    )
  })
})
