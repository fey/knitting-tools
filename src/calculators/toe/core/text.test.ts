import { describe, expect, it } from 'vitest'
import { closingCaption, paramsLine, shareText, startCaption, summaryLine } from './text'
import { calculateToe, DEFAULT_PARAMS } from './calc'

/** Конечные петли с правильным склонением: 20 петель, 21 петля, 22 и 24 петли (тикет #43). */
const ENDS = [
  { final: 20, word: '20 петель' },
  { final: 21, word: '21 петля' },
  { final: 22, word: '22 петли' },
  { final: 24, word: '24 петли' },
]

/** Расчёт, у которого мысок кончается ровно на `finalReal` петлях. */
function endingOn(finalReal: number) {
  return { ...calculateToe(DEFAULT_PARAMS), finalReal }
}

describe('строки расчёта склоняют конечные петли (§7, §10.5)', () => {
  it.each(ENDS)('$final → «$word» во всех местах', ({ final, word }) => {
    const calc = endingOn(final)
    expect(paramsLine(calc)).toBe(`60 → ${word} · кромка 1 · 19 рядов`)
    expect(paramsLine(calc, '4,75 см')).toBe(`60 → ${word} · кромка 1 · 19 рядов · 4,75 см`)
    expect(summaryLine(calc)).toBe(`Мысок: 60 → ${word}, кромка 1, убавки через ряд`)
    expect(shareText(calc)).toBe(`Мысок: 60 → ${word}, убавки через ряд, 19 рядов`)
    expect(closingCaption(calc)).toBe(`↑ ${word} на закрытие`)
  })

  it('62 → 22 на настоящем расчёте говорит «22 петли»', () => {
    const calc = calculateToe({ ...DEFAULT_PARAMS, initial: 62, final: 22 })
    expect(summaryLine(calc)).toContain('62 → 22 петли,')
    expect(closingCaption(calc)).toBe('↑ 22 петли на закрытие')
    expect(startCaption(calc)).toMatch(/^Начало мыска, 62 петли\./)
  })
})

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
    expect(summaryLine(calc)).toContain('убавки свой ритм')
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
