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
- Offline uses vite-plugin-pwa generateSW writing `dist/client/sw.js`; `src/game/pwa-register.ts` is the only registrar and refuses dev/iframe/Lovable preview hosts, because a SW in preview serves stale builds.
- AI practice recommendations (src/lib/practice.*) may only pick topic ids from src/game/data/practiceCatalog.ts; questions always come from the tested local generator, so the model never writes questions. Requires sign-in to protect AI credits.
- The active arcade is the sandboxed standalone document in `public/Hoor-Plays-Learns-Android.html`; keep its desktop and phone navigation synchronized through `switchMainView` so restored screens and game pausing stay consistent.
