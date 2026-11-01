# Educational content source audit — Hoor Game

**Branch:** `codex/hoor-game-full-upgrade`  
**Scope:** Initial citation-relevance audit of the 400-question source bank (`content/questions-source.md`) and generated bank (`public/question-bank.js`).  
**Status:** Findings below are evidence-based flags from source-to-question matching, not a full independent fact-check of all 400 answers. No Qur'anic wording or religious answer was silently changed.

## Executive summary

The bank compiler verifies that each question has four distinct options, an answer matching one option, at least one defined reference, and a unique question text within its age group. Those structural checks do **not** verify that a cited page supports the claim. This audit found repeated use of broad landing pages and several clear source-to-question mismatches.

## High-priority citation mismatches

### 1. Bank 1, questions 81–95 — prophet narratives

These questions cover specific events and relationships (Noah's ark, Jonah and the whale, Abraham in the fire, Moses and Pharaoh, Joseph's dream, Adam as first human, Moses speaking with God, Abraham and Ishmael building the Kaaba, and prophets sent to particular peoples). They all cite reference [7], `https://quran.com/an-nisa/163-164`.

That passage names a number of prophets and describes revelation, but it is not a direct citation for most of those individual narratives or details. The citation is therefore insufficient for the questions as written. Some questions need a verse or reliable tafsir/hadith source specific to the event; others may need wording narrowed to exactly what the cited verse says. Religious content should be checked by a qualified reviewer before edits.

### 2. Bank 2, questions 1–17 — arithmetic

The first 17 questions are arithmetic, averages, perimeter, and elementary number concepts, but they all cite reference [7], the Cambridge Essential British English dictionary landing page. This is not an appropriate mathematical source. Replace with a relevant mathematics curriculum/textbook or a suitable topic-level mathematics reference.

### 3. Bank 2, questions 86–100 — English vocabulary and grammar

Several vocabulary questions cite the Cambridge Essential British English dictionary homepage [7], while grammar questions cite a British Council present-simple page [6]. The references are generally in the right subject area but too broad for many individual definitions and grammar rules. Prefer direct dictionary entries and the specific grammar explanation relevant to each question.

### 4. Bank 3, question 75 — balance-scale puzzle

The eight-ball puzzle cites the Math StackExchange questions index [39] (`https://math.stackexchange.com/questions/`), not a specific explanation of the puzzle or a primary mathematical source. The answer should be independently checked and the reference replaced with a directly relevant explanation. This is a source-quality issue; the index page itself does not validate the stated minimum.

### 5. Bank 4, questions 45–46 — fire response and first aid

Both questions cite reference [11], the Consumer Financial Protection Bureau consumer-tools page. That source is unrelated to fire evacuation or first-aid principles. Replace with relevant official fire-safety and first-aid guidance (for example, local civil-defence / emergency-service guidance and a recognized first-aid authority). Review the wording for local emergency-number accuracy before release.

### 6. Bank 4, questions 98–100 — screen time and parenting

- Question 98 asks about managing screen-time disagreements but cites WHO adolescent-health overview and UNESCO media-literacy overview. These are broad contextual sources, not direct evidence for the recommended family screen-time agreement.
- Question 99 asks about parental self-care but cites early-childhood-development and adolescent-mental-health pages. Those are not direct sources for parental self-care.
- Question 100 is a broad synthesis and cites several general home/overview pages. A synthesis should cite the specific evidence used for each component or be labeled clearly as a general educational summary.

## Broader patterns to address

- **Reference reuse:** one source is often reused across many questions that span different facts. A citation's subject area is not enough; it must support the actual answer.
- **Landing pages:** homepages and topic indexes (rather than direct article or section links) reduce traceability.
- **Historical and religious content:** questions about dates, biography, hadith, and Qur'anic narratives need direct, reputable references and careful distinctions between Qur'anic text, tafsir, hadith, and later historical reports.
- **Question wording:** absolute or simplified claims should be checked for exceptions and ambiguity (for example, animal behavior, geography superlatives, and broad historical claims).
- **Age suitability:** age-band labels alone do not establish developmental appropriateness. Reading load, abstract vocabulary, cultural context, and distractor plausibility need a separate educator review.

## Recommended remediation order

1. Fix the clear mismatches above, prioritizing fire/first-aid and religious citations.
2. Add question-level source links, not only broad source lists; where a claim is a synthesis, cite each supporting claim.
3. Run a question-by-question answer verification pass, recording **verified**, **needs revision**, or **human review required**. Do not mark a whole bank verified based on structural tests.
4. Add automated checks for dead links, generic landing pages, duplicate/near-duplicate wording, answer-option consistency, and source coverage. Treat these as screening checks, not proof of factual correctness.
5. Have an Arabic-language educator review age appropriateness and wording, and a qualified religious reviewer check all Qur'an, hadith, seerah, and fiqh items.

## What this audit does not claim

- It does not claim all 400 answers have been fact-checked.
- It does not claim every source URL is broken.
- It does not change any religious text, ruling, or answer.
- It does not replace educator, subject-matter, or religious review.

The existing compiler's structural checks remain useful, but a passing build must not be presented as evidence that all educational claims are factually verified.
