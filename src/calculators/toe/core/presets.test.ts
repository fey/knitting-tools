import { describe, expect, it } from 'vitest'
import { PRESETS, presetByCode, presetRowCount, presetWhyOff } from './presets'
import { calculateToe, DEFAULT_PARAMS } from './calc'
import type { PresetName } from './types'

const rowsOf = (name: PresetName, initial: number, final: number) =>
  calculateToe({ ...DEFAULT_PARAMS, initial, final, rhythm: { kind: 'preset', name } }).totalRows

describe('четыре готовых ритма', () => {
  it('состав и порядок закреплены', () => {
    expect(PRESETS.map((p) => p.code)).toEqual(['even', 'accel', 'thirds', 'ramp'])
    expect(PRESETS.map((p) => p.min)).toEqual([1, 2, 3, 5])
  })

  // §12.1, случай 3: 60 → 16 даёт N = 11.
  it('при 11 убавочных рядах дают 21 / 17 / 20 / 21 ряд', () => {
    expect(PRESETS.map((p) => rowsOf(p.code, 60, 16))).toEqual([21, 17, 20, 21])
  })
})

describe('правило остатка: лишний убавочный ряд уходит ближе к концу мыска', () => {
  // §12.1, случай 4.
  it('«с ускорением» при 11 убавочных рядах делится 6 + 5', () => {
    expect(presetByCode('accel').segments(11)).toEqual([
      { interval: 1, repeats: 6 },
      { interval: 0, repeats: 5 },
    ])
  })

  it('«по третям» при 11 убавочных рядах делится 3 / 3 / 5', () => {
    expect(presetByCode('thirds').segments(11).map((s) => s.repeats)).toEqual([3, 3, 5])
  })
})

describe('формулы числа рядов на диапазоне', () => {
  // §12.1, случай 5.
  const range = Array.from({ length: 21 }, (_, i) => i + 5)

  it.each(range)('«через ряд» при N = %i даёт 2N − 1', (n) => {
    expect(rowsOf('even', 200, 200 - 4 * n)).toBe(2 * n - 1)
  })

  it.each(range)('«с разгоном» при N = %i даёт N + 10', (n) => {
    expect(rowsOf('ramp', 200, 200 - 4 * n)).toBe(n + 10)
  })
})

describe('живой пресет покрывает ровно N убавочных рядов', () => {
  // §12.1, случай 6: на N = 1…40 и без пустых фаз.
  const range = Array.from({ length: 40 }, (_, i) => i + 1)

  it.each(range)('N = %i', (n) => {
    for (const preset of PRESETS) {
      if (n < preset.min) continue
      const segments = preset.segments(n)
      expect(segments.reduce((sum, s) => sum + s.repeats, 0)).toBe(n)
      expect(segments.every((s) => s.repeats >= 1)).toBe(true)
      expect(calculateToe({
        ...DEFAULT_PARAMS,
        initial: 200,
        final: 200 - 4 * n,
        rhythm: { kind: 'preset', name: preset.code },
      }).lack).toBe(0)
    }
  })
})

describe('ритм, который не собирается', () => {
  it('живого числа рядов не даёт', () => {
    expect(presetRowCount(presetByCode('ramp'), 4, 60)).toBeNull()
    expect(presetRowCount(presetByCode('ramp'), 5, 60)).toBe(15)
  })

  it('объясняет причину числом убавочных рядов', () => {
    expect(presetWhyOff(presetByCode('thirds'), 2)).toBe('нужно 3 убавочных ряда, сейчас 2')
    expect(presetWhyOff(presetByCode('ramp'), 4)).toBe('нужно 5 убавочных рядов, сейчас 4')
    expect(presetWhyOff(presetByCode('even'), 0)).toBe('нужно 1 убавочный ряд, сейчас 0')
  })
})
