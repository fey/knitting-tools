/**
 * Текст для системного шита «Поделиться» (§10.5, тикет #8).
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно. Отдельный
 * файл, а не `text.ts`: `presets.ts` уже импортирует `decRowsWord` из `text.ts`,
 * и добавление обратного импорта туда завело бы цикл модулей ради одной функции.
 */
import type { ToeCalculation } from './types'
import { presetByCode } from './presets'
import { rowsWord } from './text'

/**
 * Имя ритма для текста «Поделиться» — тем же правилом, что у итога (§5.5):
 * «Свой ритм» навсегда после первой правки сегмента, сравнения с пресетами нет.
 *
 * Дублирует одноимённый расчёт в `SummaryPanel.vue` — свести их в одно место
 * нельзя, тот файл сейчас правит соседняя ветка, а этот тикет его не трогает.
 */
function rhythmLabel(calculation: ToeCalculation): string {
  const { rhythm } = calculation
  return rhythm.kind === 'preset' ? presetByCode(rhythm.name).name.toLowerCase() : 'свой ритм'
}

/**
 * Текст для системного шита «Поделиться»: «Мысок: 60 → 20 петель, убавки через
 * ряд, 19 рядов» — читается даже без перехода по ссылке.
 *
 * Петли — те, на которых мысок **действительно кончится** (§9.5): `finalReal` при
 * недоборе сегментов, иначе запрошенные `final` — тем же правилом, что в итоге.
 */
export function shareText(calculation: ToeCalculation): string {
  const finalShown = calculation.lack > 0 ? calculation.finalReal : calculation.final
  return `Мысок: ${calculation.initial} → ${finalShown} петель, убавки ${rhythmLabel(calculation)}, ${rowsWord(calculation.totalRows)}`
}
