import { createOpenAI } from '@ai-sdk/openai';
import { jsonSchema, NoObjectGeneratedError, Output, streamText } from 'ai';
import { PRACTICE_CATALOG } from '@/game/data/practiceCatalog';
import type { AgeGroupId, DifficultyLevel } from '@/game/types/game';
import type { PracticeRecommendation } from './practice.functions';

const MODEL = 'openai/gpt-6-astra';

interface Data {
  childName: string;
  ageGroup: AgeGroupId;
  stats: { topicId: string; attempts: number; correct: number; recentAccuracy: number | null; lastPracticedDaysAgo: number | null }[];
}

type Out = { summaryAr: string; recommendations: { topicId: string; difficulty: DifficultyLevel; reasonAr: string }[] };

export async function getPracticeRecommendations(data: Data): Promise<{ recommendations: PracticeRecommendation[]; summaryAr: string } | { error: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { error: 'خدمة الذكاء الاصطناعي غير مهيّأة.' };

  const catalog = PRACTICE_CATALOG[data.ageGroup];
  const ids = catalog.map((t) => t.id);

  const provider = createOpenAI({
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    apiKey,
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
  });

  const schema = jsonSchema<Out>({
    type: 'object',
    additionalProperties: false,
    required: ['summaryAr', 'recommendations'],
    properties: {
      summaryAr: { type: 'string' },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['topicId', 'difficulty', 'reasonAr'],
          properties: {
            topicId: { type: 'string', enum: ids },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            reasonAr: { type: 'string' },
          },
        },
      },
    },
  });

  const prompt = [
    `Child: ${data.childName || 'the child'}; age group: ${data.ageGroup}.`,
    'Available verified practice topics (id, Arabic label, supported difficulties):',
    ...catalog.map((t) => `- ${t.id} | ${t.labelAr} | ${t.difficulties.join(',')}`),
    'Child history per topic (first-try results):',
    ...data.stats.map((s) => `- ${s.topicId}: ${s.correct}/${s.attempts} correct, last-10 accuracy ${s.recentAccuracy == null ? 'n/a' : Math.round(s.recentAccuracy * 100) + '%'}, last practiced ${s.lastPracticedDaysAgo == null ? 'never' : s.lastPracticedDaysAgo + ' days ago'}`),
  ].join('\n');

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system:
        'You are a kind learning coach for a children\'s educational game. Recommend 1 to 3 topics the child should practice next, prioritising weak topics (low accuracy), then untried or long-unpracticed topics; if all are strong, suggest a harder difficulty. Only use topic ids and difficulties listed as supported. Write summaryAr (max 2 sentences) and each reasonAr (max 1 short sentence) in simple, encouraging Modern Standard Arabic addressed to the parent.',
      prompt,
      maxRetries: 0,
      output: Output.object({ schema }),
      providerOptions: {
        openai: { store: false, forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', include: ['reasoning.encrypted_content'] },
      },
    });
    const out = await result.output;
    const recommendations = (out.recommendations ?? [])
      .filter((r) => {
        const topic = catalog.find((t) => t.id === r.topicId);
        return topic && topic.difficulties.includes(r.difficulty);
      })
      .slice(0, 3);
    return { summaryAr: String(out.summaryAr ?? '').slice(0, 400), recommendations };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) return { error: 'لم نتمكن من قراءة اقتراحات الذكاء الاصطناعي، حاول مرة أخرى.' };
    const status = (error as { statusCode?: number })?.statusCode;
    console.error('practice recommendation failed', status, error);
    if (status === 429) return { error: 'طلبات كثيرة الآن، حاول بعد دقيقة.' };
    if (status === 402) return { error: 'نفد رصيد الذكاء الاصطناعي لهذا التطبيق.' };
    if (status === 403) return { error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً.' };
    return { error: 'تعذّر الحصول على الاقتراحات الآن، حاول لاحقاً.' };
  }
}
