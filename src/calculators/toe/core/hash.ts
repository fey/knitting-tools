/**
 * Запись и разбор параметров в hash адреса (§10.1, §10.3, §10.4). Запись — перенос
 * из прототипа `prototypes/rhythm-input.html`; разбор — тикет #8, держится на
 * правилах починки §9.2/§9.4, которых не было, когда запись переезжала из прототипа.
 * Расширен направлением (§11 спеки toe-up): ключи те же `s/e/k/r` — страницы разные,
 * ключи не сталкиваются, — а дефолты и пресеты у направлений свои.
 *
 * Канонический пример: `#s=60&e=20&k=1&r=even` (от манжеты), `#s=24&e=64&k=1&r=even`
 * (от мыска). Свой ритм пишется сегментами через запятую: `r=1x4,0x7`. Коды
 * не сталкиваются — цифра в начале значит сегменты, буква значит пресет.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно. Разбор тоже
 * чистый: он принимает и возвращает строки/объекты, а не читает `location` сам —
 * `location` и `localStorage` читает `useToeCalculator.ts`, это его этаж (§10.3).
 */
import type { Direction, PresetName, Rhythm, Segment, ToeParams } from './types'
import { defaultParams } from './calc'
import { fieldsFromLink } from './fieldRules'
import { presetsFor } from './presets'

/** Значение ключа `r=`: имя пресета либо сегменты своего ритма. */
export function formatRhythm(rhythm: Rhythm): string {
  if (rhythm.kind === 'preset') return rhythm.name
  return rhythm.segments.map((s) => `${s.interval}x${s.repeats}`).join(',')
}

/** Hash расчёта вместе с решёткой: `#s=60&e=20&k=1&r=even`. */
export function formatHash(params: ToeParams): string {
  const { initial, final, edge, rhythm } = params
  return `#s=${initial}&e=${final}&k=${edge}&r=${formatRhythm(rhythm)}`
}

/**
 * Ключ расчёта для `localStorage` (§10.2) — те же значения, что в hash.
 * Параметры на экране не совпали с ключом — прогресса нет.
 */
export function paramsKey(params: ToeParams): string {
  return formatHash(params).slice(1)
}

function stripHash(value: string): string {
  return value.startsWith('#') ? value.slice(1) : value
}

function parseIntParam(raw: string | null): number | null {
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Сегменты своего ритма из `1x4,0x7`. `null` — синтаксис сломан: неразбираемый
 * токен, нецелые числа или сегмент с нулём повторов. Нулевой повтор — не недобор
 * и не перебор (это второй ярус, §9.5), а вырожденный сегмент, который стёр бы
 * убавочные ряды из схемы вовсе — а состояния «результата нет» не существует (§9.1).
 */
function parseSegments(raw: string): Segment[] | null {
  const segments: Segment[] = []
  for (const part of raw.split(',')) {
    const match = /^(\d+)x(\d+)$/.exec(part)
    if (!match) return null
    const interval = Number(match[1])
    const repeats = Number(match[2])
    if (!Number.isInteger(interval) || !Number.isInteger(repeats) || repeats < 1) return null
    segments.push({ interval, repeats })
  }
  return segments.length > 0 ? segments : null
}

/**
 * Ритм из значения `r=`: цифра в начале — сегменты, буква — пресет (§10.1). Ничего
 * не прошло разбор (пусто, неизвестный код, сломанные сегменты) — дефолт: при
 * разборе ссылки прошлого значения нет, есть только он (§9.5).
 *
 * Пресет ищется **в наборе своего направления**: `accel` на странице toe-up — чужой
 * пресет, битая ссылка (§10.4 спеки toe-up), и ритм заменяется дефолтом молча.
 */
function parseRhythm(raw: string | null, direction: Direction): Rhythm {
  const fallback = defaultParams(direction).rhythm
  if (!raw) return { ...fallback }

  if (/^\d/.test(raw)) {
    const segments = parseSegments(raw)
    return segments ? { kind: 'custom', segments } : { ...fallback }
  }

  const known = presetsFor(direction).some((preset) => preset.code === raw)
  return known ? { kind: 'preset', name: raw as PresetName } : { ...fallback }
}

/**
 * Разбирает hash в сходящиеся параметры (§10.4). Разбор идёт **по параметру**,
 * в порядке правок §9.2 (начальные → конечные → кромка → ритм): не прошедшее
 * заменяется дефолтом, остальное из ссылки живёт — и всё это **молча**, отдельного
 * текста и места на экране случай не получает.
 *
 * Дефолты и правила починки — своего направления (§11 спеки toe-up): у toe-up это
 * 24 → 64, кромка 1, `even`, а поле-факт — конечные.
 *
 * Подтягивания к ближайшему сходящемуся здесь нет: это правило набранного в поле,
 * а не пришедшего в ссылке (§9.5 — «дефолт уместен только там, где прошлого значения
 * нет вообще, — при разборе ссылки»). Петли и кромку разбирает `fieldsFromLink`,
 * там же записано, почему кромка в этом порядке не уступает конечным. Ритм идёт
 * последним и своим путём — недобор и перебор сегментов не чинятся вовсе (§9.5),
 * это второй ярус, а не первый.
 *
 * Принимает hash и с решёткой, и без — `paramsKey` из `localStorage` несёт то же
 * содержимое, но без неё (§10.2).
 */
export function parseHash(hash: string, direction: Direction): ToeParams {
  const query = new URLSearchParams(stripHash(hash))
  const draft = {
    initial: parseIntParam(query.get('s')),
    final: parseIntParam(query.get('e')),
    edge: parseIntParam(query.get('k')),
  }
  const defaults = defaultParams(direction)
  const { initial, final, edge } = fieldsFromLink(draft, defaults, direction)
  const rhythm = parseRhythm(query.get('r'), direction)

  return { initial, final, edge, rhythm }
}

/**
 * Приоритет при загрузке (§10.3): hash → `localStorage` → дефолты. И то, и другое —
 * просто строки на входе: чтение `location.hash` и ключа записи прогресса делает
 * `useToeCalculator.ts`, здесь только порядок и разбор. `savedParamsKey` — это
 * `paramsKey` записи `{ paramsKey, row }` (§10.2), она несёт тот же формат, что hash,
 * без решётки, поэтому идёт через тот же `parseHash`.
 */
export function resolveParams(
  hash: string | null | undefined,
  savedParamsKey: string | null | undefined,
  direction: Direction,
): ToeParams {
  const hashContent = hash ? stripHash(hash) : ''
  if (hashContent) return parseHash(hashContent, direction)

  const savedContent = savedParamsKey ? stripHash(savedParamsKey) : ''
  if (savedContent) return parseHash(savedContent, direction)

  return defaultParams(direction)
}
