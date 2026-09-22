import { describe, expect, it } from 'vitest'
import { cleanItem, formatReleaseDate, parseChangelog } from './changelog'

// Вид файла ровно тот, что пишет release-please: пустые строки после заголовка версии,
// ссылки на сравнение, коммит и тикет.
const RELEASE_PLEASE = `# Changelog

## [1.1.0](https://github.com/fey/knitting-tools/compare/v1.0.0...v1.1.0) (2026-09-24)


### Новое

* Что нового на странице ([#36](https://github.com/fey/knitting-tools/issues/36)) ([abc1234](https://github.com/fey/knitting-tools/commit/abc1234def))


### Исправлено

* Разбор ссылки чинится дефолтом, а не подтягиванием (§10.4) ([0f1e2d3](https://github.com/fey/knitting-tools/commit/0f1e2d3))

## 1.0.0 (2026-09-23)


### Новое

* Схема мыска
`

describe('parseChangelog (§6.5)', () => {
  it('разбирает релизы свежим первым, с разделами и пунктами', () => {
    expect(parseChangelog(RELEASE_PLEASE)).toEqual([
      {
        version: '1.1.0',
        date: '2026-09-24',
        sections: [
          { title: 'Новое', items: ['Что нового на странице'] },
          { title: 'Исправлено', items: ['Разбор ссылки чинится дефолтом, а не подтягиванием'] },
        ],
      },
      { version: '1.0.0', date: '2026-09-23', sections: [{ title: 'Новое', items: ['Схема мыска'] }] },
    ])
  })

  it('пустой файл и файл без релизов — пустой список', () => {
    expect(parseChangelog('')).toEqual([])
    expect(parseChangelog('# Changelog\n\nкакой-то текст\n')).toEqual([])
  })
})

describe('cleanItem (§6.5)', () => {
  it('срезает ссылку на коммит', () => {
    expect(cleanItem('Масштаб схемы ([abc1234](https://x/commit/abc1234))')).toBe('Масштаб схемы')
  })

  it('срезает номер тикета — ссылкой, голый и в старой форме', () => {
    expect(cleanItem('Отметка ряда ([#9](https://x/issues/9))')).toBe('Отметка ряда')
    expect(cleanItem('Отметка ряда (#9)')).toBe('Отметка ряда')
    expect(cleanItem('Вводка (#13, #16)')).toBe('Вводка')
    expect(cleanItem('Плотность (тикет #27)')).toBe('Плотность')
  })

  it('срезает номер раздела спеки', () => {
    expect(cleanItem('Бумага шторки (§7, §8)')).toBe('Бумага шторки')
  })

  it('не трогает скобки, которые пишутся для мастера', () => {
    expect(cleanItem('Ряд считается (и отмечается) сам')).toBe('Ряд считается (и отмечается) сам')
  })

  it('оставляет текст ссылки и жирного, но не разметку', () => {
    expect(cleanItem('**deps:** Сборка [быстрее](https://x) **вдвое**')).toBe('Сборка быстрее вдвое')
  })
})

describe('formatReleaseDate', () => {
  it('пишет дату по-русски, без «г.»', () => {
    expect(formatReleaseDate('2026-09-23')).toBe('23 сентября 2026')
  })
})
