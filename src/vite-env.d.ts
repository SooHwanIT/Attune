/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_USE_BACKEND_AUTH?: string;
  readonly VITE_ALLOW_DEMO_AUTH_FALLBACK?: string;
  readonly VITE_HIDE_VRM_MODEL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ELEVENLABS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
