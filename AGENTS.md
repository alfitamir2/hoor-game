<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Hoor game lives in `src/game/` (ported from a Vite SPA) and renders client-only from `/` via `ClientOnly` + lazy import, because it reads localStorage during state initialization.
- Extra-strict TS flags (noUncheckedIndexedAccess, noPropertyAccessFromIndexSignature, exactOptionalPropertyTypes, noImplicitReturns) are off: the ported game code was written without them.
- Offline service worker (vite-plugin-pwa) is not wired; `src/game/pwa-register.ts` is a no-op stub keeping the original API.
