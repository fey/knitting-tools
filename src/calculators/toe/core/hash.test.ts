import { describe, expect, it } from 'vitest'
import { formatHash, paramsKey } from './hash'
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
