/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_DEBUG_MENU: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
