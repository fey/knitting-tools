/**
 * Склонения для строк ядра. Голос безличный, привязки к полу того, кто вяжет, нет.
 *
 * Ядро — чистый TypeScript: импортов из Vue здесь нет и быть не должно.
 */

/** Русское числительное: 1 ряд, 2 ряда, 5 рядов. */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

/** «19 рядов». */
export function rowsWord(n: number): string {
  return `${n} ${plural(n, 'ряд', 'ряда', 'рядов')}`
}

/** «10 убавочных рядов». */
export function decRowsWord(n: number): string {
  return `${n} ${plural(n, 'убавочный ряд', 'убавочных ряда', 'убавочных рядов')}`
}
