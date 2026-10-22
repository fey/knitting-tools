import { describe, expect, it } from 'vitest'
import { centerRange } from './fieldRules'
import { rowText } from './text'
import { computeTurn } from './turn'

const texts = (heel: number, center: number, firstSide: 'rs' | 'ws' = 'rs') =>
  computeTurn({ heel, center, firstSide }).rows.map(rowText)

describe('поворот: примеры из research (спека пятки §5)', () => {
  it('H = 30, C = 6, ряд 1 лицевой — 12 рядов, остаётся 18 (пример 1)', () => {
    const turn = computeTurn({ heel: 30, center: 6, firstSide: 'rs' })
    expect(turn.sides).toBe(12)
    expect(turn.rows).toHaveLength(12)
    expect(turn.left).toBe(18)
    const t = turn.rows.map(rowText)
    expect(t[0]).toBe('17 лиц., протяжка, 1 лиц., поверни')
    expect(t[1]).toBe('сн. 1, 5 изн., 2 вм. изн., 1 изн., поверни')
    expect(t[2]).toBe('сн. 1, 6 лиц., протяжка, 1 лиц., поверни')
    expect(t[3]).toBe('сн. 1, 7 изн., 2 вм. изн., 1 изн., поверни')
    expect(t[10]).toBe('сн. 1, 14 лиц., протяжка, 1 лиц., поверни')
    expect(t[11]).toBe('сн. 1, 15 изн., 2 вм. изн., 1 изн.')
  })

  it('H = 20, C = 6 — нечётная боковая часть, два последних ряда без «1 петли» (пример 2, урок Budd)', () => {
    expect(texts(20, 6)).toEqual([
      '12 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 5 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 6 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 7 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 8 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 9 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 10 лиц., протяжка, поверни',
      'сн. 1, 10 изн., 2 вм. изн.',
    ])
    expect(computeTurn({ heel: 20, center: 6, firstSide: 'rs' }).left).toBe(12)
  })

  it('H = 15, C = 5, ряд 1 изнаночный — зеркало, убавки по стороне ряда (пример 3, Schurch)', () => {
    expect(texts(15, 5, 'ws')).toEqual([
      '9 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 4 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 5 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 6 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 7 изн., 2 вм. изн., поверни',
      'сн. 1, 7 лиц., протяжка',
    ])
    expect(computeTurn({ heel: 15, center: 5, firstSide: 'ws' }).left).toBe(9)
  })

  it('сколько петель остаётся — по таблицам Budd, CYC, Lion Brand, Silver’s, Schurch', () => {
    const left = (heel: number, center: number) =>
      computeTurn({ heel, center, firstSide: 'rs' }).left
    // Budd, 14 описаний: центр 6 везде.
    const budd: Array<[number, number]> = [
      [12, 8], [14, 10], [16, 10], [18, 12], [20, 12], [22, 14], [24, 14], [26, 16],
      [28, 16], [30, 18], [32, 18], [34, 20], [36, 20], [38, 22],
    ]
    for (const [heel, rest] of budd) expect(left(heel, 6), `H=${heel}`).toBe(rest)
    expect(left(32, 8)).toBe(20) // Lion Brand
  })

  it('Schurch: центр 4 при чётных H, 5 при нечётных, размеры через 4 петли', () => {
    for (let heel = 16; heel <= 60; heel += 4) {
      expect(computeTurn({ heel, center: 4, firstSide: 'rs' }).left).toBe(heel / 2 + 2)
    }
    for (let heel = 15; heel <= 59; heel += 4) {
      expect(computeTurn({ heel, center: 5, firstSide: 'rs' }).left).toBe((heel + 3) / 2)
    }
  })
})

/**
 * Независимая проверка формулы: ряды 3 и дальше выводятся из правила «до петли перед
 * зазором» по петлям на спице, а не из формулы `C + n − 3`. Ряды 1 и 2 заданы определением.
 */
function simulate(heel: number, center: number) {
  const live = Array.from({ length: heel }, () => ({ worked: false }))
  const rows: Array<{ slip: boolean; plain: number; after: boolean }> = []

  function exec(dir: 1 | -1, start: number, slip: boolean, plain: number, after: boolean): number {
    let i = start
    let last = live[start]
    const take = (k: number) => {
      for (let j = 0; j < k; j++) {
        live[i].worked = true
        last = live[i]
        i += dir
      }
    }
    take((slip ? 1 : 0) + plain)
    const merged = live[i]
    const removed = live[i + dir]
    merged.worked = removed.worked = true
    last = merged
    i += 2 * dir
    if (after) take(1)
    live.splice(live.indexOf(removed), 1)
    rows.push({ slip, plain, after })
    return live.indexOf(last)
  }

  const sides = (heel - center) / 2
  let turn = exec(1, 0, false, sides + center - 1, true)
  live.forEach((stitch) => (stitch.worked = false))
  turn = exec(-1, turn, true, center - 1, true)

  for (let dir: 1 | -1 = 1; ; dir = dir === 1 ? -1 : 1) {
    let gap = -1
    if (dir === 1) {
      for (let j = turn + 1; j < live.length; j++) if (!live[j].worked) { gap = j; break }
    } else {
      for (let j = turn - 1; j >= 0; j--) if (!live[j].worked) { gap = j; break }
    }
    if (gap < 0) break
    const plain = dir === 1 ? gap - 2 - turn : turn - gap - 2
    const hasAfter = dir === 1 ? gap + 1 < live.length : gap - 1 >= 0
    turn = exec(dir, turn, true, plain, hasAfter)
  }
  return { rows, left: live.length }
}

describe('формула против симуляции по петлям', () => {
  it('на всех пятках 6…60 и всех допустимых центрах числа рядов, петель и «1 петли» совпадают', () => {
    let cases = 0
    for (let heel = 6; heel <= 60; heel++) {
      const { min, max } = centerRange(heel)
      for (let center = min; center <= max; center += 2) {
        const sim = simulate(heel, center)
        const turn = computeTurn({ heel, center, firstSide: 'rs' })
        const label = `H=${heel} C=${center}`
        expect(turn.rows.length, label).toBe(sim.rows.length)
        expect(turn.left, label).toBe(sim.left)
        turn.rows.forEach((row, i) => {
          expect({ slip: row.slip, plain: row.plain, after: row.after }, `${label} ряд ${row.n}`).toEqual(
            sim.rows[i],
          )
        })
        cases++
      }
    }
    expect(cases).toBeGreaterThan(500)
  })
})

describe('инварианты', () => {
  it('число рядов чётное, а последний ряд на стороне, противоположной ряду 1', () => {
    for (const firstSide of ['rs', 'ws'] as const) {
      for (let heel = 6; heel <= 40; heel++) {
        const { min, max } = centerRange(heel)
        for (let center = min; center <= max; center += 2) {
          const { rows } = computeTurn({ heel, center, firstSide })
          expect(rows.length % 2).toBe(0)
          expect(rows[0].side).toBe(firstSide)
          expect(rows[rows.length - 1].side).not.toBe(firstSide)
        }
      }
    }
  })

  it('смена стороны ряда 1 зеркалит поворот: число рядов и петель то же, тексты те же по счёту', () => {
    const rs = computeTurn({ heel: 30, center: 6, firstSide: 'rs' })
    const ws = computeTurn({ heel: 30, center: 6, firstSide: 'ws' })
    expect(ws.rows.length).toBe(rs.rows.length)
    expect(ws.left).toBe(rs.left)
    expect(ws.rows.map((r) => [r.plain, r.after])).toEqual(rs.rows.map((r) => [r.plain, r.after]))
    expect(ws.rows[0].decrease).toBe('p2tog')
    expect(rs.rows[0].decrease).toBe('ssk')
  })

  it('самая узкая боковая часть — 2 петли: два ряда, остаётся пятка минус 2', () => {
    const turn = computeTurn({ heel: 10, center: 6, firstSide: 'rs' })
    expect(turn.sides).toBe(2)
    expect(turn.rows).toHaveLength(2)
    expect(turn.left).toBe(8)
    expect(turn.rows.map(rowText)).toEqual([
      '7 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 5 изн., 2 вм. изн., 1 изн.',
    ])
  })

  it('боковая часть в 3 петли (Budd, H = 12): четыре ряда, два последних без «1 петли»', () => {
    expect(texts(12, 6)).toEqual([
      '8 лиц., протяжка, 1 лиц., поверни',
      'сн. 1, 5 изн., 2 вм. изн., 1 изн., поверни',
      'сн. 1, 6 лиц., протяжка, поверни',
      'сн. 1, 6 изн., 2 вм. изн.',
    ])
  })
})
