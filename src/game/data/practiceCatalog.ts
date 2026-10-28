import type { AgeGroupId, DifficultyLevel, EducationalQuestion, SubjectFilter } from '../types/game';

/**
 * Verified practice topics. Each one maps to a generator path in
 * utils/questionGenerator.ts whose answers are checked by tests/questionCorrectness.test.ts.
 * The AI may only recommend ids from this list for the child's age group.
 */
export interface PracticeTopic {
  id: string;
  labelAr: string;
  subject: SubjectFilter;
  /** Question types this topic produces (used to match the child's history). */
  types: EducationalQuestion['type'][];
  /** Which difficulty levels actually change the questions. */
  difficulties: DifficultyLevel[];
}

const ALL: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export const PRACTICE_CATALOG: Record<AgeGroupId, PracticeTopic[]> = {
  under_5: [
    { id: 'u5_count_add', labelAr: 'العدّ والجمع البسيط', subject: 'math', types: ['counting', 'addition'], difficulties: ['easy'] },
    { id: 'u5_english', labelAr: 'كلمات إنجليزية مصوّرة', subject: 'english', types: ['english'], difficulties: ['easy'] },
    { id: 'u5_mix', labelAr: 'العدّ والأشكال والكلمات معاً', subject: 'all', types: ['counting', 'shapes', 'addition', 'english'], difficulties: ['easy'] },
  ],
  '6_to_9': [
    { id: 'p_addition', labelAr: 'الجمع', subject: 'addition', types: ['addition'], difficulties: ALL },
    { id: 'p_subtraction', labelAr: 'الطرح', subject: 'subtraction', types: ['subtraction'], difficulties: ALL },
    { id: 'p_multiplication', labelAr: 'جدول الضرب', subject: 'multiplication', types: ['multiplication'], difficulties: ALL },
    { id: 'p_english', labelAr: 'الكلمات الإنجليزية', subject: 'english', types: ['english'], difficulties: ['medium'] },
    { id: 'p_general', labelAr: 'المعلومات العامة', subject: 'general_knowledge', types: ['general_knowledge'], difficulties: ['medium'] },
  ],
  '10_plus': [
    { id: 't_addsub', labelAr: 'الجمع والطرح بأعداد كبيرة', subject: 'math', types: ['addition', 'subtraction'], difficulties: ALL },
    { id: 't_multiplication', labelAr: 'الضرب', subject: 'multiplication', types: ['multiplication'], difficulties: ALL },
    { id: 't_advanced', labelAr: 'القسمة والقوى والمعادلات', subject: 'advanced_math', types: ['multiplication', 'division', 'powers', 'equation'], difficulties: ALL },
    { id: 't_english', labelAr: 'مفردات إنجليزية متقدمة', subject: 'english', types: ['english'], difficulties: ['medium'] },
    { id: 't_general', labelAr: 'المعلومات العامة', subject: 'general_knowledge', types: ['general_knowledge'], difficulties: ['medium'] },
  ],
};

export function findTopic(ageGroup: AgeGroupId, id: string): PracticeTopic | undefined {
  return PRACTICE_CATALOG[ageGroup].find((t) => t.id === id);
}
