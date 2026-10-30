/**
 * Сантиметровый вид расчёта (§4, §7, §9.6): одно место, где решается «сантиметры, если
 * вписана плотность». «Итог» и схема берут отсюда готовое и сами между сантиметрами
 * и рядами не выбирают — два выбора одного правила разъехались бы.
 *
 * `gauge.ts` — перевод чисел и ничего о расчёте; здесь перевод пристыкован к расчёту.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeCalculation } from './types'
import type { Gauge, RulerTick } from './gauge'
import { circumferenceCm, cmPerRow, cmPerStitch, cmWord, rulerTicks, toeLengthCm } from './gauge'
import { lengthNote, lengthNoteCm, startHint } from './notes'

export type CentimetreView = {
  /**
   * Замечание о длине (§9.6) **без плотности, в рядах**: коридор в рядах и есть перевод
   * по предполагаемой плотности. С плотностью замечание влито в `cm.startHint`, и здесь
   * `null` — два текста про одну величину рядом не стоят.
   */
  lengthNote: string | null
  /** Сантиметры — только с вписанной плотностью; без неё `null` и на экране их нет. */
  cm: {
    /** «4,75 см» — длина мыска. */
    length: string
    /** Строка указания «Итога» (§6, #36): длина мыска и, если есть, замечание о ней. */
    startHint: string
    /** Обхват на начальных петлях: петли считаются в круге (§4), схема — половина. */
    circumference: string
    /** Засечки вдоль, в клетках от ряда 1 — снизу, где начало мыска (§7). */
    rowTicks: RulerTick[]
    /** Засечки поперёк, в клетках от правого края — оттуда читается ряд (§7). */
    stitchTicks: RulerTick[]
  } | null
}

export function centimetreView(
  calculation: Pick<ToeCalculation, 'totalRows' | 'initial'>,
  gauge: Gauge | null,
): CentimetreView {
  const { totalRows, initial } = calculation
  if (!gauge) return { lengthNote: lengthNote(totalRows), cm: null }

  const lengthCm = toeLengthCm(totalRows, gauge)
  const length = cmWord(lengthCm)
  return {
    lengthNote: null,
    cm: {
      length,
      startHint: startHint(length, lengthNoteCm(lengthCm)),
      circumference: cmWord(circumferenceCm(initial, gauge)),
      rowTicks: rulerTicks(totalRows, cmPerRow(gauge)),
      // Сетка — половина круга (§7), поперёк её `initial / 2` клеток.
      stitchTicks: rulerTicks(initial / 2, cmPerStitch(gauge)),
    },
  }
}
