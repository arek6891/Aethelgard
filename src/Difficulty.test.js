import { describe, it, expect } from 'vitest';
import { calculateEnemyStats } from './Difficulty.js';

describe('Difficulty', () => {
  it('should calculate valid stats for normal enemies', () => {
    const stats = calculateEnemyStats('normal', 1, false);
    expect(stats.hp).toBeGreaterThan(0);
    expect(stats.damage).toBeGreaterThan(0);
  });
});
