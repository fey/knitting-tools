import { describe, expect, it } from 'vitest'
import { converges, finalCandidates, MAX_STITCHES } from './fieldRules'

describe('converges', () => {
  it('дефолт сходится', () => {
    expect(converges({ initial: 60, final: 20, edge: 1 })).toBe(true)
  })

  it('нечётные начальные не сходятся', () => {
    expect(converges({ initial: 61, final: 20, edge: 1 })).toBe(false)
  })

  it('нечётные конечные не сходятся', () => {
    expect(converges({ initial: 60, final: 19, edge: 1 })).toBe(false)
  })

  it('разница не кратна 4 не сходится', () => {
    expect(converges({ initial: 60, final: 18, edge: 1 })).toBe(false)
  })

  it('конечные не меньше начальных не сходятся', () => {
    expect(converges({ initial: 60, final: 60, edge: 1 })).toBe(false)
    expect(converges({ initial: 60, final: 64, edge: 1 })).toBe(false)
  })

  it('конечных не хватает на кромку', () => {
    expect(converges({ initial: 16, final: 8, edge: 2 })).toBe(false)
    expect(converges({ initial: 16, final: 12, edge: 2 })).toBe(true)
  })

  it('потолок 200 соблюдается по обоим полям', () => {
    expect(converges({ initial: MAX_STITCHES + 4, final: 20, edge: 1 })).toBe(false)
    expect(converges({ initial: MAX_STITCHES, final: MAX_STITCHES - 4, edge: 1 })).toBe(true)
  })

  it('нулевые и отрицательные значения не сходятся', () => {
    expect(converges({ initial: 0, final: 0, edge: 1 })).toBe(false)
    expect(converges({ initial: 60, final: -4, edge: 1 })).toBe(false)
  })

  it('нецелые значения не сходятся', () => {
    expect(converges({ initial: 60.5, final: 20, edge: 1 })).toBe(false)
  })
})

describe('finalCandidates', () => {
  it('дефолт даёт 16, 20, 24', () => {
    expect(finalCandidates(60, 1)).toEqual([16, 20, 24])
  })

  it('пересчитывается от начальных без тай-брейка на чётном остатке', () => {
    expect(finalCandidates(62, 1)).toEqual([18, 22])
  })

  it('кромка сужает список снизу через минимум конечных', () => {
    expect(finalCandidates(60, 2)).toEqual([16, 20, 24])
    expect(finalCandidates(28, 2)).toEqual([16, 20, 24])
  })

  it('маленький мысок отдаёт всё достижимое, когда обычный диапазон пуст', () => {
    expect(finalCandidates(16, 1)).toEqual([8, 12])
  })

  it('ничего не достижимо — список пуст', () => {
    expect(finalCandidates(8, 2)).toEqual([])
  })
})
