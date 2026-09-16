import { describe, expect, it } from 'vitest'
import { CELL_SIZE, CHART_VIEWPORT_HEIGHT } from './constants'

describe('константы схемы', () => {
  it('клетка остаётся 22 px', () => {
    expect(CELL_SIZE).toBe(22)
  })

  it('окно схемы — 420 px', () => {
    expect(CHART_VIEWPORT_HEIGHT).toBe(420)
  })
})
