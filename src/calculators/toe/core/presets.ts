/**
 * Готовые ритмы (§5.4). Состав перенесён из прототипа `prototypes/rhythm-input.html`.
 *
 * Правило остатка зашито в самих формулах, отдельной функции нет:
 * **лишний убавочный ряд уходит ближе к концу мыска**. У «с ускорением» длиннее первая
 * фаза (⌈N/2⌉), у «по третям» остаток падает в последнюю треть.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { PresetName, Segment } from './types'
import { buildRows } from './rows'
import { decRowsWord } from './text'

export type Preset = {
  code: PresetName
  /** Имя в интерфейсе. */
  name: string
  /** Сколько убавочных рядов нужно, чтобы ритм собрался. */
  min: number
  /** Описание самих сегментов. Формы клина словами не обещаем (§5.4). */
  how: string
  /** Сегменты при N убавочных рядах. */
  segments: (decRowsNeeded: number) => Segment[]
}

export const PRESETS: Preset[] = [
  {
    code: 'even',
    name: 'Через ряд',
    min: 1,
    how: 'убавочный, потом один промежуточный — и так до конца',
    segments: (n) => [{ interval: 1, repeats: n }],
  },
  {
    code: 'accel',
    name: 'С ускорением',
    min: 2,
    how: 'сперва через ряд, вторая половина — каждый ряд',
    segments: (n) => [
      { interval: 1, repeats: Math.ceil(n / 2) },
      { interval: 0, repeats: Math.floor(n / 2) },
    ],
  },
  {
    code: 'thirds',
    name: 'По третям',
    min: 3,
    how: 'три фазы: через два ряда, через ряд, каждый ряд',
    segments: (n) => {
      const third = Math.floor(n / 3)
      return [
        { interval: 2, repeats: third },
        { interval: 1, repeats: third },
        { interval: 0, repeats: n - 2 * third },
      ]
    },
  },
  {
    code: 'ramp',
    name: 'С разгоном',
    min: 5,
    how: 'первые убавки редкие, дальше подряд каждый ряд',
    segments: (n) => [
      { interval: 4, repeats: 1 },
      { interval: 3, repeats: 1 },
      { interval: 2, repeats: 1 },
      { interval: 1, repeats: 1 },
      { interval: 0, repeats: n - 4 },
    ],
  },
]

export function presetByCode(code: PresetName): Preset {
  const preset = PRESETS.find((p) => p.code === code)
  if (!preset) throw new Error(`Неизвестный ритм: ${code}`)
  return preset
}

/**
 * Живое число рядов для подписи карточки. `null` — ритм при этих петлях не собирается;
 * карточку показывают неактивной с причиной, а не подменяют другим ритмом (§5.4).
 */
export function presetRowCount(preset: Preset, decRowsNeeded: number, initial: number): number | null {
  if (decRowsNeeded < preset.min) return null
  return buildRows(initial, preset.segments(decRowsNeeded)).length
}

/** Причина, по которой ритм неактивен: «нужно 3 убавочных ряда, сейчас 2». */
export function presetWhyOff(preset: Preset, decRowsNeeded: number): string {
  // Прототип склонял только слово «ряд» и на пороге 1 выдавал «1 убавочных ряд»;
  // склоняется вся связка целиком.
  return `нужно ${decRowsWord(preset.min)}, сейчас ${decRowsNeeded}`
}
