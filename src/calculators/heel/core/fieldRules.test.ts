import { describe, expect, it } from 'vitest'
import {
  centerRange,
  converges,
  defaultCenter,
  isCenterValid,
  MAX_INITIAL,
  MIN_INITIAL,
  normalizeFields,
} from './fieldRules'
import { divisionText } from './text'

const last = { initial: 60, center: 6 }

describe('границы (спека пятки §4)', () => {
  it('дефолт центра: 6, а при нечётных петлях пятки 5', () => {
    expect(defaultCenter(30)).toBe(6)
    expect(defaultCenter(31)).toBe(5)
  })

  it('допустимые центры: чётности пятки, боковая часть не меньше 2', () => {
    expect(centerRange(30)).toEqual({ min: 2, max: 26 })
    expect(centerRange(31)).toEqual({ min: 3, max: 27 })
    expect(centerRange(6)).toEqual({ min: 2, max: 2 })
    expect(centerRange(7)).toEqual({ min: 3, max: 3 })
  })

  it('каждая пятка от минимальной имеет хотя бы один допустимый центр', () => {
    for (let initial = MIN_INITIAL; initial <= MAX_INITIAL; initial += 2) {
      const { min, max } = centerRange(initial / 2)
      expect(min).toBeLessThanOrEqual(max)
    }
  })

  it('центр другой чётности, чем пятка, не сходится — боковые выйдут неравными', () => {
    expect(isCenterValid(30, 6)).toBe(true)
    expect(isCenterValid(30, 7)).toBe(false)
    expect(isCenterValid(31, 5)).toBe(true)
    expect(isCenterValid(31, 6)).toBe(false)
  })

  it('дефолт центра сходится на пятках 30 и 31', () => {
    expect(converges({ initial: 60, center: defaultCenter(30) })).toBe(true)
    expect(converges({ initial: 62, center: defaultCenter(31) })).toBe(true)
  })
})

describe('починка ввода (спека пятки §8)', () => {
  it('сходящаяся пара остаётся как есть, подписей нет', () => {
    expect(normalizeFields({ initial: 64, center: 8 }, last)).toEqual({ initial: 64, center: 8, fixes: [] })
  })

  it('нечётные начальные тянутся вниз и называют ближайшее чётное', () => {
    const r = normalizeFields({ initial: 61, center: 6 }, last)
    expect(r.initial).toBe(60)
    expect(r.fixes).toEqual([{ field: 'initial', message: '61 не делится пополам. Ближайшее чётное — 60' }])
  })

  it('начальных меньше минимума — подтягиваются к 12 с причиной', () => {
    const r = normalizeFields({ initial: 8, center: 2 }, last)
    expect(r.initial).toBe(12)
    expect(r.fixes[0].message).toMatch(/не меньше 12/)
  })

  it('выше потолка — молча к 200', () => {
    const r = normalizeFields({ initial: 2000, center: 6 }, last)
    expect(r.initial).toBe(200)
    expect(r.fixes).toEqual([])
  })

  it('центр другой чётности, чем пятка, тянется вверх и называет причину', () => {
    const r = normalizeFields({ initial: 60, center: 7 }, last)
    expect(r.center).toBe(8)
    expect(r.fixes).toEqual([
      {
        field: 'center',
        message: 'Центр 7 не сходится: 30 − 7 = 23, боковые части выйдут неравными. Ближайший сходящийся — 8',
      },
    ])
  })

  it('центр, съедающий боковые части, урезается с сохранением чётности', () => {
    const r = normalizeFields({ initial: 60, center: 28 }, last)
    expect(r.center).toBe(26)
    expect(r.fixes[0].message).toMatch(/урезан до 26/)

    // нечётная пятка: 31 → максимум 27, а не 26
    expect(normalizeFields({ initial: 62, center: 30 }, last).center).toBe(27)
    expect(normalizeFields({ initial: 62, center: 29 }, last).center).toBe(27)
  })

  it('центр меньше минимума тянется к минимуму своей чётности', () => {
    expect(normalizeFields({ initial: 60, center: 0 }, last).center).toBe(2)
    expect(normalizeFields({ initial: 62, center: 1 }, last).center).toBe(3)
  })

  it('смена начальных чинит и центр: 62 → пятка 31, центр 6 становится 7', () => {
    const r = normalizeFields({ initial: 62, center: 6 }, last)
    expect(r.initial).toBe(62)
    expect(r.center).toBe(7)
    expect(r.fixes.map((f) => f.field)).toEqual(['center'])
  })

  it('начальные чинятся первыми: центр считается от уже починенных', () => {
    // 21 → 20, пятка 10, центр 8 урезается до 6
    const r = normalizeFields({ initial: 21, center: 8 }, last)
    expect(r.initial).toBe(20)
    expect(r.center).toBe(6)
    expect(r.fixes.map((f) => f.field)).toEqual(['initial', 'center'])
  })

  it('пустое поле возвращается к последнему сходящемуся значению, молча', () => {
    expect(normalizeFields({ initial: null, center: 8 }, last)).toEqual({ initial: 60, center: 8, fixes: [] })
    expect(normalizeFields({ initial: 60, center: null }, { initial: 60, center: 10 })).toEqual({
      initial: 60,
      center: 10,
      fixes: [],
    })
  })

  it('результат починки всегда сходится', () => {
    for (let initial = 0; initial <= 220; initial++) {
      for (const center of [0, 1, 2, 5, 6, 7, 40, 150]) {
        const r = normalizeFields({ initial, center }, last)
        expect(converges(r), `${initial}/${center}`).toBe(true)
      }
    }
  })
})

describe('текст деления', () => {
  it('винительный падеж: 30 петель, 31 петлю, 32 петли', () => {
    expect(divisionText(30, 12, 6)).toBe('Раздели 30 петель пятки на три части: 12 · 6 · 12')
    expect(divisionText(31, 13, 5)).toBe('Раздели 31 петлю пятки на три части: 13 · 5 · 13')
    expect(divisionText(32, 13, 6)).toBe('Раздели 32 петли пятки на три части: 13 · 6 · 13')
  })
})
