import { describe, expect, it } from 'vitest'
import { parsePrefillUrl } from './prefill'

const LINK =
  'https://docs.google.com/forms/d/e/1FAIpQLSfAnJAbfTl23gNM6gAbU1gAXo03N9I6pf5LJbo3Ptmex5nqUg/viewform?usp=pp_url' +
  '&entry.294341084=сообщение&entry.381911659=контакты&entry.1117=ссылка'

describe('разбор предзаполненной ссылки (§11)', () => {
  it('достаёт ID формы и три entry в порядке полей', () => {
    expect(parsePrefillUrl(LINK)).toEqual({
      formId: '1FAIpQLSfAnJAbfTl23gNM6gAbU1gAXo03N9I6pf5LJbo3Ptmex5nqUg',
      entries: { message: 'entry.294341084', contact: 'entry.381911659', url: 'entry.1117' },
    })
  })

  it('пусто и мусор дают «формы нет», а не падение', () => {
    expect(parsePrefillUrl(undefined)).toBeNull()
    expect(parsePrefillUrl('')).toBeNull()
    expect(parsePrefillUrl('   ')).toBeNull()
    expect(parsePrefillUrl('не ссылка вовсе')).toBeNull()
  })

  it('чужой домен не принимается', () => {
    expect(parsePrefillUrl('https://example.com/forms/d/e/ID/viewform?entry.1=a&entry.2=b&entry.3=c')).toBeNull()
  })

  it('ссылка без ID формы не принимается', () => {
    expect(parsePrefillUrl('https://docs.google.com/forms/viewform?entry.1=a&entry.2=b&entry.3=c')).toBeNull()
  })

  it('полей не три — не принимается: собрать половину хуже, чем не собрать', () => {
    const base = 'https://docs.google.com/forms/d/e/ID/viewform?'
    expect(parsePrefillUrl(base + 'entry.1=a&entry.2=b')).toBeNull()
    expect(parsePrefillUrl(base + 'entry.1=a&entry.2=b&entry.3=c&entry.4=d')).toBeNull()
  })

  it('посторонние параметры не мешают', () => {
    const parsed = parsePrefillUrl(LINK)
    expect(parsed?.entries.message).toBe('entry.294341084')
  })
})
