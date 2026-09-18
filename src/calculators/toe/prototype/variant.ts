/**
 * ПРОТОТИП, в `main` не едет. Вопрос: как выглядит «только схема» — кнопка,
 * убирающая с экрана всё, кроме схемы и контролов.
 *
 * Три варианта на одном и том же экране, переключаются `?variant=` (§10.5 не трогается:
 * это не параметр расчёта, а ручка стенда, и живёт она в search, а не в hash).
 * Ключ читается один раз при старте в `ref` — запись hash в `useToeCalculator`
 * зовёт `history.replaceState` и перетирала бы реактивное чтение `location.search`.
 */
import { ref } from 'vue'

export const VARIANTS = [
  { key: 'main', name: 'как сейчас' },
  { key: 'A', name: 'оверлей «только схема»' },
  { key: 'B', name: 'панель схлопывается на месте' },
  { key: 'C', name: 'схема первична, ручки в шторке' },
  { key: 'D', name: 'прячутся только настройки' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

function readVariant(): VariantKey {
  if (typeof location === 'undefined') return 'main'
  const raw = (new URLSearchParams(location.search).get('variant') ?? '').toLowerCase()
  const hit = VARIANTS.find((v) => v.key.toLowerCase() === raw)
  return hit ? hit.key : 'main'
}

export const variant = ref<VariantKey>(readVariant())

/** Ключ едет в адрес: вариант шарится ссылкой и переживает перезагрузку. */
export function setVariant(key: VariantKey): void {
  variant.value = key
  const url = new URL(location.href)
  if (key === 'main') url.searchParams.delete('variant')
  else url.searchParams.set('variant', key)
  history.replaceState(null, '', url)
}

/** Полоса переключателя и сами варианты живут только на стенде. */
export const prototypeOn = import.meta.env.DEV
