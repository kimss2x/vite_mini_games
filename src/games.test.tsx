import { describe, expect, it } from 'vitest';
import { PING_PONG_RULES } from './gameRules';
import { GAME_CATEGORIES, games } from './games';

describe('game registry', () => {
  it('46개 game ID가 모두 고유하고 필수 필드를 가진다', () => {
    expect(games).toHaveLength(46);
    expect(new Set(games.map((game) => game.id)).size).toBe(46);

    for (const game of games) {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.description).toBeTruthy();
      expect(game.hotkey).toBeTruthy();
      expect(GAME_CATEGORIES).toContain(game.category);
      expect(typeof game.render).toBe('function');
      expect(game.info.goal).toBeTruthy();
      expect(game.info.controls.length).toBeGreaterThan(0);
    }
  });

  it('Ping Pong runtime과 사용자 설명이 같은 5점 규칙을 사용한다', () => {
    const pingPong = games.find((game) => game.id === 'pingpong');
    expect(PING_PONG_RULES.winScore).toBe(5);
    expect(pingPong?.info.goal).toBe(PING_PONG_RULES.goal);
    expect(pingPong?.info.scoring).toBe(PING_PONG_RULES.scoring);
  });
});
