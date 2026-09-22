<script setup lang="ts">
/**
 * Подвал страницы (§6.5): номер версии и «Что нового». Общий на весь проект, как и шапка.
 *
 * **В подвале, а не в шапке.** Шапка по замерам полна (§6.4): на витрине в её ряду запас
 * пять пикселей, на калькуляторе пятая кнопка уводит ряд в четвёртую строку и сталкивает
 * вводку с первого экрана. «Что нового» к работе со страницей не нужно — до него долистывают.
 *
 * **Заметки приезжают сборкой, из `CHANGELOG.md`.** Файл меняется только мержем PR релиза,
 * поэтому страница показывает выпущенное, а не всё, что лежит в `main`, и не ходит за этим
 * в сеть — диалог открывается и офлайн (§10.6).
 *
 * Диалог — родной `<dialog>` с `showModal()`, как у отзыва: Esc, фокус-ловушка и возврат
 * фокуса достаются от платформы, клик по подложке закрывает.
 */
import { ref } from 'vue'
import changelogText from '../../CHANGELOG.md?raw'
import { formatReleaseDate, parseChangelog } from './changelog/changelog'

const releases = parseChangelog(changelogText)
const latest = releases[0]

const dialog = ref<HTMLDialogElement>()

function onDialogClick(event: MouseEvent): void {
  if (event.target === dialog.value) dialog.value?.close()
}
</script>

<template>
  <footer
    v-if="latest"
    class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500"
    data-testid="app-footer"
  >
    <span data-testid="app-version">Версия {{ latest.version }}</span>
    <button
      type="button"
      class="flex h-11 items-center text-slate-700 underline underline-offset-4"
      data-testid="changelog-button"
      @click="dialog?.showModal()"
    >
      Что нового
    </button>

    <dialog
      ref="dialog"
      aria-labelledby="changelog-title"
      class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md rounded-2xl p-5 text-slate-900 backdrop:bg-slate-900/40"
      data-testid="changelog-dialog"
      @click="onDialogClick"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 id="changelog-title" class="text-lg font-semibold">Что нового</h2>
        <button
          type="button"
          aria-label="Закрыть"
          class="-mt-1 px-2 text-2xl leading-none text-slate-500"
          data-testid="changelog-close"
          @click="dialog?.close()"
        >
          ×
        </button>
      </div>

      <section
        v-for="release in releases"
        :key="release.version"
        class="mt-5"
        data-testid="changelog-release"
      >
        <h3 class="font-semibold">
          {{ release.version }}
          <span class="font-normal text-slate-500">· {{ formatReleaseDate(release.date) }}</span>
        </h3>
        <template v-for="section in release.sections" :key="section.title">
          <h4 class="mt-3 text-sm font-medium text-slate-600">{{ section.title }}</h4>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-sm">
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
        </template>
      </section>
    </dialog>
  </footer>
</template>
