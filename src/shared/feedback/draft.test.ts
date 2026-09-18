import { describe, expect, it } from 'vitest'
import { parseDraft, serializeDraft } from './draft'

describe('чтение черновика (§10.2)', () => {
  it('записи нет — черновик пуст', () => {
    expect(parseDraft(null)).toEqual({ message: '', contact: '' })
  })

  it('читает оба поля', () => {
    expect(parseDraft('{"message":"схема врёт","contact":"почта"}')).toEqual({
      message: 'схема врёт',
      contact: 'почта',
    })
  })

  it('мусор в хранилище даёт пустой черновик, а не падение', () => {
    expect(parseDraft('не json')).toEqual({ message: '', contact: '' })
    expect(parseDraft('null')).toEqual({ message: '', contact: '' })
    expect(parseDraft('[1,2,3]')).toEqual({ message: '', contact: '' })
    expect(parseDraft('{"message":42}')).toEqual({ message: '', contact: '' })
  })

  it('недостающее поле подставляется пустым', () => {
    expect(parseDraft('{"message":"только текст"}')).toEqual({
      message: 'только текст',
      contact: '',
    })
  })
})

describe('запись черновика (§10.2)', () => {
  it('пустой черновик записи не получает', () => {
    expect(serializeDraft({ message: '', contact: '' })).toBeNull()
  })

  it('заполненный контакт хранится тоже', () => {
    expect(serializeDraft({ message: '', contact: 'почта' })).toBe('{"message":"","contact":"почта"}')
  })

  it('прогон туда-обратно ничего не теряет', () => {
    const draft = { message: 'схема врёт на 84 петлях', contact: '@кто-то' }
    expect(parseDraft(serializeDraft(draft))).toEqual(draft)
  })
})
