/**
 * ПРОТОТИП. Одноразовый код, отвечающий на один вопрос. Тикет #27.
 *
 * Вопрос: **читается ли линейка как перевод клеток в сантиметры, а не как размер носка** —
 * и что делает разный шаг засечек по вертикали и горизонтали: информирует или выглядит
 * дефектом.
 *
 * Варианты переключаются `?variant=A…D` и стрелками ←/→:
 *   A — линейки нет вовсе (контроль: может, чисел в «Итоге» достаточно)
 *   B — принятое на бумаге: засечки на круглых см в полосе номеров + полоса под сеткой
 *   C — линейка своей полосой, не подмешанная к номерам (теснит ли B полосу номеров)
 *   D — размерная линия целиком: одна стрелка и подпись «19 рядов = 4,53 см», без засечек
 *
 * ЧТО ЗДЕСЬ ХОСТ, А НЕ ПРЕДМЕТ ОЦЕНКИ: сама схема, зум, полоса номеров, прокрутка,
 * шторка прогресса, «Итог», шапка — всё это живой код страницы, вынутый как есть.
 * Предмет — только линейка и две неоднозначности, которые дешевле увидеть, чем обсудить:
 * два знака после запятой («4,53 см» — не ложная ли точность) и место жёлтой/зелёной
 * кнопки (в «Итоге» или в шапке — прототип показывает обе сразу).
 *
 * Плотность живёт в памяти и никуда не пишется: прототипы не персистят (тикет решил
 * `localStorage`, но проверяется здесь не хранение).
 */
import { computed, ref, watch } from 'vue'

export const VARIANTS = ['A', 'B', 'C', 'D'] as const
export type Variant = (typeof VARIANTS)[number]

export const VARIANT_NAMES: Record<Variant, string> = {
  A: 'без линейки, только числа',
  B: 'засечки в полосе номеров',
  C: 'линейка своей полосой',
  D: 'размерная линия',
}

/** Число из query, если оно там есть и положительное. */
function readNum(key: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = (new URLSearchParams(window.location.search).get(key) ?? '').replace(',', '.').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function readVariant(): Variant {
  if (typeof window === 'undefined') return 'A'
  const raw = (new URLSearchParams(window.location.search).get('variant') ?? '').toUpperCase()
  return (VARIANTS as readonly string[]).includes(raw) ? (raw as Variant) : 'A'
}

/** Прототип включён только тогда, когда `?variant=` стоит в адресе. */
export function prototypeOn(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('variant')
}

const variantRef = ref<Variant>(readVariant())
export const variant = computed(() => variantRef.value)

export function setVariant(next: Variant): void {
  variantRef.value = next
  writeUrl()
}

/**
 * Вариант и плотность едут в query, чтобы **одна ссылка воспроизводила тот самый кадр**:
 * без этого все четыре варианта открываются одинаково пустыми, и линейку приходится
 * каждый раз впечатывать руками. Хранилищем это не становится — hash остаётся расчёту
 * (§10.1), а решение «плотность только в `localStorage`» проверяется не здесь.
 */
function writeUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('variant', variantRef.value)
  const put = (key: string, value: number | null) => {
    if (value === null) url.searchParams.delete(key)
    else url.searchParams.set(key, String(value))
  }
  put('rows', rowsPer.value)
  put('st', stitchesPer.value)
  put('base', base.value)
  window.history.replaceState(null, '', url.toString())
}

export function cycleVariant(delta: number): void {
  const i = VARIANTS.indexOf(variantRef.value)
  setVariant(VARIANTS[(i + delta + VARIANTS.length) % VARIANTS.length])
}

/**
 * Плотность: три поля (тикет #27). Пусто — сантиметров нет вовсе, дефолта у плотности
 * не бывает. База образца — единственное поле со значением по умолчанию.
 */
export const rowsPer = ref<number | null>(readNum('rows'))
export const stitchesPer = ref<number | null>(readNum('st'))
export const base = ref(readNum('base') ?? 10)

// Правка полей переписывает адрес — ссылка из отчёта остаётся тем же кадром.
watch([rowsPer, stitchesPer, base], writeUrl)

export const gaugeFilled = computed(
  () => !!rowsPer.value && !!stitchesPer.value && !!base.value,
)

/** Сантиметров в одном ряду по высоте. Ноль, пока плотность не вписана. */
export const cmPerRow = computed(() =>
  gaugeFilled.value ? base.value / (rowsPer.value as number) : 0,
)
/** Сантиметров в одной петле по ширине. */
export const cmPerStitch = computed(() =>
  gaugeFilled.value ? base.value / (stitchesPer.value as number) : 0,
)

/** Два знака после запятой, разделитель — запятая: текст русский (§2). */
export function cm(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

/** Диалог настроек один на обе кнопки — в шапке и в «Итоге» (прототип показывает обе). */
export const dialogOpen = ref(false)

/**
 * §9.6 при известной плотности перестаёт гадать. Коридор 15–25 рядов получен в спеке
 * переводом из сантиметров по плотности 40–44 ряда / 10 см — здесь он переведён обратно:
 * 15 ÷ 4,4 ≈ 3,5 см и 25 ÷ 4,0 ≈ 6,3 см. Числа прототипа, в спеку поедут из §9.6.
 */
export const SHORT_TOE_CM = 3.5
export const LONG_TOE_CM = 6.3

export function lengthNoteCm(lengthCm: number): string | null {
  if (lengthCm < SHORT_TOE_CM) return `Меньше ${cm(SHORT_TOE_CM)} см — мысок выйдет тупым`
  if (lengthCm > LONG_TOE_CM) return `Больше ${cm(LONG_TOE_CM)} см — мысок выйдет длинным, проверь ритм`
  return null
}
