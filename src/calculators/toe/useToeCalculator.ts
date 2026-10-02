/**
 * Состояние калькулятора мыска. Одна точка на всю страницу: Pinia нет (§11),
 * а шесть блоков экрана обязаны видеть один и тот же расчёт, поэтому состояние
 * лежит на уровне модуля, а не заводится заново на каждый вызов.
 *
 * Здесь проходит граница: этот файл про Vue (и про браузер — `location`,
 * `history`, `localStorage`), `core/` — про арифметику и чистый разбор строк.
 */
import { computed, reactive, readonly, ref, watch } from 'vue'
import { calculateToe } from './core/calc'
import { formatHash, paramsKey as computeParamsKey, resolveParams } from './core/hash'
import { formatGauge, parseGauge } from './core/gauge'
import type { Gauge } from './core/gauge'
import {
  clampDone,
  formatProgressRecord,
  markDone,
  parseProgressRecord,
  progressView,
  restoreDone,
  undoDone,
} from './core/progress'
import type { ToeParams } from './core/types'
// Доступ к хранилищу — один на проект (§10.2, `src/shared/storage.ts`): записей три,
// а правило «падать не вправе» сформулировано один раз и на все.
import { readStored, writeStored } from '../../shared/storage'

/**
 * Ключ записи прогресса в `localStorage` (§10.2): `{ paramsKey, row }`. Строка
 * зафиксирована здесь, чтобы читающая половина (приоритет при загрузке, §10.3)
 * и пишущая половина (тикет #9 — первая явная отметка ряда) сходились на одном
 * ключе, а не заводили каждая свой.
 */
export const PROGRESS_STORAGE_KEY = 'knitting-tools:toe-progress'

/** `paramsKey` сохранённого расчёта, для фолбэка при пустом hash (§10.3). */
function readSavedParamsKey(): string | null {
  return parseProgressRecord(readStored(PROGRESS_STORAGE_KEY))?.paramsKey ?? null
}

function loadInitialParams(): ToeParams {
  const hash = typeof location === 'undefined' ? null : location.hash
  return resolveParams(hash, readSavedParamsKey())
}

/**
 * Параметры расчёта. Приоритет при загрузке — hash → `localStorage` → дефолты
 * (§10.3), разбор и починка несходящейся ссылки — `resolveParams`/`parseHash`
 * в `core/hash.ts`. Наружу они уходят только на чтение: правят их одним входом,
 * `setParams`.
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
// починка полей). Дефолтный `flush: 'pre'` — намеренно: правка пары полей идёт
// в несколько присвоений подряд (`setParams`), и коалесинг не даёт адресу на миг
// застыть на несходящемся промежуточном значении.
watch(params, syncHash, { deep: true })

/**
 * Прогресс ряда (тикет #9, §8, §10.2): отмечено рядов. Модель — `core/progress.ts`,
 * здесь только связь с хранилищем и расчётом. Восстанавливается молча при загрузке —
 * только если `paramsKey` записи совпал с уже разрешёнными `params` (§10.3 уже
 * выбрал, из hash они или из `localStorage`); не совпал — прогресса нет.
 */
const done = ref(
  restoreDone(readStored(PROGRESS_STORAGE_KEY), computeParamsKey(params), calculation.value.totalRows),
)

/** Что прогресс показывает на экране: текущий ряд, «всё готово», строка, кромка шторки. */
const progress = computed(() => progressView(calculation.value, done.value))

/**
 * Ставит отмеченный ряд и пишет его в `localStorage` под ключом текущего расчёта.
 * Ряд 0 запись стирает (`formatProgressRecord`) — до первой отметки это холостой
 * `removeItem`, мусора он не создаёт (§10.2).
 */
function setDone(next: number): void {
  done.value = next
  writeStored(PROGRESS_STORAGE_KEY, formatProgressRecord(computeParamsKey(params), next))
}

function markRow(): void {
  setDone(markDone(done.value, calculation.value.totalRows))
}

function undoRow(): void {
  setDone(undoDone(done.value))
}

/** Сброс — ряд возвращается к нулю, расчёт остаётся (§8); подтверждение — на экране. */
function resetProgress(): void {
  setDone(0)
}

/**
 * **Один вход правки расчёта** (§8, §9). Правка применяется целиком и только потом
 * зажимает прогресс — один раз: починка пары полей (100 → 60 и начальные 40 приносят
 * пару 40 → 36) — одна смена расчёта, а не две, и отмеченный ряд подтягивается
 * к последнему, а не обнуляется на несходящемся промежуточном 40 → 60.
 *
 * Запись прогресса переписывается и при неизменном ряде: её `paramsKey` следует
 * за расчётом, иначе после правки ряд не восстановился бы.
 */
function setParams(patch: Partial<ToeParams>): void {
  Object.assign(params, patch)
  setDone(clampDone(done.value, calculation.value.totalRows))
}

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

/** Единственное хранимое значение свёрнутости: развёрнутая вводка запись стирает. */
const INTRO_COLLAPSED = 'collapsed'

/**
 * Свёрнута ли вводка по записи в хранилище. Недоступное `localStorage` (приватная
 * вкладка, `file://`, тестовый узел без DOM) читается как «не свёрнута»: фолбэк —
 * развёрнутая вводка, ровно как при первом заходе.
 */
function readIntroCollapsed(): boolean {
  return readStored(INTRO_STORAGE_KEY) === INTRO_COLLAPSED
}

const introCollapsed = ref(readIntroCollapsed())

/**
 * Ставит свёрнутость явно и стирает запись при развёрнутой вводке: развёрнутая —
 * дефолт, и хранить её отдельной строкой незачем.
 *
 * **Экран этот сеттер не зовёт** — ему хватает `toggleIntro`. Он нужен юнит-тестам,
 * чтобы вернуть модульный синглтон в исходное между кейсами: это цена состояния
 * на уровне модуля, а не ручка интерфейса.
 */
function setIntroCollapsed(collapsed: boolean): void {
  introCollapsed.value = collapsed
  writeStored(INTRO_STORAGE_KEY, collapsed ? INTRO_COLLAPSED : null)
}

/** Кнопка внизу вводки и строка-кнопка на её месте — один и тот же переключатель. */
function toggleIntro(): void {
  setIntroCollapsed(!introCollapsed.value)
}

/**
 * Ключ плотности вязания (тикет #27, §10.2) — **четвёртая** запись в `localStorage`
 * и, как свёрнутость вводки и черновик отзыва, привязана **к человеку**, а не
 * к расчёту: плотность — свойство пряжи и спиц, кручение петель её не трогает.
 *
 * **В hash плотность не идёт никогда** (§10.1, §10.5). «Поделиться» делится расчётом,
 * а в чужой ссылке чужая плотность соврала бы: получатель увидел бы сантиметры
 * по не своему образцу, и выглядели бы они свойством расчёта. Схема уезжает в петлях,
 * свою плотность вписывают на месте.
 *
 * **В `paramsKey` плотность тоже не входит**, и это отдельное решение: смена плотности
 * не смеет сбрасывать отмеченный ряд (§8). Здесь оно держится тем, что `gauge` живёт
 * своим `ref` вне `params` — зажимать прогресс по ней нечему.
 */
export const GAUGE_STORAGE_KEY = 'knitting-tools:gauge'

/**
 * Плотность из хранилища, или `null` — записи нет, она повреждена либо неполна
 * (`parseGauge`). Фолбэк — «плотности нет»: сантиметров на экране не появляется,
 * а расчёт в петлях и рядах от этого не меняется вовсе (§4).
 */
const gauge = ref<Gauge | null>(parseGauge(readStored(GAUGE_STORAGE_KEY)))

/**
 * Ставит плотность или стирает её. Стирание — это `null`: пустые поля значат
 * «плотности нет», а не нули, и хранить нечего (§10.2).
 */
function setGauge(next: Gauge | null): void {
  gauge.value = next
  writeStored(GAUGE_STORAGE_KEY, next ? formatGauge(next) : null)
}

/**
 * Открыт ли диалог плотности (§6.4). Состояние экрана, как свёрнутость вводки:
 * в hash не идёт и не хранится. Лежит здесь, а не в компоненте кнопки, потому что
 * кнопка и диалог стоят в разных поддеревьях — кнопка в «Итоге», диалог у страницы.
 */
const gaugeDialogOpen = ref(false)

export function useToeCalculator() {
  return {
    params: readonly(params),
    setParams,
    calculation,
    progress,
    markRow,
    undoRow,
    resetProgress,
    introCollapsed,
    setIntroCollapsed,
    toggleIntro,
    gauge,
    setGauge,
    gaugeDialogOpen,
  }
}
