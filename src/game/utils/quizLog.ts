import type { AgeGroupId, DifficultyLevel, EducationalQuestion } from '../types/game';
import { PRACTICE_CATALOG } from '../data/practiceCatalog';

export const STORAGE_QUIZ_LOG_KEY = 'hoor_quiz_attempts_v1';
const MAX_PER_CHILD = 300;

export interface QuizAttempt {
  t: number; // timestamp
  type: EducationalQuestion['type'];
  age: AgeGroupId;
  diff: DifficultyLevel;
  /** Correct on the first tap. */
  ok: boolean;
}

export type QuizLog = Record<string, QuizAttempt[]>;

export function loadQuizLog(): QuizLog {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_QUIZ_LOG_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function recordQuizAttempt(profileId: string, attempt: QuizAttempt) {
  try {
    const log = loadQuizLog();
    const list = [...(log[profileId] ?? []), attempt].slice(-MAX_PER_CHILD);
    log[profileId] = list;
    localStorage.setItem(STORAGE_QUIZ_LOG_KEY, JSON.stringify(log));
  } catch {
    // storage full / private mode — skip logging
  }
}

export interface TopicStat {
  topicId: string;
  labelAr: string;
  attempts: number;
  correct: number;
  /** Accuracy over the last 10 questions of this topic, 0..1, null if none. */
  recentAccuracy: number | null;
  lastPracticedDaysAgo: number | null;
}

export function summarizeByTopic(attempts: QuizAttempt[], ageGroup: AgeGroupId, now = Date.now()): TopicStat[] {
  return PRACTICE_CATALOG[ageGroup].map((topic) => {
    const mine = attempts.filter((a) => a.age === ageGroup && topic.types.includes(a.type));
    const recent = mine.slice(-10);
    const last = mine[mine.length - 1];
    return {
      topicId: topic.id,
      labelAr: topic.labelAr,
      attempts: mine.length,
      correct: mine.filter((a) => a.ok).length,
      recentAccuracy: recent.length ? recent.filter((a) => a.ok).length / recent.length : null,
      lastPracticedDaysAgo: last ? Math.floor((now - last.t) / 86_400_000) : null,
    };
  });
}
