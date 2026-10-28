import { describe, it, expect } from 'vitest';
import { PRACTICE_CATALOG } from '../data/practiceCatalog';
import { generateQuestion } from '../utils/questionGenerator';
import { summarizeByTopic, type QuizAttempt } from '../utils/quizLog';
import type { AgeGroupId } from '../types/game';

describe('practice catalog', () => {
  it('every recommended topic only produces the question types it claims', () => {
    for (const age of Object.keys(PRACTICE_CATALOG) as AgeGroupId[]) {
      for (const topic of PRACTICE_CATALOG[age]) {
        for (const diff of topic.difficulties) {
          for (let i = 0; i < 200; i++) {
            expect(topic.types).toContain(generateQuestion(diff, topic.subject, age).type);
          }
        }
      }
    }
  });

  it('accuracy uses only the last 10 first-try answers', () => {
    const a = (ok: boolean): QuizAttempt => ({ t: 0, type: 'subtraction', age: '6_to_9', diff: 'easy', ok });
    const log = [...Array(10).fill(a(false)), ...Array(10).fill(a(true)).slice(0, 7), a(false), a(false), a(false)];
    const s = summarizeByTopic(log, '6_to_9', 0).find((t) => t.topicId === 'p_subtraction')!;
    expect(s.attempts).toBe(20);
    expect(s.recentAccuracy).toBe(0.7);
  });
});
