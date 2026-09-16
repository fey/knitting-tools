/**
 * Запись и разбор параметров в hash адреса (§10.1, §10.3, §10.4). Запись — перенос
 * из прототипа `prototypes/rhythm-input.html`; разбор — тикет #8, держится на
 * правилах починки §9.2/§9.4, которых не было, когда запись переезжала из прототипа.
 *
 * Канонический пример: `#s=60&e=20&k=1&r=even`. Свой ритм пишется сегментами через
 * запятую: `r=1x4,0x7`. Коды не сталкиваются — цифра в начале значит сегменты,
 * буква значит пресет.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно. Разбор тоже
 * чистый: он принимает и возвращает строки/объекты, а не читает `location` сам —
 * `location` и `localStorage` читает `useToeCalculator.ts`, это его этаж (§10.3).
 */
import type { PresetName, Rhythm, Segment, ToeParams } from './types'
import { DEFAULT_PARAMS } from './calc'
import { normalizeStitchFields } from './fieldRules'
import { PRESETS } from './presets'

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
 */
function parseRhythm(raw: string | null): Rhythm {
  if (!raw) return { ...DEFAULT_PARAMS.rhythm }

  if (/^\d/.test(raw)) {
    const segments = parseSegments(raw)
    return segments ? { kind: 'custom', segments } : { ...DEFAULT_PARAMS.rhythm }
  }

  const known = PRESETS.some((preset) => preset.code === raw)
  return known ? { kind: 'preset', name: raw as PresetName } : { ...DEFAULT_PARAMS.rhythm }
}

/**
 * Разбирает hash в сходящиеся параметры (§10.4). Несходящаяся пара петель и кромка
 * чинится нормализатором ядра **молча** — правки просто не читаются, это и есть
 * «вызвать нормализатор и выбросить `fixes`» вместо второго разбора. Порядок правок
 * §9.2 (начальные → конечные → кромка) зашит в самом нормализаторе; ритм идёт
 * последним и своим путём — недобор и перебор сегментов нормализатор не чинит (§9.5),
 * это второй ярус, а не первый.
 *
 * Принимает hash и с решёткой, и без — `paramsKey` из `localStorage` несёт то же
 * содержимое, но без неё (§10.2).
 */
export function parseHash(hash: string): ToeParams {
  const query = new URLSearchParams(stripHash(hash))
  const draft = {
    initial: parseIntParam(query.get('s')),
    final: parseIntParam(query.get('e')),
    edge: parseIntParam(query.get('k')),
  }
  const { initial, final, edge } = normalizeStitchFields(draft, DEFAULT_PARAMS)
  const rhythm = parseRhythm(query.get('r'))

  return { initial, final, edge, rhythm }
}

/**
 * Приоритет при загрузке (§10.3): hash → `localStorage` → дефолты. И то, и другое —
 * просто строки на входе: чтение `location.hash` и ключа записи прогресса делает
 * `useToeCalculator.ts`, здесь только порядок и разбор. `savedParamsKey` — это
 * `paramsKey` записи `{ paramsKey, row }` (§10.2), она несёт тот же формат, что hash,
 * без решётки, поэтому идёт через тот же `parseHash`.
 */
export function resolveParams(hash: string | null | undefined, savedParamsKey: string | null | undefined): ToeParams {
  const hashContent = hash ? stripHash(hash) : ''
  if (hashContent) return parseHash(hashContent)

  const savedContent = savedParamsKey ? stripHash(savedParamsKey) : ''
  if (savedContent) return parseHash(savedContent)

  return { ...DEFAULT_PARAMS, rhythm: { ...DEFAULT_PARAMS.rhythm } }
}
