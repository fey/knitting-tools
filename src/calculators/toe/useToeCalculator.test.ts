import { describe, expect, it } from 'vitest'
import { useToeCalculator } from './useToeCalculator'

describe('состояние калькулятора', () => {
  it('открывается посчитанным дефолтом: 60 → 20, кромка 1, через ряд', () => {
    const { params, calculation } = useToeCalculator()
    expect(params.initial).toBe(60)
    expect(params.final).toBe(20)
    expect(params.edge).toBe(1)
    expect(params.rhythm).toEqual({ kind: 'preset', name: 'even' })
    expect(calculation.value.decRowsNeeded).toBe(10)
    expect(calculation.value.totalRows).toBe(19)
  })

  it('состояние одно на всю страницу, и расчёт пересчитывается при правке', () => {
    const first = useToeCalculator()
    const second = useToeCalculator()

    first.params.final = 16
    expect(second.calculation.value.totalRows).toBe(21)
    expect(second.calculation.value.decRowsNeeded).toBe(11)

    first.params.final = 20
    expect(second.calculation.value.totalRows).toBe(19)
  })
})
