import { describe, expect, it } from 'vitest'
import { formatHash, parseHash, paramsKey, resolveParams } from './hash'
import { DEFAULT_PARAMS, DEFAULT_PARAMS_TOE_UP } from './calc'
import type { ToeParams } from './types'

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
    expect(parseHash('#s=60&e=20&k=1&r=even', 'cuff-down')).toEqual(DEFAULT_PARAMS)
  })

  it('60 → 16 через ряд', () => {
    expect(parseHash('#s=60&e=16&k=1&r=even', 'cuff-down')).toEqual({
      initial: 60,
      final: 16,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('свой ритм сегментами, включая нулевой интервал', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x4,0x7', 'cuff-down')).toEqual({
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
    expect(parseHash('s=60&e=20&k=1&r=even', 'cuff-down')).toEqual(DEFAULT_PARAMS)
  })

  it('запись и разбор — круговой путь для всех четырёх пресетов', () => {
    for (const rhythm of [
      { kind: 'preset', name: 'even' },
      { kind: 'preset', name: 'accel' },
      { kind: 'preset', name: 'thirds' },
      { kind: 'preset', name: 'ramp' },
    ] as const) {
      const params = { ...DEFAULT_PARAMS, rhythm }
      expect(parseHash(formatHash(params), 'cuff-down')).toEqual(params)
    }
  })
})

describe('починка несходящегося входящего hash (§10.4) — молча, по параметру', () => {
  it('пара #s=60&e=18: числа порознь законны, но не сходится их сочетание', () => {
    // 60 − 18 = 42, не кратно 4: не прошли именно конечные, и они берутся дефолтом.
    // 60 − 20 = 40 сходится, начальные из ссылки живут.
    expect(parseHash('#s=60&e=18&k=1&r=even', 'cuff-down')).toEqual({
      initial: 60,
      final: 20,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('не прошедшее заменяется дефолтом, а не подтягивается к ближайшему', () => {
    // 100 − 50 = 50, не кратно 4. Ближайшее сходящееся здесь — 52 или 48, но ссылка
    // чинится не подтягиванием: конечные берутся дефолтными 20 (100 − 20 = 80).
    expect(parseHash('#s=100&e=50&k=1&r=even', 'cuff-down')).toEqual({
      initial: 100,
      final: 20,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('нечётные начальные заменяются дефолтом, конечные из ссылки живут', () => {
    expect(parseHash('#s=61&e=16&k=1&r=even', 'cuff-down')).toEqual({
      initial: 60,
      final: 16,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
  })

  it('кромка вне 0/1/2 заменяется дефолтом', () => {
    expect(parseHash('#s=60&e=20&k=5&r=even', 'cuff-down').edge).toBe(1)
  })

  it('кромка из ссылки не уступает конечным: выбор не чинится, чинится число', () => {
    // При кромке 2 конечных нужно минимум 12, а в ссылке 8. Уступает число, а не выбор:
    // кромка остаётся двойкой, конечные берутся дефолтными 20 (§9.2 — выборы гасятся,
    // а не чинятся, и значение выбора от конфликта не меняется нигде).
    const params = parseHash('#s=60&e=8&k=2&r=even', 'cuff-down')
    expect(params.edge).toBe(2)
    expect(params.final).toBe(20)
  })

  it('дефолт, не сошедшийся с уцелевшим из ссылки, подтягивается — страховка', () => {
    // Начальные 16 законны сами по себе и живут, а дефолтные конечные 20 их больше.
    // Подтягивается уже дефолт, а не пришедшее число: 16 → 12 при кромке 0.
    const params = parseHash('#s=16&e=50&k=0&r=even', 'cuff-down')
    expect(params.initial).toBe(16)
    expect(params.final).toBe(12)
  })

  it('пропавшие числа заменяются дефолтом — прошлого при разборе ссылки нет', () => {
    expect(parseHash('#k=1&r=even', 'cuff-down')).toEqual(DEFAULT_PARAMS)
  })
})

describe('починка ритма — цифра в начале значит сегменты, буква — пресет', () => {
  it('пустой r — дефолтный пресет', () => {
    expect(parseHash('#s=60&e=20&k=1', 'cuff-down').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('неизвестный код пресета заменяется дефолтом', () => {
    expect(parseHash('#s=60&e=20&k=1&r=zigzag', 'cuff-down').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('сломанный синтаксис сегментов заменяется дефолтом целиком', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x4,bad', 'cuff-down').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('нулевой повтор сегмента — не недобор, а сломанный синтаксис: дефолт', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x0', 'cuff-down').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('недобор сегментов — не сломанный синтаксис, живёт как есть (второй ярус, §9.5)', () => {
    expect(parseHash('#s=60&e=20&k=1&r=1x2', 'cuff-down').rhythm).toEqual({
      kind: 'custom',
      segments: [{ interval: 1, repeats: 2 }],
    })
  })
})

describe('приоритет при загрузке (§10.3): hash → localStorage → дефолты', () => {
  it('hash побеждает localStorage, даже когда сам ссылается на другой расчёт', () => {
    const result = resolveParams('#s=60&e=16&k=1&r=even', 's=60&e=20&k=1&r=even', 'cuff-down')
    expect(result.final).toBe(16)
  })

  it('пустой hash — берётся paramsKey из localStorage', () => {
    const result = resolveParams('', 's=60&e=16&k=1&r=even', 'cuff-down')
    expect(result.final).toBe(16)
  })

  it('решётка без содержимого — то же самое, что пустой hash', () => {
    const result = resolveParams('#', 's=60&e=16&k=1&r=even', 'cuff-down')
    expect(result.final).toBe(16)
  })

  it('ни hash, ни localStorage — дефолты', () => {
    expect(resolveParams(null, null, 'cuff-down')).toEqual(DEFAULT_PARAMS)
    expect(resolveParams('', '', 'cuff-down')).toEqual(DEFAULT_PARAMS)
  })

  it('битый localStorage тоже чинится молча тем же нормализатором', () => {
    const result = resolveParams(null, 's=60&e=18&k=1&r=even', 'cuff-down')
    expect(result.final).toBe(20)
  })
})

describe('hash от мыска (§10.1 спеки toe-up)', () => {
  const UP_DEFAULTS = '#s=24&e=64&k=1&r=even'

  it('дефолт пишется каноническим примером спеки toe-up', () => {
    expect(formatHash(DEFAULT_PARAMS_TOE_UP)).toBe(UP_DEFAULTS)
    expect(paramsKey(DEFAULT_PARAMS_TOE_UP)).toBe('s=24&e=64&k=1&r=even')
  })

  it('канонический пример разбирается в дефолт toe-up', () => {
    expect(parseHash(UP_DEFAULTS, 'toe-up')).toEqual(DEFAULT_PARAMS_TOE_UP)
  })

  it('те же ключи s/e/k/r — страницы разные, ключи не сталкиваются', () => {
    // Один hash на двух страницах открывает два разных расчёта: у каждой свои дефолты.
    expect(parseHash('#s=24&e=64&k=1&r=even', 'cuff-down').initial).toBe(24)
    expect(parseHash('#s=60&e=20&k=1&r=even', 'toe-up').final).toBe(20)
  })

  it('свой ритм и кромка пишутся и читаются как у cuff-down', () => {
    const params: ToeParams = { ...DEFAULT_PARAMS_TOE_UP, edge: 2, rhythm: { kind: 'custom', segments: [{ interval: 0, repeats: 8 }] } }
    expect(parseHash(formatHash(params), 'toe-up')).toEqual(params)
  })

  it('разбор сходящегося hash toe-up по параметрам', () => {
    expect(parseHash('#s=28&e=68&k=2&r=slow', 'toe-up')).toEqual({
      initial: 28,
      final: 68,
      edge: 2,
      rhythm: { kind: 'preset', name: 'slow' },
    })
  })

  it('чужой пресет accel — битая ссылка: ритм заменяется дефолтом молча (§10.4)', () => {
    // Остальное из ссылки живёт: 28 → 68 сходится.
    expect(parseHash('#s=28&e=68&k=1&r=accel', 'toe-up')).toEqual({
      initial: 28,
      final: 68,
      edge: 1,
      rhythm: { kind: 'preset', name: 'even' },
    })
    expect(parseHash('#s=28&e=68&k=1&r=thirds', 'toe-up').rhythm).toEqual({ kind: 'preset', name: 'even' })
    expect(parseHash('#s=28&e=68&k=1&r=ramp', 'toe-up').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('slow на странице cuff-down — тоже чужой пресет', () => {
    expect(parseHash('#s=60&e=20&k=1&r=slow', 'cuff-down').rhythm).toEqual({ kind: 'preset', name: 'even' })
  })

  it('несходящиеся числа заменяются дефолтом по параметру', () => {
    // Конечные 66 законны сами по себе и живут (66 − 24 = 42 не кратно 4 — но
    // разбор по параметрам, начальные уступают), начальные подтягивает страховка.
    expect(parseHash('#s=24&e=66&k=1&r=even', 'toe-up')).toEqual({ initial: 22, final: 66, edge: 1, rhythm: { kind: 'preset', name: 'even' } })
    // Честный отказ конечных — выше потолка: берутся дефолтные 64.
    expect(parseHash('#s=24&e=204&k=1&r=even', 'toe-up')).toEqual(DEFAULT_PARAMS_TOE_UP)
  })

  it('приоритет hash → localStorage → дефолты toe-up', () => {
    expect(resolveParams('', 's=28&e=68&k=1&r=slow', 'toe-up').final).toBe(68)
    expect(resolveParams(null, null, 'toe-up')).toEqual(DEFAULT_PARAMS_TOE_UP)
  })
})
