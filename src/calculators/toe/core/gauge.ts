/**
 * Плотность вязания и перевод счёта в сантиметры (§4, §7, §13).
 *
 * Стык спроектирован §13 заранее: число рядов мыска хранится самостоятельной
 * величиной, и длина получается делением на плотность по рядам. Ломать модель
 * расчёта не пришлось — плотность к ней пристыковывается снаружи.
 *
 * **Плотность — не параметр расчёта.** Она про пряжу и спицы того, кто вяжет,
 * а не про мысок: смена петель её не трогает, и в hash она не попадает (§10.1).
 * Поэтому здесь нет ни `ToeParams`, ни `ToeCalculation` целиком — только числа,
 * которые калькулятор уже посчитал.
 *
 * Единица одна — сантиметр. Перевод в дюймы пристыкуется к этим же величинам,
 * как сама плотность пристыковалась к числу рядов; ручки на экране у него нет (§4).
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */

/**
 * Плотность по образцу: сколько рядов и петель укладывается на базе в `base`
 * сантиметров. База **одна на обе плотности** — образец вяжут один (§4).
 */
export type Gauge = {
  /** Плотность по рядам — счёт по вертикали. */
  rows: number
  /** Плотность по петлям — счёт по горизонтали. */
  stitches: number
  /** База образца в сантиметрах. */
  base: number
}

/** База образца по умолчанию — так пишут на этикетке пряжи и в описаниях (§4). */
export const DEFAULT_GAUGE_BASE = 10

/** Сколько сантиметров в одном ряду по высоте. */
export function cmPerRow(gauge: Gauge): number {
  return gauge.base / gauge.rows
}

/** Сколько сантиметров в одной петле по ширине. */
export function cmPerStitch(gauge: Gauge): number {
  return gauge.base / gauge.stitches
}

/** Длина мыска: число рядов ÷ плотность по рядам (§13). */
export function toeLengthCm(totalRows: number, gauge: Gauge): number {
  return totalRows * cmPerRow(gauge)
}

/**
 * Обхват на начальных петлях. Петли считаются **в круге** (§4), поэтому это именно
 * обхват, а не ширина: половину круга показывает схема, и «ширина» была бы прочитана
 * как она.
 */
export function circumferenceCm(stitchesInRound: number, gauge: Gauge): number {
  return stitchesInRound * cmPerStitch(gauge)
}

/**
 * Число в сантиметрах на экран: два знака после запятой, разделитель — **запятая**.
 * Текст русский (§2), точка в десятичной дроби читается чужой.
 */
export function formatCm(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

/** «4,75 см» — то же число вместе с единицей. */
export function cmWord(value: number): string {
  return `${formatCm(value)} см`
}

/**
 * Засечки линейки на круглых сантиметрах (§7): сколько клеток от начала отсчёта
 * до каждого целого сантиметра. Клеток `cells`, в клетке `cmPerCell` сантиметров.
 *
 * Возвращает смещения **в клетках**, а не в пикселях: схема живёт в единицах
 * `viewBox`, и засечки обязаны расти вместе с клеткой при смене масштаба сами.
 *
 * Шаг засечек по вертикали и горизонтали разный, и это не дефект: ряд ниже,
 * чем петля шире. Схема — сетка обозначений, а не картинка мыска в масштабе (§7).
 */
export function rulerTicks(cells: number, cmPerCell: number): { cm: number; at: number }[] {
  if (!(cmPerCell > 0)) return []
  const total = cells * cmPerCell
  const ticks: { cm: number; at: number }[] = []
  // Запас на погрешность деления: 4 ряда по 0.25 см обязаны дать засечку на 1 см.
  for (let cm = 1; cm <= Math.floor(total + 1e-9); cm++) {
    ticks.push({ cm, at: cm / cmPerCell })
  }
  return ticks
}

/**
 * Число из поля плотности, или `null` — поле пустое либо в нём не число. Запятая
 * принимается наравне с точкой: её и набирают, раз сами сантиметры пишутся с запятой.
 *
 * Ноль и отрицательное — то же `null`: делить на них нечего, а отдельного текста
 * ошибки у плотности нет (§4), пустое поле просто не даёт сантиметров.
 */
export function parseGaugeField(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Плотность из записи `localStorage` (§10.2), или `null` — записи нет, она повреждена
 * либо неполна. Сантиметры появляются **только при обеих плотностях** (§4): одна
 * половина образца перевести обе оси не может, а показывать длину без обхвата значило бы
 * молча решить за мастера, что вторую он мерить не станет.
 */
export function parseGauge(raw: string | null): Gauge | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const record = parsed as {
    rows?: unknown
    stitches?: unknown
    base?: unknown
  } | null
  const rows = record?.rows
  const stitches = record?.stitches
  const base = record?.base
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0
  if (!ok(rows) || !ok(stitches) || !ok(base)) return null
  return { rows, stitches, base }
}

/** Запись плотности для `localStorage` (§10.2). */
export function formatGauge(gauge: Gauge): string {
  return JSON.stringify({
    rows: gauge.rows,
    stitches: gauge.stitches,
    base: gauge.base,
  })
}
