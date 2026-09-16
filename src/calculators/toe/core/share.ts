/**
 * Текст для системного шита «Поделиться» (§10.5, тикет #8).
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно. Отдельный
 * файл, а не `text.ts`: `presets.ts` уже импортирует `decRowsWord` из `text.ts`,
 * и добавление обратного импорта туда завело бы цикл модулей ради одной функции.
 */
import type { ToeCalculation } from './types'
import { rhythmName } from './presets'
import { rowsWord } from './text'

/**
 * Текст для системного шита «Поделиться»: «Мысок: 60 → 20 петель, убавки через
 * ряд, 19 рядов» — читается даже без перехода по ссылке.
 *
 * Петли — те, на которых мысок **действительно кончится**, то есть `finalReal`
 * и только он, тем же правилом, что в итоге (§9.5): при недоборе мысок встанет
 * на 36 петлях вместо 20, а при переборе `finalReal` сам равен конечным — лишние
 * шаги ядро не выполняет. Развилки здесь нет: второй источник правды на одно число
 * разъехался бы со схемой.
 *
 * Имя ритма — общее `rhythmName` из `presets.ts`: одно правило на итог и на ссылку.
 */
export function shareText(calculation: ToeCalculation): string {
  return `Мысок: ${calculation.initial} → ${calculation.finalReal} петель, убавки ${rhythmName(calculation.rhythm)}, ${rowsWord(calculation.totalRows)}`
}
