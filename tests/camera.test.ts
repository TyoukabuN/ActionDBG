import { describe, expect, it } from 'vitest';
import type { CombatSnapshot } from '../src/combat';
import { CameraDirector } from '../src/camera';

function snapshot(overrides: Partial<CombatSnapshot> = {}): CombatSnapshot {
  return {
    controlMode: 'qte', phase: 'planning', round: 1, playerHp: 10, enemyHp: 12,
    activeSide: 'player', playerTurn: 1, enemyTurn: 0, enemyAp: 3, enemyMaxAp: 3, enemyGuard: 0, pendingEnemyCard: null, playerTurnSeconds: 4, lastRecoverySide: null, ap: 3, maxAp: 3, remaining: 4, queue: [], committed: [], activeCard: null,
    playerInputOpen: true, planningRemaining: 4, pendingActions: [], actionResolved: false,
    guard: 0, enemyAttack: 'light', enemyDamage: 2, visualTime: 0, phaseElapsed: 0,
    paused: false, log: [], cooldowns: { quick: 0, heavy: 0, guard: 0, counter: 0 },
    ...overrides,
  };
}

function settle(director: CameraDirector, state: CombatSnapshot): void {
  director.update(state, 0.1);
  director.update(state, 0.1);
}

describe('CameraDirector', () => {
  it('anchors stable shots behind the player right shoulder and uses distinct action panels', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'planning' }));
    const decision = director.current;
    expect(decision.position[0]).toBeLessThan(-3.5);
    expect(decision.position[1]).toBeGreaterThan(2);
    expect(decision.position[2]).toBeGreaterThan(2);
    expect(decision.target[0]).toBeGreaterThan(1);
    settle(director, snapshot({ phase: 'acting', activeCard: 'quick' }));
    const quick = director.current;
    settle(director, snapshot({ phase: 'acting', activeCard: 'heavy', visualTime: 1 }));
    const heavy = director.current;
    expect(quick.id).toBe('quick-strike');
    expect(heavy.id).toBe('heavy-strike');
    expect(quick.position).not.toEqual(heavy.position);
    expect(quick.roll).toBeGreaterThan(0);
    expect(heavy.roll).toBeLessThan(0);
    expect(quick.position[2]).toBeGreaterThan(0);
    expect(heavy.position[2]).toBeGreaterThan(0);
  });

  it('cuts to the counter window and holds a parry when the counter resolves', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'planning', visualTime: .5 }));
    const decision = director.current;
    settle(director, snapshot({ phase: 'counter', visualTime: 1 }));
    expect(director.current.id).toBe('counter-window');
    expect(director.current.position[0]).toBeGreaterThan(decision.position[0]);
    expect(director.current.fov).toBeLessThan(decision.fov);
    director.update(snapshot({ phase: 'resolve', enemyHp: 10, visualTime: 2 }), 0.1);
    expect(director.current.id).toBe('parry');
    director.update(snapshot({ phase: 'telegraph', enemyHp: 10, visualTime: 3 }), 0.1);
    expect(director.current.id).toBe('parry');
  });

  it('keeps a cancelled strike in parry until the next round without a false guard impact', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'counter', guard: 2, visualTime: 1 }));
    const resolved = snapshot({ phase: 'resolve', guard: 2, enemyHp: 10, visualTime: 2 });
    for (let i = 0; i < 6; i++) director.update(resolved, .1);
    expect(director.current.id).toBe('parry');
    settle(director, snapshot({ phase: 'telegraph', round: 2, enemyHp: 10, visualTime: 3 }));
    expect(director.current.id).toBe('enemy-windup');
  });

  it('lets the next executing card replace a completed action impact hold', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'acting', activeCard: 'heavy', visualTime: 1 }));
    director.update(snapshot({ phase: 'planning', enemyHp: 9, visualTime: 2 }), .016);
    expect(director.current.id).toBe('impact');
    settle(director, snapshot({ phase: 'acting', activeCard: 'guard', enemyHp: 9, visualTime: 2.1 }));
    expect(director.current.id).toBe('guard');
  });

  it('lets the Counter window interrupt a completed card impact hold', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'acting', activeCard: 'quick', visualTime: 1 }));
    director.update(snapshot({ phase: 'planning', enemyHp: 11, visualTime: 2 }), .016);
    expect(director.current.id).toBe('impact');
    settle(director, snapshot({ phase: 'counter', enemyHp: 11, visualTime: 2.1 }));
    expect(director.current.id).toBe('counter-window');
  });

  it('does not transition or consume an event while paused, including at zero delta', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'planning' }));
    const before = director.current;
    const paused = director.update(snapshot({ phase: 'victory', paused: true, enemyHp: 0 }), 0);
    expect(paused).toBe(before);
    expect(director.current.id).toBe('decision');
  });

  it('resets to overview on ready and on visual clock rewind or health restore', () => {
    const director = new CameraDirector();
    settle(director, snapshot({ phase: 'acting', activeCard: 'heavy', visualTime: 2 }));
    expect(director.current.id).not.toBe('overview');
    expect(director.update(snapshot({ phase: 'ready', visualTime: 2 }), 0.1).id).toBe('overview');
    settle(director, snapshot({ phase: 'telegraph', visualTime: 4 }));
    expect(director.update(snapshot({ phase: 'telegraph', visualTime: 0 }), 0.1).id).toBe('overview');
    settle(director, snapshot({ phase: 'counter', playerHp: 8, visualTime: 1 }));
    expect(director.update(snapshot({ phase: 'counter', playerHp: 10, visualTime: 2 }), 0.1).id).toBe('overview');
  });

  it('keeps the stable right-shoulder overview with reduced motion enabled', () => {
    const director = new CameraDirector();
    const pose = director.update(snapshot({ phase: 'acting', activeCard: 'heavy' }), 0.1, true);
    expect(pose).toMatchObject({ id: 'overview', position: [-4.55, 2.35, 2.75], target: [1.35, 1.3, -0.35], fov: 49, roll: 0 });
  });
});
