import { describe, expect, test } from 'vitest'
import { PAIRS, YARNS, castOn } from './castOn'

/**
 * Формула сверяется с числами исследования `cast-on-by-yarn.md`, §5.1: колонки «формула»
 * и таблица чувствительности Alize. Разошлось — ошибка в обхвате или в округлении, а не
 * в исследовании: его числа посчитаны независимо от этого кода.
 */
const RESEARCH: Record<number, number[]> = {
  30: [52, 56, 60, 64, 68, 72, 72, 76],
  20: [36, 36, 40, 44, 44, 48, 48, 52],
  22: [40, 40, 44, 48, 48, 52, 52, 56],
  28: [52, 52, 56, 60, 64, 64, 68, 72],
  32: [56, 60, 64, 68, 72, 76, 76, 84],
  18: [32, 32, 36, 40, 40, 44, 44, 48],
}

describe('формула сходится с исследованием (§5.1)', () => {
  for (const [gauge, expected] of Object.entries(RESEARCH)) {
    test(`${gauge} п. на 10 см`, () => {
      expect(PAIRS.map((pair) => castOn(pair, Number(gauge)))).toEqual(expected)
    })
  }
})

test('у каждой толщины наборы на все пары, и все кратны 4', () => {
  for (const yarn of YARNS) {
    for (const column of [yarn.opal, yarn.regia]) {
      expect(column).toHaveLength(PAIRS.length)
      expect(column.every((n) => n % 4 === 0)).toBe(true)
    }
  }
})
