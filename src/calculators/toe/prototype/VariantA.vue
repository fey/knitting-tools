<script setup lang="ts">
/**
 * ПРОТОТИП, вариант A — «только схема» оверлеем.
 *
 * Кнопка у лупы разворачивает схему на весь экран: страница остаётся под низом,
 * а схема становится кадром, внутри которого возят в обе стороны. Где браузер умеет —
 * сверху дополнительно снимается его собственный хром (`requestFullscreen`); где не
 * умеет (iOS Safari — это весь основной телефонный сценарий), остаётся тот же оверлей,
 * только с адресной строкой. Выход — та же кнопка или Esc.
 *
 * Цена, которую вариант и обязан показать: схема с вложенной вертикальной прокруткой —
 * это ровно тот кадр, который §6 отменил. Выиграет A — §6 придётся править.
 *
 * Схема не перемонтируется: меняются классы обёртки, а не место компонента в дереве,
 * поэтому шаг масштаба переживает вход и выход.
 */
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import ToeChart from '../components/ToeChart.vue'
import IntroNote from '../components/IntroNote.vue'
import RhythmPresets from '../components/RhythmPresets.vue'
import RhythmBuilder from '../components/RhythmBuilder.vue'
import StitchFields from '../components/StitchFields.vue'
import SummaryPanel from '../components/SummaryPanel.vue'
import RowProgressBar from '../components/RowProgressBar.vue'
import ShareButton from '../components/ShareButton.vue'

const focus = ref(false)
const stage = ref<HTMLElement | null>(null)
/** Нативный фуллскрин удался — только тогда выход из него значит выход из режима. */
const native = ref(false)

async function enter(): Promise<void> {
  focus.value = true
  await nextTick()
  try {
    await stage.value?.requestFullscreen?.()
    native.value = document.fullscreenElement === stage.value
  } catch {
    // Нативного фуллскрина нет (iOS Safari) — оверлея достаточно.
  }
}

async function leave(): Promise<void> {
  focus.value = false
  native.value = false
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen()
    } catch {
      /* уже вышли */
    }
  }
}

/** Esc из нативного фуллскрина до `keydown` не доходит — ловится сменой режима. */
function onFullscreenChange(): void {
  if (!document.fullscreenElement && native.value) {
    native.value = false
    focus.value = false
  }
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && focus.value) void leave()
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900">
    <main
      class="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-12 pb-56 min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]"
    >
      <header class="flex items-start justify-between gap-3">
        <h1 class="text-xl font-semibold">Калькулятор мыска носка</h1>
        <ShareButton />
      </header>

      <IntroNote />

      <div
        class="flex flex-col gap-4 min-[1240px]:grid min-[1240px]:grid-cols-[400px_minmax(0,1fr)] min-[1240px]:items-start min-[1240px]:gap-6"
      >
        <div class="flex flex-col gap-4 min-[1240px]:col-start-1 min-[1240px]:row-start-1">
          <StitchFields />
          <RhythmPresets />
          <RhythmBuilder />
        </div>

        <!-- Сцена: в обычном виде — клетка грида, в развёрнутом — весь экран.
             Плашка прогресса лежит внутри сцены намеренно: в нативном фуллскрине
             видно только содержимое элемента, и дока, оставленная снаружи, пропала бы. -->
        <div
          ref="stage"
          :class="
            focus
              ? 'fixed inset-0 z-40 overflow-y-auto bg-white px-2 pt-11 pb-44'
              : 'min-[1240px]:col-start-2 min-[1240px]:row-start-1 min-[1240px]:row-span-2'
          "
          data-testid="proto-stage"
        >
          <ToeChart>
            <template #actions>
              <button
                type="button"
                class="flex h-11 items-center gap-1 rounded border border-slate-300 px-2 text-sm text-slate-700"
                data-testid="proto-focus-toggle"
                @click="focus ? leave() : enter()"
              >
                {{ focus ? 'Свернуть' : 'Только схема' }}
              </button>
            </template>
          </ToeChart>

          <div class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-2">
            <div class="mx-auto max-w-xl min-[800px]:max-w-3xl min-[1240px]:max-w-[1400px]">
              <RowProgressBar />
            </div>
          </div>
        </div>

        <SummaryPanel class="min-[1240px]:col-start-1 min-[1240px]:row-start-2" />
      </div>
    </main>
  </div>
</template>
