import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { generateLevel } from './LevelGenerator.js';
import { state } from './GameState.js';
import { config } from './Config.js';

vi.mock('./GameState.js', () => ({
  state: {
    mapData: [],
    enemies: [],
    lootBags: [],
    currentLootBag: null,
    player: {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      level: 1,
      stats: { magicFind: 0 }
    },
    biome: "normal",
    level: 1
  }
}));

vi.mock('./Config.js', () => ({
  config: {
    mapSize: 50 // Need enough map size so 16-24 loops don't out of bound
  }
}));

describe('LevelGenerator', () => {
  beforeAll(() => {
    // Stub global document
    global.document = {
      getElementById: vi.fn(() => ({ style: { display: 'none' } }))
    };
    global.console = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
  });

  afterAll(() => {
    delete global.document;
  });

  it('should initialize mapData with correct dimensions', () => {
    generateLevel(1);

    expect(state.mapData.length).toBe(config.mapSize);
    expect(state.mapData[0].length).toBe(config.mapSize);
  });
});
