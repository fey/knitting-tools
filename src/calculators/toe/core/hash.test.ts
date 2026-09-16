import { describe, expect, it } from 'vitest'
import { formatHash, parseHash, paramsKey, resolveParams } from './hash'
import { DEFAULT_PARAMS } from './calc'

describe('запись параметров в hash', () => {
  it('дефолт пишется каноническим примером', () => {
    expect(formatHash(DEFAULT_PARAMS)).toBe('#s=60&e=20&k=1&r=even')
  })

  it('свой ритм пишется сегментами через запятую', () => {
    expect(
      formatHash({
        ...DEFAULT_PARAMS,
        rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 4 }, { interval: 0, repeats: 7 }] },
      }),
    ).toBe('#s=60&e=20&k=1&r=1x4,0x7')
  })

  it('коды не сталкиваются: цифра в начале значит сегменты, буква — пресет', () => {
    const custom = formatHash({
      ...DEFAULT_PARAMS,
      rhythm: { kind: 'custom', segments: [{ interval: 1, repeats: 10 }] },
    })
    expect(custom).toContain('r=1x10')
    expect(formatHash({ ...DEFAULT_PARAMS, rhythm: { kind: 'preset', name: 'thirds' } })).toContain('r=thirds')
  })
})

describe('ключ расчёта для прогресса', () => {
  it('несёт те же значения, что и hash, без решётки', () => {
    expect(paramsKey(DEFAULT_PARAMS)).toBe('s=60&e=20&k=1&r=even')
  })

  it('смена кромки меняет ключ', () => {
    expect(paramsKey({ ...DEFAULT_PARAMS, edge: 2 })).not.toBe(paramsKey(DEFAULT_PARAMS))
  })
})

describe('разбор канонического hash', () => {
  it('канонический пример разбирается в дефолт', () => {
    expect(parseHash('#s=60&e=20&k=1&r=even')).toEqual(DEFAULT_PARAMS)
  })

  it('60 → 16 через ряд', () => {
    expect(parseHash('#s=60&e=16&k=1&r=even')).toEqual({
      initial: 60,
      final: 16,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('свой ритм сегментами, включая нулевой интервал', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x4,0x7')).toEqual({
      initial: 60,
      final: 20,
      edge: 1,
      rhythm: {
        kind: 'custom',
        segments: [
          { interval: 1, repeats: 4 },
          { interval: 0, repeats: 7 },
        ],
      },
    })
  })

  it('принимает hash и с решёткой, и без — то же содержимое, что у paramsKey', () => {
    expect(parseHash('s=60&e=20&k=1&r=even')).toEqual(DEFAULT_PARAMS)
  })

  it('запись и разбор — круговой путь для всех четырёх пресетов', () => {
    for (const rhythm of [
      { kind: 'preset', name: 'even' },
      { kind: 'preset', name: 'accel' },
      { kind: 'preset', name: 'thirds' },
      { kind: 'preset', name: 'ramp' },
    ] as const) {
      const params = { ...DEFAULT_PARAMS, rhythm }
      expect(parseHash(formatHash(params))).toEqual(params)
    }
  })
})

describe('починка несходящегося входящего hash (§10.4) — молча, по нормализатору', () => {
  it('пара #s=60&e=18: числа порознь законны, но не сходится их сочетание', () => {
    // 60 − 18 = 42, не кратно 4. Ближайшее сходящееся при равных расстояниях — вверх.
    expect(parseHash('#s=60&e=18&k=1&r=even')).toEqual({
      initial: 60,
      final: 20,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('нечётные начальные тянутся вниз', () => {
    expect(parseHash('#s=61&e=20&k=1&r=even').initial).toBe(60)
  })

  it('кромка вне 0/1/2 заменяется дефолтом', () => {
    expect(parseHash('#s=60&e=20&k=5&r=even').edge).toBe(1)
  })

  it('кромка 2 при конечных 8 подтягивает конечные до 12 — гасить в ссылке нечего', () => {
    expect(parseHash('#s=60&e=8&k=2&r=even').final).toBe(12)
  })

  it('пропавшие числа заменяются дефолтом — прошлого при разборе ссылки нет', () => {
    expect(parseHash('#k=1&r=even')).toEqual(DEFAULT_PARAMS)
  })
})

describe('починка ритма — цифра в начале значит сегменты, буква — пресет', () => {
  it('пустой r — дефолтный пресет', () => {
    expect(parseHash('#s=60&e=20&k=1').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('неизвестный код пресета заменяется дефолтом', () => {
    expect(parseHash('#s=60&e=20&k=1&r=zigzag').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('сломанный синтаксис сегментов заменяется дефолтом целиком', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x4,bad').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('нулевой повтор сегмента — не недобор, а сломанный синтаксис: дефолт', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x0').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('недобор сегментов — не сломанный синтаксис, живёт как есть (второй ярус, §9.5)', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x2').rhythm).toEqual({
      kind: 'custom',
      segments: [{ interval: 1, repeats: 2 }],
    })
  })
})

describe('приоритет при загрузке (§10.3): hash → localStorage → дефолты', () => {
  it('hash побеждает localStorage, даже когда сам ссылается на другой расчёт', () => {
    const result = resolveParams('#s=60&e=16&k=1&r=even', 's=60&e=20&k=1&r=even')
    expect(result.final).toBe(16)
  })

  it('пустой hash — берётся paramsKey из localStorage', () => {
    const result = resolveParams('', 's=60&e=16&k=1&r=even')
    expect(result.final).toBe(16)
  })

  it('решётка без содержимого — то же самое, что пустой hash', () => {
    const result = resolveParams('#', 's=60&e=16&k=1&r=even')
    expect(result.final).toBe(16)
  })

  it('ни hash, ни localStorage — дефолты', () => {
    expect(resolveParams(null, null)).toEqual(DEFAULT_PARAMS)
    expect(resolveParams('', '')).toEqual(DEFAULT_PARAMS)
  })

  it('битый localStorage тоже чинится молча тем же нормализатором', () => {
    const result = resolveParams(null, 's=60&e=18&k=1&r=even')
    expect(result.final).toBe(20)
  })
})
