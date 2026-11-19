/**
 * Правила полей ввода (§4, §9.2–§9.5): что считается сходящимся, что подсказывать
 * и как чинить несходящееся. Расширены направлением вязания (§11 спеки toe-up).
 *
 * `converges` отвечает на вопрос «схема пересчитывается живьём от этого набора
 * значений или нет» (§9.3): поле в фокусе двигает схему, только пока набранное
 * сходится само с собой. Починка несходящегося — `normalizeStitchFields` ниже;
 * она срабатывает не на каждом нажатии, а на уходе фокуса и по `Enter`.
 *
 * У toe-up зеркально: **поле-факт — конечные петли** (§9.2 спеки toe-up), в конфликте
 * уступают начальные; исключение зеркальное — нечётные конечные чинятся сами, фактом
 * круга стопы они быть не могут. Границы §9.4 toe-up: оба чётные, разница кратна 4,
 * начальных меньше конечных, начальных не меньше 8, потолок 200 у конечных. Кромка
 * границ не двигает: набор не меньше 8, прибавочному ряду при кромке 2 хватает 8 петель.
 *
 * `finalCandidates` — числа для живой подсказки у конечных петель (§4): это дело
 * cuff-down, у toe-up подсказка живая у начальных (§4 спеки toe-up).
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { Direction, ToeParams } from './types'
import { minFinalStitches } from './calc'
import { stitchesWord } from './plural'

/** Потолок полей — защита от лишнего нуля в опечатке, без сообщений (§9.4). */
export const MAX_STITCHES = 200

/**
 * Обычный диапазон конечных петель **под трикотажный шов** — одно из двух закрытий (§4).
 * Привязка к шву здесь намеренная: у стягивания коридор свой, около 8 петель, и общего
 * «обычного» диапазона на оба закрытия не существует.
 */
const TYPICAL_FINAL_MIN = 16
const TYPICAL_FINAL_MAX = 24

/**
 * Обычный диапазон начальных петель у toe-up (§4 спеки toe-up): «обычно 16–28».
 * Подсказка у начальных зеркальна подсказке у конечных у cuff-down.
 */
const TYPICAL_INITIAL_MIN = 16
const TYPICAL_INITIAL_MAX = 28

/** Пол начальных у toe-up (§9.4 спеки toe-up): практический пол источников. */
const INITIAL_FLOOR_TOE_UP = 8

function isPositiveEvenInt(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n % 2 === 0
}

/**
 * Сходится ли набор параметров сам с собой (§9.4): оба чётные, разница кратна 4,
 * начальных и конечных хватает на кромку (cuff-down) или начальных не меньше 8
 * и начальных меньше конечных (toe-up), оба в пределах потолка.
 *
 * Это чистый предикат — он не выбирает, что подставить вместо несходящегося
 * значения. Выбор ближайшего сходящегося и его текст — дело нормализатора.
 */
export function converges(
  params: Pick<ToeParams, 'initial' | 'final' | 'edge'>,
  direction: Direction,
): boolean {
  const { initial, final, edge } = params
  if (!isPositiveEvenInt(initial) || !isPositiveEvenInt(final)) return false

  if (direction === 'toe-up') {
    if (final > MAX_STITCHES) return false
    if (final <= initial) return false
    if ((final - initial) % 4 !== 0) return false
    if (initial < INITIAL_FLOOR_TOE_UP) return false
    return true
  }

  if (initial > MAX_STITCHES || final > MAX_STITCHES) return false
  if (final >= initial) return false
  if ((initial - final) % 4 !== 0) return false
  if (final < minFinalStitches(edge)) return false
  return true
}

/**
 * Достижимые конечные петли от текущих начальных (§4): значения, кратные шагу
 * убавок и попадающие в диапазон 16–24. Список пересчитывается от `initial`
 * и `edge`, а не выбирает «ближайшее к 20» — так подсказке не нужен тай-брейк
 * на нечётном остатке, тай-брейки — дело нормализатора.
 *
 * Диапазон тесен для маленького мыска (детский, кукольный) — тогда подсказка
 * отдаёт всё, что вообще достижимо, самое близкое к диапазону сверху.
 */
export function finalCandidates(initial: number, edge: number): number[] {
  return candidates(initial - 4, minFinalStitches(edge), TYPICAL_FINAL_MIN, TYPICAL_FINAL_MAX)
}

/** Достижимые значения с шагом 4 от `top` вниз до `floor`: обычные, иначе три верхних. */
function candidates(top: number, floor: number, typicalMin: number, typicalMax: number): number[] {
  const achievable: number[] = []
  for (let v = top; v >= floor; v -= 4) achievable.push(v)
  achievable.reverse()

  const typical = achievable.filter((v) => v >= typicalMin && v <= typicalMax)
  return typical.length > 0 ? typical : achievable.slice(-3)
}

/**
 * Достижимые начальные петли от текущих конечных (§4 спеки toe-up): зеркально —
 * значения, кратные шагу прибавок, в обычном диапазоне 16–28. Список растёт
 * от пола 8 вверх; «обычный» диапазон тесен для тупого мыска — тогда всё,
 * что вообще достижимо сверху.
 */
export function initialCandidates(final: number): number[] {
  return candidates(final - 4, INITIAL_FLOOR_TOE_UP, TYPICAL_INITIAL_MIN, TYPICAL_INITIAL_MAX)
}

/* ------------------------------------------------------------------------- *
 * Нормализатор ввода (§9.2, §9.5) — тикет #7, расширен направлением.
 *
 * Чинит несходящийся ввод и **говорит, что починил**: возвращает не только
 * поправленные числа, но и структурный отчёт — что правили, что было набрано,
 * к чему подтянули, какой сосед предложен второй кнопкой. Отчёт структурный,
 * а не готовая строка, потому что одно и то же предупреждение спека требует
 * в двух местах сразу, а сосед — касаемая кнопка, а не текст.
 *
 * Порядок правок — `начальные → конечные → кромка` (§9.2), одинаков у обоих
 * направлений: он про то, в каком порядке читаются поля, а не про то, кто
 * уступает. У cuff-down поле-факт — начальные, уступают конечные; у toe-up
 * наоборот (§9.2 спеки toe-up). Исключение зеркальное: нечётные конечные
 * у toe-up чинятся сами, фактом круга стопы они быть не могут.
 *
 * Нормализатор ничего не знает про фокус и момент правки: когда его звать —
 * дело интерфейса (§9.3). Разбор пришедшей ссылки он **не** обслуживает: там
 * не прошедшее заменяется дефолтом, а не подтягивается, — это `fieldsFromLink`
 * ниже (§10.4).
 * ------------------------------------------------------------------------- */

/** Кромка как выбор, а не как любое число. */
export type EdgeValue = 0 | 1 | 2

/** Какое поле правили. Кромка сюда не попадает: выборы гасятся, а не чинятся (§9.2). */
export type FixField = 'initial' | 'final'

/**
 * Почему правили. Причина решает текст подписи, и она всегда та, что **последней**
 * сдвинула значение: у набранных 9 при кромке 1 чётность правится первой, но
 * говорить надо про минимум 12, иначе подпись назовёт 12 «ближайшим чётным к 9».
 */
export type FixReason =
  | 'initial-odd' // нечётные начальные
  | 'initial-floor' // начальных не хватает даже на минимальные конечные
  | 'initial-ceiling' // выше потолка
  | 'initial-step' // разница не кратна 4 (toe-up: начальные уступают)
  | 'initial-not-less' // начальных не меньше конечных (toe-up)
  | 'final-step' // разница не кратна 4
  | 'final-not-less' // конечных не меньше начальных
  | 'final-min' // конечных меньше минимума при этой кромке
  | 'final-odd' // нечётные конечные (toe-up: исключение §9.2 — чинятся сами)
  | 'final-floor' // конечных меньше пола круга стопы (toe-up)
  | 'final-ceiling' // выше потолка (toe-up)

/** Одна правка одного поля. Больше одной правки на поле в отчёт не попадает. */
export type Fix = {
  field: FixField
  reason: FixReason
  /** Что было набрано (или что осталось в поле, которого не трогали). */
  entered: number
  /** К чему подтянули. Это значение уже стоит в поле. */
  applied: number
  /**
   * Сходящийся сосед с другой стороны от набранного — вторая кнопка подписи.
   * Есть только когда набранное лежало **между** двумя сходящимися: за границей
   * стороны всего одна, и предлагать там нечего.
   */
  neighbour: number | null
  /** Готовая подпись без соседа: сосед рисуется кнопкой, а не словом. */
  message: string
}

/** Набранное. `null` — поле пустое или в нём не число: возьмётся прошлое значение (§9.5). */
export type FieldsDraft = {
  initial: number | null
  final: number | null
  edge: number | null
}

export type NormalizedFields = {
  initial: number
  final: number
  edge: EdgeValue
  /** Пусто — правок не было. Иначе по одной записи на поправленное поле. */
  fixes: Fix[]
}

function toEdge(value: number | null, fallback: EdgeValue): EdgeValue {
  return value === 0 || value === 1 || value === 2 ? value : fallback
}

function toInt(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null
  return Math.round(value)
}

/** Минимум начальных у cuff-down: иначе ни одни конечные петли не помещаются между минимумом и начальными. */
function initialFloor(edge: EdgeValue): number {
  return minFinalStitches(edge) + 4
}

/** Минимум конечных у toe-up: прибавочному ряду нужно подняться с пола начальных. */
const FINAL_FLOOR_TOE_UP = INITIAL_FLOOR_TOE_UP + 4

/** Наименьшие сходящиеся конечные при этих начальных и кромке (cuff-down). */
function lowestFinal(initial: number, edge: EdgeValue): number {
  const min = minFinalStitches(edge)
  return min + (((initial - min) % 4) + 4) % 4
}

function messageFor(reason: FixReason, entered: number, applied: number, anchor: number, edge: EdgeValue): string {
  switch (reason) {
    case 'initial-odd':
      return `${entered} не делится пополам. Ближайшее чётное — ${applied}`
    case 'initial-floor':
      return `Начальных нужно минимум ${applied}. Ближайшее сходящееся — ${applied}`
    case 'initial-ceiling':
      return `Потолок — ${stitchesWord(MAX_STITCHES)}. Ближайшее сходящееся — ${applied}`
    case 'initial-step':
      return `${entered} не сходится: ${anchor} − ${entered} = ${anchor - entered}, а прибавки добавляют по 4. Ближайшее сходящееся — ${applied}`
    case 'initial-not-less':
      return `Начальных должно быть меньше конечных. Ближайшее сходящееся — ${applied}`
    case 'final-step':
      return `${entered} не сходится: ${anchor} − ${entered} = ${anchor - entered}, а убавки снимают по 4. Ближайшее сходящееся — ${applied}`
    case 'final-not-less':
      return `Конечных должно быть меньше начальных. Ближайшее сходящееся — ${applied}`
    case 'final-min':
      return edge === 2
        ? `При широком мыске конечных нужно минимум ${minFinalStitches(2)}. Ближайшее сходящееся — ${applied}`
        : `Конечных нужно минимум ${minFinalStitches(edge)}. Ближайшее сходящееся — ${applied}`
    case 'final-odd':
      return `${entered} не делится пополам. Ближайшее чётное — ${applied}`
    case 'final-floor':
      return `Конечных нужно минимум ${applied}. Ближайшее сходящееся — ${applied}`
    case 'final-ceiling':
      return `Потолок — ${stitchesWord(MAX_STITCHES)}. Ближайшее сходящееся — ${applied}`
  }
}

function fixOf(
  field: FixField,
  reason: FixReason,
  entered: number,
  applied: number,
  neighbour: number | null,
  anchor: number,
  edge: EdgeValue,
): Fix {
  return { field, reason, entered, applied, neighbour, message: messageFor(reason, entered, applied, anchor, edge) }
}

/**
 * Роли полей (§9.2): какое поле — факт, а какое уступает. Алгоритм починки у обоих
 * направлений один; различаются роли, пол факта, дно решётки уступающего, тай-брейк
 * и имена причин.
 *
 * Факт чинится только своей арифметикой — чётность, потолок, пол. Уступающее поле
 * подтягивается к решётке `дно + 4k` в пределах `дно … факт − 4` (разница кратна 4,
 * уступающее меньше факта).
 */
type Roles = {
  anchor: FixField
  follower: FixField
  /** Пол факта при этой кромке. */
  anchorFloor: (edge: EdgeValue) => number
  /** Наименьшее сходящееся уступающее поле при этом факте и кромке. */
  followerLowest: (anchor: number, edge: EdgeValue) => number
  /** При равенстве расстояний: вверх (cuff-down) или вниз (toe-up) — мысок выходит длиннее (§9.5). */
  tieUp: boolean
  anchorReasons: { odd: FixReason; ceiling: FixReason; floor: FixReason }
  followerReasons: { floor: FixReason; notLess: FixReason; step: FixReason }
}

const ROLES: Record<Direction, Roles> = {
  'cuff-down': {
    anchor: 'initial',
    follower: 'final',
    anchorFloor: initialFloor,
    followerLowest: lowestFinal,
    tieUp: true,
    anchorReasons: { odd: 'initial-odd', ceiling: 'initial-ceiling', floor: 'initial-floor' },
    followerReasons: { floor: 'final-min', notLess: 'final-not-less', step: 'final-step' },
  },
  'toe-up': {
    anchor: 'final',
    follower: 'initial',
    anchorFloor: () => FINAL_FLOOR_TOE_UP,
    // Решётка сходящихся начальных держится конечных: `начальные ≡ конечные (mod 4)` —
    // от пола 8 вверх она встала бы мимо (при конечных 66 сходятся 10, 14, …, а не 8, 12, …).
    followerLowest: (final) => final - 4 - 4 * Math.floor((final - 4 - INITIAL_FLOOR_TOE_UP) / 4),
    tieUp: false,
    anchorReasons: { odd: 'final-odd', ceiling: 'final-ceiling', floor: 'final-floor' },
    followerReasons: { floor: 'initial-floor', notLess: 'initial-not-less', step: 'initial-step' },
  },
}

/** Проходит ли поле-факт само по себе: чётность, потолок и пол под кромку. */
function anchorPasses(roles: Roles, value: number, edge: EdgeValue): boolean {
  return isPositiveEvenInt(value) && value <= MAX_STITCHES && value >= roles.anchorFloor(edge)
}

/**
 * Чинит набранное до сходящегося и рассказывает, что починил.
 *
 * `previous` — последние сходящиеся значения полей: к ним возвращается пустое поле
 * (§9.5, «человек стирал, чтобы набрать другое»). При разборе ссылки прошлого нет,
 * и туда передаются дефолты.
 *
 * Постусловие: возвращённая тройка всегда проходит `converges`.
 */
export function normalizeStitchFields(
  draft: FieldsDraft,
  previous: { initial: number; final: number; edge: number },
  direction: Direction,
): NormalizedFields {
  const roles = ROLES[direction]
  const edge = toEdge(draft.edge, toEdge(previous.edge, 1))
  const fixes: Fix[] = []

  // --- Факт. Его не подтягивают под уступающее поле, только под свою же арифметику.
  const enteredAnchor = toInt(draft[roles.anchor]) ?? previous[roles.anchor]
  const floor = roles.anchorFloor(edge)
  let anchor = enteredAnchor
  let anchorReason: FixReason | null = null
  let anchorNeighbour: number | null = null

  if (anchor % 2 !== 0) {
    // Тянутся вниз, оба соседа предложены (§9.5).
    anchorReason = roles.anchorReasons.odd
    anchorNeighbour = anchor + 1
    anchor -= 1
  }
  if (anchor > MAX_STITCHES) {
    anchor = MAX_STITCHES
    anchorReason = roles.anchorReasons.ceiling
    anchorNeighbour = null
  }
  if (anchor < floor) {
    anchor = floor
    anchorReason = roles.anchorReasons.floor
    anchorNeighbour = null
  }
  if (anchorNeighbour !== null && (anchorNeighbour > MAX_STITCHES || anchorNeighbour < floor)) {
    anchorNeighbour = null
  }
  if (anchorReason) {
    fixes.push(fixOf(roles.anchor, anchorReason, enteredAnchor, anchor, anchorNeighbour, anchor, edge))
  }

  // --- Уступающее поле: в конфликте уступает именно оно — и факту, и кромке.
  const enteredFollower = toInt(draft[roles.follower]) ?? previous[roles.follower]
  const lo = roles.followerLowest(anchor, edge)
  const hi = anchor - 4

  // Сходящиеся соседи набранного: на решётке `lo + 4k` в пределах `lo…hi`.
  const below = enteredFollower < lo ? null : Math.min(hi, lo + Math.floor((enteredFollower - lo) / 4) * 4)
  const above = enteredFollower > hi ? null : Math.max(lo, lo + Math.ceil((enteredFollower - lo) / 4) * 4)

  let follower = enteredFollower
  let followerReason: FixReason | null = null
  let followerNeighbour: number | null = null

  if (below === enteredFollower && above === enteredFollower) {
    // Набранное само сходится — правки нет.
  } else if (below === null) {
    follower = lo
    followerReason = roles.followerReasons.floor
  } else if (above === null) {
    follower = hi
    followerReason = enteredFollower >= anchor ? roles.followerReasons.notLess : roles.followerReasons.step
  } else {
    // Набранное между двумя сходящимися.
    const up = roles.tieUp ? above - enteredFollower <= enteredFollower - below : above - enteredFollower < enteredFollower - below
    follower = up ? above : below
    followerNeighbour = up ? below : above
    followerReason = roles.followerReasons.step
  }

  if (followerReason) {
    fixes.push(fixOf(roles.follower, followerReason, enteredFollower, follower, followerNeighbour, anchor, edge))
  }

  const values = { [roles.anchor]: anchor, [roles.follower]: follower } as Record<FixField, number>
  return { initial: values.initial, final: values.final, edge, fixes }
}

/**
 * Поля петель и кромки из пришедшей ссылки (§10.4) — **разбор по параметру, а не
 * починка подтягиванием**.
 *
 * Разница с `normalizeStitchFields` принципиальная и на ней держится вся функция:
 * нормализатор чинит набранное, то есть подтягивает несходящееся число к ближайшему
 * сходящемуся, — а ссылка чинится иначе. «Не прошедшее заменяется **дефолтом**,
 * остальное из ссылки живёт» (§10.4), потому что при разборе ссылки прошлого значения
 * нет вообще, и дефолт — единственное, чем разумно заменить (§9.5). Иначе `#s=100&e=50`
 * дал бы конечные 54: число, которого в ссылке не было и которое никто не набирал.
 *
 * Порядок — тот же, что у правок (§9.2): начальные → конечные → кромка. Уцелевшее
 * из ссылки старшее значение держит разбор младшего: у toe-up конечные проверяются
 * сами по себе, начальные — уже вместе с уцелевшими конечными (§9.2 спеки toe-up).
 *
 * **Кромка никогда не уступает числам**, у обоих направлений: кромка — выбор, а выборы
 * гасятся, а не чинятся (§9.2), и значение выбора от конфликта не меняется нигде
 * в калькуляторе. У toe-up кромка границ не двигает вовсе (§9.4 спеки toe-up).
 *
 * Последний шаг — страховка: дефолт мог не сойтись с уцелевшим из ссылки числом
 * (`#s=16&e=50` — дефолтные конечные 20 больше начальных 16). Там и только там
 * подтягивание уместно, и подтягивается уже дефолт, а не пришедшее значение;
 * на сходящейся тройке шаг холостой.
 */
export function fieldsFromLink(
  draft: FieldsDraft,
  defaults: { initial: number; final: number; edge: number },
  direction: Direction,
): { initial: number; final: number; edge: EdgeValue } {
  const roles = ROLES[direction]
  const edge = toEdge(draft.edge, toEdge(defaults.edge, 1))

  // Факт проверяется сам по себе, уступающее поле — уже вместе с уцелевшим фактом.
  const linkAnchor = toInt(draft[roles.anchor])
  const anchor = linkAnchor !== null && anchorPasses(roles, linkAnchor, edge) ? linkAnchor : defaults[roles.anchor]

  const linkFollower = toInt(draft[roles.follower])
  const follower =
    linkFollower !== null &&
    converges({ [roles.anchor]: anchor, [roles.follower]: linkFollower, edge } as Pick<ToeParams, 'initial' | 'final' | 'edge'>, direction)
      ? linkFollower
      : defaults[roles.follower]

  const values = { [roles.anchor]: anchor, [roles.follower]: follower } as Record<FixField, number>
  const safe = normalizeStitchFields({ ...values, edge }, { ...values, edge }, direction)
  return { initial: safe.initial, final: safe.final, edge: safe.edge }
}

/**
 * Почему кромка недоступна, или `null`, если доступна (§9.5).
 *
 * Это вторая половина правила «числа чинятся подтягиванием, выборы — гашением
 * с причиной»: широкая кромка при малых конечных не подтягивает конечные молча,
 * а гаснет, и значение не меняется вовсе. Обратная ветка — конечные набрали
 * при уже выбранной кромке 2 — живёт в нормализаторе.
 *
 * У toe-up кромка границ не двигает (§9.4 спеки toe-up): двойка не гасится никогда.
 */
export function edgeWhyOff(edge: EdgeValue, final: number, direction: Direction): string | null {
  if (direction === 'toe-up') return null
  const min = minFinalStitches(edge)
  if (final >= min) return null
  return edge === 2 ? `Широкий мысок — от ${min} конечных петель` : `Нужно минимум ${min} конечных петель`
}
