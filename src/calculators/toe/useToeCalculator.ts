/**
 * Состояние калькулятора мыска. Одна точка на всю страницу: Pinia нет (§11),
 * а шесть блоков экрана обязаны видеть один и тот же расчёт, поэтому состояние
 * лежит на уровне модуля, а не заводится заново на каждый вызов.
 *
 * Здесь проходит граница: этот файл про Vue (и про браузер — `location`,
 * `history`, `localStorage`), `core/` — про арифметику и чистый разбор строк.
 */
import { computed, reactive, ref, watch } from 'vue'
import { calculateToe } from './core/calc'
import { formatHash, paramsKey as computeParamsKey, resolveParams } from './core/hash'
import type { ToeParams } from './core/types'

/**
 * Ключ записи прогресса в `localStorage` (§10.2): `{ paramsKey, row }`. Строка
 * зафиксирована здесь, чтобы читающая половина (приоритет при загрузке, §10.3)
 * и пишущая половина (тикет #9 — первая явная отметка ряда) сходились на одном
 * ключе, а не заводили каждая свой.
 */
export const PROGRESS_STORAGE_KEY = 'knitting-tools:toe-progress'

/**
 * Запись `{ paramsKey, row }` из `localStorage`, или `null` — записи нет, она
 * повреждена, либо `localStorage` недоступен (приватная вкладка, `file://`,
 * тестовый узел без DOM). Проверка на недоступность стоит **внутри** `try`:
 * у Chrome с заблокированными данными сайта кидает сам доступ к свойству,
 * то есть и `typeof`, — а этот вызов идёт при загрузке модуля и уронил бы
 * страницу целиком, а не одну запись. Тихий фолбэк — ни приоритет при загрузке (§10.3), ни
 * восстановление ряда (тикет #9) не вправе падать из-за недоступного хранилища.
 */
function readSavedProgress(): { paramsKey: string; row: number } | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const record = parsed as { paramsKey?: unknown; row?: unknown } | null
    const key = record?.paramsKey
    const row = record?.row
    if (typeof key !== 'string' || typeof row !== 'number' || !Number.isFinite(row)) return null
    return { paramsKey: key, row }
  } catch {
    return null
  }
}

/** `paramsKey` сохранённого расчёта, для фолбэка при пустом hash (§10.3). */
function readSavedParamsKey(): string | null {
  return readSavedProgress()?.paramsKey ?? null
}

function loadInitialParams(): ToeParams {
  const hash = typeof location === 'undefined' ? null : location.hash
  return resolveParams(hash, readSavedParamsKey())
}

/**
 * Параметры расчёта. Приоритет при загрузке — hash → `localStorage` → дефолты
 * (§10.3), разбор и починка несходящейся ссылки — `resolveParams`/`parseHash`
 * в `core/hash.ts`. Поля петель и кромки дальше правит `StitchFields.vue`.
 */
const params = reactive<ToeParams>(loadInitialParams())

/** Расчёт пересчитывается сам при любой правке параметров. */
const calculation = computed(() => calculateToe(params))

/**
 * Переписывает hash живьём (§10.1). Сравнение с текущим hash — не оптимизация,
 * а тишина: холостая перезапись адреса на каждый чих `watch` устроила бы лишние
 * записи в историю там, где адрес и так уже канонический.
 */
function syncHash(): void {
  if (typeof history === 'undefined' || typeof location === 'undefined') return
  const canonical = formatHash(params)
  if (location.hash !== canonical) history.replaceState(null, '', canonical)
}

/**
 * Восстановление позиции страницы после перезагрузки отдаётся калькулятору (§8).
 * Браузер делает это сам и позже монтажа — и затирал бы разовую прокрутку к текущему
 * ряду, которую ставит `ToeChart.vue`. Поведение без прогресса от этого не меняется:
 * чистый заход спека и так требует открывать сверху, на вводке.
 *
 * Стоит здесь, а не в компоненте: `history` — браузерная граница этого файла.
 */
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

// Переписывает адрес сразу при загрузке: битая входящая ссылка (§10.4) или расчёт,
// подхваченный из `localStorage` при пустом hash (§10.3), должны отразиться
// в адресной строке немедленно, а не только на первую правку параметров.
syncHash()

// Дальше — живьём при любой правке (кнопки петель, кромка, конструктор ритма,
// починка полей). Дефолтный `flush: 'pre'` — намеренно: правка полей идёт
// в несколько присвоений подряд (см. `fieldRules.ts` → `apply`), и коалесинг
// не даёт адресу на миг застыть на несходящемся промежуточном значении.
watch(params, syncHash, { deep: true })

/**
 * Прогресс ряда (тикет #9, §8, §10.2). Восстанавливается молча при загрузке —
 * только если `paramsKey` записи совпал с уже разрешёнными `params` (§10.3 уже
 * выбрал, из hash они или из `localStorage`); не совпал — прогресса нет, значение
 * остаётся нулевым, ровно как для расчёта, у которого записи не было вовсе.
 */
function initialProgressRow(): number {
  const saved = readSavedProgress()
  if (!saved || saved.paramsKey !== computeParamsKey(params)) return 0
  return Math.max(0, Math.min(saved.row, calculation.value.totalRows))
}

const progressRow = ref(initialProgressRow())

/**
 * Пишет прогресс в `localStorage`, либо стирает запись при `row === 0`.
 *
 * Запись появляется только когда есть что хранить: до первой явной отметки
 * `row` всегда 0, и эта ветка стирает — что при пустом хранилище не более чем
 * холостой `removeItem` (§10.2 «кручение ритма мусора не создаёт»). Отмена до
 * нуля тем же путём убирает запись, а не оставляет в ней `row: 0` — так «ряд 0»
 * никогда не всплывает вторым источником правды для фолбэка на пустой hash (§10.3).
 */
function persistProgress(row: number): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (row > 0) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ paramsKey: computeParamsKey(params), row }))
    } else {
      localStorage.removeItem(PROGRESS_STORAGE_KEY)
    }
  } catch {
    // Хранилище недоступно — прогресс не переживёт эту сессию, но экран не падает.
  }
}

/** Первое нажатие «Ряд 1 готов» и есть начало счёта — отдельного включения нет (§8). */
function markRow(): void {
  const total = calculation.value.totalRows
  if (progressRow.value >= total) return
  progressRow.value += 1
  persistProgress(progressRow.value)
}

/** Отмена — «−1» (§8); автоповтор на удержании собирает `RowProgressBar.vue`. */
function undoRow(): void {
  if (progressRow.value <= 0) return
  progressRow.value -= 1
  persistProgress(progressRow.value)
}

/** Сброс — ряд возвращается к нулю, расчёт остаётся (§8); подтверждение — на экране. */
function resetProgress(): void {
  progressRow.value = 0
  persistProgress(0)
}

/**
 * Зажим прогресса по текущему расчёту (§8): номер ряда сохраняется, а если рядов
 * стало меньше — подтягивается к последнему.
 */
function clampProgress(): void {
  const total = calculation.value.totalRows
  if (progressRow.value > total) progressRow.value = total
  persistProgress(progressRow.value)
}

/**
 * Идёт ли прямо сейчас правка пары полей (см. `setStitches`). Зажим на промежуточное
 * состояние не срабатывает: пара — одна смена расчёта, а не две.
 */
let applyingFields = false

// Смена расчёта на ходу (§8); автоматическая правка ввода (§9) идёт тем же путём —
// она меняет `params`, а `calculation` пересчитывается сама. Пока не было ни одной
// отметки, `row` остаётся 0, и `persistProgress` при каждой правке лишь холостит
// `removeItem` — мусора это не создаёт (§10.2). `flush: 'sync'` — зажим случается тем же
// тиком, что и правка `params`: `ToeChart.vue` не вправе на кадр увидеть `progressRow`,
// отставший от уже усечённого расчёта. Синхронность и делает флаг нужным: при
// отложенном `flush` промежуточное состояние пары схлопнулось бы само.
watch(
  calculation,
  () => {
    if (applyingFields) return
    clampProgress()
  },
  { flush: 'sync' },
)

/**
 * Ключ свёрнутости вводки (тикет #16, §10.2) — **вторая** запись в `localStorage`
 * и намеренно отдельная от прогресса. Прогресс привязан к расчёту и живёт под
 * `paramsKey`; свёрнутость привязана к человеку и от петель на экране не зависит
 * вовсе — смешать их в одной записи значило бы сбрасывать «уже читал» при каждой
 * смене расчёта.
 *
 * В hash свёрнутость не попадает никогда (§10.5): делятся расчётом, а не тем,
 * читал ли отправитель вводку.
 */
export const INTRO_STORAGE_KEY = 'knitting-tools:intro-collapsed'

/**
 * Свёрнута ли вводка по записи в хранилище. Недоступное `localStorage` (приватная
 * вкладка, `file://`, тестовый узел без DOM) читается как «не свёрнута»: фолбэк —
 * развёрнутая вводка, ровно как при первом заходе.
 */
function readIntroCollapsed(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(INTRO_STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

const introCollapsed = ref(readIntroCollapsed())

/**
 * Пишет свёрнутость, либо стирает запись при развёрнутой вводке: развёрнутая — это
 * дефолт, и хранить её отдельной строкой незачем. Падать запись не вправе — выбор
 * не переживёт сессию, но экран не упадёт.
 */
function setIntroCollapsed(collapsed: boolean): void {
  introCollapsed.value = collapsed
  try {
    if (typeof localStorage === 'undefined') return
    if (collapsed) localStorage.setItem(INTRO_STORAGE_KEY, 'collapsed')
    else localStorage.removeItem(INTRO_STORAGE_KEY)
  } catch {
    // Хранилище недоступно — выбор не переживёт эту сессию, но экран не падает.
  }
}

/** Кнопка внизу вводки и строка-кнопка на её месте — один и тот же переключатель. */
function toggleIntro(): void {
  setIntroCollapsed(!introCollapsed.value)
}

/**
 * Правит петли одной сменой расчёта (§8). Присвоить `initial` и `final` двумя
 * шагами нельзя: между ними стоит пара, которая сама с собой не сходится
 * (60 → 20 и правка начальных на 40 проходит через 40 → 20), синхронный зажим
 * видит её как расчёт в один ряд и обнуляет отмеченный ряд. Прогресс при правке
 * обоих полей сразу обязан подтягиваться к последнему ряду, а не пропадать.
 *
 * Кромка правится здесь же: она меняет минимум конечных петель, то есть входит
 * в ту же пару.
 */
function setStitches(next: { initial: number; final: number; edge?: number }): void {
  applyingFields = true
  try {
    params.initial = next.initial
    params.final = next.final
    if (next.edge !== undefined) params.edge = next.edge
  } finally {
    applyingFields = false
  }
  clampProgress()
}

export function useToeCalculator() {
  return {
    params,
    calculation,
    progressRow,
    markRow,
    undoRow,
    resetProgress,
    setStitches,
    introCollapsed,
    setIntroCollapsed,
    toggleIntro,
  }
}
