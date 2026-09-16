/**
 * Состояние калькулятора мыска. Одна точка на всю страницу: Pinia нет (§11),
 * а шесть блоков экрана обязаны видеть один и тот же расчёт, поэтому состояние
 * лежит на уровне модуля, а не заводится заново на каждый вызов.
 *
 * Здесь проходит граница: этот файл про Vue, `core/` — про арифметику.
 */
import { computed, reactive } from 'vue'
import { calculateToe, DEFAULT_PARAMS } from './core/calc'
import type { ToeParams } from './core/types'

/** Параметры расчёта. Открывается дефолтом (§4), поля петель и кромки правит `StitchFields.vue`. */
const params = reactive<ToeParams>({
  ...DEFAULT_PARAMS,
  rhythm: { ...DEFAULT_PARAMS.rhythm },
})

/** Расчёт пересчитывается сам при любой правке параметров. */
const calculation = computed(() => calculateToe(params))

export function useToeCalculator() {
  return { params, calculation }
}
