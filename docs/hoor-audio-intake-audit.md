# Hoor rescue audio intake audit — 1 November 2026

## Scope

This note records the technical intake of 29 user-supplied MP3 files intended as candidate Qur'an recitations for Hoor's zero-heart listening rescue. It does not authorize production integration.

## Current findings

- 29 distinct MP3 files were inspected.
- All 29 decode as MP3 and report 56 kbps, 22,050 Hz.
- Combined duration: 778.57 seconds (12 minutes, 58.57 seconds).
- No duplicate SHA-256 hashes were found among the 29 supplied files.
- All 29 files contain ID3 artist metadata: `Shekh Dr. Maher Al-Muaiqly`.
- All 29 contain album metadata: `Hafs Recitation`.
- All 29 contain a comment naming `http://audio.qurancomplex.gov.sa` and stating that the recitation recording is free and available on the Complex's site.
- Metadata also contains a recording-year note of 1430 AH; the tag date field is 2019-31-03. These are preserved as source metadata, not interpreted as a verified recording session date.

The metadata is strong provenance evidence consistent with the official King Fahd Complex Maher Al-Muaiqly Hafs collection. Metadata alone is not cryptographic proof that the supplied files are byte-for-byte the official downloads.

## Filename observations — provisional only

Twenty-eight files use the pattern `10-008NNN-A08.mp3`; one file is named `10-008C00-A08.mp3`.

The numeric identifiers present are:
- 001–002
- 007–018
- 059–067
- 071–075

Within the apparent contiguous ranges, identifiers 003–006 and 068–070 are absent. The apparent surah/ayah interpretation of these filename segments has not yet been independently confirmed against the official archive manifest or by listening and matching each recording. The `C00` identifier is unresolved and must not be mapped by guesswork.

## Official source and usage

The King Fahd Complex official reciter page identifies Sheikh Maher Al-Muaiqly — Hafs and publishes archive fingerprints:
- Individual-ayah archive SHA-256: `3EDCC70407F9D19C972C002C69A43CC245A62A0FCC497D3C719406A69965E18E`
- Complete-surah archive SHA-256: `1F99418CD52D2E84BD144D80F62A8FDDD45BFC633C352FD06A603C7CFBE7B5CC`

The Complex's official usage page states that the listed digital recitations are made available free for general use in computer applications, websites and broadcast channels, inside and outside Saudi Arabia.

The published archive fingerprints are for the complete archives. They cannot be compared directly with hashes of individual extracted MP3 files. The archive itself has not yet been obtained and verified in this intake step.

## Required before production integration

1. Obtain the official individual-ayah archive or a verifiable official download manifest.
2. Verify the archive SHA-256 against the Complex's published fingerprint.
3. Match each supplied file to its exact official archive member and Qur'anic reference; resolve `C00`.
4. Confirm the exact recitation and ayah boundaries; do not trim, splice, time-stretch, pitch-shift, or synthesize recitation.
5. Keep original filenames and immutable source hashes in the asset manifest.
6. Add only the minimum complete ayahs selected for the rescue experience, with explicit content records and source attribution.
7. Test audio playback, interruption, completion-only reward, duplicate event handling, and accessible no-audio fallback.

## Project status

- Intake metadata audit: complete.
- Provenance confidence: strong metadata match; archive-level verification pending.
- Exact ayah mapping: pending.
- `C00` mapping: pending.
- Production code changes: none.
- Audio committed to repository: none.
- Save data changed: no.
- Merge or deployment: none.

Owner authorization to proceed without an external reviewer does not convert technical checks into independent religious review. Any owner-approved content must remain honestly labelled as such; exact text, source mapping, and recording rights still require verification.
