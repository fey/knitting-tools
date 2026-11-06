import { describe, expect, it } from 'vitest'
import { shareText } from './text'

describe('текст «Поделиться» (спека пятки §9.4)', () => {
  it('петли пятки, центр и ряды поворота', () => {
    expect(shareText({ heel: 30, center: 6, rows: 12 })).toBe(
      'Поворот французской пятки: 30 петель пятки, центр 6, 12 рядов поворота',
    )
  })

  it('склоняет петли и ряды', () => {
    expect(shareText({ heel: 31, center: 5, rows: 14 })).toBe(
      'Поворот французской пятки: 31 петля пятки, центр 5, 14 рядов поворота',
    )
    expect(shareText({ heel: 22, center: 4, rows: 2 })).toBe(
      'Поворот французской пятки: 22 петли пятки, центр 4, 2 ряда поворота',
    )
  })
})
