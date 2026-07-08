/// <reference types="vite/client" />

import type { OmniSuiteApi } from "../electron/preload";

declare global {
  interface Window {
    api: OmniSuiteApi;
  }
}

export {};
