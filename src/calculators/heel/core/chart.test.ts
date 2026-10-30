import { describe, expect, it } from 'vitest'
import { turnChart, type TurnChart } from './chart'
import { centerRange } from './fieldRules'
import { computeTurn, type Side } from './turn'

function chart(heel: number, center: number, firstSide: Side = 'rs'): TurnChart {
  return turnChart(computeTurn({ heel, center, firstSide }), heel, center)
}

/** Ряд по `n`: в модели ряды идут сверху вниз. */
function row(c: TurnChart, n: number) {
  const found = c.rows.find((r) => r.n === n)
  if (!found) throw new Error(`нет ряда ${n}`)
  return found
}

function xs(c: TurnChart, n: number, kind: string): number[] {
  return row(c, n)
    .stitches.filter((s) => s.kind === kind)
    .map((s) => s.x)
    .sort((a, b) => a - b)
}

describe('раскладка схемы поворота (§7)', () => {
  it('H = 30, C = 6, ряд 1 лицевой: ряд 1 идёт от правого края до поворота после «1 петли»', () => {
    const c = chart(30, 6)
    const r1 = row(c, 1)
    expect(r1.y).toBe(11)
    expect(r1.x0).toBe(0)
    expect(r1.width).toBe(30)
    // 17 лиц. с правого края — клетки 29…13; протяжка на 11–12; 1 лиц. на 10.
    expect(xs(c, 1, 'knit')).toEqual([10, ...Array.from({ length: 17 }, (_, k) => 13 + k)])
    expect(r1.decrease).toEqual({ x: 11, kind: 'ssk' })
    expect(r1.turnX).toBe(10)
    expect(xs(c, 1, 'idle')).toEqual(Array.from({ length: 10 }, (_, k) => k))
    expect(xs(c, 1, 'slip')).toEqual([])
  })

  it('ряд 2 изнаночный: на петлю уже, по центру, начинается снятой петлёй там, где повернул ряд 1', () => {
    const c = chart(30, 6)
    const r2 = row(c, 2)
    expect(r2.width).toBe(29)
    expect(r2.x0).toBe(0.5)
    expect(r2.side).toBe('ws')
    // сн. 1, 5 изн., 2 вм. изн., 1 изн. — слева направо.
    expect(xs(c, 2, 'slip')).toEqual([10.5])
    expect(xs(c, 2, 'knit')).toEqual([11.5, 12.5, 13.5, 14.5, 15.5, 18.5])
    expect(r2.decrease).toEqual({ x: 16.5, kind: 'p2tog' })
    expect(r2.turnX).toBe(19.5)
  })

  it('ширина ряда — петли на спице к его началу: сетка сужается на петлю за ряд', () => {
    const c = chart(30, 6)
    for (const r of c.rows) {
      expect(r.width).toBe(30 - (r.n - 1))
      expect(r.stitches.length + 2).toBe(r.width)
      expect(r.x0).toBe((30 - r.width) / 2)
    }
  })

  it('поворот отмечен у каждого ряда, кроме последнего', () => {
    const c = chart(30, 6)
    expect(c.rows[0].n).toBe(12)
    expect(c.rows[0].turnX).toBeNull()
    expect(c.rows.slice(1).every((r) => r.turnX !== null)).toBe(true)
  })

  it('скобка под рядом 1 делит сетку на боковая · центр · боковая', () => {
    expect(chart(30, 6).parts).toEqual([
      { x: 0, width: 12, center: false },
      { x: 12, width: 6, center: true },
      { x: 18, width: 12, center: false },
    ])
  })

  it('нечётная боковая часть: два последних ряда кончаются убавкой, поворот — у её края', () => {
    const c = chart(20, 6)
    const r7 = row(c, 7)
    const lastWorked = Math.min(...r7.stitches.filter((s) => s.kind !== 'idle').map((s) => s.x), r7.decrease.x)
    expect(r7.turnX).toBe(lastWorked)
    expect(r7.decrease.x).toBe(lastWorked)
  })

  it('на всех пятках 6…60, допустимых центрах и обеих сторонах ряд укладывается в петли на спице', () => {
    for (let heel = 6; heel <= 60; heel++) {
      const { min, max } = centerRange(heel)
      for (let center = min; center <= max; center += 2) {
        for (const side of ['rs', 'ws'] as const) {
          const turn = computeTurn({ heel, center, firstSide: side })
          const c = turnChart(turn, heel, center)
          const label = `H=${heel} C=${center} ${side}`
          for (const r of c.rows) {
            const src = turn.rows[r.n - 1]
            const worked = r.stitches.filter((s) => s.kind !== 'idle').length + 2
            expect(worked, label).toBe((src.slip ? 1 : 0) + src.plain + 2 + (src.after ? 1 : 0))
            expect(r.decrease.x, label).toBeGreaterThanOrEqual(r.x0)
            expect(r.decrease.x + 2, label).toBeLessThanOrEqual(r.x0 + r.width)
            if (r.turnX !== null) {
              expect(r.turnX, label).toBeGreaterThanOrEqual(r.x0)
              expect(r.turnX, label).toBeLessThanOrEqual(r.x0 + r.width)
            }
          }
        }
      }
    }
  })

  it('изнаночный ряд 1 зеркалит схему лицевого', () => {
    for (const [heel, center] of [
      [30, 6],
      [20, 6],
      [15, 5],
    ]) {
      const rs = chart(heel, center, 'rs')
      const ws = chart(heel, center, 'ws')
      rs.rows.forEach((r, i) => {
        const m = ws.rows[i]
        const mirror = (x: number, w: number) => heel - x - w
        expect(m.side).toBe(r.side === 'rs' ? 'ws' : 'rs')
        expect(m.decrease.x).toBe(mirror(r.decrease.x, 2))
        expect(m.turnX).toBe(r.turnX === null ? null : heel - r.turnX)
        const sorted = (s: { x: number; kind: string }[]) => [...s].sort((a, b) => a.x - b.x)
        expect(sorted(m.stitches)).toEqual(sorted(r.stitches.map((s) => ({ ...s, x: mirror(s.x, 1) }))))
      })
    }
  })
})
