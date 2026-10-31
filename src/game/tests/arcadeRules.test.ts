import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const context: any = { window: {} };
runInNewContext(readFileSync('public/arcade-rules.js', 'utf8'), context);
runInNewContext(readFileSync('public/question-bank.js', 'utf8'), context);
const rules = context.window.HoorRules;
const bank = context.window.HoorQuestionBank.questions;
const html = readFileSync('public/Hoor-Plays-Learns-Android.html', 'utf8');
const stages = new Function(`${html.slice(html.indexOf('    const ALL_STAGES = ['), html.indexOf('    const QUESTION_BANK'))}; return ALL_STAGES;`)();

describe('Family arcade rules', () => {
  it.each(['under_8', '8_to_15', '16_plus', 'parents'])('has 100 structurally valid, distinct questions for %s', age => {
    const pool = rules.pool(bank, age, 'basic');
    expect(pool).toHaveLength(100);
    expect(new Set(pool.map((q: any) => q.q)).size).toBe(100);
    for (const q of pool) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.filter((option: string) => option === q.correctText)).toHaveLength(1);
      expect(q.sources.length).toBeGreaterThan(0);
    }
  });
  it.each(['under_8', '8_to_15', '16_plus', 'parents'])('does not repeat any of 100 questions across reloads for %s', age => {
    const pool = rules.pool(bank, age, 'basic');
    let history = { seen: [], last: null };
    const drawn = [];
    for (let i = 0; i < 100; i++) {
      drawn.push(rules.draw(pool, history, () => 0).id);
      history = JSON.parse(JSON.stringify(history));
    }
    expect(new Set(drawn).size).toBe(100);
    expect(rules.draw(pool, history, () => 0).id).not.toBe(drawn[99]);
  });
  it('retains general history when switching to a special question pool', () => {
    const history = { seen: [], last: null };
    const pool = rules.pool(bank, '8_to_15', 'basic');
    const first = rules.draw(pool, history, () => 0);
    rules.draw(rules.pool(bank, '8_to_15', 'quran'), history, () => 0);
    expect(history.seen).toContain(first.id);
    expect(rules.draw(pool, history, () => 0).id).not.toBe(first.id);
  });
  it('doubles combat content for every stage and every age', () => {
    expect(stages).toHaveLength(26);
    for (const stage of stages) for (const age of rules.ages) {
      const config = rules.stageConfig(stage, age);
      expect(config.waves - 1).toBe((stage.waves - 1) * 2);
      const hp = stage.id === 22 ? 18 : stage.id === 21 ? 35 : 15 + stage.id * 2;
      expect(config.bossHp).toBe(hp * 2);
    }
  });
  it('restores exactly one heart only after a correct rescue answer', () => {
    expect(rules.rescue(0, false)).toBe(0);
    expect(rules.rescue(0, true)).toBe(1);
    expect(rules.rescue(2, true)).toBe(2);
  });
  it('deducts 10 stars for a wrong answer, never below zero', () => {
    expect(rules.answer(120, 40, false)).toEqual({ stars: 110, score: 30, coins: 0 });
    expect(rules.answer(5, 5, false)).toEqual({ stars: 0, score: 0, coins: 0 });
  });
  it('retains correct answer rewards', () => {
    expect(rules.answer(10, 5, true)).toEqual({ stars: 40, score: 35, coins: 15 });
  });
  it('unlocks the four new stages sequentially after stage 20', () => {
    for (const [stage, previous] of [[23, 20], [24, 23], [25, 24], [26, 25]]) {
      expect(rules.unlocked(stage, { unlockedStage: 20, completedStageIds: [] })).toBe(false);
      expect(rules.unlocked(stage, { unlockedStage: 20, completedStageIds: [previous] })).toBe(true);
    }
    expect(rules.unlocked(21, { unlockedStage: 1 })).toBe(true);
    expect(rules.unlocked(22, { unlockedStage: 1 })).toBe(true);
  });
  it('maps legacy ages into the supplied bank ages', () => {
    expect(rules.normalizeAge('5-8')).toBe('under_8');
    expect(rules.normalizeAge('9-12')).toBe('8_to_15');
    expect(rules.normalizeAge('13-16')).toBe('16_plus');
    expect(rules.normalizeAge('parents')).toBe('parents');
  });
  it('uses reviewed wording for energy conservation and relativity', () => {
    expect(bank.find((q: any) => q.id === 'bank3-q008').q).toContain('الطاقة الكلية');
    expect(bank.find((q: any) => q.id === 'bank3-q001').q).toContain('أي سرعة');
  });
});