# Hoor 2.0 — Zero-Heart Listening Rescue Design

**Status:** Stage 1 design specification — proposed, not implemented  
**Branch:** codex/hoor-2-stage-0-audit  
**Runtime:** public/Hoor-Plays-Learns-Android.html (wrapped by React; cloud-save coordination remains in src/game/CloudGate.tsx)  
**Purpose:** Define a safe, respectful, testable rescue experience before code changes begin.

## 1. Product decision

When the player's hearts reach zero, the arcade pauses and offers a listening rescue using either:
1. A verified Qur'an ayah recitation, or
2. A verified Prophetic hadith audio narration.

Completing the selected recording restores one heart and resumes the same stage. The player is not required to memorize, recite, answer a religious quiz, or prove religious knowledge. Listening is an encouraging learning opportunity, never a punishment or a judgement of the child.

The rescue flow applies to every campaign stage, all four existing age profiles, and special stages. It must not reset the stage, wave, score, collected rewards, or saved progress.

## 2. Experience flow

1. **Heart depletion:** The final heart is lost. Combat stops immediately; no further collision or damage processing is allowed.
2. **Snapshot:** Capture the current stage ID, wave, score, player state needed to resume, and a unique rescue-session ID. Persist the pending rescue state through the existing save mechanism.
3. **Rescue screen:** Show Hoor and friends with calm visual feedback and the message: “لا بأس، يمكنك المحاولة من جديد”.
4. **Choose content:** Offer a clearly labelled Qur'an recitation or hadith audio item. Do not autoplay; the child or parent starts playback deliberately.
5. **Listen:** Provide play/pause, replay, volume, elapsed/remaining progress, and a clear indication of which content is playing. Do not provide a seek-to-end shortcut.
6. **Completion:** Only a successful media ended event for the currently selected and successfully loaded item can complete the listening step. Ignore stale events from previous items. Do not claim this proves attention; it only confirms playback reached its end.
7. **Rescue reward:** In one idempotent state transition, restore exactly one heart (or the configured safe rescue amount, default one), clear the pending session, grant brief spawn protection, and persist.
8. **Resume:** Return to the same stage and wave. Show and speak the encouragement: “ممتاز حور وأصدقاؤها!” Then resume only after an explicit Continue action or a clearly accessible user gesture.
9. **Playback failure:** Keep the rescue screen stable. Offer retry and another approved item. If audio is unavailable, blocked, or inaccessible, expose the documented fallback; never trap the player or erase progress.

## 3. State machine

Allowed states:

- playing
- rescue_pending
- content_selected
- audio_loading
- audio_playing
- audio_paused
- audio_completed
- rescue_granted
- rescue_fallback
- stage_retry

Allowed transitions:

| From | Event | To | Required behavior |
|---|---|---|---|
| playing | hearts become zero | rescue_pending | Pause loop; snapshot and persist |
| rescue_pending | player selects approved item | content_selected | Validate item and age eligibility |
| content_selected | player presses Play | audio_loading | Start only after explicit gesture |
| audio_loading | media can play | audio_playing | Bind handlers to session and item IDs |
| audio_loading | load/play error | rescue_fallback | Show retry and fallback |
| audio_playing | pause | audio_paused | Preserve current time |
| audio_paused | resume | audio_playing | Continue same media |
| audio_playing | valid ended event | audio_completed | Reject stale/duplicate events |
| audio_completed | completion transaction succeeds | rescue_granted | Restore one heart exactly once |
| rescue_granted | player chooses Continue | playing | Resume same stage and wave |
| any rescue state | unrecoverable session/state | stage_retry | Preserve progress and offer safe retry |

Any unexpected or stale event must be ignored. A second click, duplicate ended event, repeated callback, reload, or cloud-sync retry must never award multiple hearts for the same rescue session.

## 4. Content catalogue schema

Keep religious content in a separate, reviewable catalogue; do not embed unverified text or URLs inside gameplay logic. Each item must carry:

| Field | Meaning |
|---|---|
| id | Stable unique ID |
| kind | quran_ayah or hadith |
| arabic_text | Verified Arabic text; exact source wording |
| display_title | Respectful short label |
| source_name | Qur'an surah/ayah reference or hadith collection/reference |
| authenticity_grade | Required for hadith, with named grading source |
| reciter_or_narrator | Verified performer/reciter identity |
| audio_url | Approved audio location |
| audio_duration_seconds | Verified duration for display and sanity checks |
| age_profiles | Explicit allowed profiles |
| difficulty_band | Simple, standard, extended; presentation only, not religious worth |
| language | Audio and text language |
| review_status | Must be approved to ship |
| reviewed_by | Qualified reviewer role/name as approved for publication |
| reviewed_at | Review date |
| source_url | Primary/authoritative reference |
| audio_license | Rights and permitted use |
| offline_allowed | Whether approved caching is permitted |
| checksum | Integrity check for hosted/cached media |

Do not include a hadith in production unless wording, source, authenticity grading, attribution, age suitability, and audio rights have all been checked. Qur'an text and ayah metadata must also be checked against an authoritative mushaf source. Automated validation cannot replace qualified human review.

## 5. Selection and age adaptation

Use existing profile IDs unchanged:
- under_8
- 8_to_15
- 16_plus
- parents

Selection rules:
1. Filter to review_status=approved, valid audio, permitted age profile, and rights-cleared content.
2. Prefer the player's current language and accessibility settings.
3. Adapt duration and presentation to age profile and game progression; do not describe longer or shorter content as more virtuous.
4. For early stages and under-8 players, prefer short, clear, age-reviewed recordings.
5. For 8–15, allow a broader selection and moderate duration.
6. For 16+, allow the full approved age-appropriate catalogue, including longer recordings.
7. Parent mode can preview content and configure categories, duration preferences, and audio behavior.
8. Rotate items to avoid immediate repetition where enough approved content exists.
9. Never raise difficulty because the player lost hearts. Never select content as a penalty.
10. If the filtered catalogue is empty, enter the fallback path instead of showing broken or unreviewed material.

No exact duration limits are fixed in this specification. They should be set after the catalogue is reviewed and tested with families and educators.

## 6. Audio and platform behavior

- Use actual approved recordings. Browser text-to-speech must never stand in for Qur'an recitation or hadith narration.
- Do not autoplay. Browser and mobile operating systems may block autoplay; playback starts from a deliberate Play tap.
- Handle play() rejection, media errors, missing files, slow connections, and interrupted playback.
- Prevent seek-to-end completion. A valid completion requires playback to reach the media end naturally; seeking controls are not exposed in the rescue player.
- If the app becomes hidden or the device locks, preserve playback state and re-check media state when returning. Do not grant a rescue based on elapsed wall-clock time.
- Pause and cancel the previous media before switching items. Bind callbacks to both rescue-session ID and content ID.
- Stop audio on leaving the rescue screen, changing items, or destroying the game view.
- Keep recitation/hadith audio, spoken encouragement, and sound effects in separate controls.
- No background music, soundtrack, melodic loops, musical stingers, or music-based victory themes anywhere in the game. Use voice, approved recitation, and non-musical effects only.
- Provide captions/transcript text for accessibility, but displaying the text alone does not count as completed listening.
- If a user cannot or does not wish to use audio, provide a clearly labelled accessible alternative rescue path (for example, a parent-enabled no-audio rescue). Do not force sound or leave the child stuck.

## 7. Save compatibility and recovery

- Do not rename or replace existing save keys.
- Add rescue fields as optional, versioned fields with safe defaults.
- Suggested pending-rescue fields: rescueSessionId, rescueStatus, stageId, wave, selectedContentId, audioPositionSeconds, createdAt.
- Do not store raw audio data or large media blobs in the game save.
- A pending rescue restored after reload must not automatically grant a heart. Reopen the rescue screen and let the player resume or restart the approved recording.
- Save a completed rescue transaction atomically in the game state before returning to combat.
- Keep the current cloud-save ownership, conflict-resolution, guest migration, and account-switch protections unchanged.
- If cloud sync fails, local progress and rescue must remain usable; sync can retry later.
- Do not include sensitive listening analytics or child profiling. Persist only the minimum state required to resume the game.

## 8. Encouragement and Islamic visual identity

Use the exact phrase **«ممتاز حور وأصدقاؤها!»** at meaningful positive moments:
- after a completed listening rescue,
- after a correct educational answer,
- after a stage or boss victory,
- after a meaningful achievement.

Use a cooldown and context-aware variation in animation so the phrase remains warm rather than noisy. The exact requested phrase should remain available and recognizable. Do not use music to amplify the moment. Use respectful, child-friendly Islamic visual motifs and avoid treating sacred text as a decoration, collectible, weapon, or score multiplier.

## 9. Accessibility and family controls

- Large, clear Arabic RTL controls and readable text.
- Keyboard and touch operation; visible focus and screen-reader labels.
- Play/pause/replay and independent volume controls.
- Do not require headphones.
- Parent controls for content categories, audio level, and no-audio alternative.
- No external sign-in, ads, marketing, or analytics gate before rescue.
- No shame, blame, countdown pressure, or loss of earned progress.

## 10. Test plan and acceptance criteria

### Unit/state tests
- Heart depletion pauses gameplay once and creates one pending session.
- All 26 stages and all four existing profiles can enter the rescue flow.
- Only approved and age-eligible content is selectable.
- A successful natural ended event restores exactly one heart.
- Wrong item ID, stale session ID, duplicate event, early event, media error, or seek attempt does not grant rescue.
- Repeated taps and repeated save/sync operations do not duplicate the reward.
- Failed playback offers retry and fallback without losing stage state.
- Re-entering after reload preserves the pending rescue and never auto-awards.
- After rescue, stage ID, wave, score, and relevant player state are preserved.
- Existing save snapshots and old saves load unchanged.
- No music asset or music playback is introduced.
- The exact encouragement phrase is emitted at the defined moments without excessive repetition.

### Manual device tests
- Desktop Chrome and Firefox.
- Android Chrome on a representative lower-end device.
- Installed PWA / Android wrapper where applicable.
- Online, slow network, offline, media URL unavailable, audio permission/volume muted, app backgrounded, screen locked, and page reload.
- Arabic RTL, keyboard-only, touch, and screen-reader checks.

### Release gate
Do not ship until:
- Qur'an and hadith entries pass qualified content review.
- Every audio file has documented usage rights.
- Automated tests, lint, build, and release checks pass.
- Manual mobile and desktop tests pass.
- No regressions to saves, the 26-stage campaign, question pools, or Android behavior.
- A human reviewer approves the religious content and child-facing UX.

## 11. Deliberately out of scope for this step

- No production code changes.
- No new Qur'an or hadith audio URLs selected yet.
- No invented hadith text, grading, or attribution.
- No redesign of the whole game.
- No changes to question bank, age IDs, save keys, or stage progression.
- No merge to main, no deployment, and no release.

## 12. Decisions required before implementation

1. Approve a qualified religious-content reviewer and the exact review workflow.
2. Select licensed/authorized recitation and hadith audio sources, including offline caching rights.
3. Decide the default no-audio fallback behavior with parent controls.
4. Confirm whether rescue listening can be repeated without a per-stage cap; default design is one heart per completed rescue session, with duplicate prevention per session.
5. Confirm preferred default audio volume and whether parent mode may set a maximum.

**Next step:** Review this specification and close the content-source and fallback decisions. Then implement a minimal vertical slice in the standalone arcade only, with tests, before applying it across all 26 stages.
