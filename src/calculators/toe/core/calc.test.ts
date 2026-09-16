import { describe, expect, it } from 'vitest'
import { calculateToe, DEFAULT_PARAMS, minFinalStitches } from './calc'
import { buildRows, halfStitchesAfter, roundStitchesAfter } from './rows'
import type { PresetName, Rhythm, ToeParams } from './types'

const preset = (name: PresetName): Rhythm => ({ kind: 'preset', name })

const toe = (params: Partial<ToeParams> = {}) =>
  calculateToe({ ...DEFAULT_PARAMS, ...params })

describe('число рядов и убавочные ряды', () => {
  // §12.1, случай 2 — дефолт первого экрана.
  it('60 → 20 через ряд: 10 убавочных рядов, 19 рядов всего', () => {
    const result = toe()
    expect(result.decRowsNeeded).toBe(10)
    expect(result.decRowsCovered).toBe(10)
    expect(result.totalRows).toBe(19)
    expect(result.finalReal).toBe(20)
    expect(result.lack).toBe(0)
  })

  // §12.1, случай 1.
  it('60 → 16 через ряд: 11 убавочных рядов, 21 ряд, половина уходит с 30 до 8', () => {
    const result = toe({ final: 16 })
    expect(result.decRowsNeeded).toBe(11)
    expect(result.totalRows).toBe(21)
    expect(halfStitchesAfter(60, 0)).toBe(30)
    expect(halfStitchesAfter(60, result.decRowsNeeded)).toBe(8)
    expect(roundStitchesAfter(60, result.decRowsNeeded)).toBe(16)
    expect(result.rows[result.rows.length - 1].stitches).toBe(16)
  })

  it('последний ряд мыска — убавочный, промежуточных перед швом нет', () => {
    const result = toe()
    expect(result.rows[result.rows.length - 1].type).toBe('dec')
    expect(result.rows).toHaveLength(19)
  })

  it('ряды пронумерованы подряд от первого', () => {
    const result = toe()
    expect(result.rows.map((row) => row.n)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1),
    )
  })
})

describe('правило хвоста', () => {
  // §12.1, случай 7: снимается интервал последнего сегмента целиком.
  it('свой ритм одним сегментом {интервал 2, повторов 3} даёт 7 рядов, а не 8', () => {
    const result = toe({
      rhythm: { kind: 'custom', segments: [{ interval: 2, repeats: 3 }] },
    })
    expect(result.totalRows).toBe(7)
    expect(result.rows.filter((row) => row.type === 'dec').map((row) => row.n)).toEqual([1, 4, 7])
  })

  it('хвост снимается и при интервале 6', () => {
    const result = toe({
      rhythm: { kind: 'custom', segments: [{ interval: 6, repeats: 2 }] },
    })
    expect(result.totalRows).toBe(8)
  })

  it('сегмент с нулём повторов не уводит число рядов в минус', () => {
    const result = toe({
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 3 }, { interval: 2, repeats: 0 }] },
    })
    expect(result.totalRows).toBe(5)
  })
})

describe('недобор и перебор сегментов', () => {
  // §9.5: расчёт строится всегда, схема показывает то, что реально выйдет.
  it('недобор оставляет больше петель, чем конечные', () => {
    const result = toe({
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 6 }] },
    })
    expect(result.lack).toBe(4)
    expect(result.finalReal).toBe(36)
    expect(result.decRowsCovered).toBe(6)
  })

  it('перебор доводит мысок ниже конечных петель, а не обрывает расчёт', () => {
    const result = toe({
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 12 }] },
    })
    expect(result.lack).toBe(-2)
    expect(result.finalReal).toBe(12)
  })
})

describe('минимум конечных петель', () => {
  // §12.1, случай 8.
  it('4 + 4 × кромка даёт 4 / 8 / 12', () => {
    expect(minFinalStitches(0)).toBe(4)
    expect(minFinalStitches(1)).toBe(8)
    expect(minFinalStitches(2)).toBe(12)
  })

  it('кромка на арифметику расчёта не влияет', () => {
    const rows = [0, 1, 2].map((edge) => toe({ edge }).totalRows)
    expect(rows).toEqual([19, 19, 19])
  })
})

describe('пустой расчёт', () => {
  it('конечных не меньше начальных — убавочных рядов нет', () => {
    const result = toe({ final: 60, rhythm: { kind: 'custom', segments: [] } })
    expect(result.decRowsNeeded).toBe(0)
    expect(result.totalRows).toBe(0)
  })
})

describe('закрытая формула числа рядов', () => {
  // §5.2: Σ повторов × (1 + интервал) − интервал последнего сегмента.
  // Формула и раскладка рядов сходятся, пока пустых фаз нет.
  const byFormula = (segments: { interval: number; repeats: number }[]) => {
    const sum = segments.reduce((a, s) => a + s.repeats * (1 + s.interval), 0)
    return sum - segments[segments.length - 1].interval
  }

  const cases = [
    [{ interval: 1, repeats: 10 }],
    [{ interval: 2, repeats: 3 }],
    [{ interval: 1, repeats: 6 }, { interval: 0, repeats: 5 }],
    [{ interval: 2, repeats: 3 }, { interval: 1, repeats: 3 }, { interval: 0, repeats: 5 }],
    [{ interval: 4, repeats: 1 }, { interval: 3, repeats: 1 }, { interval: 0, repeats: 7 }],
  ]

  it.each(cases)('сходится с раскладкой рядов: %j', (...segments) => {
    expect(buildRows(60, segments).length).toBe(byFormula(segments))
  })
})

describe('пресет пересчитывается живьём, свой ритм — нет', () => {
  it('пресет при смене петель снова покрывает все убавочные ряды', () => {
    const same = toe({ rhythm: preset('even'), final: 16 })
    expect(same.decRowsCovered).toBe(same.decRowsNeeded)
    expect(same.segments).toEqual([{ interval: 1, repeats: 11 }])
  })

  it('расчёт не делит память с набранными сегментами', () => {
    const segments = [{ interval: 1, repeats: 10 }]
    const result = toe({ rhythm: { kind: 'custom', segments } })
    segments[0].interval = 5
    expect(result.segments).toEqual([{ interval: 1, repeats: 10 }])
    expect(result.totalRows).toBe(19)
  })

  it('свой ритм остаётся набранным', () => {
    const segments = [{ interval: 1, repeats: 10 }]
    const result = toe({ rhythm: { kind: 'custom', segments }, final: 16 })
    expect(result.segments).toEqual(segments)
    expect(result.lack).toBe(1)
  })
})
