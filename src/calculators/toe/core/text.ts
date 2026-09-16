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

/** «1 промежуточный», «2 промежуточных» — существительное «ряд» опущено, как в §6.1. */
export function plainRowsWord(n: number): string {
  return `${n} ${plural(n, 'промежуточный', 'промежуточных', 'промежуточных')}`
}

/** «повторить 1 раз», «повторить 2 раза», «повторить 5 раз» (§6.1). */
export function timesWord(n: number): string {
  return `${n} ${plural(n, 'раз', 'раза', 'раз')}`
}

/** «20 петель», «22 петли», «21 петля». */
export function stitchesWord(n: number): string {
  return `${n} ${plural(n, 'петля', 'петли', 'петель')}`
}

/** «1 шаг», «2 шага», «5 шагов» — шаг конструктора ритма (§6.1). */
export function stepsWord(n: number): string {
  return `${n} ${plural(n, 'шаг', 'шага', 'шагов')}`
}

/**
 * Родительный падеж убавочных рядов: «не хватает 1 убавочного ряда»,
 * «не хватает 4 убавочных рядов». Именительный `decRowsWord` после «не хватает»
 * даёт «не хватает 4 убавочных ряда» — форма, которой спека не писала.
 */
export function decRowsWordGen(n: number): string {
  return `${n} ${plural(n, 'убавочного ряда', 'убавочных рядов', 'убавочных рядов')}`
}
