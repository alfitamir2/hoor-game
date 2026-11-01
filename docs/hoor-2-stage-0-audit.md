# Hoor 2.0 — Stage 0 Baseline Audit

**Status:** Baseline inspection recorded; no gameplay or production code changed.  
**Base:** `main` at `42fb74c94b563ec5e0ae4bc03044888a3d699505`  
**Working branch:** `codex/hoor-2-stage-0-audit`

## 1. Safety rules

- Do not rewrite published Git history, force-push, or rebase/amend/squash commits already pushed. This repository syncs with Lovable.
- Do not merge or publish from this work branch without explicit approval.
- Preserve the standalone arcade, its save key, cloud-save behavior, all existing profiles, stage IDs, question bank, and Android/PWA compatibility.
- Make one small, reviewable change at a time. Run tests and build checks after each change.
- No background music, soundtrack, musical loops, or musical victory themes anywhere in the product. Use speech, Qur'an recitation, and non-musical sound effects only.

## 2. Current architecture observed

- The published arcade is the standalone RTL document: `public/Hoor-Plays-Learns-Android.html`.
- Its age, question rotation, reward, stage progression, and current rescue rules are in `public/arcade-rules.js`.
- The offline question bank is generated from `content/questions-source.md` by `scripts/update-question-bank.mjs` into `public/question-bank.js`.
- The standalone arcade currently contains 26 stages and four age profiles: `under_8`, `8_to_15`, `16_plus`, and `parents`.
- There is also a React game area under `src/game/`. Avoid assuming it is the active arcade entry point; confirm routing and product usage before changing either implementation.
- Quran transition verses and reciter URL helpers exist in `src/game/data/quranVerses.ts`; these are not yet a complete rescue-content catalogue.
- CI runs tests, targeted lint, production build, and release configuration verification.

## 3. Verified baseline findings

1. The latest `main` commit fixes a blank-page issue. The latest main CI run completed successfully.
2. The standalone arcade uses three hearts and pauses the game when hearts reach zero.
3. Current rescue is quiz-based: the player is offered a knowledge question and must answer correctly to regain one heart.
4. Qur'an audio is available elsewhere as a separate player; it is not currently the zero-heart rescue flow.
5. Existing speech feedback uses browser speech synthesis. Existing short sound effects use a separate sound-effects path.
6. The current question bank contains 400 entries (100 per age profile), with structural validation for options, answers, references, and duplicate question text.
7. Existing automated tests cover age pools, question rotation, stage scaling, rescue-answer rules, rewards, stage unlocking, question correctness, and inline-script parsing.
8. `content/quality-audit.md` explicitly says the 400-question bank has not received a complete independent fact-check. It records citation mismatches that require subject-matter review.
9. The current stage sequence keeps stages 21 and 22 available as special stages while the normal campaign sequence proceeds from 20 to 23–26. Preserve this behavior unless a separate design decision is approved.

## 4. Product requirement to implement later

### Zero-heart listening rescue

When hearts reach zero:
- Pause combat and preserve the current stage, wave, score, and saved progress.
- Present a dedicated, accessible rescue screen with a calm, respectful visual treatment.
- Offer an authenticated, reviewed Qur'an ayah recitation or a verified Prophetic hadith audio recording.
- The player is rescued by completing the listening experience; do not require memorization or a religious quiz as a condition of rescue.
- Include replay, pause/resume, clear progress, volume controls, and an accessible no-audio fallback.
- Prevent duplicate rewards, repeated event firing, audio race conditions, and accidental loss of stage state.
- Return the player to the same stage state with the configured rescue heart(s).

### Age and difficulty adaptation

Use the existing profile taxonomy unless product research demonstrates a safe migration:
- `under_8`: short, age-appropriate recitations and simple interface language.
- `8_to_15`: broader selection and moderate listening duration.
- `16_plus`: broader selection and longer content where appropriate.
- `parents`: family-appropriate selection and parent controls.

Age alone is not sufficient: adapt selection and presentation to progression and accessibility settings. Do not increase the religious difficulty as a punishment for losing hearts.

### Religious-content governance

- Qur'an text, surah/ayah metadata, recitation files, hadith wording, grading, and attribution must be verified against reputable sources.
- Hadith entries require explicit source and authenticity/grading metadata and qualified review before release.
- Never synthesize, paraphrase, or use browser text-to-speech as a substitute for Qur'an recitation or hadith narration.
- Do not present uncertain or disputed material as authenticated.
- Maintain a human-review status and provenance for every item.
- Do not make listening conditional on accepting marketing, analytics, sign-in, or an external account.

### Encouragement and sound identity

- Use the requested encouragement phrase consistently in appropriate moments: **«ممتاز حور وأصدقاؤها!»**
- Avoid excessive repetition: use it for rescue completion, correct learning moments, stage completion, and meaningful achievements, with sensible cooldowns.
- No music under any circumstances. Keep speech, verified recitation, and non-musical effects separate so the player can control them independently.

## 5. Risks and safeguards

| Risk | Required safeguard |
|---|---|
| Audio unavailable or network lost | Cache approved audio where licensing permits; otherwise offer retry and a non-audio fallback without trapping the player |
| Audio is interrupted or not completed | Track playback state carefully; do not grant rescue on a failed/partial load |
| Player closes or reloads the app | Persist rescue state safely and restore the same stage |
| Incorrect Qur'an/hadith attribution | Reviewed catalogue, source metadata, human approval, and automated metadata checks |
| Age-inappropriate content | Explicit age suitability metadata and review |
| Repeated rescue farming | Idempotent rescue transaction and defined limits, without punitive religious framing |
| Existing save incompatibility | Versioned, backward-compatible save changes and migration tests |
| Two game implementations diverge | Identify the canonical runtime before changing either implementation |

## 6. Stage 0 exit checklist

- [x] Confirm repository default branch and latest main commit.
- [x] Confirm no open pull requests at the time of inspection.
- [x] Identify the standalone arcade and rule engine.
- [x] Identify current age profiles, question bank, save-sensitive flow, and rescue behavior.
- [x] Inspect CI configuration and latest main CI result.
- [x] Record educational-source audit limitations.
- [ ] Run a full local desktop and mobile walkthrough against the current published build.
- [ ] Confirm which of the React game and standalone arcade is canonical for all product surfaces.
- [ ] Establish an explicit reviewed source catalogue and licensing/hosting plan for rescue audio.
- [ ] Obtain a qualified religious-content review process for Qur'an and hadith entries.

## 7. Next step — Stage 1

Do not implement the rescue feature yet. First produce a small design specification covering the rescue state machine, approved content schema, audio lifecycle, age/progression selection, offline fallback, accessibility, and test cases. Only after that specification is reviewed should implementation begin.
