/**
 * Тексты поворота пятки (спека пятки §6.3). Голос безличный и повелительный,
 * привязки к полу того, кто вяжет, нет. Ядро — чистый TypeScript: импортов из Vue
 * здесь нет и быть не должно.
 */
import { plural } from '../../toe/core/plural'
import type { Side, TurnRow } from './turn'

/** «Лицевой ряд ←»: лицевой читается справа налево, изнаночный — слева направо. */
export function sideLabel(side: Side): string {
  return side === 'rs' ? 'Лицевой ряд ←' : 'Изнаночный ряд →'
}

/** «Раздели 31 петлю пятки…»: винительный падеж, поэтому «петлю», а не «петля». */
export function divisionText(heel: number, sides: number, center: number): string {
  const word = plural(heel, 'петлю', 'петли', 'петель')
  return `Раздели ${heel} ${word} пятки на три части: ${sides} · ${center} · ${sides}`
}

/** «сн. 1, 18 лиц., протяжка, 1 лиц., поверни». */
export function rowText(row: TurnRow): string {
  const stitch = row.side === 'rs' ? 'лиц.' : 'изн.'
  const parts: string[] = []
  if (row.slip) parts.push('сн. 1')
  parts.push(`${row.plain} ${stitch}`)
  parts.push(row.decrease === 'ssk' ? 'протяжка' : '2 вм. изн.')
  if (row.after) parts.push(`1 ${stitch}`)
  if (!row.last) parts.push('поверни')
  return parts.join(', ')
}
