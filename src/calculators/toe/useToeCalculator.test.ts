import { describe, expect, it } from 'vitest'
import { useToeCalculator } from './useToeCalculator'

describe('состояние калькулятора', () => {
  it('открывается посчитанным дефолтом: 60 → 20, кромка 1, через ряд', () => {
    const { params, calculation } = useToeCalculator()
    expect(params.initial).toBe(60)
    expect(params.final).toBe(20)
    expect(params.edge).toBe(1)
    expect(params.rhythm).toEqual({ kind: 'preset', name: 'even' })
    expect(calculation.value.decRowsNeeded).toBe(10)
    expect(calculation.value.totalRows).toBe(19)
  })

  it('состояние одно на всю страницу, и расчёт пересчитывается при правке', () => {
    const first = useToeCalculator()
    const second = useToeCalculator()

    first.params.final = 16
    expect(second.calculation.value.totalRows).toBe(21)
    expect(second.calculation.value.decRowsNeeded).toBe(11)

    first.params.final = 20
    expect(second.calculation.value.totalRows).toBe(19)
  })
})

// Тикет #9, §8: счёт рядов. `localStorage` недоступен в `environment: 'node'` (см.
// vite.config.ts), поэтому персист проверяют браузерные тесты (§12.2); здесь —
// сама модель счёта: отметка, отмена, сброс, зажим при усечении расчёта.
describe('счёт ряда (тикет #9)', () => {
  it('начинается с нуля, первое «Ряд 1 готов» — markRow — и есть начало', () => {
    const { params, calculation, progressRow, markRow, resetProgress } = useToeCalculator()
    params.initial = 60
    params.final = 20
    params.edge = 1
    params.rhythm = { kind: 'preset', name: 'even' }
    resetProgress()

    expect(progressRow.value).toBe(0)
    markRow()
    expect(progressRow.value).toBe(1)
    expect(calculation.value.totalRows).toBe(19)
  })

  it('отмена — «−1», не уходит ниже нуля', () => {
    const { progressRow, markRow, undoRow, resetProgress } = useToeCalculator()
    resetProgress()
    markRow()
    markRow()
    undoRow()
    expect(progressRow.value).toBe(1)
    undoRow()
    undoRow() // ниже нуля — не уходит
    expect(progressRow.value).toBe(0)
  })

  it('markRow не уходит выше totalRows — на последнем ряду дальше отмечать нечего', () => {
    const { calculation, progressRow, markRow, resetProgress } = useToeCalculator()
    resetProgress()
    const total = calculation.value.totalRows
    for (let i = 0; i < total + 5; i++) markRow()
    expect(progressRow.value).toBe(total)
  })

  it('сброс возвращает ряд к нулю, расчёт остаётся', () => {
    const { params, progressRow, markRow, resetProgress } = useToeCalculator()
    markRow()
    markRow()
    resetProgress()
    expect(progressRow.value).toBe(0)
    expect(params.final).toBe(20) // расчёт не тронут сбросом счёта
  })

  it('смена расчёта на ходу номер ряда сохраняет, а если рядов стало меньше — подтягивает к последнему', () => {
    const { params, calculation, progressRow, markRow, resetProgress } = useToeCalculator()
    resetProgress()
    params.initial = 60
    params.final = 20
    params.edge = 1
    params.rhythm = { kind: 'preset', name: 'even' } // 19 рядов

    for (let i = 0; i < 15; i++) markRow()
    expect(progressRow.value).toBe(15)

    // Свой ритм короче: {interval: 2, repeats: 3} даёт 7 рядов (§12.1 случай 7).
    params.rhythm = { kind: 'custom', segments: [{ interval: 2, repeats: 3 }] }
    expect(calculation.value.totalRows).toBe(7)
    expect(progressRow.value).toBe(7) // подтянулся к последнему, не сброшен

    // Возврат к более длинному расчёту номер не поднимает сам — только сохраняет то,
    // что было (клин вверх нет), при этом не роняет ниже уже достигнутого при усечении.
    params.rhythm = { kind: 'preset', name: 'even' }
    expect(calculation.value.totalRows).toBe(19)
    expect(progressRow.value).toBe(7)

    resetProgress()
  })

  it('правка обоих полей сразу — одна смена расчёта: ряд подтягивается, а не обнуляется', () => {
    const { params, calculation, progressRow, markRow, resetProgress, setStitches } = useToeCalculator()
    resetProgress()
    setStitches({ initial: 100, final: 60, edge: 1 })
    params.rhythm = { kind: 'preset', name: 'even' }
    expect(calculation.value.totalRows).toBe(19)

    for (let i = 0; i < 15; i++) markRow()
    expect(progressRow.value).toBe(15)

    // Начальные 40 при конечных 60 не сходятся, поэтому починка приносит пару целиком:
    // 40 → 36 — это один убавочный ряд и один ряд всего. Промежуточного состояния
    // 40 → 60 зажим видеть не должен, иначе ряд обнулится вместо подтягивания.
    setStitches({ initial: 40, final: 36 })
    expect(calculation.value.totalRows).toBe(1)
    expect(progressRow.value).toBe(1)

    // Обратная сторона того же зажима: расчёт вырос — номер не поднимается сам,
    // а остаётся там, где остановился (§8, клина вверх нет).
    setStitches({ initial: 100, final: 20 })
    expect(calculation.value.totalRows).toBe(39)
    expect(progressRow.value).toBe(1)

    resetProgress()
    setStitches({ initial: 60, final: 20, edge: 1 })
  })
})

// Тикет #16, §6.1: вводка нужна на первом заходе и мешает на десятом. Свёрнутость —
// вторая запись в `localStorage` (§10.2), и она привязана к человеку, а не к расчёту.
// `localStorage` в node-окружении недоступен (см. vite.config.ts) — переживание
// перезагрузки и фолбэк при недоступном хранилище проверяют браузерные спеки (§12.2).
describe('свёрнутость вводки (тикет #16)', () => {
  it('первый заход — вводка развёрнута', () => {
    const { introCollapsed, setIntroCollapsed } = useToeCalculator()
    setIntroCollapsed(false)
    expect(introCollapsed.value).toBe(false)
  })

  it('переключатель сворачивает и разворачивает обратно', () => {
    const { introCollapsed, toggleIntro, setIntroCollapsed } = useToeCalculator()
    setIntroCollapsed(false)

    toggleIntro()
    expect(introCollapsed.value).toBe(true)

    toggleIntro()
    expect(introCollapsed.value).toBe(false)
  })

  it('свёрнутость не трогает ни расчёт, ни отмеченный ряд: смена расчёта её не сбрасывает', () => {
    const { params, progressRow, markRow, resetProgress, setStitches, introCollapsed, toggleIntro, setIntroCollapsed } =
      useToeCalculator()
    resetProgress()
    setStitches({ initial: 60, final: 20, edge: 1 })
    params.rhythm = { kind: 'preset', name: 'even' }

    setIntroCollapsed(false)
    toggleIntro()
    markRow()
    expect(introCollapsed.value).toBe(true)
    expect(progressRow.value).toBe(1)

    // Прогресс привязан к расчёту и при его смене подтягивается; свёрнутость привязана
    // к человеку и живёт независимо от того, какие петли на экране.
    setStitches({ initial: 40, final: 36 })
    expect(introCollapsed.value).toBe(true)

    resetProgress()
    setIntroCollapsed(false)
    setStitches({ initial: 60, final: 20, edge: 1 })
  })
})
