import { describe, expect, it } from 'vitest'
import { decRowsWord, plural, rowsWord } from './text'

describe('склонения', () => {
  it('ряд, ряда, рядов', () => {
    expect([1, 2, 5, 11, 19, 21, 104].map(rowsWord)).toEqual([
      '1 ряд', '2 ряда', '5 рядов', '11 рядов', '19 рядов', '21 ряд', '104 ряда',
    ])
  })

  it('убавочные ряды склоняются вместе с числом', () => {
    expect([1, 3, 10].map(decRowsWord)).toEqual([
      '1 убавочный ряд', '3 убавочных ряда', '10 убавочных рядов',
    ])
  })

  it('ноль идёт множественным', () => {
    expect(plural(0, 'ряд', 'ряда', 'рядов')).toBe('рядов')
  })
})
