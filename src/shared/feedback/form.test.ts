import { describe, expect, it } from 'vitest'
import { FEEDBACK_MAX_LENGTH, buildFeedbackBody, canSend, counterText, formResponseUrl } from './form'

describe('адрес приёма', () => {
  it('собирается из ID формы', () => {
    expect(formResponseUrl('ABC123')).toBe('https://docs.google.com/forms/d/e/ABC123/formResponse')
  })
})

describe('тело запроса', () => {
  const url = 'https://fey.github.io/knitting-tools/#s=60&e=20&k=1&r=even'
  // Настоящие entry придут из предзаполненной ссылки формы; тесты берут свои,
  // иначе пустые идентификаторы схлопнули бы три поля в один ключ.
  const entries = { message: 'entry.1', contact: 'entry.2', url: 'entry.3' }

  it('несёт три поля, ссылка — полным адресом', () => {
    const body = buildFeedbackBody({ message: ' схема врёт ', contact: ' почта ' }, url, entries)
    expect(body).toEqual({ 'entry.1': 'схема врёт', 'entry.2': 'почта', 'entry.3': url })
  })

  it('пустой контакт уезжает пустой строкой, а не пропадает', () => {
    const body = buildFeedbackBody({ message: 'текст', contact: '' }, url, entries)
    expect(Object.prototype.hasOwnProperty.call(body, entries.contact)).toBe(true)
    expect(body[entries.contact]).toBe('')
  })
})

describe('можно ли отправлять (§6.4)', () => {
  it('пустое сообщение гасит отправку', () => {
    expect(canSend({ message: '', contact: '' })).toBe(false)
    expect(canSend({ message: '   \n ', contact: 'почта' })).toBe(false)
  })

  it('перебор гасит отправку, ровно потолок — нет', () => {
    expect(canSend({ message: 'я'.repeat(FEEDBACK_MAX_LENGTH), contact: '' })).toBe(true)
    expect(canSend({ message: 'я'.repeat(FEEDBACK_MAX_LENGTH + 1), contact: '' })).toBe(false)
  })

  it('контакт на отправку не влияет — он необязательный', () => {
    expect(canSend({ message: 'текст', contact: '' })).toBe(true)
  })
})

describe('счётчик', () => {
  it('до потолка считает остаток', () => {
    expect(counterText(0)).toBe('осталось 500')
    expect(counterText(160)).toBe('осталось 340')
    expect(counterText(FEEDBACK_MAX_LENGTH)).toBe('осталось 0')
  })

  it('за потолком считает перебор', () => {
    expect(counterText(FEEDBACK_MAX_LENGTH + 134)).toBe('на 134 больше, чем влезает')
  })
})
