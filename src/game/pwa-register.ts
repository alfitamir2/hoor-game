// Offline service worker is not bundled in this build; keeps the original API shape.
type Opts = { immediate?: boolean; onRegisteredSW?: (url: string, r?: ServiceWorkerRegistration) => void; onNeedRefresh?: () => void; onOfflineReady?: () => void };
export function registerSW(_opts: Opts = {}) {
  return async (_reload?: boolean) => {};
}
