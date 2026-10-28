// Single, guarded service-worker registrar. Never registers in dev, iframes or Lovable previews.
type Opts = {
  immediate?: boolean;
  onRegisteredSW?: (url: string, r?: ServiceWorkerRegistration) => void;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
};

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_DOMAINS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  if (PREVIEW_DOMAINS.some((d) => host.endsWith(d))) {
    if (PREVIEW_LABEL.test(label)) return true;
    if (/^project--[a-z0-9-]+-dev$/.test(label)) return true;
  }
  const matches = (d: string) => host === d || host.endsWith("." + d);
  if (matches("lovableproject.com") || matches("lovableproject-dev.com") || matches("beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSW() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => (r.active ?? r.installing ?? r.waiting)?.scriptURL.endsWith("/sw.js"))
      .map((r) => r.unregister()),
  );
}

export function registerSW(opts: Opts = {}) {
  const noop = async (_reload?: boolean) => {};
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return noop;
  if (isBlockedContext()) {
    void unregisterAppSW().catch(() => {});
    return noop;
  }
  let update = noop;
  void import("virtual:pwa-register").then(({ registerSW: real }) => {
    update = real({
      immediate: opts.immediate ?? true,
      onRegisteredSW: opts.onRegisteredSW,
      onNeedRefresh: opts.onNeedRefresh,
      onOfflineReady: opts.onOfflineReady,
    });
  });
  return (reload?: boolean) => update(reload);
}
