import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const catalog = JSON.parse(readFileSync('public/rescue-audio-catalog.json', 'utf8'));
const runtime = readFileSync('public/Hoor-Plays-Learns-Android.html', 'utf8');

describe('Qur’an listening rescue catalogue', () => {
  it('contains 98 unique, retained local MP3 assets', () => {
    expect(catalog.items).toHaveLength(98);
    expect(new Set(catalog.items.map((item: any) => item.id)).size).toBe(98);
    expect(new Set(catalog.items.map((item: any) => item.audioPath)).size).toBe(98);

    for (const item of catalog.items) {
      expect(item.audioPath).toMatch(/^\/audio\/rescue\/[A-Za-z0-9._-]+\.mp3$/);
      expect(existsSync(`public${item.audioPath}`)).toBe(true);
      expect(item.audioPath).not.toMatch(/C00/i);
    }
    expect(existsSync('public/audio/rescue/10-008C00-A08.mp3')).toBe(false);
    expect(existsSync('public/audio/rescue/10-019C00-A08.mp3')).toBe(false);
  });

  it('uses only known age profiles and valid positive durations', () => {
    const limits = catalog.ageProfiles;
    for (const item of catalog.items) {
      expect(Number.isFinite(item.durationSeconds)).toBe(true);
      expect(item.durationSeconds).toBeGreaterThan(0);
      expect(item.ageProfiles.length).toBeGreaterThan(0);
      for (const age of item.ageProfiles) {
        expect(limits[age]).toBeDefined();
        expect(item.durationSeconds).toBeLessThanOrEqual(limits[age].maxDurationSeconds);
      }
    }
  });

  it('preserves the expected Surah/ayah inventory counts', () => {
    const counts = catalog.items.reduce((result: Record<number, number>, item: any) => {
      result[item.surah] = (result[item.surah] || 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ 1: 7, 8: 75, 19: 16 });
  });

  it('filters the random selection by age, duration, and local MP3 path', () => {
    expect(runtime).toContain('RULES.normalizeAge(appState.ageTier)');
    expect(runtime).toContain('item.ageProfiles.includes(age)');
    expect(runtime).toContain('Number(item.durationSeconds) <= maxDuration');
    expect(runtime).toContain('/^\\/audio\\/rescue\\/[A-Za-z0-9._-]+\\.mp3$/');
  });

  it('awards one heart only for the active, started session after natural audio completion', () => {
    expect(runtime).toContain('session.id !== sessionId');
    expect(runtime).toContain('session.completed || !session.started || !audio.ended');
    expect(runtime).toContain('playerLives !== 0 || !rescuePending');
    expect(runtime).toContain('RULES.rescue(playerLives, true)');
    expect(runtime).toContain('session.completed = true');
    expect(runtime).toContain("speakText('ممتاز حور وأصدقاؤها!')");
  });

  it('invalidates stale sessions and retains a free quiz fallback', () => {
    expect(runtime).toContain('rescueAudioSessionId++');
    expect(runtime).toContain('fallbackToQuizRescue');
    expect(runtime).toContain('openQuizStation(false, true)');
  });
});
