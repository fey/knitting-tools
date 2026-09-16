import { describe, expect, it } from 'vitest'
import {
  CELL_SIZE,
  CHART_VIEWPORT_HEIGHT,
  chartGuideLines,
  stitchLinePoints,
  trianglePoints,
} from './constants'

describe('константы схемы', () => {
  it('клетка остаётся 22 px', () => {
    expect(CELL_SIZE).toBe(22)
  })

  it('окно схемы — 420 px', () => {
    expect(CHART_VIEWPORT_HEIGHT).toBe(420)
  })
})

describe('жирные линии каждые 5 петель — счёт от правого края', () => {
  it('на дефолтных 30 петлях в половине даёт тот же набор, что и счёт от левого края', () => {
    // cols = 60 / 2 = 30, кратно 5 — отсчёт от правого и левого края не расходится.
    expect(chartGuideLines(30)).toEqual([25, 20, 15, 10, 5])
  })

  it('на 31 петле расходится со счётом от левого края (5, 10, …, 30)', () => {
    expect(chartGuideLines(31)).toEqual([26, 21, 16, 11, 6, 1])
  })

  it('на кромке короче пяти петель линий нет', () => {
    expect(chartGuideLines(4)).toEqual([])
  })
})

describe('геометрия значков — один источник для сетки и легенды', () => {
  it('треугольник наклона влево: вертикальный катет слева, гипотенуза «\\»', () => {
    expect(trianglePoints('left', 0, 0)).toBe('0.22,0.8 0.22,0.2 0.78,0.8')
  })

  it('треугольник наклона вправо: вертикальный катет справа, гипотенуза «/»', () => {
    expect(trianglePoints('right', 0, 0)).toBe('0.78,0.8 0.78,0.2 0.22,0.8')
  })

  it('size масштабирует те же доли — легенда (14 px) и сетка (клетка) не расходятся', () => {
    const [near, top, far] = trianglePoints('left', 0, 0, 14)
      .split(' ')
      .map((point) => point.split(',').map(Number))
    expect(near).toEqual([0.22 * 14, 0.8 * 14])
    expect(top).toEqual([0.22 * 14, 0.2 * 14])
    expect(far).toEqual([0.78 * 14, 0.8 * 14])
  })

  it('штрих лицевой стоит по центру клетки', () => {
    expect(stitchLinePoints(2, 3)).toEqual({ x1: 2.5, x2: 2.5, y1: 3.2, y2: 3.8 })
  })
})
