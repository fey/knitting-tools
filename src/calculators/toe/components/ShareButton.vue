<script setup lang="ts">
/**
 * Кнопка «Поделиться» (§10.5, тикет #8) — обычный блок шапки `App.vue`.
 *
 * `navigator.share()` уносит и `url`, и `text`: сообщение читается даже без
 * перехода по ссылке. Фолбэк — копирование в буфер там, где API нет или шит
 * отклонили не отменой (не `AbortError`), а сбоем.
 *
 * **Калькулятор не производит битых ссылок (§10.4).** Касание кнопки уводит
 * фокус с поля раньше, чем срабатывает `@click` — родное поведение браузера
 * (`blur` целевого поля идёт перед `click` по кнопке), и починка §9.3 меняет
 * `params` синхронно. Отдельного кода на этот случай здесь нет и не нужно: `url`
 * строится из уже почтикнутых `params`, а не из `location.href` за спиной —
 * если бы `location.href` ещё не догнал `params` (следующий тик `watch`),
 * ссылка успела бы уйти недосинхронизированной.
 *
 * **Место кнопки — шапка, выше полей петель**, и это часть той же гарантии.
 * Подпись починки (§9.2) вставляется в DOM тем же синхронным `blur`, что чинит
 * поле: кнопка, стоящая в потоке **ниже** полей, уехала бы от этой вставки вниз
 * между `mousedown` и `mouseup` одного и того же клика, и клик промахнулся бы мимо
 * (проверено: тест на блюр-починку падал на пустом `__shared`). Выше полей вставка
 * подписи кнопку не двигает — поэтому фиксировать её к экрану не нужно.
 */
import { computed, ref } from 'vue'
import { useToeCalculator } from '../useToeCalculator'
import { formatHash } from '../core/hash'
import { shareText } from '../core/share'

const { params, calculation } = useToeCalculator()

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

/** Адрес из уже почтикнутых `params`, а не из `location.href` (см. комментарий выше). */
function shareUrl(): string {
  const url = new URL(window.location.href)
  url.hash = formatHash(params)
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
  const url = shareUrl()
  const text = shareText(calculation.value)

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
