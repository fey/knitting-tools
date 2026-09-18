import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GAUGE_BASE,
  circumferenceCm,
  cmPerRow,
  cmPerStitch,
  cmWord,
  formatCm,
  formatGauge,
  parseGauge,
  parseGaugeField,
  rulerTicks,
  toeLengthCm,
} from './gauge'
import { paramsKey } from './hash'
import type { Gauge } from './gauge'
import type { ToeParams } from './types'

/** Носочная плотность из §9.6, на базе по умолчанию. */
const GAUGE: Gauge = { rows: 40, stitches: 31, base: DEFAULT_GAUGE_BASE }

describe('перевод счёта в сантиметры', () => {
  it('клетка по вертикали и по горизонтали разного размера — ряд ниже, чем петля шире', () => {
    expect(cmPerRow(GAUGE)).toBeCloseTo(0.25, 10)
    expect(cmPerStitch(GAUGE)).toBeCloseTo(0.3226, 4)
  })

  it('длина мыска — число рядов ÷ плотность по рядам (§13)', () => {
    expect(toeLengthCm(19, GAUGE)).toBeCloseTo(4.75, 10)
  })

  it('обхват берётся от петель в круге, а не от половины на схеме (§4)', () => {
    expect(circumferenceCm(60, GAUGE)).toBeCloseTo(19.35, 2)
  })

  it('база образца не обязана быть десяткой', () => {
    const onFour: Gauge = { rows: 16, stitches: 12, base: 4 }
    expect(cmPerRow(onFour)).toBeCloseTo(0.25, 10)
    expect(cmPerStitch(onFour)).toBeCloseTo(0.3333, 4)
  })
})

describe('запись числа', () => {
  it('два знака после запятой, разделитель — запятая (§2)', () => {
    expect(formatCm(4.75)).toBe('4,75')
    expect(formatCm(19.354838)).toBe('19,35')
    expect(formatCm(3)).toBe('3,00')
  })

  it('единица идёт вместе с числом', () => {
    expect(cmWord(4.75)).toBe('4,75 см')
  })
})

describe('засечки линейки (§7)', () => {
  it('стоят на круглых сантиметрах и меряются в клетках', () => {
    // 19 рядов по 0,25 см — 4,75 см: засечки на 1, 2, 3 и 4 см, по 4 ряда каждая.
    expect(rulerTicks(19, cmPerRow(GAUGE))).toEqual([
      { cm: 1, at: 4 },
      { cm: 2, at: 8 },
      { cm: 3, at: 12 },
      { cm: 4, at: 16 },
    ])
  })

  it('шаг поперёк реже, чем вдоль — это и есть разница плотностей', () => {
    const across = rulerTicks(30, cmPerStitch(GAUGE))
    expect(across).toHaveLength(9)
    expect(across[0].at).toBeCloseTo(3.1, 4)
  })

  it('мысок короче сантиметра засечек не получает', () => {
    expect(rulerTicks(2, cmPerRow(GAUGE))).toEqual([])
  })

  it('плотности нет — считать нечего', () => {
    expect(rulerTicks(19, 0)).toEqual([])
  })
})

describe('разбор поля плотности (§4)', () => {
  it('запятая принимается наравне с точкой: её и набирают', () => {
    expect(parseGaugeField('37,5')).toBe(37.5)
    expect(parseGaugeField('37.5')).toBe(37.5)
  })

  it('пустое поле значит «плотности нет», а не ноль', () => {
    expect(parseGaugeField('')).toBeNull()
    expect(parseGaugeField('   ')).toBeNull()
  })

  it('ноль, отрицательное и не-число — то же «плотности нет»', () => {
    expect(parseGaugeField('0')).toBeNull()
    expect(parseGaugeField('-4')).toBeNull()
    expect(parseGaugeField('сорок')).toBeNull()
  })
})

describe('запись в хранилище (§10.2)', () => {
  it('своя запись читается обратно', () => {
    expect(parseGauge(formatGauge(GAUGE))).toEqual(GAUGE)
  })

  it('записи нет, она битая или неполна — плотности нет', () => {
    expect(parseGauge(null)).toBeNull()
    expect(parseGauge('')).toBeNull()
    expect(parseGauge('{')).toBeNull()
    expect(parseGauge('{"rows":40}')).toBeNull()
    expect(parseGauge('{"rows":40,"stitches":31}')).toBeNull()
    expect(parseGauge('{"rows":0,"stitches":31,"base":10}')).toBeNull()
    expect(parseGauge('{"rows":"40","stitches":31,"base":10}')).toBeNull()
  })
})

describe('плотность не входит в расчёт', () => {
  it('`paramsKey` её не знает — смена плотности не сбрасывает отмеченный ряд (§8, §10.2)', () => {
    const params: ToeParams = {
      initial: 60,
      final: 20,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    }
    // Ключ прогресса собирается из параметров расчёта и только из них: плотности
    // среди них нет вовсе, поэтому её правка не может разойтись с записью прогресса.
    expect(paramsKey(params)).toBe('s=60&e=20&k=1&r=even')
    expect(paramsKey(params)).not.toContain('40')
  })
})
