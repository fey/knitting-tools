/**
 * Состояние калькулятора мыска. Одна точка на всю страницу: Pinia нет (§11),
 * а шесть блоков экрана обязаны видеть один и тот же расчёт, поэтому состояние
 * лежит на уровне модуля, а не заводится заново на каждый вызов.
 *
 * Здесь проходит граница: этот файл про Vue (и про браузер — `location`,
 * `history`, `localStorage`), `core/` — про арифметику и чистый разбор строк.
 */
import { computed, reactive, watch } from 'vue'
import { calculateToe } from './core/calc'
import { formatHash, resolveParams } from './core/hash'
import type { ToeParams } from './core/types'

/**
 * Ключ записи прогресса в `localStorage` (§10.2): `{ paramsKey, row }`. Строка
 * зафиксирована здесь, а не в тикете #9, чтобы читающая половина (приоритет при
 * загрузке, §10.3) и пишущая половина (первая отметка ряда) сходились на одном
 * ключе, а не заводили каждая свой.
 *
 * Этот тикет запись не производит вовсе — она появляется только при первой явной
 * отметке ряда, а отметка ряда не его. Здесь только чтение, для фолбэка при пустом
 * hash.
 */
export const PROGRESS_STORAGE_KEY = 'knitting-tools:toe-progress'

/**
 * `paramsKey` сохранённого расчёта или `null` — записи нет, она повреждена, либо
 * `localStorage` недоступен (приватная вкладка, `file://`, тестовый узел без DOM).
 * Тихий фолбэк — приоритет при загрузке не вправе падать из-за недоступного
 * хранилища (§10.3).
 */
function readSavedParamsKey(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const paramsKey = (parsed as { paramsKey?: unknown } | null)?.paramsKey
    return typeof paramsKey === 'string' ? paramsKey : null
  } catch {
    return null
  }
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

// Переписывает адрес сразу при загрузке: битая входящая ссылка (§10.4) или расчёт,
// подхваченный из `localStorage` при пустом hash (§10.3), должны отразиться
// в адресной строке немедленно, а не только на первую правку параметров.
syncHash()

// Дальше — живьём при любой правке (кнопки петель, кромка, конструктор ритма,
// починка полей). Дефолтный `flush: 'pre'` — намеренно: правка полей идёт
// в несколько присвоений подряд (см. `fieldRules.ts` → `apply`), и коалесинг
// не даёт адресу на миг застыть на несходящемся промежуточном значении.
watch(params, syncHash, { deep: true })

export function useToeCalculator() {
  return { params, calculation }
}
