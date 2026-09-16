import { describe, expect, it } from 'vitest'
import { shareText } from './share'
import { calculateToe, DEFAULT_PARAMS } from './calc'

describe('текст для системного шита «Поделиться»', () => {
  it('дефолт читается фразой целиком, без перехода по ссылке', () => {
    expect(shareText(calculateToe(DEFAULT_PARAMS))).toBe('Мысок: 60 → 20 петель, убавки через ряд, 19 рядов')
  })

  it('имя ритма — то же, что в итоге: свой ритм называется своим ритмом', () => {
    const calc = calculateToe({
      ...DEFAULT_PARAMS,
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 10 }] },
    })
    expect(shareText(calc)).toContain('убавки свой ритм')
  })

  it('петли — те, на которых мысок действительно кончится: при недоборе это finalReal', () => {
    const calc = calculateToe({
      ...DEFAULT_PARAMS,
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 6 }] },
    })
    expect(calc.lack).toBe(4)
    expect(calc.finalReal).toBe(36)
    expect(shareText(calc)).toContain('60 → 36 петель')
  })

  it('при переборе finalReal равен конечным — развилки в тексте не нужно', () => {
    const calc = calculateToe({
      ...DEFAULT_PARAMS,
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 14 }] },
    })
    expect(calc.lack).toBeLessThan(0)
    expect(calc.finalReal).toBe(calc.final)
    expect(shareText(calc)).toContain('60 → 20 петель')
  })
})
