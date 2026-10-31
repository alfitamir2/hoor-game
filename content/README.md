# Updating the question bank

1. Edit `questions-source.md`, keeping four age banks, four distinct choices per question, one matching correct answer, and section-local references.
2. Run `node scripts/update-question-bank.mjs`. It rejects missing answers, references, duplicate texts within an age group, and unexpected bank sizes. Maintain stable question numbers for unchanged questions.
3. Review facts and age suitability. Structural validation is not independent fact checking. Corrections to ambiguous wording live in the compiler and should remain until the source is corrected.
4. Run `bunx vitest run src/game/tests/arcadeRules.test.ts` and play new questions before publishing. Publish to distribute updates; the installed game refreshes when online and retains its cached bank offline.

The current 400-question source has broad supplied references, not independently verified citations for every answer. References are displayed as supplied; feedback uses the reviewed explanation when available, otherwise the correct answer and its source. No model generates live questions or automatically publishes unchecked content.