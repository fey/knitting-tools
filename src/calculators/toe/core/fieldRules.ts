/**
 * Правила полей ввода (§4, §9.2–§9.5): что считается сходящимся, что подсказывать
 * и как чинить несходящееся.
 *
 * `converges` отвечает на вопрос «схема пересчитывается живьём от этого набора
 * значений или нет» (§9.3): поле в фокусе двигает схему, только пока набранное
 * сходится само с собой. Починка несходящегося — `normalizeStitchFields` ниже;
 * она срабатывает не на каждом нажатии, а на уходе фокуса и по `Enter`.
 *
 * `finalCandidates` — числа для живой подсказки у конечных петель (§4):
 * `20 (шаг 4: 16, 20, 24)`. Подсказка не чинит и не выбирает «лучшее» значение —
 * она просто перечисляет, какие конечные петли вообще достижимы от текущих
 * начальных и попадают в обычный диапазon 16–24, без арбитража тай-брейков.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */
import type { ToeParams } from './types'
import { minFinalStitches } from './calc'
import { stitchesWord } from './text'

/** Потолок полей — защита от лишнего нуля в опечатке, без сообщений (§9.4). */
export const MAX_STITCHES = 200

/**
 * Обычный диапазон конечных петель **под трикотажный шов** — одно из двух закрытий (§4).
 * Привязка к шву здесь намеренная: у стягивания коридор свой, около 8 петель, и общего
 * «обычного» диапазона на оба закрытия не существует.
 */
const TYPICAL_FINAL_MIN = 16
const TYPICAL_FINAL_MAX = 24

function isPositiveEvenInt(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n % 2 === 0
}

/**
 * Сходится ли набор параметров сам с собой (§9.4): оба чётные, конечные меньше
 * начальных, разница кратна 4, конечных хватает на кромку, оба в пределах потолка.
 *
 * Это чистый предикат — он не выбирает, что подставить вместо несходящегося
 * значения. Выбор ближайшего сходящегося и его текст — тикет #7.
 */
export function converges(params: Pick<ToeParams, 'initial' | 'final' | 'edge'>): boolean {
  const { initial, final, edge } = params
  if (!isPositiveEvenInt(initial) || !isPositiveEvenInt(final)) return false
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
 * на нечётном остатке, тай-брейки — дело тикета #7.
 *
 * Диапазон тесен для маленького мыска (детский, кукольный) — тогда подсказка
 * отдаёт всё, что вообще достижимо, самое близкое к диапазону сверху.
 */
export function finalCandidates(initial: number, edge: number): number[] {
  const min = minFinalStitches(edge)
  const achievable: number[] = []
  for (let v = initial - 4; v >= min; v -= 4) achievable.push(v)
  achievable.reverse()

  const typical = achievable.filter((v) => v >= TYPICAL_FINAL_MIN && v <= TYPICAL_FINAL_MAX)
  return typical.length > 0 ? typical : achievable.slice(-3)
}

/* ------------------------------------------------------------------------- *
 * Нормализатор ввода (§9.2, §9.5) — тикет #7.
 *
 * Чинит несходящийся ввод и **говорит, что починил**: возвращает не только
 * поправленные числа, но и структурный отчёт — что правили, что было набрано,
 * к чему подтянули, какой сосед предложен второй кнопкой. Отчёт структурный,
 * а не готовая строка, потому что одно и то же предупреждение спека требует
 * в двух местах сразу, а сосед — касаемая кнопка, а не текст.
 *
 * Порядок правок — `начальные → конечные → кромка` (§9.2). Начальные петли —
 * единственное поле-факт, поэтому в конфликте уступают конечные; исключение
 * ровно одно — нечётные начальные, фактом ленточного мыска быть не могут.
 * Конфликт кромки тоже разрешается конечными: до нормализатора доходит только
 * ветка «кромка уже 2, набрали конечные 8» — ветку «тянемся к кромке 2»
 * интерфейс гасит кнопкой (`edgeWhyOff`), и значение там не меняется вовсе.
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
  | 'final-step' // разница не кратна 4
  | 'final-not-less' // конечных не меньше начальных
  | 'final-min' // конечных меньше минимума при этой кромке

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

/** Минимум начальных: иначе ни одни конечные петли не помещаются между минимумом и начальными. */
function initialFloor(edge: EdgeValue): number {
  return minFinalStitches(edge) + 4
}

/** Наименьшие сходящиеся конечные при этих начальных и кромке. */
function lowestFinal(initial: number, edge: EdgeValue): number {
  const min = minFinalStitches(edge)
  return min + (((initial - min) % 4) + 4) % 4
}

function messageFor(reason: FixReason, entered: number, applied: number, initial: number, edge: EdgeValue): string {
  switch (reason) {
    case 'initial-odd':
      return `${entered} не делится пополам. Ближайшее чётное — ${applied}`
    case 'initial-floor':
      return `Начальных нужно минимум ${applied}. Ближайшее сходящееся — ${applied}`
    case 'initial-ceiling':
      return `Потолок — ${stitchesWord(MAX_STITCHES)}. Ближайшее сходящееся — ${applied}`
    case 'final-step':
      return `${entered} не сходится: ${initial} − ${entered} = ${initial - entered}, а убавки снимают по 4. Ближайшее сходящееся — ${applied}`
    case 'final-not-less':
      return `Конечных должно быть меньше начальных. Ближайшее сходящееся — ${applied}`
    case 'final-min':
      return edge === 2
        ? `При широком мыске конечных нужно минимум ${minFinalStitches(2)}. Ближайшее сходящееся — ${applied}`
        : `Конечных нужно минимум ${minFinalStitches(edge)}. Ближайшее сходящееся — ${applied}`
  }
}

function fixOf(
  field: FixField,
  reason: FixReason,
  entered: number,
  applied: number,
  neighbour: number | null,
  initial: number,
  edge: EdgeValue,
): Fix {
  return { field, reason, entered, applied, neighbour, message: messageFor(reason, entered, applied, initial, edge) }
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
): NormalizedFields {
  const edge = toEdge(draft.edge, toEdge(previous.edge, 1))
  const fixes: Fix[] = []

  // --- Начальные. Поле-факт: их не подтягивают под конечные, только под свою же
  // арифметику — чётность, пол и потолок.
  const enteredInitial = toInt(draft.initial) ?? previous.initial
  let initial = enteredInitial
  let initialReason: FixReason | null = null
  let initialNeighbour: number | null = null

  if (initial % 2 !== 0) {
    // Тянутся вниз, оба соседа предложены (§9.5).
    initialReason = 'initial-odd'
    initialNeighbour = initial + 1
    initial -= 1
  }
  if (initial > MAX_STITCHES) {
    initial = MAX_STITCHES
    initialReason = 'initial-ceiling'
    initialNeighbour = null
  }
  if (initial < initialFloor(edge)) {
    initial = initialFloor(edge)
    initialReason = 'initial-floor'
    initialNeighbour = null
  }
  if (initialNeighbour !== null && (initialNeighbour > MAX_STITCHES || initialNeighbour < initialFloor(edge))) {
    initialNeighbour = null
  }
  if (initialReason) {
    fixes.push(fixOf('initial', initialReason, enteredInitial, initial, initialNeighbour, initial, edge))
  }

  // --- Конечные. В конфликте уступают именно они — и начальным, и кромке.
  const enteredFinal = toInt(draft.final) ?? previous.final
  const lo = lowestFinal(initial, edge)
  const hi = initial - 4
  const step = 4

  // Сходящиеся соседи набранного: на решётке `lo + 4k` в пределах `lo…hi`.
  const below = enteredFinal < lo ? null : Math.min(hi, lo + Math.floor((enteredFinal - lo) / step) * step)
  const above = enteredFinal > hi ? null : Math.max(lo, lo + Math.ceil((enteredFinal - lo) / step) * step)

  let final = enteredFinal
  let finalReason: FixReason | null = null
  let finalNeighbour: number | null = null

  if (below === enteredFinal && above === enteredFinal) {
    // Набранное само сходится — правки нет.
  } else if (below === null) {
    final = lo
    finalReason = 'final-min'
  } else if (above === null) {
    final = hi
    finalReason = enteredFinal >= initial ? 'final-not-less' : 'final-step'
  } else {
    // Набранное между двумя сходящимися: при равенстве расстояний — вверх (§9.5).
    const up = above - enteredFinal <= enteredFinal - below
    final = up ? above : below
    finalNeighbour = up ? below : above
    finalReason = 'final-step'
  }

  if (finalReason) {
    fixes.push(fixOf('final', finalReason, enteredFinal, final, finalNeighbour, initial, edge))
  }

  return { initial, final, edge, fixes }
}

/** Проходит ли поле начальных петель само по себе: чётность, потолок и пол под кромку. */
function initialPasses(initial: number, edge: EdgeValue): boolean {
  return isPositiveEvenInt(initial) && initial <= MAX_STITCHES && initial >= initialFloor(edge)
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
 * из ссылки старшее значение держит разбор младшего: начальные проверяются сами
 * по себе, конечные — уже вместе с уцелевшими начальными.
 *
 * **Кромка при этом никогда не уступает конечным**, хотя в порядке §9.2 стоит после
 * них: кромка — выбор, а выборы гасятся, а не чинятся (§9.2), и значение выбора
 * от конфликта не меняется нигде в калькуляторе. Поэтому `#s=60&e=8&k=2` оставляет
 * кромку 2 и заменяет дефолтом конечные, а не наоборот.
 *
 * Последний шаг — страховка: дефолт мог не сойтись с уцелевшим из ссылки числом
 * (`#s=16&e=50` — дефолтные конечные 20 больше начальных 16). Там и только там
 * подтягивание уместно, и подтягивается уже дефолт, а не пришедшее значение;
 * на сходящейся тройке шаг холостой.
 */
export function fieldsFromLink(
  draft: FieldsDraft,
  defaults: { initial: number; final: number; edge: number },
): { initial: number; final: number; edge: EdgeValue } {
  const edge = toEdge(draft.edge, toEdge(defaults.edge, 1))

  const linkInitial = toInt(draft.initial)
  const initial = linkInitial !== null && initialPasses(linkInitial, edge) ? linkInitial : defaults.initial

  const linkFinal = toInt(draft.final)
  const final =
    linkFinal !== null && converges({ initial, final: linkFinal, edge }) ? linkFinal : defaults.final

  const safe = normalizeStitchFields({ initial, final, edge }, { initial, final, edge })
  return { initial: safe.initial, final: safe.final, edge: safe.edge }
}

/**
 * Почему кромка недоступна, или `null`, если доступна (§9.5).
 *
 * Это вторая половина правила «числа чинятся подтягиванием, выборы — гашением
 * с причиной»: широкая кромка при малых конечных не подтягивает конечные молча,
 * а гаснет, и значение не меняется вовсе. Обратная ветка — конечные набрали
 * при уже выбранной кромке 2 — живёт в нормализаторе.
 */
export function edgeWhyOff(edge: EdgeValue, final: number): string | null {
  const min = minFinalStitches(edge)
  if (final >= min) return null
  return edge === 2 ? `Широкий мысок — от ${min} конечных петель` : `Нужно минимум ${min} конечных петель`
}
