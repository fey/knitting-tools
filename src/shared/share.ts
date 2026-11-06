/**
 * Что калькулятор отдаёт кнопке «Поделиться» (`ShareButton.vue`). Чистый TypeScript:
 * тип читают и composable калькуляторов, и компонент кнопки.
 */
export interface SharePayload {
  /** Hash расчёта вместе с решёткой. */
  hash: string
  /** Текст для шита: читается и без перехода по ссылке. */
  text: string
}
