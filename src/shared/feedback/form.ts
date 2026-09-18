/**
 * Отправка отзыва в Google Forms (тикет #24, §11).
 *
 * Чистый TypeScript: ни импортов из Vue, ни обращений к браузеру. Адрес, тело запроса
 * и тексты счётчика считаются здесь, сам `fetch` и `localStorage` живут в `useFeedback.ts`.
 *
 * **Endpoint Google не документирован ни строкой.** Приём живёт с 2018 года и на сегодня
 * работает, но гарантии нет, а ответ непрозрачен (см. `useFeedback.ts`) — значит поломка
 * будет молчаливой. Риск принят осознанно, ловится ручным тестовым отзывом.
 */

/** Потолок сообщения. Ввод не режется — за потолком гаснет «Отправить» (§6.4). */
export const FEEDBACK_MAX_LENGTH = 500

/** Идентификаторы полей формы, `entry.NNNNN`. Берутся из предзаполненной ссылки (`prefill.ts`). */
export interface FeedbackEntries {
  message: string
  contact: string
  url: string
}

/** Поля, которые заполняет мастер. `url` подставляется сам и ручки на экране не имеет. */
export interface FeedbackDraft {
  message: string
  contact: string
}

/** Адрес приёма ответов формы. */
export function formResponseUrl(formId: string): string {
  return `https://docs.google.com/forms/d/e/${formId}/formResponse`
}

/**
 * Тело запроса полями формы. Пустой контакт уезжает пустой строкой, а не пропускается:
 * колонка в таблице ответов должна стоять на месте у каждой строки.
 *
 * Ссылка на расчёт идёт **полным адресом**, а не голым hash: по ней кликают прямо
 * из таблицы ответов и попадают на тот самый экран.
 */
export function buildFeedbackBody(
  draft: FeedbackDraft,
  calculationUrl: string,
  entries: FeedbackEntries,
): Record<string, string> {
  return {
    [entries.message]: draft.message.trim(),
    [entries.contact]: draft.contact.trim(),
    [entries.url]: calculationUrl,
  }
}

/** Отправимо ли написанное: пустое сообщение и перебор гасят «Отправить» (§6.4). */
export function canSend(draft: FeedbackDraft): boolean {
  const message = draft.message.trim()
  return message !== '' && draft.message.length <= FEEDBACK_MAX_LENGTH
}

/**
 * Счётчик под полем. Виден всегда, а не только у границы: появляющийся у порога
 * подпрыгивает под пальцем ровно тогда, когда человек торопится дописать.
 */
export function counterText(length: number): string {
  if (length > FEEDBACK_MAX_LENGTH) return `на ${length - FEEDBACK_MAX_LENGTH} больше, чем влезает`
  return `осталось ${FEEDBACK_MAX_LENGTH - length}`
}
