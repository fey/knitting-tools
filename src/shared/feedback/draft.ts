/**
 * Черновик отзыва — **третья** запись в `localStorage` (§10.2, тикет #24).
 *
 * Привязан к человеку, а не к расчёту: кручение петель его не сбрасывает. Это отличает
 * его от прогресса, который живёт под `paramsKey` и при смене расчёта пропадает, и
 * роднит со свёрнутостью вводки. Подтверждения при закрытии диалога нет именно потому,
 * что написанное переживает закрытие: терять нечего.
 *
 * Чистый TypeScript — разбор и сборка строки. Само хранилище трогает `useFeedback.ts`.
 */
import type { FeedbackDraft } from './form'

export const FEEDBACK_DRAFT_KEY = 'knitting-tools:feedback-draft'

const EMPTY: FeedbackDraft = { message: '', contact: '' }

/**
 * Черновик из строки хранилища. Всё, что не разобралось, — пустой черновик: записи
 * может не быть вовсе, а лежать там может что угодно, если в хранилище лазили руками.
 */
export function parseDraft(raw: string | null): FeedbackDraft {
  if (raw === null) return { ...EMPTY }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...EMPTY }
    const { message, contact } = parsed as Partial<FeedbackDraft>
    return {
      message: typeof message === 'string' ? message : '',
      contact: typeof contact === 'string' ? contact : '',
    }
  } catch {
    return { ...EMPTY }
  }
}

/**
 * Строка для хранилища, либо `null` — стереть запись. Пустой черновик записи не
 * получает: тем же узором, что свёрнутость вводки, где дефолт отдельной строкой
 * не хранится (§10.2).
 *
 * Хранится **всё, что заполнено**, включая контакты: цена названа в тикете — вписанный
 * и не отправленный контакт лежит в браузере, пока черновик не отправят или не сотрут.
 */
export function serializeDraft(draft: FeedbackDraft): string | null {
  if (draft.message === '' && draft.contact === '') return null
  return JSON.stringify({ message: draft.message, contact: draft.contact })
}
