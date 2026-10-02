import { describe, expect, it } from 'vitest'
import { calculateToe, DEFAULT_PARAMS } from './calc'
import {
  clampDone,
  formatProgressRecord,
  markDone,
  progressView,
  progressWhatText,
  restoreDone,
  rowShortText,
  toeDoneText,
  undoDone,
} from './progress'
import { paramsKey } from './hash'

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
  it('называет петли к закрытию — finalReal, а не final (§9.5)', () => {
    expect(toeDoneText(calculation)).toBe('Мысок связан — закрывай 20 петель')
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

describe('счёт рядов (§8)', () => {
  it('отметка ведёт вверх и упирается в последний ряд', () => {
    expect(markDone(0, 19)).toBe(1)
    expect(markDone(18, 19)).toBe(19)
    expect(markDone(19, 19)).toBe(19)
  })

  it('отмена ведёт вниз и не уходит ниже нуля', () => {
    expect(undoDone(2)).toBe(1)
    expect(undoDone(0)).toBe(0)
  })

  it('зажим под новый расчёт: номер сохраняется, а если рядов стало меньше — подтягивается к последнему', () => {
    expect(clampDone(15, 19)).toBe(15)
    expect(clampDone(15, 7)).toBe(7)
    // Расчёт вырос — номер сам не поднимается, клина вверх нет.
    expect(clampDone(7, 19)).toBe(7)
    expect(clampDone(-3, 19)).toBe(0)
  })
})

describe('вид прогресса на экране (§8)', () => {
  it('до отметки текущий — ряд 1, шторки нет: её кромка у самого низа схемы', () => {
    expect(progressView(calculation, 0)).toEqual({
      done: 0,
      current: 1,
      allDone: false,
      text: 'убавочный 1 из 10 · в круге станет 56',
      shutterRow: 19,
    })
  })

  it('кромка шторки — (рядов − отмечено) от кончика мыска', () => {
    expect(progressView(calculation, 7).shutterRow).toBe(12)
    expect(progressView(calculation, 7).current).toBe(8)
  })

  it('все ряды отмечены — «всё готово», текущим остаётся последний, шторка до верха', () => {
    const view = progressView(calculation, 19)
    expect(view.allDone).toBe(true)
    expect(view.current).toBe(19)
    expect(view.shutterRow).toBe(0)
    expect(view.text).toBe(toeDoneText(calculation))
  })

  it('отмеченное сверх расчёта зажимается здесь же — шторка не уходит за схему', () => {
    expect(progressView(calculation, 30)).toMatchObject({ done: 19, shutterRow: 0, allDone: true })
  })
})

describe('запись прогресса в localStorage (§10.2)', () => {
  const key = paramsKey(calculation)

  it('пишется вместе с ключом расчёта и читается обратно', () => {
    const raw = formatProgressRecord(key, 5)
    expect(raw).toBe(JSON.stringify({ paramsKey: key, row: 5 }))
    expect(restoreDone(raw, key, 19)).toBe(5)
  })

  it('ноль не хранится — запись стирается', () => {
    expect(formatProgressRecord(key, 0)).toBeNull()
  })

  it('битая запись или чужой расчёт дают 0', () => {
    expect(restoreDone(null, key, 19)).toBe(0)
    expect(restoreDone('{', key, 19)).toBe(0)
    expect(restoreDone('null', key, 19)).toBe(0)
    expect(restoreDone(JSON.stringify({ paramsKey: key, row: 'пять' }), key, 19)).toBe(0)
    expect(restoreDone(JSON.stringify({ row: 5 }), key, 19)).toBe(0)
    expect(restoreDone(formatProgressRecord('s=40&e=20&k=1&r=even', 5), key, 19)).toBe(0)
  })

  it('запись длиннее расчёта зажимается под него', () => {
    expect(restoreDone(formatProgressRecord(key, 40), key, 19)).toBe(19)
  })
})
