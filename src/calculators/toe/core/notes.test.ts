import { describe, expect, it } from 'vitest'
import { calculateToe } from './calc'
import { coverageNote, lengthNote } from './notes'
import type { ToeParams } from './types'

const BASE: ToeParams = { initial: 60, final: 20, edge: 1, rhythm: { kind: 'preset', name: 'even' } }

describe('coverageNote', () => {
  it('сходящийся ритм — счётчик покрытия', () => {
    expect(coverageNote(calculateToe(BASE))).toEqual({
      kind: 'ok',
      text: 'Сегменты покрывают все 10 убавочных рядов',
    })
  })

  it('недобор называет, сколько петель останется на самом деле', () => {
    const calc = calculateToe({ ...BASE, rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 6 }] } })
    expect(coverageNote(calc)).toEqual({
      kind: 'lack',
      text: 'Не хватает 4 убавочных рядов: останется 36 петель вместо 20',
    })
  })

  it('перебор говорит, что до лишних шагов не дойдёт', () => {
    // Ритм «с разгоном» выбран при широких петлях, потом петли сузили до N = 2.
    const calc = calculateToe({ ...BASE, final: 52, rhythm: { kind: 'preset', name: 'ramp' } })
    expect(calc.lack).toBe(-2)
    expect(coverageNote(calc)).toEqual({
      kind: 'excess',
      text: 'Лишние 2 шага: мысок кончится раньше, до них не дойдёт',
    })
  })

  it('склоняется вся связка, а не одно слово', () => {
    expect(coverageNote({ lack: -1, decRowsNeeded: 10, final: 20, finalReal: 16 }).text).toContain('Лишний 1 шаг:')
    expect(coverageNote({ lack: -5, decRowsNeeded: 10, final: 20, finalReal: 0 }).text).toContain('Лишних 5 шагов:')
    expect(coverageNote({ lack: 1, decRowsNeeded: 10, final: 20, finalReal: 24 }).text).toBe(
      'Не хватает 1 убавочного ряда: останется 24 петли вместо 20',
    )
  })
})

describe('lengthNote', () => {
  it('меньше 12 рядов — тупой мысок', () => {
    expect(lengthNote(11)).toBe('Меньше 12 рядов — мысок выйдет тупым')
  })

  it('больше 30 — длинный', () => {
    expect(lengthNote(31)).toBe('Больше 30 рядов — мысок выйдет длинным, проверь ритм')
  })

  it('на границах и внутри коридора замечания нет', () => {
    expect(lengthNote(12)).toBeNull()
    expect(lengthNote(19)).toBeNull()
    expect(lengthNote(30)).toBeNull()
  })
})
