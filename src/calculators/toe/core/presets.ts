/**
 * Готовые ритмы (§5.4). Состав перенесён из прототипа `prototypes/rhythm-input.html`
 * и расширен направлением (§11 спеки toe-up): у toe-up свои пресеты — `even` и `slow`;
 * «по третям» и «с разгоном» в источниках toe-up не встречаются ни разу и сюда
 * не переносятся, а «с ускорением» — перевёрнутое «с замедлением».
 *
 * Правило остатка зашито в самих формулах, отдельной функции нет:
 * **лишний убавочный ряд уходит ближе к концу мыска** у cuff-down. У toe-up правило
 * привязано к смыслу, а не к порядку вязания: лишний прибавочный ряд уходит в фазу
 * «через ряд», ближе к стопе (§5.4 спеки toe-up) — у «с замедлением» это ⌈N/2⌉
 * во второй фазе.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Direction, PresetName, Rhythm, Segment } from './types'
import { buildRows } from './rows'
import { decRowsWord } from './plural'

export type Preset = {
  code: PresetName
  /** Имя в интерфейсе. */
  name: string
  /** Сколько убавочных (прибавочных) рядов нужно, чтобы ритм собрался. */
  min: number
  /** Описание самих сегментов. Формы клина словами не обещаем (§5.4). */
  how: string
  /** Сегменты при N убавочных рядах. */
  segments: (decRowsNeeded: number) => Segment[]
}

/** «Через ряд» общий: у обоих направлений сегменты одни. */
const even: Preset = {
  code: 'even',
  name: 'Через ряд',
  min: 1,
  how: 'убавочный, потом один промежуточный — и так до конца',
  segments: (n) => [{ interval: 1, repeats: n }],
}

/** Пресеты от манжеты (§5.4). */
export const PRESETS: Preset[] = [
  even,
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
      // Ниже `min` (5) фиксированный хвост в 4 ряда сам превышает N. Отрицательные
      // `repeats` здесь молча разошлись бы с `buildRows`: цикл `r < repeats` их
      // пропускает, а `decRowsCovered` (плоская сумма) — нет, и получался лживый
      // «перебора нет» при фактическом перекрытии на 44 петлях вместо честных 52
      // (карточка «с разгоном», выбранная на N = 10, при сужении петель до N = 2).
      // Зажимаем в 0 — тогда обе величины считают одинаковые 4 ряда, и недостача
      // читается как перебор сегментов (§9.5), а не как тихая ошибка.
      { interval: 0, repeats: Math.max(0, n - 4) },
    ],
  },
]

/** Пресеты от мыска (§5.4 спеки toe-up). */
export const PRESETS_TOE_UP: Preset[] = [
  even,
  {
    code: 'slow',
    name: 'С замедлением',
    min: 2,
    how: 'сперва каждый ряд, вторая половина — через ряд',
    segments: (n) => [
      { interval: 0, repeats: Math.floor(n / 2) },
      // Остаток уходит во вторую фазу: прибавки «через ряд» стоят ближе к стопе.
      { interval: 1, repeats: Math.ceil(n / 2) },
    ],
  },
]

/** Пресеты по направлению (§11 спеки toe-up): наборы не пересекаются, кроме «через ряд». */
export function presetsFor(direction: Direction): Preset[] {
  return direction === 'toe-up' ? PRESETS_TOE_UP : PRESETS
}

/**
 * Пресет по коду **в наборе своего направления**. У наборов нет общих чужих кодов:
 * `accel` на странице toe-up — битая ссылка (§10.4), и отсюда он не достаётся.
 */
export function presetByCode(code: PresetName, direction: Direction = 'cuff-down'): Preset {
  const preset = presetsFor(direction).find((p) => p.code === code)
  if (!preset) throw new Error(`Неизвестный ритм: ${code}`)
  return preset
}

/**
 * Имя ритма для подписи — одно на весь калькулятор: итог, «Поделиться» и всё, что
 * ритм называет словами, читают его отсюда. Правило §5.5: «Свой ритм» навсегда после
 * первой правки сегмента, сравнения набранных сегментов с пресетами нет нигде.
 *
 * Строчная буква — ритм всегда стоит внутри фразы: «убавки через ряд», «прибавки
 * свой ритм».
 */
export function rhythmName(rhythm: Rhythm, direction: Direction = 'cuff-down'): string {
  return rhythm.kind === 'preset' ? presetByCode(rhythm.name, direction).name.toLowerCase() : 'свой ритм'
}

/**
 * Живое число рядов для подписи карточки. `null` — ритм при этих петлях не собирается;
 * карточку показывают неактивной с причиной, а не подменяют другим ритмом (§5.4).
 */
export function presetRowCount(preset: Preset, decRowsNeeded: number, initial: number, direction: Direction = 'cuff-down'): number | null {
  if (decRowsNeeded < preset.min) return null
  return buildRows(initial, preset.segments(decRowsNeeded), direction).length
}

/** Причина, по которой ритм неактивен: «нужно 3 убавочных ряда, сейчас 2». */
export function presetWhyOff(preset: Preset, decRowsNeeded: number): string {
  // Прототип склонял только слово «ряд» и на пороге 1 выдавал «1 убавочных ряд»;
  // склоняется вся связка целиком.
  return `нужно ${decRowsWord(preset.min)}, сейчас ${decRowsNeeded}`
}
