/**
 * Строки, описывающие расчёт: подпись схемы, «Итог», текст «Поделиться» (§7, §10.5).
 * Одна сборка на все точки показа — у каждого места своя копия формулировки уже
 * разъехалась однажды («22 петель», тикет #43). Числа петель и рядов склоняются
 * только через `plural.ts`, своих литералов у компонентов нет.
 *
 * Петли везде — те, на которых мысок **действительно кончится**, то есть `finalReal`
 * и только он (§9.5): при недоборе мысок встанет на 36 петлях вместо 20, а при
 * переборе `finalReal` сам равен конечным — лишние шаги ядро не выполняет.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeCalculation } from './types'
import { rhythmName } from './presets'
import { rowsWord, stitchesWord } from './plural'

type Described = Pick<ToeCalculation, 'initial' | 'finalReal' | 'edge' | 'totalRows' | 'rhythm'>

/** «60 → 20 петель» — от начальных к тем, на которых мысок кончится. */
function stitchesSpan(calculation: Pick<ToeCalculation, 'initial' | 'finalReal'>): string {
  return `${calculation.initial} → ${stitchesWord(calculation.finalReal)}`
}

/**
 * Числа расчёта в подписи схемы (§7): «60 → 20 петель · кромка 1 · 19 рядов».
 * Длина по плотности (`lengthCm`, уже отформатированная) дописывается в конец.
 */
export function paramsLine(calculation: Described, lengthCm: string | null = null): string {
  const head = `${stitchesSpan(calculation)} · кромка ${calculation.edge} · ${rowsWord(calculation.totalRows)}`
  return lengthCm ? `${head} · ${lengthCm}` : head
}

/** Строка «Итога»: «Мысок: 60 → 20 петель, кромка 1, убавки через ряд». */
export function summaryLine(calculation: Described): string {
  return `Мысок: ${stitchesSpan(calculation)}, кромка ${calculation.edge}, убавки ${rhythmName(calculation.rhythm)}`
}

/**
 * Текст для системного шита «Поделиться» (§10.5): «Мысок: 60 → 20 петель, убавки через
 * ряд, 19 рядов» — читается даже без перехода по ссылке.
 */
export function shareText(calculation: Described): string {
  return `Мысок: ${stitchesSpan(calculation)}, убавки ${rhythmName(calculation.rhythm)}, ${rowsWord(calculation.totalRows)}`
}

/** Подпись над схемой (§7): «↑ 20 петель на закрытие». */
export function closingCaption(calculation: Pick<ToeCalculation, 'finalReal'>): string {
  return `↑ ${stitchesWord(calculation.finalReal)} на закрытие`
}

/** Подпись под схемой (§7): «Начало мыска, 60 петель. …». */
export function startCaption(calculation: Pick<ToeCalculation, 'initial'>): string {
  return `Начало мыска, ${stitchesWord(calculation.initial)}. Ряды читаются снизу вверх, петли справа налево.`
}
