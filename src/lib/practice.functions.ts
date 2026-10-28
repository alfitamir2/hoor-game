import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { PRACTICE_CATALOG } from '@/game/data/practiceCatalog';
import type { AgeGroupId, DifficultyLevel } from '@/game/types/game';

export interface PracticeRecommendation {
  topicId: string;
  difficulty: DifficultyLevel;
  reasonAr: string;
}

interface Input {
  childName: string;
  ageGroup: AgeGroupId;
  stats: { topicId: string; attempts: number; correct: number; recentAccuracy: number | null; lastPracticedDaysAgo: number | null }[];
}

const AGES: AgeGroupId[] = ['under_5', '6_to_9', '10_plus'];

export const recommendPractice = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input || !AGES.includes(input.ageGroup) || !Array.isArray(input.stats)) throw new Error('Invalid input');
    return {
      childName: String(input.childName ?? '').slice(0, 40),
      ageGroup: input.ageGroup,
      stats: input.stats.slice(0, 20).map((s) => ({
        topicId: String(s.topicId),
        attempts: Number(s.attempts) || 0,
        correct: Number(s.correct) || 0,
        recentAccuracy: s.recentAccuracy == null ? null : Number(s.recentAccuracy),
        lastPracticedDaysAgo: s.lastPracticedDaysAgo == null ? null : Number(s.lastPracticedDaysAgo),
      })),
    };
  })
  .handler(async ({ data }): Promise<{ recommendations: PracticeRecommendation[]; summaryAr: string } | { error: string }> => {
    const { getPracticeRecommendations } = await import('./practice.server');
    return getPracticeRecommendations(data);
  });
