import { describe, expect, it } from 'vitest';
import { CARDS, Combat, type CardId, type Phase } from '../src/combat';

function advanceUntil(combat: Combat, phase: Phase, maxSeconds = 30): void {
  for (let elapsed = 0; elapsed < maxSeconds && combat.snapshot().phase !== phase; elapsed += 0.1) {
    combat.tick(0.1);
  }
  expect(combat.snapshot().phase).toBe(phase);
}

function playCard(combat: Combat, id: CardId): void {
  expect(combat.toggleCard(id)).toBe(true);
  combat.submit();
  // Action cards resolve at the end of a 0.55 second action beat.
  for (let elapsed = 0; elapsed < 1; elapsed += 0.1) {
    if (combat.snapshot().phase !== 'acting') break;
    combat.tick(0.1);
  }
}

describe('combat rules', () => {
  it('automatically submits both planning and counter previews on expiry, once only', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    combat.toggleCard('quick');
    advanceUntil(combat, 'counter');
    expect(combat.snapshot()).toMatchObject({ ap: 2, enemyHp: 11 });
    combat.toggleCard('counter');
    advanceUntil(combat, 'resolve');
    expect(combat.snapshot()).toMatchObject({ ap: 0, enemyHp: 9 });
    combat.submit();
    combat.tick(0.7);
    expect(combat.snapshot()).toMatchObject({ playerHp: 10, round: 2 });
    expect(combat.snapshot().log.filter((line) => line === 'Counter window open.')).toHaveLength(1);
  });

  it('returns detached snapshots and removal cannot duplicate an action', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    combat.toggleCard('quick');
    combat.toggleCard('quick');
    combat.toggleCard('quick');
    const snapshot = combat.snapshot();
    snapshot.queue.push('quick');
    snapshot.cooldowns.heavy = 999;
    snapshot.log.push('Injected event');
    expect(combat.snapshot().queue).toEqual(['quick']);
    expect(combat.snapshot().cooldowns.heavy).toBe(0);
    combat.submit();
    combat.submit();
    advanceUntil(combat, 'counter');
    expect(combat.snapshot()).toMatchObject({ ap: 2, enemyHp: 11 });
  });

  it('empty deadlines progress into damage and Guard reduces a heavy hit by exactly two', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    advanceUntil(combat, 'counter');
    advanceUntil(combat, 'resolve');
    combat.tick(0.7);
    expect(combat.snapshot()).toMatchObject({ round: 2, playerHp: 8, enemyAttack: 'heavy' });
    advanceUntil(combat, 'planning');
    combat.toggleCard('guard');
    combat.submit();
    advanceUntil(combat, 'counter');
    combat.skip();
    combat.tick(0.7);
    expect(combat.snapshot()).toMatchObject({ round: 3, playerHp: 6, guard: 0 });
  });
  it('exports the frozen card contract and starts/restarts with a complete encounter reset', () => {
    expect(CARDS.map(({ id }) => id)).toEqual(['quick', 'heavy', 'guard', 'counter']);
    const combat = new Combat();
    expect(combat.snapshot().phase).toBe('ready');
    combat.start();
    expect(combat.snapshot()).toMatchObject({
      phase: 'telegraph', round: 1, playerHp: 10, enemyHp: 12, ap: 3, maxAp: 3,
      enemyAttack: 'light', enemyDamage: 2, remaining: 1.1,
    });

    advanceUntil(combat, 'planning');
    combat.toggleCard('heavy');
    combat.submit();
    expect(combat.snapshot().phase).toBe('acting');
    combat.restart();
    expect(combat.snapshot()).toMatchObject({
      phase: 'telegraph', round: 1, playerHp: 10, enemyHp: 12, ap: 3,
      queue: [], committed: [], activeCard: null, guard: 0, enemyAttack: 'light',
      remaining: 1.1, paused: false,
    });
    expect(combat.snapshot().cooldowns).toEqual({ quick: 0, heavy: 0, guard: 0, counter: 0 });
  });

  it('ignores invalid deltas and advances remainder across telegraph into a real-time planning window', () => {
    const combat = new Combat();
    combat.start();
    combat.tick(Number.NaN);
    combat.tick(Number.POSITIVE_INFINITY);
    combat.tick(-1);
    expect(combat.snapshot().remaining).toBeCloseTo(1.1);
    // This tick crosses the 1.1 second telegraph boundary with 0.1 seconds left.
    combat.tick(1.2);
    expect(combat.snapshot().phase).toBe('planning');
    expect(combat.snapshot().remaining).toBeCloseTo(3.9);
    const beforeVisual = combat.snapshot().visualTime;
    combat.tick(1);
    expect(combat.snapshot().remaining).toBeCloseTo(2.9);
    expect(combat.snapshot().visualTime - beforeVisual).toBeCloseTo(0.15);
  });

  it('reserves queued AP, supports removal, commits once, and resolves ordered damage', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    expect(combat.toggleCard('heavy')).toBe(true);
    expect(combat.snapshot().queue).toEqual(['heavy']);
    expect(combat.availability('quick')).toBeNull();
    expect(combat.toggleCard('heavy')).toBe(true);
    expect(combat.snapshot().queue).toEqual([]);
    expect(combat.toggleCard('quick')).toBe(true);
    expect(combat.toggleCard('heavy')).toBe(true);
    expect(combat.toggleCard('guard')).toBe(false);
    const before = combat.snapshot();
    combat.submit();
    expect(combat.snapshot()).toMatchObject({ phase: 'acting', ap: 0, queue: [], committed: ['quick', 'heavy'] });
    expect(before.ap).toBe(3);
    combat.tick(0.6);
    expect(combat.snapshot().enemyHp).toBe(11);
    expect(combat.snapshot().activeCard).toBe('heavy');
    combat.tick(0.6);
    expect(combat.snapshot().enemyHp).toBe(8);
    expect(combat.snapshot().phase).toBe('resolve');
  });

  it('lets Guard reduce the next hit and carries ordinary-phase AP into the counter eligibility check', () => {
    const guarded = new Combat();
    guarded.start();
    advanceUntil(guarded, 'planning');
    expect(guarded.toggleCard('guard')).toBe(true);
    guarded.submit();
    advanceUntil(guarded, 'counter');
    expect(guarded.snapshot().guard).toBe(2);
    guarded.skip();
    advanceUntil(guarded, 'resolve');
    guarded.tick(0.7);
    expect(guarded.snapshot()).toMatchObject({ phase: 'telegraph', playerHp: 10, round: 2, ap: 3 });
    expect(guarded.snapshot().log.some((line) => line.includes('2 damage guarded'))).toBe(true);

    const reserved = new Combat();
    reserved.start();
    advanceUntil(reserved, 'planning');
    playCard(reserved, 'quick');
    expect(reserved.snapshot()).toMatchObject({ phase: 'counter', enemyHp: 11, ap: 2 });
    expect(reserved.availability('counter')).toBeNull();
  });

  it('resolves Counter only in its eligible phase, spends shared AP, cancels the hit, and cools down through N+1', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    expect(combat.availability('counter')).toContain('only available');
    playCard(combat, 'quick');
    expect(combat.snapshot().phase).toBe('counter');
    expect(combat.toggleCard('counter')).toBe(true);
    combat.submit();
    expect(combat.snapshot()).toMatchObject({ phase: 'resolve', enemyHp: 9, ap: 0, queue: [], cooldowns: { counter: 1 } });
    combat.tick(0.7);
    expect(combat.snapshot()).toMatchObject({ phase: 'telegraph', playerHp: 10, round: 2 });

    // A later round can pass the unavailable round; Counter is usable again in N+2.
    advanceUntil(combat, 'planning');
    combat.skip();
    advanceUntil(combat, 'telegraph');
    advanceUntil(combat, 'planning');
    expect(combat.snapshot().round).toBe(3);
    expect(combat.snapshot().cooldowns.counter).toBe(0);
  });

  it('pauses both clocks, blocks actions while paused, and clears pause on restart', () => {
    const combat = new Combat();
    combat.start();
    advanceUntil(combat, 'planning');
    combat.setPaused(true);
    const paused = combat.snapshot();
    combat.tick(2);
    expect(combat.snapshot()).toEqual(paused);
    expect(combat.toggleCard('quick')).toBe(false);
    combat.setPaused(false);
    combat.tick(1);
    expect(combat.snapshot().remaining).toBeCloseTo(paused.remaining - 1);
    combat.setPaused(true);
    combat.restart();
    expect(combat.snapshot()).toMatchObject({ phase: 'telegraph', paused: false, remaining: 1.1 });
  });

  it('cancels remaining work on lethal damage and bounds its event log', () => {
    const combat = new Combat();
    combat.start();
    // Alternate Heavy Strike turns with Quick Strike turns to deal lethal
    // damage while respecting Heavy's unavailable N+1 cooldown round.
    for (let strike = 0; strike < 6 && combat.snapshot().phase !== 'victory'; strike++) {
      advanceUntil(combat, 'planning');
      const canHeavy = combat.availability('heavy') === null;
      if (canHeavy) expect(combat.toggleCard('heavy')).toBe(true);
      if (!canHeavy && combat.snapshot().enemyHp <= 3) expect(combat.toggleCard('guard')).toBe(true);
      expect(combat.toggleCard('quick')).toBe(true);
      combat.submit();
      for (let elapsed = 0; elapsed < 2 && combat.snapshot().phase === 'acting'; elapsed += 0.1) combat.tick(0.1);
      if (combat.snapshot().phase === 'counter') {
        if (combat.availability('counter') === null) {
          expect(combat.toggleCard('counter')).toBe(true);
          combat.submit();
        } else combat.skip();
      }
      if (combat.snapshot().phase === 'victory') break;
      advanceUntil(combat, 'telegraph');
    }
    const snapshot = combat.snapshot();
    expect(snapshot.phase).toBe('victory');
    expect(snapshot.enemyHp).toBe(0);
    expect(snapshot.committed).toEqual([]);
    expect(snapshot.activeCard).toBeNull();
    expect(snapshot.log).toHaveLength(16);
    expect(combat.toggleCard('quick')).toBe(false);
    combat.skip();
    combat.tick(10);
    expect(combat.snapshot().phase).toBe('victory');
  });

  it('ends in defeat after lethal incoming damage and stops future round transitions', () => {
    const combat = new Combat();
    combat.start();
    for (let round = 0; round < 5 && combat.snapshot().phase !== 'defeat'; round++) {
      advanceUntil(combat, 'planning');
      combat.skip();
      if (combat.snapshot().phase === 'counter') combat.skip();
      for (let elapsed = 0; elapsed < 1 && combat.snapshot().phase === 'resolve'; elapsed += 0.1) combat.tick(0.1);
    }
    const before = combat.snapshot();
    expect(before.phase).toBe('defeat');
    expect(before.playerHp).toBe(0);
    combat.tick(5);
    expect(combat.snapshot()).toEqual(before);
  });

  it('supports winning attack-first and counter-saving strategies', () => {
    const attackFirst = new Combat();
    attackFirst.start();
    for (let round = 1; round <= 5 && attackFirst.snapshot().phase !== 'victory'; round++) {
      advanceUntil(attackFirst, 'planning');
      if (round % 2 === 1) {
        expect(attackFirst.toggleCard('heavy')).toBe(true);
        expect(attackFirst.toggleCard('quick')).toBe(true);
      } else {
        expect(attackFirst.toggleCard('quick')).toBe(true);
        expect(attackFirst.toggleCard('guard')).toBe(true);
      }
      attackFirst.submit();
      for (let elapsed = 0; elapsed < 2 && attackFirst.snapshot().phase === 'acting'; elapsed += 0.1) attackFirst.tick(0.1);
      if (attackFirst.snapshot().phase === 'counter') attackFirst.skip();
      if (attackFirst.snapshot().phase !== 'victory') advanceUntil(attackFirst, 'telegraph');
    }
    expect(attackFirst.snapshot()).toMatchObject({ phase: 'victory', enemyHp: 0 });

    const counterSaving = new Combat();
    counterSaving.start();
    advanceUntil(counterSaving, 'planning');
    expect(counterSaving.toggleCard('quick')).toBe(true);
    counterSaving.submit();
    for (let elapsed = 0; elapsed < 1 && counterSaving.snapshot().phase === 'acting'; elapsed += 0.1) counterSaving.tick(0.1);
    expect(counterSaving.snapshot().phase).toBe('counter');
    expect(counterSaving.toggleCard('counter')).toBe(true);
    counterSaving.submit();
    expect(counterSaving.snapshot().enemyHp).toBe(9);
    advanceUntil(counterSaving, 'telegraph');

    advanceUntil(counterSaving, 'planning');
    expect(counterSaving.toggleCard('heavy')).toBe(true);
    expect(counterSaving.toggleCard('guard')).toBe(true);
    counterSaving.submit();
    for (let elapsed = 0; elapsed < 2 && counterSaving.snapshot().phase === 'acting'; elapsed += 0.1) counterSaving.tick(0.1);
    expect(counterSaving.snapshot().phase).toBe('resolve');
    advanceUntil(counterSaving, 'telegraph');

    advanceUntil(counterSaving, 'planning');
    expect(counterSaving.toggleCard('quick')).toBe(true);
    counterSaving.submit();
    for (let elapsed = 0; elapsed < 1 && counterSaving.snapshot().phase === 'acting'; elapsed += 0.1) counterSaving.tick(0.1);
    expect(counterSaving.snapshot().phase).toBe('counter');
    expect(counterSaving.toggleCard('counter')).toBe(true);
    counterSaving.submit();
    expect(counterSaving.snapshot().enemyHp).toBe(3);
    advanceUntil(counterSaving, 'telegraph');

    advanceUntil(counterSaving, 'planning');
    expect(counterSaving.toggleCard('heavy')).toBe(true);
    counterSaving.submit();
    for (let elapsed = 0; elapsed < 1 && counterSaving.snapshot().phase === 'acting'; elapsed += 0.1) counterSaving.tick(0.1);
    expect(counterSaving.snapshot()).toMatchObject({ phase: 'victory', enemyHp: 0 });
  });
});
