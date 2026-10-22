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
    expect(view.cm?.startHint).toBe('Мысок займёт 4,75 см — начинай его за столько до конца носка')
    expect(view.cm?.length).toBe('4,75 см')
    expect(view.cm?.circumference).toBe('19,35 см')
    // Вдоль — 19 рядов по 0,25 см; поперёк — половина круга, 30 петель по 0,32 см.
    expect(view.cm?.rowTicks.map((t) => t.at)).toEqual([4, 8, 12, 16])
    expect(view.cm?.stitchTicks).toHaveLength(9)
  })

  it('с плотностью замечание о длине меряет в сантиметрах и влито в строку указания', () => {
    // 19 рядов внутри коридора в рядах, но на рыхлой плотности это 9,5 см.
    const view = centimetreView(DEFAULT, { rows: 20, stitches: 16, base: 10 })
    expect(view.cm?.startHint).toBe(
      'Мысок займёт 9,50 см — начинай его за столько до конца носка. Длинноват, проверь ритм',
    )
    // Отдельной строки замечания с плотностью нет: два текста про одну величину не стоят рядом.
    expect(view.lengthNote).toBeNull()
  })
})
