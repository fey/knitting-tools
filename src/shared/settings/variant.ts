/** ПРОТОТИП: вариант входа в «Настройки» из `?variant=`. */
import { ref } from 'vue'

export const VARIANTS = [
  { key: 'A', name: 'Слово первым в ряду' },
  { key: 'B', name: 'Шестерёнка у значка кода' },
  { key: 'C', name: 'Слева, у возврата' },
  { key: 'D', name: 'Полоса под шапкой' },
  { key: 'E', name: 'A + плашка, пока плотности нет' },
  { key: 'F', name: 'C + плашка, пока плотности нет' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

const initial = new URLSearchParams(location.search).get('variant')
export const variant = ref<VariantKey>(
  (VARIANTS.find((v) => v.key === initial)?.key ?? 'A') as VariantKey,
)

export function setVariant(key: VariantKey): void {
  variant.value = key
  const url = new URL(location.href)
  url.searchParams.set('variant', key)
  history.replaceState(history.state, '', url)
}
