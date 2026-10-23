/**
 * Набор петель на носок по размеру — данные и формула справочника `/sock-cast-on/`.
 *
 * Источник — исследование `.scratch/sock-sizes/research/cast-on-by-yarn.md`, §5.1: оттуда
 * переписаны дословно пары EU, длины стопы, номер носка, обхват стопы (Kate Atherley)
 * и наборы Opal и Regia. Числа производителей **не пересчитываются**: это их таблицы как есть.
 * Формула считается кодом (§3 исследования) и сверяется с его числами тестом.
 *
 * Вид страницы выбран прототипом `.scratch/sock-sizes/prototypes/cast-on-table.html`,
 * вариант A: все пары разом, три источника рядом, выбор за мастером.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */

/** Пара обувных размеров EU — строка справочника. */
export interface SizePair {
  /** «38/39». */
  eu: string
  /** Длина стопы по ГОСТ 11373-88, см, как диапазон для пары: «24,5–25». */
  gostCm: string
  /** Номер носка по ГОСТ 8541-2014. */
  sock: number
  /** Обхват стопы по Atherley, см: от и до. На одной строке Atherley — оба равны. */
  girthCm: readonly [number, number]
}

export const PAIRS: readonly SizePair[] = [
  { eu: '32/33', gostCm: '21', sock: 21, girthCm: [19.5, 20.25] },
  { eu: '34/35', gostCm: '21,5–22,5', sock: 23, girthCm: [20.25, 21] },
  { eu: '36/37', gostCm: '23–23,5', sock: 23, girthCm: [22.5, 23] },
  { eu: '38/39', gostCm: '24,5–25', sock: 25, girthCm: [23.5, 24] },
  { eu: '40/41', gostCm: '25,5–26,5', sock: 27, girthCm: [25, 25.5] },
  { eu: '42/43', gostCm: '27–27,5', sock: 27, girthCm: [26, 26] },
  { eu: '44/45', gostCm: '28,5–29', sock: 29, girthCm: [26.5, 26.5] },
  { eu: '46/47', gostCm: '29,5–30,5', sock: 31, girthCm: [28.5, 28.5] },
]

/** Толщина пряжи — колонка справочника. Наборы Opal и Regia идут по `PAIRS`. */
export interface Yarn {
  key: string
  /** «400 м/100 г». */
  name: string
  /** «fingering, 4-ply». */
  tag: string
  /** Плотность формулы, петель на 10 см. */
  gauge: number
  /** Марки этой толщины — подпись под переключателем. */
  brands: string
  /** Оговорка про пряжу без заявленной плотности, если она есть. */
  caveat: string | null
  opal: readonly number[]
  regia: readonly number[]
}

export const YARNS: readonly Yarn[] = [
  {
    key: '400',
    name: '400 м/100 г',
    tag: 'fingering, 4-ply',
    gauge: 30,
    brands: 'Opal 4-fach, Regia 4-ply — 30 п. на 10 см; Alize Superwash Comfort и Artisan',
    caveat:
      'У Alize Superwash плотности на этикетке нет — формула считает её по 30 петель, как у Opal и Regia. ' +
      'Спицы 2–4 дают от 28 до 32 петель, это ступень набора в любую сторону: свяжи образец.',
    opal: [52, 56, 56, 60, 60, 64, 64, 68],
    regia: [56, 56, 60, 60, 64, 64, 68, 72],
  },
  {
    key: '200',
    name: '200 м/100 г',
    tag: 'DK, sport, 8-ply',
    gauge: 20,
    brands: 'Opal 8-fach, Regia 8-ply — 20 п. на 10 см; Alize Wooltime',
    caveat:
      'У Alize Wooltime плотности на этикетке нет — формула считает её по 20 петель, как у Opal и Regia.',
    opal: [40, 40, 44, 44, 48, 48, 52, 52],
    regia: [40, 40, 44, 44, 48, 48, 52, 52],
  },
  {
    key: '250',
    // «250–280 м/100 г» на телефоне в кнопку не встаёт — «на 100 г» уехало в подпись.
    name: '250–280 м',
    tag: 'на 100 г, 6-ply',
    gauge: 22,
    brands: 'Opal 6-fach — 23 п. на 10 см, Regia 6-ply — 22 п.',
    caveat: null,
    opal: [44, 48, 48, 52, 52, 56, 56, 56],
    regia: [44, 44, 48, 48, 52, 52, 56, 56],
  },
]

/** Свобода по умолчанию — 10 % на чулочную гладь (Atherley). */
export const EASE = 0.1

/** Обхват стопы одним числом — середина диапазона, как в исследовании. */
export function girth(pair: SizePair): number {
  return (pair.girthCm[0] + pair.girthCm[1]) / 2
}

/**
 * Начальные петли по формуле: обхват × (1 − свобода) × плотность / 10, затем ближайшее
 * кратное 4. Кратность 4 — требование ленточного мыска: разность начальных и конечных
 * петель делится на 4.
 */
export function castOn(pair: SizePair, gauge: number, ease: number = EASE): number {
  return Math.round((girth(pair) * (1 - ease) * gauge) / 10 / 4) * 4
}
