# Hoor 2.0 — Listening Rescue: Source and Rights Review

**Status:** research note / candidate-source assessment only  
**Date:** 2026-11-01  
**Branch:** `codex/hoor-2-stage-0-audit`  
**Scope:** Qur'an recitation and Prophetic hadith audio for the zero-heart listening rescue  
**Important:** This document is not legal advice, a religious approval, or confirmation that any asset has been integrated. No game code or audio files are changed by this note.

## Executive recommendation

1. **Qur'an recitation — selected provisional first reciter: Maher Al-Muaiqly, Hafs, from the King Fahd Glorious Qur'an Printing Complex.** Its official audio pages explicitly state that, with approval of the Minister of Islamic Affairs, the listed digital recitation recordings are made available free for general use in computer applications, websites, broadcast websites/channels, and government and private-sector work, inside and outside Saudi Arabia. The pages include recitations in Hafs and other named riwayat, and provide both complete-surah and ayah-by-ayah downloads for at least some reciters. This is the clearest directly published permission found in this review.
2. **Hadith audio — preferred route: commission a human narrator and create original recordings.** Select hadith wording from a vetted primary collection; have the exact Arabic text, attribution, source reference, and grading reviewed by a qualified hadith specialist; then obtain a signed recording/performer agreement covering app playback, streaming, bundling/offline use if needed, territories, duration, attribution, and commercial/advertising status. Do not take an arbitrary hadith clip from YouTube, a lecture, podcast, or another app.
3. **Dorar Al-Sunniyah API — possible research/verification route, not yet approved for static game content.** Its API requires an access request and manual review. Its terms require visible attribution to Dorar, a clickable source URL, showing the hadith together with its grading, no alteration or invented grading, no bulk scraping/republication, and cache duration limited to 24–48 hours. These constraints need to be reconciled with the game's offline/static content architecture before adopting the API.
4. **Do not use EveryAyah as a rights-cleared fallback** unless written permission is obtained for the exact reciter/recording and intended use. Public availability is not proof of a reuse licence.

## Qur'an recitation candidates

### A. King Fahd Complex — preferred candidate

Official usage-rights page:  
https://qurancomplex.gov.sa/quran-audios/

The page states (Arabic) that, based on approval of the Minister of Islamic Affairs, the Complex makes digital copies of the listed recitations available for free general use in computer applications, websites, broadcast websites/channels, and work by government entities and private institutions, within and outside the Kingdom.

The catalogue lists named reciters and riwayat, including:
- Ali Al-Hudhaify — Hafs
- Maher Al-Muaiqly — Hafs
- Muhammad Ayyub — Hafs
- Khalid Al-Muhanna — Hafs
- Ibrahim Al-Akhdar — Hafs
- Ali Al-Hudhaify — Shu'bah
- Ali Al-Hudhaify — Qalun
- Other listed riwayat and reciters

Example official page with complete-surah and ayah-by-ayah download options:
https://qurancomplex.gov.sa/quran-audio-hafs-huthify/

The official page exposes downloads for both:
- complete surahs; and
- the full Mushaf split into individual ayahs.

This makes the source a strong technical and rights candidate for short rescue recitations. Before integration, verify the exact download archive, individual file naming/ordering, ayah mapping, file integrity, and whether the published permission covers the exact intended playback, caching, and offline distribution method. Preserve the original audio; do not pitch-shift, remix, or splice recordings. Keep reciter, riwayah, source page, file hash, and rights evidence in the catalogue.

### B. Quran Foundation / Quran.com — technically useful, rights review required

Audio API documentation:
https://api-docs.quran.com/docs/sdk/javascript/audio/

Developer Terms:
https://api-docs.quran.com/legal/developer-terms/

The API supports verse recitation audio and timing metadata. Its documentation says the Developer Terms govern storage, offline playback, redistribution, and commercial use. The terms permit charging for an app and advertising in certain circumstances, but separately distributing, sublicensing, or selling QF content/raw data requires a signed commercial licence. The documentation also requires attribution for connected-app use.

Quran.com has separately stated that it does not own the recitation recordings and cannot grant permission on behalf of the reciters or recording rights-holders:
https://feedback.quran.com/reciters-request/p/permission-request-using-quran-recitation-audio-in-monetized-youtube-content

**Decision:** keep as a technical alternative only. Do not infer that an API key or public playback URL grants a blanket right to bundle recordings into Hoor.

### C. AlQuran.cloud / Islamic Network — conditional alternative

Terms:
https://alquran.cloud/terms-and-conditions

The current terms say recitations are licensed to the service by reciters or estates for free, non-commercial redistribution at published bitrates; streaming, embedding, and downloading are permitted for personal and educational use; recitations may be bundled into a commercial product, but rights remain with the reciters and they may request removal.

This is promising, but Hoor should obtain written confirmation for its exact product model (including any ads, donations, subscriptions, offline assets, or commercial distribution), chosen reciter, and caching/hosting approach before using it. Maintain a takedown/removal mechanism.

### D. EveryAyah — not cleared by this review

Available research indicates that EveryAyah does not publish a comprehensive site-wide recording licence, and that at least some recording metadata reports the licence as unknown. Do not use a recording simply because it can be streamed or downloaded. Obtain permission from the relevant reciter/estate or publisher first.

## Hadith text, grading, and audio

### A. Dorar Al-Sunniyah Hadith Encyclopedia

API overview:
https://dorar.net/api-services/hadith

API terms:
https://dorar.net/index.php/api-services/terms

The service returns hadith text, narrator, hadith scholar, source, grading summary, and reference links. Access requires an application describing the applicant, purpose, beneficiary, and a reviewable version of the product.

The published API terms require:
- clear attribution to “الدرر السنية” for each returned text;
- keeping the returned reference URL visible and clickable;
- not changing, shortening, or inventing the grading;
- displaying the hadith with its accompanying grading;
- use only within the specifically approved product;
- no scraping, bulk downloading, full-database storage, republication, or sublicensing;
- caching only for 24–48 hours and refreshing regularly.

**Decision:** apply for access only if Hoor can comply with these requirements. Do not scrape Dorar or copy its database into the game. If the product needs a small offline catalogue, obtain explicit written permission for that exact arrangement or choose another independently cleared source.

### B. Sunnah.com — useful reference, not a substitute for permissions

About and reproduction notes:
https://sunnah.com/about

Sunnah.com says individual hadith or selections may be reproduced for teaching/didactic/presentation purposes, but scraping and mass reproduction of entire books or collections are not permitted. It also notes that grading information for hadith outside Sahih al-Bukhari and Sahih Muslim is still being developed and that displayed grades may be attributed to particular scholars.

**Decision:** use as a research/reference aid only after checking the exact edition and reference. Do not bulk copy the site or assume that its text, translation, database, or any audio is universally licensed.

### C. Preferred Hoor hadith-audio workflow

1. Build a short candidate list from well-established primary collections, prioritising hadith with clear source references and unambiguous authenticity status.
2. Have a qualified hadith reviewer approve the exact Arabic wording, narrator/companion attribution, collection, book/chapter, hadith number, and grading (including whose grading is being cited where relevant).
3. Keep the original wording. Do not paraphrase a hadith and present the paraphrase as the Prophet's words.
4. Commission a human narrator to record the approved text. The narration must not be generated by browser TTS or AI voice.
5. Obtain written rights from the narrator and recording producer for fixation, reproduction, online streaming, in-app playback, distribution, and offline use if required. Include territory, term, attribution, permitted edits (ideally none beyond technical trimming), commercial status, and takedown/replacement process.
6. Have a second reviewer compare the final recording against the approved text word for word before publishing.

## Saudi rights context

The Saudi Authority for Intellectual Property's published implementing regulations identify reciters as performers and describe performers' and sound-recording producers' rights to authorise public performance, fixation, internet transmission, and reproduction. The regulations also describe unauthorised uses of audio/visual works as potential infringement.

Reference:
https://externalportal-backend-production.saip.gov.sa/sites/default/files/2022-02/IMPLEMENTING-REGULATIONS-Of-Copyright-Law-.pdf

This reinforces the practical rule: obtain and retain permission from the relevant rights-holder/performer/producer, rather than assuming that religious or educational subject matter makes a particular recording free to reuse.

## Content and technical governance required before implementation

Every approved rescue item must carry:
- stable item ID and content kind (`quran_ayah` or `hadith`);
- exact Arabic text and verified diacritics;
- source reference and clickable authoritative source URL;
- reciter/narrator name;
- riwayah for Qur'an, or narrator/companion and grading source for hadith;
- audio URL or bundled asset path;
- rights-holder, licence/permission document reference, permitted use, territory, term, offline permission, attribution wording, and takedown contact;
- file checksum and duration;
- permitted age profiles and content difficulty band;
- reviewer identity/role, approval date, and next review date;
- publication status (`draft`, `review_pending`, `approved`, `withdrawn`).

Only `approved` items with current rights evidence may appear in a rescue session. If an item is withdrawn, unavailable, corrupt, or rights-expired, it must be removed from selection and replaced with another approved item. Do not silently switch to an unreviewed recording.

## Decisions still required

1. Confirm whether the Hoor app/site is, or may become, ad-supported, subscription-based, or otherwise monetised. This affects which audio permissions are safest to rely on.
2. **Provisional choice recorded:** Maher Al-Muaiqly — Hafs. The owner has approved this as the first reciter candidate for the prototype; exact asset validation and implementation clearance remain outstanding.
3. Decide whether Hoor should bundle a small set of approved ayah clips for offline reliability or stream them from the official source. Verify the Complex's permission covers the selected distribution method.
4. Select a qualified hadith reviewer and agree the grading policy.
5. Decide whether to apply for Dorar API access or use a separately permissioned small curated hadith list.
6. Commission and license original human hadith narration if the hadith path is selected.

## Explicit non-decisions

- No audio files have been downloaded, copied, committed, or integrated.
- No Qur'an verse or hadith has been selected as game content.
- No reviewer has approved any content for Hoor yet.
- No audio source is declared production-approved until the exact assets and rights are documented.
- No gameplay code, saves, stage logic, or live deployment has been changed.


## Charity and advertising decision — user confirmed (2026-11-01)

The owner explicitly confirmed that Hoor must be a **fully free, advertisement-free charity game** intended to entertain and educate Muslim children.

Binding product requirements:
- No advertisements, rewarded ads, sponsorship placements, promotional placements, or ad-tracking SDKs.
- No in-app purchases, paid revives, paid stage unlocks, subscriptions, or payment gates.
- The Qur'an/hadith listening rescue and all core educational/gameplay content must remain available without payment or advertising.
- No music of any kind.
- Do not introduce monetisation later without explicit owner approval; the charity and child-first purpose takes priority.

Rights-review consequence:
- Assess every audio licence against this ad-free, non-monetised charitable app model.
- Do not assume that permission for free educational use automatically permits every form of offline bundling, redistribution, hosting, or modification. Verify the exact recording and distribution method before integration.
- This decision supersedes the earlier unresolved advertising-status note above. Hoor is confirmed ad-free.
- No audio has been selected, downloaded, committed, or integrated by recording this decision.


## Provisional first-reciter decision — owner approved (2026-11-01)

The owner has chosen **Sheikh Maher Al-Muaiqly — Hafs** as Hoor's provisional first Qur'an reciter for the listening-rescue prototype.

Official references:
- King Fahd Complex audio-use rights and listed recitations: https://qurancomplex.gov.sa/quran-audios/
- Official catalogue entry for Maher Al-Muaiqly — Hafs, including the listed complete-surah and ayah-archive SHA-256 values: https://qurancomplex.gov.sa/category/quran-audios/
- Reciter-specific page: https://qurancomplex.gov.sa/quran-audio-hafs-muaiqly/

The Complex's current published rights page states that the listed digital recitations are available free for general use in computer applications, websites, broadcast websites/channels, and government/private-sector work inside and outside Saudi Arabia. The catalogue lists Maher Al-Muaiqly in Hafs and provides an ayah-level archive option.

**What this approval means:** use Maher Al-Muaiqly — Hafs as the consistent first-reciter candidate when preparing the prototype content catalogue.

**What it does not mean:** no individual ayah, archive, or audio file has yet been selected, downloaded, checked, or integrated. Before any asset is used, the implementation review must:
1. Obtain the exact official ayah archive and verify its SHA-256 against the Complex's published value.
2. Inspect the archive structure, file naming, ayah ordering, audio format, duration, and playback behaviour.
3. Confirm the chosen ayah mapping and exact Qur'anic text with a qualified Qur'an reviewer.
4. Record the official source URL, reciter, riwayah, asset checksum, and attribution in each catalogue entry.
5. Confirm that the intended technical delivery (streaming and/or local offline bundling) is consistent with the published permission and the exact asset's terms. Do not modify, remix, or splice the recitation.
6. Keep the product fully free and ad-free, with no monetisation or advertising SDKs.

**Current status:** reciter choice approved provisionally; exact assets and content still pending review; no code, audio, save data, or live deployment changed.
