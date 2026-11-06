import { describe, expect, it } from 'vitest'
import { DEFAULT_HEEL_PARAMS, formatHash, parseHash } from './hash'
import { converges, MAX_INITIAL, MIN_INITIAL } from './fieldRules'

describe('запись hash (спека пятки §9.1)', () => {
  it('канонический вид: начальные, центр, сторона ряда 1', () => {
    expect(formatHash({ initial: 60, center: 6, firstSide: 'rs' })).toBe('#s=60&c=6&side=rs')
    expect(formatHash({ initial: 62, center: 5, firstSide: 'ws' })).toBe('#s=62&c=5&side=ws')
  })

  it('запись и разбор сходятся на всех сходящихся парах и обеих сторонах', () => {
    for (let initial = MIN_INITIAL; initial <= MAX_INITIAL; initial += 2) {
      const heel = initial / 2
      for (let center = 2; center <= heel; center++) {
        if (!converges({ initial, center })) continue
        for (const firstSide of ['rs', 'ws'] as const) {
          const params = { initial, center, firstSide }
          expect(parseHash(formatHash(params))).toEqual(params)
        }
      }
    }
  })
})

describe('битая ссылка чинится дефолтом по параметру (спека пятки §9.2)', () => {
  it('дефолт: 60 петель, центр 6, ряд 1 лицевой', () => {
    expect(DEFAULT_HEEL_PARAMS).toEqual({ initial: 60, center: 6, firstSide: 'rs' })
  })

  it('пустой hash — дефолт', () => {
    expect(parseHash('')).toEqual(DEFAULT_HEEL_PARAMS)
    expect(parseHash('#')).toEqual(DEFAULT_HEEL_PARAMS)
    expect(parseHash('')).not.toBe(DEFAULT_HEEL_PARAMS)
  })

  it('несходящиеся начальные — дефолт, сходящийся центр из ссылки живёт', () => {
    expect(parseHash('#s=61&c=8&side=ws')).toEqual({ initial: 60, center: 8, firstSide: 'ws' })
    expect(parseHash('#s=10&c=8&side=ws')).toEqual({ initial: 60, center: 8, firstSide: 'ws' })
    expect(parseHash('#s=abc&c=8&side=ws')).toEqual({ initial: 60, center: 8, firstSide: 'ws' })
    expect(parseHash('#s=202&c=8')).toEqual({ initial: 60, center: 8, firstSide: 'rs' })
  })

  it('не подтягивает к ближайшему: это правило поля, а не ссылки', () => {
    expect(parseHash('#s=61').initial).toBe(60)
    expect(parseHash('#s=300').initial).toBe(60)
    expect(parseHash('#s=40&c=7').center).toBe(6)
    expect(parseHash('#s=40&c=40').center).toBe(6)
  })

  it('центр проверяется от уже разобранных начальных и чинится дефолтом своей чётности', () => {
    expect(parseHash('#s=62&c=6')).toEqual({ initial: 62, center: 5, firstSide: 'rs' })
    expect(parseHash('#s=62&c=7')).toEqual({ initial: 62, center: 7, firstSide: 'rs' })
    expect(parseHash('#s=12&c=4')).toEqual({ initial: 12, center: 2, firstSide: 'rs' })
  })

  it('дефолт центра, который сам не сходится на узкой пятке, — ближайший допустимый', () => {
    // Пятка 6 и 7: допустим один центр — 2 и 3, а дефолт 6 и 5 в них не влезает.
    expect(parseHash('#s=12')).toEqual({ initial: 12, center: 2, firstSide: 'rs' })
    expect(parseHash('#s=14')).toEqual({ initial: 14, center: 3, firstSide: 'rs' })
    expect(parseHash('#s=16')).toEqual({ initial: 16, center: 4, firstSide: 'rs' })
  })

  it('неизвестная сторона — лицевой', () => {
    expect(parseHash('#s=60&c=6&side=xx').firstSide).toBe('rs')
    expect(parseHash('#s=60&c=6').firstSide).toBe('rs')
  })

  it('нецелые и пустые числа — дефолт', () => {
    expect(parseHash('#s=60.5&c=6')).toEqual(DEFAULT_HEEL_PARAMS)
    expect(parseHash('#s=&c=')).toEqual(DEFAULT_HEEL_PARAMS)
  })

  it('принимает hash и без решётки', () => {
    expect(parseHash('s=40&c=8&side=ws')).toEqual({ initial: 40, center: 8, firstSide: 'ws' })
  })

  it('результат разбора всегда сходится', () => {
    for (const s of ['', '0', '11', '12', '13', '61', '200', '201', 'x']) {
      for (const c of ['', '0', '1', '2', '3', '6', '7', '96', '97', 'x']) {
        expect(converges(parseHash(`#s=${s}&c=${c}`))).toBe(true)
      }
    }
  })
})
