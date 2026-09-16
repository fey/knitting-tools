import { describe, expect, it } from 'vitest'
import { calculateToe, DEFAULT_PARAMS } from './calc'
import { progressWhatText, rowShortText, toeDoneText } from './progress'

// Дефолт: 60 → 20, кромка 1, через ряд — 19 рядов, 10 убавочных (§12.1, случай 2).
// Ряд 1 убавочный (60 − 4 = 56), ряд 2 промежуточный на тех же 56.
const calculation = calculateToe(DEFAULT_PARAMS)

describe('короткая строка ряда (§8)', () => {
  it('убавочный ряд называет номер убавки из decRowsNeeded и петли, которые станут', () => {
    expect(rowShortText(calculation, 1)).toBe('убавочный 1 из 10 · в круге станет 56')
  })

  it('промежуточный ряд — словарное слово, не «без убавок» (§2)', () => {
    expect(rowShortText(calculation, 2)).toBe('промежуточный · в круге 56')
  })

  it('ряда с таким номером нет — пустая строка', () => {
    expect(rowShortText(calculation, 0)).toBe('')
    expect(rowShortText(calculation, 999)).toBe('')
  })
})

describe('сообщение о завершении мыска', () => {
  it('называет петли под трикотажный шов — finalReal, а не final (§9.5)', () => {
    expect(toeDoneText(calculation)).toBe('Мысок связан — закрывай 20 петель трикотажным швом')
  })
})

describe('progressWhatText переключает строку плашки по числу отмеченных рядов', () => {
  it('до отметки — короткая строка ряда 1: первое нажатие и есть начало (§8)', () => {
    expect(progressWhatText(calculation, 0)).toBe('убавочный 1 из 10 · в круге станет 56')
  })

  it('после N-1 отметок — короткая строка ряда N', () => {
    expect(progressWhatText(calculation, 1)).toBe(rowShortText(calculation, 2))
  })

  it('все ряды отмечены — сообщение о завершении', () => {
    expect(progressWhatText(calculation, calculation.totalRows)).toBe(toeDoneText(calculation))
  })
})
