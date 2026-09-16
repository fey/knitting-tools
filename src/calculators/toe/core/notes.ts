/**
 * Второй ярус ответа калькулятора (§9.1): предупреждение **с показанным
 * результатом**. Недобор и перебор сегментов не чинятся вовсе (§9.5) —
 * добавление шага неизбежно проходит через недобор, и починка на лету дралась бы
 * с тем, кто ритм собирает. Замечание о длине мыска тоже ничего не запрещает.
 *
 * Тексты собираются здесь, а не в компонентах, потому что предупреждение о недоборе
 * спека требует **в двух местах сразу**: в счётчике конструктора и строкой у числа
 * рядов — конструктор сворачивается, и единственная строка ушла бы с экрана вместе
 * с ним. Две сборки одной строки разъехались бы.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeCalculation } from './types'
import { decRowsWord, decRowsWordGen, plural, stepsWord, stitchesWord } from './text'

/** Мысок короче этого — замечание о тупом мыске (§9.6). */
export const SHORT_TOE_ROWS = 12
/** Мысок длиннее этого — замечание о длинном мыске (§9.6). */
export const LONG_TOE_ROWS = 30

export type CoverageNote = {
  /** `ok` — сегменты покрывают `N`; `lack` — недобор; `excess` — перебор. */
  kind: 'ok' | 'lack' | 'excess'
  text: string
}

/**
 * Покрывают ли сегменты все убавочные ряды, и что будет, если нет (§9.5).
 *
 * «Шаг» здесь — лишний **убавочный ряд**, а не лишняя строка конструктора: сегмент
 * с пятью повторами даёт пять шагов. Так же говорит и сама спека («Лишние 2 шага»
 * при переборе на два убавочных ряда), и так же считает `lack`.
 */
export function coverageNote(
  calculation: Pick<ToeCalculation, 'lack' | 'decRowsNeeded' | 'final' | 'finalReal'>,
): CoverageNote {
  const { lack, decRowsNeeded, final, finalReal } = calculation

  if (lack === 0) {
    return { kind: 'ok', text: `Сегменты покрывают все ${decRowsWord(decRowsNeeded)}` }
  }
  if (lack > 0) {
    return {
      kind: 'lack',
      text: `Не хватает ${decRowsWordGen(lack)}: останется ${stitchesWord(finalReal)} вместо ${final}`,
    }
  }
  // Склоняется и прилагательное: «Лишний 1 шаг», «Лишние 2 шага», «Лишних 5 шагов».
  const extra = -lack
  const adjective = plural(extra, 'Лишний', 'Лишние', 'Лишних')
  return { kind: 'excess', text: `${adjective} ${stepsWord(extra)}: мысок кончится раньше, до них не дойдёт` }
}

/**
 * Мягкое замечание о длине мыска, или `null` (§9.6). **Не ошибка и не запрет:**
 * описания сами расходятся со своими цифрами на 1–1.5 см, поэтому красным это
 * не показывают и расчёт не придерживают.
 */
export function lengthNote(totalRows: number): string | null {
  if (totalRows < SHORT_TOE_ROWS) return `Меньше ${SHORT_TOE_ROWS} рядов — мысок выйдет тупым`
  if (totalRows > LONG_TOE_ROWS) return `Больше ${LONG_TOE_ROWS} рядов — мысок выйдет длинным, проверь ритм`
  return null
}
