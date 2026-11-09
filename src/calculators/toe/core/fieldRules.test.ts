import { describe, expect, it } from 'vitest'
import {
  converges,
  edgeWhyOff,
  finalCandidates,
  fieldsFromLink,
  MAX_STITCHES,
  normalizeStitchFields,
  type FieldsDraft,
  type Fix,
  type NormalizedFields,
} from './fieldRules'

describe('converges', () => {
  it('дефолт сходится', () => {
    expect(converges({ initial: 60, final: 20, edge: 1 }, 'cuff-down')).toBe(true)
  })

  it('нечётные начальные не сходятся', () => {
    expect(converges({ initial: 61, final: 20, edge: 1 }, 'cuff-down')).toBe(false)
  })

  it('нечётные конечные не сходятся', () => {
    expect(converges({ initial: 60, final: 19, edge: 1 }, 'cuff-down')).toBe(false)
  })

  it('разница не кратна 4 не сходится', () => {
    expect(converges({ initial: 60, final: 18, edge: 1 }, 'cuff-down')).toBe(false)
  })

  it('конечные не меньше начальных не сходятся', () => {
    expect(converges({ initial: 60, final: 60, edge: 1 }, 'cuff-down')).toBe(false)
    expect(converges({ initial: 60, final: 64, edge: 1 }, 'cuff-down')).toBe(false)
  })

  it('конечных не хватает на кромку', () => {
    expect(converges({ initial: 16, final: 8, edge: 2 }, 'cuff-down')).toBe(false)
    expect(converges({ initial: 16, final: 12, edge: 2 }, 'cuff-down')).toBe(true)
  })

  it('потолок 200 соблюдается по обоим полям', () => {
    expect(converges({ initial: MAX_STITCHES + 4, final: 20, edge: 1 }, 'cuff-down')).toBe(false)
    expect(converges({ initial: MAX_STITCHES, final: MAX_STITCHES - 4, edge: 1 }, 'cuff-down')).toBe(true)
  })

  it('нулевые и отрицательные значения не сходятся', () => {
    expect(converges({ initial: 0, final: 0, edge: 1 }, 'cuff-down')).toBe(false)
    expect(converges({ initial: 60, final: -4, edge: 1 }, 'cuff-down')).toBe(false)
  })

  it('нецелые значения не сходятся', () => {
    expect(converges({ initial: 60.5, final: 20, edge: 1 }, 'cuff-down')).toBe(false)
  })
})

describe('finalCandidates', () => {
  it('дефолт даёт 16, 20, 24', () => {
    expect(finalCandidates(60, 1)).toEqual([16, 20, 24])
  })

  it('пересчитывается от начальных без тай-брейка на чётном остатке', () => {
    expect(finalCandidates(62, 1)).toEqual([18, 22])
  })

  it('кромка сужает список снизу через минимум конечных', () => {
    expect(finalCandidates(60, 2)).toEqual([16, 20, 24])
    expect(finalCandidates(28, 2)).toEqual([16, 20, 24])
  })

  it('маленький мысок отдаёт всё достижимое, когда обычный диапазон пуст', () => {
    expect(finalCandidates(16, 1)).toEqual([8, 12])
  })

  it('ничего не достижимо — список пуст', () => {
    expect(finalCandidates(8, 2)).toEqual([])
  })
})

describe('нормализатор: подтягивание с подписью', () => {
  const PREV = { initial: 60, final: 20, edge: 1 }

  /** Короткий вызов: чего нет в черновике — того не трогали, берётся прошлое. */
  function normalize(draft: Partial<FieldsDraft>) {
    return normalizeStitchFields({ initial: null, final: null, edge: null, ...draft }, PREV, 'cuff-down')
  }

  function fixOn(result: NormalizedFields, field: 'initial' | 'final'): Fix {
    const fix = result.fixes.find((f) => f.field === field)
    if (!fix) throw new Error(`Правки поля ${field} нет`)
    return fix
  }

  it('сходящийся набор не правится и отчёт пуст', () => {
    const result = normalize({ initial: 60, final: 20, edge: 1 })
    expect(result).toEqual({ initial: 60, final: 20, edge: 1, fixes: [] })
  })

  it('разница не кратна 4: при равенстве расстояний тянет вверх и предлагает соседа', () => {
    const result = normalize({ final: 18 })
    expect(result.final).toBe(20)
    expect(fixOn(result, 'final')).toMatchObject({
      reason: 'final-step',
      entered: 18,
      applied: 20,
      neighbour: 16,
      message: '18 не сходится: 60 − 18 = 42, а убавки снимают по 4. Ближайшее сходящееся — 20',
    })
  })

  it('без равенства расстояний тянет к ближнему, сосед всё равно предложен', () => {
    const result = normalize({ final: 19 })
    expect(result.final).toBe(20)
    expect(fixOn(result, 'final')).toMatchObject({ applied: 20, neighbour: 16 })

    const down = normalize({ final: 17 })
    expect(down.final).toBe(16)
    expect(fixOn(down, 'final')).toMatchObject({ applied: 16, neighbour: 20 })
  })

  it('нечётные начальные тянутся вниз, предложены оба соседа', () => {
    const result = normalize({ initial: 61 })
    expect(result.initial).toBe(60)
    expect(fixOn(result, 'initial')).toMatchObject({
      reason: 'initial-odd',
      entered: 61,
      applied: 60,
      neighbour: 62,
      message: '61 не делится пополам. Ближайшее чётное — 60',
    })
    // Начальные — поле-факт: конечные под них не правились, они и так сходятся.
    expect(result.final).toBe(20)
    expect(result.fixes).toHaveLength(1)
  })

  it('конечных не меньше начальных: тянет вниз тем же правилом, соседа сверху нет', () => {
    const result = normalize({ final: 60 })
    expect(result.final).toBe(56)
    expect(fixOn(result, 'final')).toMatchObject({
      reason: 'final-not-less',
      neighbour: null,
      message: 'Конечных должно быть меньше начальных. Ближайшее сходящееся — 56',
    })
  })

  it('в конфликте уступают конечные, даже когда трогали начальные', () => {
    // Набрали начальные 16 при конечных 20: правится поле конечных, не начальных.
    const result = normalize({ initial: 16 })
    expect(result.initial).toBe(16)
    expect(result.final).toBe(12)
    expect(fixOn(result, 'final').reason).toBe('final-not-less')
  })

  it('кромка уже 2, набрали конечные 8 — число тянется до 12', () => {
    const result = normalizeStitchFields(
      { initial: null, final: 8, edge: 2 },
      { initial: 60, final: 20, edge: 2 }, 'cuff-down',
    )
    expect(result.final).toBe(12)
    expect(fixOn(result, 'final')).toMatchObject({
      reason: 'final-min',
      neighbour: null,
      message: 'При широком мыске конечных нужно минимум 12. Ближайшее сходящееся — 12',
    })
  })

  it('минимум при кромке 0 и 1 говорит своим числом', () => {
    expect(normalize({ final: 6 }).final).toBe(8)
    expect(fixOn(normalize({ final: 6 }), 'final').message).toBe(
      'Конечных нужно минимум 8. Ближайшее сходящееся — 8',
    )
  })

  it('минимум сдвигается вверх, когда решётка шага мимо него', () => {
    // При начальных 62 сходятся конечные 10, 14, … — восьмёрка мимо решётки.
    const result = normalizeStitchFields({ initial: 62, final: 8, edge: 1 }, PREV, 'cuff-down')
    expect(result.final).toBe(10)
  })

  it('потолок правит начальные, а не молчит', () => {
    const result = normalize({ initial: 260 })
    expect(result.initial).toBe(MAX_STITCHES)
    expect(fixOn(result, 'initial').reason).toBe('initial-ceiling')
  })

  it('нечётные выше потолка чинятся один раз и без соседа за потолком', () => {
    const result = normalize({ initial: 201 })
    expect(result.initial).toBe(200)
    expect(result.fixes.filter((f) => f.field === 'initial')).toHaveLength(1)
    expect(fixOn(result, 'initial').neighbour).toBeNull()
  })

  it('начальных не хватает на минимальные конечные — говорит про минимум, а не про чётность', () => {
    // Девятка правится дважды (чётность, потом пол), но подпись называет ту причину,
    // что сдвинула значение последней: «ближайшее чётное к 9» — не 12.
    const result = normalize({ initial: 9 })
    expect(result.initial).toBe(12)
    expect(fixOn(result, 'initial')).toMatchObject({
      reason: 'initial-floor',
      message: 'Начальных нужно минимум 12. Ближайшее сходящееся — 12',
    })
  })

  it('пустое поле возвращает прошлое значение этого поля, а не дефолт', () => {
    const previous = { initial: 64, final: 24, edge: 1 }
    const result = normalizeStitchFields({ initial: null, final: null, edge: null }, previous, 'cuff-down')
    expect(result).toEqual({ initial: 64, final: 24, edge: 1, fixes: [] })
  })

  it('кромка вне 0/1/2 берётся прошлая — выбор не чинится числом', () => {
    expect(normalize({ edge: 7 }).edge).toBe(1)
  })

  it('что бы ни набрали, результат сходится', () => {
    const garbage = [null, 0, -4, 1, 9, 17, 18, 19, 21, 60, 61, 62, 199, 200, 201, 260, 20.4, NaN]
    for (const initial of garbage) {
      for (const final of garbage) {
        for (const edge of [0, 1, 2, 7]) {
          const result = normalizeStitchFields({ initial, final, edge }, PREV, 'cuff-down')
          expect(converges(result, 'cuff-down'), `набрано ${initial} / ${final} при кромке ${edge}`).toBe(true)
          // Правка на поле ровно одна: две подписи под одним полем показывать негде.
          expect(result.fixes.filter((f) => f.field === 'initial').length).toBeLessThanOrEqual(1)
          expect(result.fixes.filter((f) => f.field === 'final').length).toBeLessThanOrEqual(1)
          for (const fix of result.fixes) {
            expect(fix.applied).toBe(fix.field === 'initial' ? result.initial : result.final)
          }
        }
      }
    }
  })
})

describe('edgeWhyOff', () => {
  it('двойка гаснет с причиной, пока конечных меньше 12', () => {
    expect(edgeWhyOff(2, 8, 'cuff-down')).toBe('Широкий мысок — от 12 конечных петель')
    expect(edgeWhyOff(2, 12, 'cuff-down')).toBeNull()
  })

  it('кромка 0 и 1 при обычных конечных доступна', () => {
    expect(edgeWhyOff(0, 8, 'cuff-down')).toBeNull()
    expect(edgeWhyOff(1, 8, 'cuff-down')).toBeNull()
    expect(edgeWhyOff(1, 4, 'cuff-down')).toBe('Нужно минимум 8 конечных петель')
  })
})

describe('converges от мыска (§9.4 спеки toe-up)', () => {
  const up = (initial: number, final: number, edge = 1) => converges({ initial, final, edge }, 'toe-up')

  it('дефолт 24 → 64 сходится', () => {
    expect(up(24, 64)).toBe(true)
  })

  it('оба чётные, разница кратна 4, начальных меньше конечных', () => {
    expect(up(24, 65)).toBe(false)
    expect(up(25, 64)).toBe(false)
    expect(up(24, 66)).toBe(false)
    expect(up(64, 24)).toBe(false)
    expect(up(64, 64)).toBe(false)
    expect(up(28, 64)).toBe(true)
  })

  it('начальных не меньше 8', () => {
    expect(up(6, 64)).toBe(false)
    expect(up(8, 64)).toBe(true)
  })

  it('потолок 200 — у конечных (§9.4 спеки toe-up)', () => {
    expect(up(200, 204)).toBe(false)
    expect(up(196, 200)).toBe(true)
  })

  it('кромка границ не двигает: двойка не гасится никогда', () => {
    expect(up(8, 64, 0)).toBe(true)
    expect(up(8, 64, 2)).toBe(true)
  })
})

describe('нормализатор от мыска: поле-факт — конечные (§9.2 спеки toe-up)', () => {
  const PREV_UP = { initial: 24, final: 64, edge: 1 }

  function normalizeUp(draft: Partial<FieldsDraft>) {
    return normalizeStitchFields({ initial: null, final: null, edge: null, ...draft }, PREV_UP, 'toe-up')
  }

  function fixOn(result: NormalizedFields, field: 'initial' | 'final'): Fix {
    const fix = result.fixes.find((f) => f.field === field)
    if (!fix) throw new Error(`Правки поля ${field} нет`)
    return fix
  }

  it('сходящийся набор не правится и отчёт пуст', () => {
    expect(normalizeUp({ initial: 24, final: 64, edge: 1 })).toEqual({
      initial: 24,
      final: 64,
      edge: 1,
      fixes: [],
    })
  })

  // §9.5 спеки toe-up, строка «Разница не кратна 4»: пример из таблицы дословно.
  it('разница не кратна 4: начальные тянутся вниз, при равенстве расстояний — вниз', () => {
    const result = normalizeUp({ initial: 26 })
    expect(result.initial).toBe(24)
    expect(fixOn(result, 'initial')).toMatchObject({
      reason: 'initial-step',
      entered: 26,
      applied: 24,
      neighbour: 28,
      message: '26 не сходится: 64 − 26 = 38, а прибавки добавляют по 4. Ближайшее сходящееся — 24',
    })
    // Конечные — поле-факт: под начальные не правились.
    expect(result.final).toBe(64)
    expect(result.fixes).toHaveLength(1)
  })

  it('без равенства расстояний начальные тянутся к ближнему, сосед предложен', () => {
    const up = normalizeUp({ initial: 27 })
    expect(up.initial).toBe(28)
    expect(fixOn(up, 'initial')).toMatchObject({ applied: 28, neighbour: 24 })

    const down = normalizeUp({ initial: 29 })
    expect(down.initial).toBe(28)
    expect(fixOn(down, 'initial')).toMatchObject({ applied: 28, neighbour: 32 })
  })

  // §9.5 спеки toe-up, строка «Нечётные конечные»: пример из таблицы дословно.
  it('нечётные конечные чинятся сами, фактом круга стопы они быть не могут', () => {
    const result = normalizeUp({ final: 65 })
    expect(result.final).toBe(64)
    expect(fixOn(result, 'final')).toMatchObject({
      reason: 'final-odd',
      entered: 65,
      applied: 64,
      neighbour: 66,
      message: '65 не делится пополам. Ближайшее чётное — 64',
    })
    // Начальные 24 при конечных 64 сходятся — правка одна.
    expect(result.initial).toBe(24)
    expect(result.fixes).toHaveLength(1)
  })

  it('нечётные конечные выше потолка чинятся один раз и без соседа за потолком', () => {
    const result = normalizeUp({ final: 201 })
    expect(result.final).toBe(200)
    expect(result.fixes.filter((f) => f.field === 'final')).toHaveLength(1)
    expect(fixOn(result, 'final').neighbour).toBeNull()
  })

  it('потолок 200 правит конечные, а не молчит', () => {
    const result = normalizeUp({ final: 260 })
    expect(result.final).toBe(MAX_STITCHES)
    expect(fixOn(result, 'final').reason).toBe('final-ceiling')
  })

  it('конечных меньше, чем минимальный набор с прибавкой, — пол 12 у конечных', () => {
    const result = normalizeUp({ final: 6 })
    expect(result.final).toBe(12)
    expect(fixOn(result, 'final')).toMatchObject({
      reason: 'final-floor',
      neighbour: null,
      message: 'Конечных нужно минимум 12. Ближайшее сходящееся — 12',
    })
  })

  // §9.5 спеки toe-up, строка «Начальных не меньше конечных».
  it('начальных не меньше конечных: тянутся вниз к ближайшему сходящемуся', () => {
    const result = normalizeUp({ initial: 64 })
    expect(result.initial).toBe(60)
    expect(fixOn(result, 'initial')).toMatchObject({
      reason: 'initial-not-less',
      neighbour: null,
      message: 'Начальных должно быть меньше конечных. Ближайшее сходящееся — 60',
    })
  })

  // §9.5 спеки toe-up, строка «Начальных меньше 8».
  it('начальных меньше 8 — подтягиваются к 8', () => {
    const result = normalizeUp({ initial: 4 })
    expect(result.initial).toBe(8)
    expect(fixOn(result, 'initial')).toMatchObject({
      reason: 'initial-floor',
      message: 'Начальных нужно минимум 8. Ближайшее сходящееся — 8',
    })
  })

  it('решётка начальных держится конечных: при конечных 66 сходятся 10, 14, …', () => {
    const result = normalizeUp({ final: 66, initial: 6 })
    expect(result.final).toBe(66)
    expect(result.initial).toBe(10)
  })

  it('кромка в починке не участвует: двойка не гасится и ничего не двигает', () => {
    expect(normalizeUp({ edge: 2 })).toEqual({ initial: 24, final: 64, edge: 2, fixes: [] })
    expect(normalizeUp({ edge: 7 }).edge).toBe(1)
  })

  it('что бы ни набрали, результат сходится', () => {
    const garbage = [null, 0, -4, 1, 4, 9, 17, 18, 19, 21, 24, 25, 26, 64, 65, 66, 199, 200, 201, 260, 20.4, NaN]
    for (const initial of garbage) {
      for (const final of garbage) {
        for (const edge of [0, 1, 2, 7]) {
          const result = normalizeStitchFields({ initial, final, edge }, PREV_UP, 'toe-up')
          expect(converges(result, 'toe-up'), `набрано ${initial} / ${final} при кромке ${edge}`).toBe(true)
          // Правка на поле ровно одна: две подписи под одним полем показывать негде.
          expect(result.fixes.filter((f) => f.field === 'initial').length).toBeLessThanOrEqual(1)
          expect(result.fixes.filter((f) => f.field === 'final').length).toBeLessThanOrEqual(1)
          for (const fix of result.fixes) {
            expect(fix.applied).toBe(fix.field === 'initial' ? result.initial : result.final)
          }
        }
      }
    }
  })
})

describe('разбор ссылки от мыска: не прошедшее заменяется дефолтом (§10.4)', () => {
  const DEFAULTS_UP = { initial: 24, final: 64, edge: 1 }

  it('уцелевшие числа держат разбор по-своему: конечные проверяются первыми', () => {
    // Конечные 66 законны (чётные, в потолке) и живут; начальные 26 от них сходятся.
    const result = fieldsFromLink({ initial: 26, final: 66, edge: 1 }, DEFAULTS_UP, 'toe-up')
    expect(result).toEqual({ initial: 26, final: 66, edge: 1 })
  })

  it('несходящееся сочетание: уступившее поле берётся дефолтом, а не подтягивается', () => {
    // Начальные 27 не сходятся сами по себе (нечётные) — берутся дефолтные 24.
    // Дефолт с уцелевшими конечными 62 не сходится (62 − 24 = 38 не кратно 4),
    // и там подтягивание уместно: подтягивается уже дефолт — к решётке конечных 62
    // (…, 18, 22, 26, …), при ничьей расстояний вниз: 22.
    const result = fieldsFromLink({ initial: 27, final: 62, edge: 1 }, DEFAULTS_UP, 'toe-up')
    expect(result.final).toBe(62)
    expect(result.initial).toBe(22)
  })

  it('кромка из ссылки не уступает конечным и при toe-up', () => {
    // Нечётные конечные 65 сами чинятся до 64 — исключение §9.2 toe-up.
    const result = fieldsFromLink({ initial: 24, final: 65, edge: 1 }, DEFAULTS_UP, 'toe-up')
    expect(result.final).toBe(64)
    expect(result.initial).toBe(24)
  })
})

describe('edgeWhyOff от мыска', () => {
  it('двойка не гасится никогда: набор не меньше 8, прибавочному ряду хватает', () => {
    expect(edgeWhyOff(2, 8, 'toe-up')).toBeNull()
    expect(edgeWhyOff(0, 4, 'toe-up')).toBeNull()
    expect(edgeWhyOff(1, 4, 'toe-up')).toBeNull()
  })
})
