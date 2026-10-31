(function (root) {
  const ages = ['under_8', '8_to_15', '16_plus', 'parents'];
  const labels = { under_8: 'أقل من ٨ سنوات', '8_to_15': '٨ إلى ١٥ سنة', '16_plus': '١٦ سنة فأكثر', parents: 'بابا وماما' };
  const sequence = [...Array.from({ length: 20 }, (_, i) => i + 1), 23, 24, 25, 26];
  root.HoorRules = {
    ages, labels, sequence,
    normalizeAge(age) { return ({ '5-8': 'under_8', '9-12': '8_to_15', '13-16': '16_plus' })[age] || (ages.includes(age) ? age : '8_to_15'); },
    stageConfig(stage, age) {
      const factor = { under_8: 0.65, '8_to_15': 0.85, '16_plus': 1, parents: 0.9 }[age] || 1;
      const originalBossHp = stage.id === 22 ? 18 : stage.id === 21 ? 35 : 15 + stage.id * 2;
      return { ...stage, waves: 2 * (stage.waves - 1) + 1, speed: stage.speed * factor, bossHp: originalBossHp * 2 };
    },
    pool(bank, age, mode) {
      const eligible = bank.filter(q => q.age === age);
      const tagged = mode === 'basic' ? eligible : eligible.filter(q => q.modes.includes(mode));
      return tagged.length ? tagged : eligible;
    },
    draw(pool, history, random = Math.random) {
      if (!pool.length) return null;
      const validIds = new Set(pool.map(q => q.id));
      let seen = [...(history.seen || [])];
      let fresh = pool.filter(q => !seen.includes(q.id));
      if (!fresh.length) {
        seen = seen.filter(id => !validIds.has(id));
        fresh = pool.filter(q => q.id !== history.last);
        if (!fresh.length) fresh = pool;
      }
      const q = fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))];
      history.seen = [...seen, q.id];
      history.last = q.id;
      return q;
    },
    answer(stars, score, right) {
      return { stars: right ? stars + 30 : Math.max(0, stars - 10), score: right ? score + 30 : Math.max(0, score - 10), coins: right ? 15 : 0 };
    },
    rescue(lives, right) { return lives === 0 && right ? 1 : lives; },
    unlocked(stageId, progress) {
      if (stageId === 21 || stageId === 22) return true;
      const index = sequence.indexOf(stageId);
      return index === 0 || (index > 0 && (progress.completedStageIds || []).includes(sequence[index - 1])) || (stageId <= 20 && stageId <= progress.unlockedStage);
    },
  };
})(typeof window === 'undefined' ? globalThis : window);