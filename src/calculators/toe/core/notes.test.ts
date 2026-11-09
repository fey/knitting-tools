import { describe, expect, it } from 'vitest'
import { calculateToe } from './calc'
import { coverageNote, lengthNote, lengthNoteCm } from './notes'
import type { ToeParams } from './types'

const BASE: ToeParams = { initial: 60, final: 20, edge: 1, rhythm: { kind: 'preset', name: 'even' } }

describe('coverageNote', () => {
  it('сходящийся ритм — счётчик покрытия', () => {
    expect(coverageNote(calculateToe(BASE, 'cuff-down'))).toEqual({
      kind: 'ok',
      text: 'Сегменты покрывают все 10 убавочных рядов',
    })
  })

  it('недобор называет, сколько петель останется на самом деле', () => {
    const calc = calculateToe({ ...BASE, rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 6 }] } }, 'cuff-down')
    expect(coverageNote(calc)).toEqual({
      kind: 'lack',
      text: 'Не хватает 4 убавочных рядов: останется 36 петель вместо 20',
    })
  })

  it('перебор говорит, что до лишних шагов не дойдёт', () => {
    // Ритм «с разгоном» выбран при широких петлях, потом петли сузили до N = 2.
    const calc = calculateToe({ ...BASE, final: 52, rhythm: { kind: 'preset', name: 'ramp' } }, 'cuff-down')
    expect(calc.lack).toBe(-2)
    expect(coverageNote(calc)).toEqual({
      kind: 'excess',
      text: 'Лишние 2 шага: мысок кончится раньше, до них не дойдёт',
    })
  })

  it('склоняется вся связка, а не одно слово', () => {
    expect(coverageNote({ lack: -1, decRowsNeeded: 10, final: 20, finalReal: 16, direction: 'cuff-down' }).text).toContain('Лишний 1 шаг:')
    expect(coverageNote({ lack: -5, decRowsNeeded: 10, final: 20, finalReal: 0, direction: 'cuff-down' }).text).toContain('Лишних 5 шагов:')
    expect(coverageNote({ lack: 1, decRowsNeeded: 10, final: 20, finalReal: 24, direction: 'cuff-down' }).text).toBe(
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

describe('lengthNoteCm', () => {
  it('коридор в сантиметрах молчит на обычном мыске', () => {
    // 19 рядов при 40 рядах / 10 см — 4,75 см, середина коридора.
    expect(lengthNoteCm(4.75)).toBeNull()
  })

  it('короткий мысок — то же замечание, но в сантиметрах', () => {
    expect(lengthNoteCm(2.5)).toBe('Меньше 3 см — мысок выйдет тупым')
  })

  it('длинный мысок — тоже', () => {
    expect(lengthNoteCm(8)).toBe('Больше 7 см — мысок выйдет длинным, проверь ритм')
  })

  it('границы коридора замечания не вызывают', () => {
    expect(lengthNoteCm(3)).toBeNull()
    expect(lengthNoteCm(7)).toBeNull()
  })
})

describe('coverageNote от мыска (§9.5 спеки toe-up)', () => {
  const UP: ToeParams = { initial: 24, final: 64, edge: 1, rhythm: { kind: 'preset', name: 'even' } }

  it('сегменты покрывают все прибавочные ряды', () => {
    expect(coverageNote(calculateToe(UP, 'toe-up'))).toEqual({
      kind: 'ok',
      text: 'Сегменты покрывают все 10 прибавочных рядов',
    })
  })

  it('недобор говорит, сколько петель выйдет', () => {
    const calc = calculateToe({ ...UP, rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 6 }] } }, 'toe-up')
    expect(coverageNote(calc)).toEqual({
      kind: 'lack',
      text: 'Не хватает 4 прибавочных рядов: выйдет 48 петель вместо 64',
    })
  })

  it('перебор — та же строка, что у cuff-down', () => {
    const calc = calculateToe({ ...UP, rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 12 }] } }, 'toe-up')
    expect(coverageNote(calc)).toEqual({
      kind: 'excess',
      text: 'Лишние 2 шага: мысок кончится раньше, до них не дойдёт',
    })
  })
})
