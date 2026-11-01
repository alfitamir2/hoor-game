# Hoor rescue audio integration map — 1 November 2026

## Purpose

This note maps the current zero-heart rescue implementation to the approved listening-rescue design. It is a code-reading and integration-planning document only. No production runtime or audio assets are changed by this commit.

## Current runtime path

Canonical runtime: `public/Hoor-Plays-Learns-Android.html`.

1. `loseLife()` decrements `playerLives`. When it reaches zero, it sets `rescuePending = true`, stops the game loop, saves state, and calls `showStageResult(false)`.
2. `showStageResult(false)` displays the failure/result overlay. Its primary action says the player can answer correctly to restore a heart.
3. That action closes the result overlay and calls `openQuizStation(false, true)`.
4. `openQuizStation()` pauses play, draws an age-profile question from the basic question pool, and marks it as a rescue question.
5. `checkQuizStationAnswer()` grants one heart on a correct rescue answer, clears `rescuePending`, gives temporary shield ticks, and clears enemy projectiles.
6. On a wrong rescue answer, `closeQuizStation()` opens another rescue question while the player still has zero hearts. The current fallback can therefore repeat indefinitely until a correct answer is given.

Related rule helper: `public/arcade-rules.js` exposes `rescue(lives, right)`, which currently grants one heart only when lives are zero and the rescue answer is correct.

## Proposed insertion point

The safest initial integration point is the failure overlay's primary action in `showStageResult(false)`, not a rewrite of `loseLife()` or the question engine.

Replace the current rescue-question entry action with a dedicated listening-rescue entry point. That flow should:

- preserve the current stage, wave, score, enemies/boss state, and player position;
- pause the game loop and all combat timers;
- select an approved complete ayah or approved hadith audio item for the existing age profile;
- require an intentional child tap to begin playback (no autoplay);
- award exactly one heart only after the selected media emits a valid natural `ended` event;
- reject duplicate, stale, interrupted, failed, or manually-seeked completion events;
- resume the same stage and wave with brief invulnerability;
- keep the existing question rescue as an accessible fallback if audio is unavailable or the device cannot play it;
- never require payment, ads, or an external rewarded-ad SDK.

The audio flow should be isolated from the existing quiz state (`quizOpen`, `currentQuizObj`) so rescue media events cannot accidentally complete a quiz or vice versa.

## Existing audio integration constraints

- The standalone HTML already has a hidden `#quranAudioPlayer` element.
- Its current CSP allows local media (`media-src 'self'`) and one existing MP3Quran host. A bundled local audio directory can use the existing `'self'` allowance; any new remote host would need a deliberate CSP review.
- The current player is also used by the Quran mini-player. The rescue flow must not overwrite or interrupt an unrelated active recitation without explicitly pausing and restoring it.
- `src/game/data/quranVerses.ts` currently declares Alafasy and Husary reciters and EveryAyah/Quran.com fallback URLs. It does not describe the newly uploaded Maher Al-Muaiqly candidate files. Do not silently mix these sources or infer rights for the older URLs from the King Fahd Complex permission statement.
- The current encouragement list does not include the required exact phrase `ممتاز حور وأصدقاؤها!`. Add it only at a positive, appropriate moment such as a successful completed listening rescue, with a cooldown to avoid repetition.
- Preserve the no-music rule. Do not add musical success cues, loops, or background tracks as part of the rescue implementation.

## Candidate audio intake status

The 29 uploaded MP3s have a separate audit in `docs/hoor-audio-intake-audit.md`. Their metadata strongly matches the King Fahd Complex Maher Al-Muaiqly Hafs collection, but archive-level verification and exact ayah mapping remain pending. In particular, `10-008C00-A08.mp3` remains unresolved.

No candidate audio file should be referenced by production code until the official archive or a verifiable official download manifest confirms its exact archive member and Qur'anic reference.

## Tests required before enabling the flow

1. Zero-heart transition opens listening rescue on every stage, including special stages.
2. The active stage/wave/score and enemy state are restored unchanged after a successful rescue.
3. No heart is awarded before natural playback completion.
4. Natural completion awards one heart exactly once, even if duplicate `ended` events occur.
5. Pause/resume, app backgrounding, route changes, reloads, media errors, and stale events never award a heart.
6. A selected item's completion cannot award a heart after another item has been selected.
7. Audio-disabled and unsupported-device cases provide the accessible free fallback.
8. Age-profile selection changes only the approved content pool/length, not the punishment or retry difficulty.
9. The flow works on web and Android WebView, including offline behavior for bundled assets.
10. No ad, payment, subscription, tracking SDK, or music dependency is introduced.

## Status

- Runtime insertion point identified: complete.
- Existing quiz rescue path mapped: complete.
- Audio integration code: not started.
- Exact audio-to-ayah mapping: pending.
- Production behavior changed: no.
- Save format changed: no.
- Merge/deployment: none.
