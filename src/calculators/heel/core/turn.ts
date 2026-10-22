/**
 * Расчёт поворота французской пятки (спека пятки §5). Ядро — чистый TypeScript:
 * импортов из Vue здесь нет и быть не должно.
 *
 * Вход — петли пятки, центральная часть и сторона ряда 1. Выход — деление
 * «боковая · центр · боковая», ряды поворота и число петель после него.
 * Формулы выведены и сверены с источниками в
 * `.scratch/french-heel/research/heel-turn.md`, раздел 4.
 */

export type Side = 'rs' | 'ws'

/** Убавка ряда: протяжка на лицевом, 2 вместе изнаночной на изнаночном (§5.3). */
export type Decrease = 'ssk' | 'p2tog'

export interface TurnRow {
  /** Номер ряда поворота, с 1. */
  n: number
  side: Side
  /** Первая петля снимается: так со 2-го ряда; в ряду 1 первая петля — крайняя петля стенки. */
  slip: boolean
  /** Сколько петель провязывается до убавки. В ряду 1 первая петля входит в это число. */
  plain: number
  decrease: Decrease
  /** Провязывается ли ещё 1 петля после убавки. */
  after: boolean
  /** Последний ряд не кончается словом «поверни». */
  last: boolean
}

export interface Turn {
  /** Петли одной боковой части. */
  sides: number
  rows: TurnRow[]
  /** Сколько петель пятки на спице после поворота. */
  left: number
}

export interface TurnParams {
  /** Петли пятки: половина начальных. */
  heel: number
  /** Центральная часть. Той же чётности, что и `heel`, иначе боковые выйдут неравными (§4). */
  center: number
  firstSide: Side
}

/**
 * Поворот при уже сходящихся входах: `heel − center` чётно, боковая часть не меньше 2.
 * Несходящиеся входы сюда не доходят — их чинит `fieldRules.ts`.
 *
 * Рядов `R = 2·⌈s/2⌉`, остаётся `heel − R`. Ряд 1: `s + C − 1` петель до убавки.
 * Ряд n ≥ 2: «сн. 1, C + n − 3», убавка, 1 петля. При нечётном `s` два последних ряда
 * кончаются убавкой без «1 петли», а последний на петлю короче.
 */
export function computeTurn({ heel, center, firstSide }: TurnParams): Turn {
  const sides = (heel - center) / 2
  const count = 2 * Math.ceil(sides / 2)
  const sidesOdd = sides % 2 === 1

  const rows: TurnRow[] = []
  for (let n = 1; n <= count; n++) {
    const side: Side = n % 2 === 1 ? firstSide : firstSide === 'rs' ? 'ws' : 'rs'
    const last = n === count
    rows.push({
      n,
      side,
      slip: n > 1,
      plain: n === 1 ? sides + center - 1 : center + n - 3 - (sidesOdd && last ? 1 : 0),
      decrease: side === 'rs' ? 'ssk' : 'p2tog',
      after: !(sidesOdd && n >= count - 1),
      last,
    })
  }

  return { sides, rows, left: heel - count }
}
