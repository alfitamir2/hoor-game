import React, { useMemo, useState, useEffect } from 'react';
import { X, Sparkles, Loader2, ShieldCheck, Play } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { recommendPractice, type PracticeRecommendation } from '@/lib/practice.functions';
import { AGE_GROUPS, type AgeGroupId, type DifficultyLevel, type SubjectFilter } from '../types/game';
import { findTopic } from '../data/practiceCatalog';
import { loadQuizLog, summarizeByTopic } from '../utils/quizLog';
import type { LocalChildProfile } from './ChildProfiles';

const DIFF_AR: Record<DifficultyLevel, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

interface Props {
  profiles: LocalChildProfile[];
  activeProfileId: string;
  activeAgeGroup: AgeGroupId;
  onPractice: (profileId: string, subject: SubjectFilter, difficulty: DifficultyLevel) => void;
  onClose: () => void;
}

export const ParentReview: React.FC<Props> = ({ profiles, activeProfileId, activeAgeGroup, onPractice, onClose }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [gate] = useState(() => {
    const a = 6 + Math.floor(Math.random() * 4);
    const b = 6 + Math.floor(Math.random() * 4);
    return { a, b };
  });
  const [gateInput, setGateInput] = useState('');
  const [childId, setChildId] = useState(activeProfileId);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ summaryAr: string; recommendations: PracticeRecommendation[] } | null>(null);
  const recommend = useServerFn(recommendPractice);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const child = profiles.find((p) => p.id === childId) ?? profiles[0];
  const ageGroup = child.id === activeProfileId ? activeAgeGroup : child.settings.ageGroup;
  const attempts = useMemo(() => loadQuizLog()[child.id] ?? [], [child.id]);
  const stats = useMemo(() => summarizeByTopic(attempts, ageGroup), [attempts, ageGroup]);
  const total = stats.reduce((s, t) => s + t.attempts, 0);
  const correct = stats.reduce((s, t) => s + t.correct, 0);

  useEffect(() => { setResult(null); setError(null); }, [childId]);

  const askAI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await recommend({ data: { childName: child.name, ageGroup, stats } });
      if ('error' in res) setError(res.error);
      else if (!res.recommendations.length) setError('لم تصل اقتراحات، حاول مرة أخرى.');
      else setResult(res);
    } catch {
      setError('تعذّر الاتصال، تأكد من الإنترنت وتسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-3" dir="rtl">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <button onClick={onClose} aria-label="إغلاق" className="absolute left-3 top-3 rounded-full bg-slate-100 p-2 text-slate-600">
          <X className="h-4 w-4" />
        </button>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-black text-slate-800">
          <ShieldCheck className="h-5 w-5 text-emerald-600" /> لوحة ولي الأمر
        </h2>

        {!unlocked ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (Number(gateInput) === gate.a * gate.b) setUnlocked(true);
              else setGateInput('');
            }}
          >
            <p className="text-sm text-slate-600">هذه الصفحة للكبار. كم يساوي {gate.a} × {gate.b}؟</p>
            <input
              inputMode="numeric"
              value={gateInput}
              onChange={(e) => setGateInput(e.target.value)}
              aria-label="الإجابة"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold"
              autoFocus
            />
            <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2 font-bold text-white">دخول</button>
          </form>
        ) : (
          <div className="mt-3 space-y-4">
            {profiles.length > 1 && (
              <select value={child.id} onChange={(e) => setChildId(e.target.value)} aria-label="اختر الطفل"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold">
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <div className="rounded-2xl bg-sky-50 p-3 text-sm text-slate-700">
              <b>{child.name}</b> — {AGE_GROUPS[ageGroup].badgeAr}<br />
              أسئلة مسجّلة: {total} · صحيحة من أول محاولة: {total ? Math.round((correct / total) * 100) : 0}%<br />
              مراحل مفتوحة: {child.id === activeProfileId ? '' : ''}{child.progress.unlockedLevels.length} · مجموع الأسئلة المحلولة: {child.progress.totalSolvedQuestions}
            </div>

            <table className="w-full text-sm">
              <thead><tr className="text-slate-500"><th className="text-right">الموضوع</th><th>المحاولات</th><th>الدقة (آخر ١٠)</th><th>آخر تدريب</th></tr></thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.topicId} className="border-t border-slate-100 text-center">
                    <td className="py-1.5 text-right font-bold text-slate-700">{s.labelAr}</td>
                    <td>{s.attempts}</td>
                    <td className={s.recentAccuracy == null ? 'text-slate-400' : s.recentAccuracy < 0.6 ? 'font-bold text-rose-600' : 'text-emerald-700'}>
                      {s.recentAccuracy == null ? '—' : `${Math.round(s.recentAccuracy * 100)}%`}
                    </td>
                    <td className="text-slate-500">{s.lastPracticedDaysAgo == null ? 'لم يبدأ' : s.lastPracticedDaysAgo === 0 ? 'اليوم' : `قبل ${s.lastPracticedDaysAgo} يوم`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total === 0 && <p className="text-xs text-slate-500">لم تُسجَّل إجابات بعد — تُسجَّل الأسئلة من الآن فصاعداً.</p>}

            {signedIn === false ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">سجّل الدخول بحساب Google للحصول على اقتراحات التدريب الذكية.</p>
            ) : (
              <button onClick={askAI} disabled={loading || signedIn === null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 font-bold text-white disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'جارٍ التحليل…' : 'ماذا يتدرّب بعد ذلك؟ (اقتراح ذكي)'}
              </button>
            )}
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            {result && (
              <div className="space-y-2">
                {result.summaryAr && <p className="text-sm text-slate-700">{result.summaryAr}</p>}
                {result.recommendations.map((r, i) => {
                  const topic = findTopic(ageGroup, r.topicId);
                  if (!topic) return null;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-3">
                      <div className="flex-1 text-sm">
                        <b>{topic.labelAr}</b> · {DIFF_AR[r.difficulty]}
                        <div className="text-slate-600">{r.reasonAr}</div>
                      </div>
                      <button onClick={() => onPractice(child.id, topic.subject, r.difficulty)}
                        className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-sm font-bold text-white">
                        <Play className="h-3.5 w-3.5" /> تدريب
                      </button>
                    </div>
                  );
                })}
                <p className="text-[11px] text-slate-400">الأسئلة نفسها من بنك اللعبة المُراجَع؛ الذكاء الاصطناعي يختار الموضوع فقط.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
