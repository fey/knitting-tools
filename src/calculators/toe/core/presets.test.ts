import { describe, expect, it } from 'vitest'
import { PRESETS, PRESETS_TOE_UP, presetByCode, presetRowCount, presetWhyOff, presetsFor, rhythmName } from './presets'
import { calculateToe, DEFAULT_PARAMS } from './calc'
import type { PresetName } from './types'

const rowsOf = (name: PresetName, initial: number, final: number) =>
  calculateToe({ ...DEFAULT_PARAMS, initial, final, rhythm: { kind: 'preset', name } }, 'cuff-down').totalRows

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
    expect(presetByCode('accel', 'cuff-down').segments(11)).toEqual([
      { interval: 1, repeats: 6 },
      { interval: 0, repeats: 5 },
    ])
  })

  it('«по третям» при 11 убавочных рядах делится 3 / 3 / 5', () => {
    expect(presetByCode('thirds', 'cuff-down').segments(11).map((s) => s.repeats)).toEqual([3, 3, 5])
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
      }, 'cuff-down').lack).toBe(0)
    }
  })
})

describe('ритм, который не собирается', () => {
  it('живого числа рядов не даёт', () => {
    expect(presetRowCount(presetByCode('ramp', 'cuff-down'), 4, 60, 'cuff-down')).toBeNull()
    expect(presetRowCount(presetByCode('ramp', 'cuff-down'), 5, 60, 'cuff-down')).toBe(15)
  })

  it('объясняет причину числом убавочных рядов', () => {
    expect(presetWhyOff(presetByCode('thirds', 'cuff-down'), 2, 'cuff-down')).toBe('нужно 3 убавочных ряда, сейчас 2')
    expect(presetWhyOff(presetByCode('ramp', 'cuff-down'), 4, 'cuff-down')).toBe('нужно 5 убавочных рядов, сейчас 4')
    expect(presetWhyOff(presetByCode('even', 'cuff-down'), 0, 'cuff-down')).toBe('нужно 1 убавочный ряд, сейчас 0')
  })

  it('от мыска объясняет числом прибавочных рядов (§5.4 спеки toe-up)', () => {
    expect(presetWhyOff(presetByCode('slow', 'toe-up'), 1, 'toe-up')).toBe('нужно 2 прибавочных ряда, сейчас 1')
  })

  it('«через ряд» от мыска описан прибавками, а не убавками', () => {
    expect(presetByCode('even', 'toe-up').how).toBe('прибавочный, потом один промежуточный — и так до конца')
    expect(presetByCode('even', 'cuff-down').how).toBe('убавочный, потом один промежуточный — и так до конца')
  })

  // «С разгоном» несёт фиксированный хвост в 4 ряда, который сам по себе превышает N
  // ниже min = 5. Карточка на экране гасится и не выбирается (RhythmPresets.vue), но
  // сегменты остаются достижимы напрямую — например когда ритм выбрали при N = 10,
  // а петли потом сузили до N = 2. `decRowsCovered` обязан быть плоской суммой повторов:
  // иначе «перебора нет» соврёт при фактическом перекрытии. А `finalReal` обязан совпадать
  // с тем, что реально рисует схема, — при переборе это конечные петли (§9.5).
  it('«с разгоном» ниже min не врёт числом: перебор честно виден, а не спрятан нулевым lack', () => {
    const calc = calculateToe({ ...DEFAULT_PARAMS, initial: 60, final: 52, rhythm: { kind: 'preset', name: 'ramp' } }, 'cuff-down')
    expect(calc.decRowsNeeded).toBe(2)
    // Сегменты остаются набранными целиком: усечение живёт только на пути построения рядов.
    expect(calc.segments.map((s) => s.repeats)).toEqual([1, 1, 1, 1, 0])
    expect(calc.decRowsCovered).toBe(4)
    expect(calc.lack).toBe(-2)
    expect(calc.finalReal).toBe(52)
    expect(calc.rows[calc.rows.length - 1].stitches).toBe(calc.finalReal)
    expect(calc.finalReal).toBe(calc.final)
  })
})

describe('имя ритма — одно на весь калькулятор (§5.5)', () => {
  it('пресет называется своим именем со строчной буквы: ритм стоит внутри фразы', () => {
    expect(rhythmName({ kind: 'preset', name: 'even' }, 'cuff-down')).toBe('через ряд')
    expect(rhythmName({ kind: 'preset', name: 'ramp' }, 'cuff-down')).toBe('с разгоном')
  })

  it('набранные руками сегменты — «свой ритм», сравнения с пресетами нет', () => {
    // Сегменты в точности как у «через ряд» на дефолте — имя всё равно своё.
    expect(rhythmName({ kind: 'custom', segments: [{ interval: 1, repeats: 10 }] }, 'cuff-down')).toBe('свой ритм')
  })
})

describe('пресеты от мыска (§5.4 спеки toe-up)', () => {
  const rowsOfUp = (name: PresetName, initial: number, final: number) =>
    calculateToe({ initial, final, edge: 1, rhythm: { kind: 'preset', name } }, 'toe-up').totalRows

  it('набор закреплён: even и slow, чужих пресетов нет', () => {
    expect(PRESETS_TOE_UP.map((p) => p.code)).toEqual(['even', 'slow'])
    expect(PRESETS_TOE_UP.map((p) => p.min)).toEqual([1, 2])
    // «Через ряд» стоит первым на обеих страницах, сегменты у направлений одни.
    const [up, down] = [presetsFor('toe-up')[0], presetsFor('cuff-down')[0]]
    expect(up.code).toBe(down.code)
    expect(up.segments(10)).toEqual(down.segments(10))
  })

  // §5.4 спеки toe-up: N = 10 даёт 15 рядов, N = 11 — 17.
  it('при N = 10 и N = 11 «с замедлением» даёт 15 и 17 рядов', () => {
    expect(rowsOfUp('slow', 24, 64)).toBe(15)
    expect(rowsOfUp('slow', 24, 68)).toBe(17)
  })

  it('сегменты при N = 10: каждый ряд 5 раз, потом через ряд 5 раз', () => {
    expect(presetByCode('slow', 'toe-up').segments(10)).toEqual([
      { interval: 0, repeats: 5 },
      { interval: 1, repeats: 5 },
    ])
  })

  it('остаток уходит в фазу «через ряд», ближе к стопе: ⌊N/2⌋ + ⌈N/2⌉', () => {
    expect(presetByCode('slow', 'toe-up').segments(11).map((s) => s.repeats)).toEqual([5, 6])
    expect(presetByCode('slow', 'toe-up').segments(7).map((s) => s.repeats)).toEqual([3, 4])
  })

  it('«с ускорением» toe-up не достаётся: пресеты направлений не пересекаются', () => {
    expect(() => presetByCode('accel', 'toe-up')).toThrow('Неизвестный ритм: accel')
    expect(() => presetByCode('thirds', 'toe-up')).toThrow('Неизвестный ритм: thirds')
    expect(() => presetByCode('ramp', 'toe-up')).toThrow('Неизвестный ритм: ramp')
  })

  it('живой пресет покрывает ровно N прибавочных рядов на всём диапазоне', () => {
    const range = Array.from({ length: 40 }, (_, i) => i + 1)
    for (const n of range) {
      for (const preset of PRESETS_TOE_UP) {
        if (n < preset.min) continue
        const segments = preset.segments(n)
        expect(segments.reduce((sum, s) => sum + s.repeats, 0)).toBe(n)
        expect(segments.every((s) => s.repeats >= 1)).toBe(true)
        expect(
          calculateToe(
            { initial: 8, final: 8 + 4 * n, edge: 1, rhythm: { kind: 'preset', name: preset.code } },
            'toe-up',
          ).lack,
        ).toBe(0)
      }
    }
  })
})
