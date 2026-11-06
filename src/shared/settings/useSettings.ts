/**
 * ПРОТОТИП (ветка prototype/settings-entry): общие настройки сайта — пока одна плотность.
 * Состояние вынесено из useToeCalculator, чтобы окно открывалось с любой страницы.
 */
import { ref } from 'vue'
import { formatGauge, parseGauge } from '../../calculators/toe/core/gauge'
import type { Gauge } from '../../calculators/toe/core/gauge'
import { readStored, writeStored } from '../storage'

export const GAUGE_STORAGE_KEY = 'knitting-tools:gauge'

const gauge = ref<Gauge | null>(parseGauge(readStored(GAUGE_STORAGE_KEY)))
const settingsOpen = ref(false)

function setGauge(next: Gauge | null): void {
  gauge.value = next
  writeStored(GAUGE_STORAGE_KEY, next ? formatGauge(next) : null)
}

const num = (n: number) => String(n).replace('.', ',')

/** «30 п. и 40 р. на 10 см». */
export function gaugeWords(g: Gauge): string {
  return `${num(g.stitches)} п. и ${num(g.rows)} р. на ${num(g.base)} см`
}

export function useSettings() {
  return { gauge, setGauge, settingsOpen }
}
