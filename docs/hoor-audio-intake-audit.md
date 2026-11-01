# Hoor rescue audio intake audit — 1 November 2026

## Scope and distinction

The original local metadata inspection covered 29 MP3 files. A later repository inventory found 100 uploaded MP3 files under `public/audio/rescue/`. This document distinguishes the detailed metadata checks performed on the original 29-file sample from the filename inventory of all 100 repository assets. It does not claim that all 100 files have had their ID3 metadata or audio content independently inspected.

## Detailed findings for the original 29-file sample

- 29 distinct MP3 files were inspected.
- All 29 decode as MP3 and report 56 kbps, 22,050 Hz.
- Combined duration: 778.57 seconds (12 minutes, 58.57 seconds).
- No duplicate SHA-256 hashes were found among the 29 supplied files.
- All 29 files contain ID3 artist metadata: `Shekh Dr. Maher Al-Muaiqly`.
- All 29 contain album metadata: `Hafs Recitation`.
- All 29 contain a comment naming `http://audio.qurancomplex.gov.sa` and stating that the recitation recording is free and available on the Complex's site.
- Metadata also contains a recording-year note of 1430 AH; the tag date field is 2019-31-03. These are preserved as source metadata, not interpreted as a verified recording session date.

The metadata is strong provenance evidence consistent with the official King Fahd Complex Maher Al-Muaiqly Hafs collection. Metadata alone is not cryptographic proof that the supplied files are byte-for-byte the official downloads.

## Full repository inventory

The working branch now contains 98 MP3 files under `public/audio/rescue/`:

- 7 numeric files named `10-001001-A08.mp3` through `10-001007-A08.mp3`, provisionally interpreted as Al-Fatihah 1:1–7.
- 75 numeric files named `10-008001-A08.mp3` through `10-008075-A08.mp3`, provisionally interpreted as Al-Anfal 8:1–75.
- 16 numeric files for Maryam, provisionally interpreted as 19:77–81 and 19:88–98.

All 98 remaining numeric files are included in `public/rescue-audio-catalog.json`. The mapping from the filename segments to Surah and ayah is owner-approved and provisional, not independently archive-verified. The two unresolved C00 files have been removed from the working branch and are not part of the playable catalogue. No remaining audio files are altered, trimmed, re-encoded, or renamed.

For the additional files not in the original 29-file local inspection, duration values are estimated from MP3 byte size using the constant 56 kbps encoding observed in the inspected sample. The estimate was calibrated against all 29 measured files and matched their durations within approximately 0.006 seconds. These additional duration values are estimates, not direct per-file media-probe measurements.

## Official source and usage

The King Fahd Complex official reciter page identifies Sheikh Maher Al-Muaiqly — Hafs and publishes archive fingerprints:
- Individual-ayah archive SHA-256: `3EDCC70407F9D19C972C002C69A43CC245A62A0FCC497D3C719406A69965E18E`
- Complete-surah archive SHA-256: `1F99418CD52D2E84BD144D80F62A8FDDD45BFC633C352FD06A603C7CFBE7B5CC`

The Complex's official usage page states that the listed digital recitations are made available free for general use in computer applications, websites and broadcast channels, inside and outside Saudi Arabia.

The published archive fingerprints are for the complete archives. They cannot be compared directly with hashes of individual extracted MP3 files. The archive itself has not yet been obtained and verified in this intake step.

## Remaining checks

1. Obtain the official individual-ayah archive or a verifiable official download manifest.
2. Verify the archive SHA-256 against the Complex's published fingerprint.
3. Match the remaining supplied files to exact official archive members and Qur'anic references.
4. Confirm exact recitation and ayah boundaries; do not trim, splice, time-stretch, pitch-shift, or synthesize recitation.
5. Keep original filenames and immutable source hashes in the asset manifest.
6. Directly inspect metadata and media duration for the additional 71 files not included in the original local sample.
7. Test audio playback, interruption, completion-only reward, duplicate event handling, and accessible no-audio fallback on web and Android WebView.

## Project status

- Detailed metadata inspection of original 29-file sample: complete.
- Repository inventory of 98 retained MP3 files: complete.
- 98 numeric filename-mapped files included in the working-branch catalogue: complete, provisional mapping.
- Two unresolved C00 files: removed from the working branch and catalogue.
- Archive-level fingerprint verification: pending.
- Independent ayah-to-audio verification: pending.
- Runtime integration: implemented on the working branch; browser/device testing pending.
- Save data changed: no.
- Merge or deployment: none.

Owner authorization to proceed without an external reviewer does not convert technical checks into independent religious review. Any owner-approved content must remain honestly labelled as such; exact text, source mapping, and recording rights still require verification.
