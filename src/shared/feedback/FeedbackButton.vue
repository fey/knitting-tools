<script setup lang="ts">
/**
 * Кнопка «Оставить отзыв» и её диалог (§6.4, тикет #24).
 *
 * **Формы нет — кнопки нет.** Предзаполненная ссылка не подставлена в сборку, значит
 * отправлять некуда, и рисовать кнопку, которая ничего не делает, хуже, чем не рисовать.
 *
 * Диалог — родной `<dialog>` с `showModal()`: Esc, фокус-ловушка и возврат фокуса на
 * кнопку достаются от платформы. Закрывают Esc, крестик и клик по подложке, **сразу
 * и без подтверждения**: написанное живёт в черновике и закрытие переживает.
 *
 * Клик по подложке приходит на сам элемент `<dialog>`, клик по содержимому — на что-то
 * внутри; цель события их и различает.
 */
import { computed, ref, watch } from 'vue'
import { FEEDBACK_MAX_LENGTH, canSend, counterText } from './form'
import { feedbackForm, useFeedback } from './useFeedback'

const { draft, open, status, edit, openDialog, closeDialog, send } = useFeedback()

const dialog = ref<HTMLDialogElement>()
const overLimit = computed(() => draft.message.length > FEEDBACK_MAX_LENGTH)
const sendable = computed(() => canSend(draft))

const sendLabel = computed(() => (status.value === 'sending' ? 'Отправляем…' : 'Отправить'))

watch(open, (isOpen) => {
  if (isOpen) dialog.value?.showModal()
  else dialog.value?.close()
})

/** Клик мимо диалога — по самому элементу `<dialog>`, а не по его содержимому. */
function onDialogClick(event: MouseEvent): void {
  if (event.target === dialog.value) closeDialog()
}
</script>

<template>
  <template v-if="feedbackForm">
    <button
      type="button"
      class="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-900 shadow-sm"
      data-testid="feedback-button"
      @click="openDialog"
    >
      Оставить отзыв
    </button>

    <dialog
      ref="dialog"
      aria-labelledby="feedback-title"
      class="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl p-5 backdrop:bg-slate-900/40"
      data-testid="feedback-dialog"
      @click="onDialogClick"
      @close="closeDialog"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 id="feedback-title" class="text-lg font-semibold">Оставить отзыв</h2>
        <button
          type="button"
          aria-label="Закрыть"
          class="-mt-1 px-2 text-2xl leading-none text-slate-500"
          data-testid="feedback-close"
          @click="closeDialog"
        >
          ×
        </button>
      </div>

      <template v-if="status !== 'sent'">
        <label for="feedback-message" class="mt-4 block text-sm font-medium">Сообщение *</label>
        <textarea
          id="feedback-message"
          rows="5"
          class="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
          data-testid="feedback-message"
          :value="draft.message"
          @input="edit('message', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
        <p
          class="text-xs"
          :class="overLimit ? 'text-red-700' : 'text-slate-500'"
          data-testid="feedback-counter"
        >
          {{ counterText(draft.message.length) }}
        </p>

        <label for="feedback-contact" class="mt-3 block text-sm font-medium">
          Контакты, если нужен ответ
        </label>
        <input
          id="feedback-contact"
          class="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
          data-testid="feedback-contact"
          :value="draft.contact"
          @input="edit('contact', ($event.target as HTMLInputElement).value)"
        />

        <p class="mt-3 text-xs text-slate-500">
          Отзыв уходит вместе со ссылкой на расчёт. Ничего опознающего не отправляется
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
            data-testid="feedback-send"
            :disabled="!sendable || status === 'sending'"
            @click="send"
          >
            {{ sendLabel }}
          </button>
          <p v-if="status === 'failed'" class="text-sm text-red-700" data-testid="feedback-error">
            Не отправилось, проверь связь
          </p>
        </div>
      </template>

      <template v-else>
        <!-- Доставку не утверждаем: ответ Google непрозрачен, проверить её нельзя. -->
        <p class="mt-6 text-base" data-testid="feedback-thanks">Спасибо!</p>
        <button
          type="button"
          class="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
          data-testid="feedback-done"
          @click="closeDialog"
        >
          Закрыть
        </button>
      </template>
    </dialog>
  </template>
</template>
