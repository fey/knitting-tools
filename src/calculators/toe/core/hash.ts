/**
 * Запись параметров в hash адреса (§10.1). Перенос из прототипа
 * `prototypes/rhythm-input.html`.
 *
 * Канонический пример: `#s=60&e=20&k=1&r=even`. Свой ритм пишется сегментами через
 * запятую: `r=1x4,0x7`. Коды не сталкиваются — цифра в начале значит сегменты,
 * буква значит пресет.
 *
 * Разбор входящего hash сюда ещё не приехал: он держится на правилах починки (§9.2,
 * §9.4), которых в ядре пока нет.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Rhythm, ToeParams } from './types'

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
