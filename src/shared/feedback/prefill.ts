/**
 * Разбор предзаполненной ссылки формы (§11, тикет #24).
 *
 * Мастер отдаёт **одну** ссылку — ту, что выдаёт кнопка «Получить предзаполненную
 * ссылку» в редакторе Google Forms, — и в ней лежит всё: ID формы в пути и `entry.*`
 * всех полей в запросе. Держать ID и идентификаторы полей врозь значит однажды
 * подставить половину и получить отзывы, уехавшие не в те колонки; здесь либо
 * разобралось целиком, либо формы нет и кнопки на экране тоже.
 *
 * **Порядок полей в форме значим**: сообщение, контакты, ссылка на расчёт. Google
 * выдаёт `entry.*` в порядке вопросов формы, и разбор опирается на него.
 *
 * Чистый TypeScript: ни Vue, ни браузера.
 */
import type { FeedbackEntries } from './form'

export interface FeedbackForm {
  formId: string
  entries: FeedbackEntries
}

/**
 * Ссылка → ID формы и три `entry.*`, либо `null`: ссылки нет, она не от Google Forms,
 * или полей в ней не три. Тихий `null` — это «формы ещё нет», ровно то состояние,
 * в котором кнопка не рисуется, а сборка не падает.
 */
export function parsePrefillUrl(raw: string | undefined): FeedbackForm | null {
  if (!raw || raw.trim() === '') return null

  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }

  if (url.hostname !== 'docs.google.com') return null

  // Путь: /forms/d/e/<ID>/viewform
  const match = /\/forms\/d\/e\/([^/]+)\//.exec(url.pathname)
  if (!match?.[1]) return null

  const ids = [...url.searchParams.keys()].filter((key) => key.startsWith('entry.'))
  if (ids.length !== 3) return null

  const [message, contact, link] = ids as [string, string, string]
  return { formId: match[1], entries: { message, contact, url: link } }
}
