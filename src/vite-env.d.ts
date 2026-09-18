/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

/**
 * Предзаполненная ссылка на форму обратной связи (§11, тикет #24): в ней и ID формы,
 * и `entry.*` полей. Секретом в Actions; переменной нет — кнопки на экране нет.
 */
interface ImportMetaEnv {
  readonly VITE_FEEDBACK_PREFILL_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
