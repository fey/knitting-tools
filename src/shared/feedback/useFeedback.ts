/**
 * Состояние обратной связи (тикет #24). Одна точка на страницу — диалог один,
 * и черновик у него один.
 *
 * Здесь проходит граница: этот файл про Vue и про браузер (`localStorage`, `fetch`,
 * `location`), соседние `form.ts`, `draft.ts` и `prefill.ts` — чистый TypeScript.
 *
 * **Ответ Google непрозрачен.** `mode: 'no-cors'` — единственный способ дотянуться
 * до `/formResponse` из браузера: CORS-заголовков он не отдаёт вовсе (проверено).
 * Промис разрешается непрозрачным ответом при любом ответе сервера, поэтому
 * «записалось» от «выброшено» неотличимо, и успех мы не утверждаем — говорим
 * «Спасибо!», а не «Отзыв отправлен». Отказ промиса значит другое: запрос не ушёл
 * вовсе (офлайн, DNS), и вот это сказать честно можно.
 */
import { reactive, ref } from 'vue'
import { readStored, writeStored } from '../storage'
import { FEEDBACK_DRAFT_KEY, parseDraft, serializeDraft } from './draft'
import { buildFeedbackBody, formResponseUrl } from './form'
import { parsePrefillUrl } from './prefill'

/**
 * Форма — из одной предзаполненной ссылки в окружении сборки (§11). Не разобралось
 * или переменной нет — `null`, и тогда кнопки в шапке не будет вовсе, а сборка
 * при этом не падает. Цена названа в тикете: забытый секрет в Actions даёт деплой
 * без кнопки молча.
 */
export const feedbackForm = parsePrefillUrl(import.meta.env.VITE_FEEDBACK_PREFILL_URL)

/** Задержка записи черновика: пишем на правку поля, а не на закрытие — вкладку убивают без предупреждения. */
const WRITE_DELAY_MS = 400

export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'failed'

const draft = reactive(parseDraft(readStored(FEEDBACK_DRAFT_KEY)))
const open = ref(false)
const status = ref<FeedbackStatus>('idle')

let writeTimer: ReturnType<typeof setTimeout> | undefined

function flushWrite(): void {
  clearTimeout(writeTimer)
  writeStored(FEEDBACK_DRAFT_KEY, serializeDraft(draft))
}

function scheduleWrite(): void {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(flushWrite, WRITE_DELAY_MS)
}

/**
 * Правка поля. Отдельная функция, а не `watch`: правка ещё и снимает отметку
 * прошлого отказа — человек дописывает и пробует снова, и красная строка при этом
 * висеть не должна.
 */
function edit(field: 'message' | 'contact', value: string): void {
  draft[field] = value
  if (status.value === 'failed') status.value = 'idle'
  scheduleWrite()
}

function openDialog(): void {
  status.value = 'idle'
  open.value = true
}

/**
 * Закрывают Esc, крестик и клик по подложке — сразу: написанное переживает закрытие.
 *
 * Черновик при этом **дописывается немедленно**, не дожидаясь задержки: закрыть диалог
 * и тут же закрыть вкладку — обычное движение, и отложенная на 400 мс запись до него
 * не дожила бы. Задержка остаётся для другого случая — набора текста, когда вкладку
 * убивают посреди фразы.
 */
function closeDialog(): void {
  flushWrite()
  open.value = false
}

function clearDraft(): void {
  draft.message = ''
  draft.contact = ''
  clearTimeout(writeTimer)
  writeStored(FEEDBACK_DRAFT_KEY, null)
}

/**
 * Отправка. Адрес расчёта берётся из `location.href` целиком: по нему кликают прямо
 * из таблицы ответов. Оговорка §10.4 про отставший `location.href` сюда не достаёт —
 * между правкой поля и нажатием «Отправить» в диалоге проходит не один тик.
 */
async function send(): Promise<void> {
  if (!feedbackForm) return
  status.value = 'sending'

  const body = buildFeedbackBody(draft, window.location.href, feedbackForm.entries)
  const data = new FormData()
  for (const [key, value] of Object.entries(body)) data.append(key, value)

  try {
    await fetch(formResponseUrl(feedbackForm.formId), { method: 'POST', mode: 'no-cors', body: data })
  } catch {
    // Запрос не ушёл вовсе. Написанное не трогаем — оно тут и нужно целым.
    status.value = 'failed'
    return
  }

  status.value = 'sent'
  clearDraft()
}

export function useFeedback() {
  return { draft, open, status, edit, openDialog, closeDialog, send }
}
