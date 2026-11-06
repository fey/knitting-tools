<script setup lang="ts">
/**
 * Кнопка «Поделиться» (§10.5 спеки мыска, §9.4 спеки пятки) — общая на калькуляторы,
 * стоит в шапке страницы. Что именно уходит в ссылку и текст, решает калькулятор:
 * он отдаёт `payload` — функцию, а не готовые строки.
 *
 * `navigator.share()` уносит и `url`, и `text`: сообщение читается даже без
 * перехода по ссылке. Фолбэк — копирование в буфер там, где API нет или шит
 * отклонили не отменой (не `AbortError`), а сбоем.
 *
 * **Калькулятор не производит битых ссылок (§10.4 спеки мыска).** Касание кнопки уводит
 * фокус с поля раньше, чем срабатывает `@click` — родное поведение браузера
 * (`blur` целевого поля идёт перед `click` по кнопке), и починка поля меняет
 * параметры синхронно. Поэтому `payload` — функция, которую кнопка зовёт в момент
 * клика: она читает уже почтикнутый расчёт. Готовые строки пропсом отстали бы
 * на ререндер родителя, а `location.href` — на следующий тик `watch`.
 *
 * **Место кнопки — шапка, выше полей петель**, и это часть той же гарантии.
 * Подпись починки вставляется в DOM тем же синхронным `blur`, что чинит
 * поле: кнопка, стоящая в потоке **ниже** полей, уехала бы от этой вставки вниз
 * между `mousedown` и `mouseup` одного и того же клика, и клик промахнулся бы мимо.
 * Выше полей вставка подписи кнопку не двигает — поэтому фиксировать её к экрану не нужно.
 */
import { computed, ref } from 'vue'
import type { SharePayload } from './share'

const props = defineProps<{ payload: () => SharePayload }>()

type Status = 'idle' | 'copied' | 'error'
const status = ref<Status>('idle')
let statusTimer: ReturnType<typeof setTimeout> | undefined

const label = computed(() => {
  if (status.value === 'copied') return 'Ссылка скопирована'
  if (status.value === 'error') return 'Не получилось скопировать'
  return 'Поделиться'
})

function showStatus(next: Status): void {
  status.value = next
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => {
    status.value = 'idle'
  }, 2000)
}

/** Адрес из уже почтикнутого расчёта, а не из `location.href` (см. комментарий выше). */
function shareUrl(hash: string): string {
  const url = new URL(window.location.href)
  url.hash = hash
  return url.toString()
}

function legacyCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      legacyCopy(text)
    }
    showStatus('copied')
  } catch {
    showStatus('error')
  }
}

async function share(): Promise<void> {
  const { hash, text } = props.payload()
  const url = shareUrl(hash)

  if (navigator.share) {
    try {
      await navigator.share({ text, url })
      return
    } catch (err) {
      // Отмена системного шита — не сбой (AbortError), молчим и не копируем следом.
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }

  await copyToClipboard(`${text}\n${url}`)
}
</script>

<template>
  <button
    type="button"
    class="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-900 shadow-sm"
    data-testid="share-button"
    @click="share"
  >
    {{ label }}
  </button>
  <p class="sr-only" role="status" aria-live="polite" data-testid="share-status">
    {{ status !== 'idle' ? label : '' }}
  </p>
</template>
