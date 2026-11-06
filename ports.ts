/**
 * Порты стенда и preview — свои у каждой рабочей копии.
 *
 * Сессии агентов работают параллельно, каждая в своём worktree. Общий прибитый порт
 * достаётся тому, кто встал первым: чужая сессия принимала его стенд за свой, а прогон
 * e2e подхватывал чужой preview (`reuseExistingServer`) и проверял чужой dist. Поэтому
 * порт выводится из пути копии: в одной копии он всегда один и тот же, у соседней —
 * другой. Совпадение двух копий `strictPort` роняет громко, а не подменяет стенд молча.
 *
 * Адрес стенда этой копии печатает `make stand-url` (этот файл, запущенный напрямую).
 */
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

// FNV-1a: короткий, без зависимостей и одинаковый на каждом запуске.
let hash = 0x811c9dc5
for (const ch of root) {
  hash ^= ch.codePointAt(0)!
  hash = Math.imul(hash, 0x01000193) >>> 0
}
const offset = hash % 100

export const DEV_PORT = 5300 + offset
export const PREVIEW_PORT = 4300 + offset
export const BASE_PATH = '/knitting-tools/'

if (import.meta.main) {
  console.log(`http://localhost:${DEV_PORT}${BASE_PATH}`)
}
