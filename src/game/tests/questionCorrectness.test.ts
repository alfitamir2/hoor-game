import { describe, expect, it } from 'vitest';
import { generateQuestion } from '../utils/questionGenerator';
import { QURAN_VERSES_BETWEEN_LEVELS } from '../data/quranVerses';
import type { AgeGroupId, DifficultyLevel, SubjectFilter } from '../types/game';

const AGES: AgeGroupId[] = ['under_5', '6_to_9', '10_plus'];
const DIFFS: DifficultyLevel[] = ['easy', 'medium', 'hard'];
const SUBJECTS: SubjectFilter[] = [
  'all', 'math', 'addition', 'subtraction', 'multiplication', 'advanced_math', 'english', 'general_knowledge',
] as SubjectFilter[];

/** Solve the displayed equation independently of the generator. */
function solve(display: string): number | null {
  const d = display.replace('؟', '').replace(/\s/g, '');
  let m;
  if ((m = d.match(/^(\d+)\+\((\d+)×(\d+)\)-(\d+)=$/))) return +m[1] + +m[2] * +m[3] - +m[4];
  if ((m = d.match(/^(\d+)\+(\d+)=$/))) return +m[1] + +m[2];
  if ((m = d.match(/^(\d+)-(\d+)=$/))) return +m[1] - +m[2];
  if ((m = d.match(/^(\d+)×(\d+)=$/))) return +m[1] * +m[2];
  if ((m = d.match(/^(\d+)÷(\d+)=$/))) return +m[1] / +m[2];
  if ((m = d.match(/^(\d+)\^(\d+)=$/))) return (+m[1]) ** +m[2];
  if ((m = d.match(/^(\d+)%×(\d+)=$/))) return (+m[1] * +m[2]) / 100;
  if ((m = d.match(/^(\d)X\+(\d+)=(\d+)$/))) return (+m[3] - +m[2]) / +m[1];
  if ((m = d.match(/^(\d)X-(\d+)=(-?\d+)$/))) return (+m[3] + +m[2]) / +m[1];
  return null;
}

describe('every generated question is correct', () => {
  for (const age of AGES)
    for (const diff of DIFFS)
      for (const subject of SUBJECTS)
        it(`${age} / ${diff} / ${subject}`, () => {
          for (let i = 0; i < 300; i++) {
            const q = generateQuestion(diff, subject, age);
            const values = q.options.map((o) => o.value);
            expect(new Set(values).size).toBe(values.length);
            expect(values).toContain(q.correctValue);
            if (typeof q.correctValue === 'number') {
              expect(Number.isInteger(q.correctValue)).toBe(true);
              expect(q.correctValue).toBeGreaterThanOrEqual(0);
              for (const v of values) expect(v as number).toBeGreaterThanOrEqual(0);
            }
            if (q.equationDisplay) {
              const solved = solve(q.equationDisplay);
              expect(solved, q.equationDisplay).not.toBeNull();
              expect(solved).toBe(q.correctValue);
              expect(q.equationDisplay).not.toMatch(/= -/);
            }
            if (q.type === 'counting') expect(q.countA).toBe(q.correctValue);
            if (q.type === 'english') {
              // An English-word question must not reveal the answer before it is chosen
              if (q.hideWordUntilAnswered) {
                for (const o of q.options) expect(o.subLabel).toBeUndefined();
              }
              if (age !== 'under_5') for (const o of q.options) expect(o.emoji).toBeUndefined();
            }
          }
        });
});

describe('Quran verses between levels', () => {
  it('covers every level transition 1→2 … 19→20 exactly once', () => {
    const keys = QURAN_VERSES_BETWEEN_LEVELS.map((v) => `${v.levelFrom}-${v.levelTo}`);
    expect(keys).toEqual(Array.from({ length: 19 }, (_, i) => `${i + 1}-${i + 2}`));
  });
});
