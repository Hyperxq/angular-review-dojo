import { EXERCISES, TOPICS, TOPIC_PART } from './exercise-registry';

describe('exercise registry', () => {
  it('has unique topic/slug pairs', () => {
    const keys = EXERCISES.map((e) => `${e.topic}/${e.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only references known topics with levels 0 to 8', () => {
    for (const e of EXERCISES) {
      expect(Object.keys(TOPICS)).toContain(e.topic);
      expect(e.level).toBeGreaterThanOrEqual(0);
      expect(e.level).toBeLessThanOrEqual(8);
    }
  });

  it('lazy-loads a component for every exercise', async () => {
    for (const e of EXERCISES) {
      expect(typeof (await e.loadComponent())).toBe('function');
    }
  });

  it('assigns every topic to Part 1 or Part 2', () => {
    expect(Object.keys(TOPIC_PART).sort()).toEqual(Object.keys(TOPICS).sort());
  });
});
