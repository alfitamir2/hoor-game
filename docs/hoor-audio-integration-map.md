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

The initial integration point is the failure overlay's primary action in `showStageResult(false)`; `loseLife()` and the question engine remain intact.

The primary action now opens a dedicated listening-rescue modal. That flow:

- preserve the current stage, wave, score, enemies/boss state, and player position by pausing the existing runtime rather than restarting the stage;
- select a complete Qur'an ayah from `public/rescue-audio-catalog.json` for the existing age profile and duration limit;
- require an intentional child tap to begin playback (no autoplay);
- provide play/pause, restart, read-only progress, and a separate volume control;
- award exactly one heart only after the active audio session emits a natural `ended` event while the player still has zero hearts and rescue is pending;
- invalidate stale sessions and pause the audio when the app is backgrounded;
- resume the same stage and wave with brief invulnerability;
- keep the existing question rescue as a free fallback if catalogue loading or audio playback fails, and offer it as a manual alternative;
- use the exact encouragement phrase `ممتاز حور وأصدقاؤها!` after a successful listening rescue;
- keep musical victory/cheer/wrong/power-up cues silent; no music or loops are introduced;
- never require payment, ads, or an external rewarded-ad SDK.

The audio flow should be isolated from the existing quiz state (`quizOpen`, `currentQuizObj`) so rescue media events cannot accidentally complete a quiz or vice versa.

## Existing audio integration constraints

- The standalone HTML already has a hidden `#quranAudioPlayer` element.
- Its current CSP allows local media (`media-src 'self'`) and one existing MP3Quran host. A bundled local audio directory can use the existing `'self'` allowance; any new remote host would need a deliberate CSP review.
- The current player is also used by the Quran mini-player. The rescue flow must not overwrite or interrupt an unrelated active recitation without explicitly pausing and restoring it.
- `src/game/data/quranVerses.ts` currently declares Alafasy and Husary reciters and EveryAyah/Quran.com fallback URLs. It does not describe the newly uploaded Maher Al-Muaiqly candidate files. Do not silently mix these sources or infer rights for the older URLs from the King Fahd Complex permission statement.
- The successful listening-rescue path speaks the exact required phrase `ممتاز حور وأصدقاؤها!` once after the one-heart reward.
- Preserve the no-music rule. Do not add musical success cues, loops, or background tracks as part of the rescue implementation.

## Candidate audio intake status

The 29 uploaded MP3s have a separate audit in `docs/hoor-audio-intake-audit.md`. The nine selected complete ayah files are now present under `public/audio/rescue/` and are referenced by the starter catalogue. Their metadata strongly matches the King Fahd Complex Maher Al-Muaiqly Hafs collection. The filename-to-ayah mapping is an owner-approved provisional mapping from the supplied partial collection, not an independently archive-verified manifest. The anomalous `10-008C00-A08.mp3` remains excluded. The selected files are not altered or re-encoded.

The current implementation is Qur'an-only. Hadith audio is not enabled until a separately approved, rights-cleared recording and exact source/grading metadata are supplied.

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
- Nine selected local MP3 files present in the working branch: complete.
- Qur'an listening-rescue runtime and age-profile filtering: implemented on the working branch.
- Quiz rescue fallback: preserved.
- Same-stage resume and one-heart natural-completion reward: implemented; browser/device testing still required.
- Exact audio-to-ayah mapping: owner-approved provisional filename mapping; not independently archive-verified.
- Hadith audio: not enabled.
- No-music cue cleanup: implemented for cheer, wrong, victory, and power-up events; remaining one-shot gameplay sound effects are not background music.
- Save format changed: no.
- Merge/deployment: none.
