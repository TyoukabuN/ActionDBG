import { describe, expect, it } from 'vitest';
import { CARDS, Combat, type CardId, type Phase, type CombatOptions } from '../src/combat';

function until(combat: Combat, phase: Phase, maxSeconds = 20): void {
  for (let elapsed = 0; combat.snapshot().phase !== phase && elapsed < maxSeconds; elapsed += .01) combat.tick(.01);
  expect(combat.snapshot().phase).toBe(phase);
}
function start(options: CombatOptions = {}, mode: 'qte' | 'queue' = 'qte'): Combat {
  const combat = new Combat(mode, options); combat.start(); return combat;
}
function play(combat: Combat, card: CardId): void {
  expect(combat.playCard(card)).toBe(true); combat.tick(.55);
}
function enemyTurn(combat: Combat): void {
  if (combat.snapshot().phase === 'planning') combat.skip();
  until(combat, 'telegraph');
}
function nextPlayer(combat: Combat): void {
  if (combat.snapshot().phase === 'counter') combat.skip();
  until(combat, 'planning');
}

describe('side-owned card turns', () => {
  it('starts player-first and restarts all side resources, counters and pending effects', () => {
    const combat = start();
    expect(CARDS.map(card => card.id)).toEqual(['quick', 'heavy', 'guard', 'counter']);
    expect(combat.snapshot()).toMatchObject({ phase: 'planning', activeSide: 'player', ap: 3, enemyAp: 3, playerTurn: 1, enemyTurn: 0, remaining: 4 });
    enemyTurn(combat); until(combat, 'counter'); combat.playCard('counter');
    combat.setPaused(true); combat.restart();
    expect(combat.snapshot()).toMatchObject({ phase: 'planning', activeSide: 'player', ap: 3, enemyAp: 3, guard: 0, playerTurn: 1, enemyTurn: 0, pendingEnemyCard: null, paused: false, lastRecoverySide: null });
    expect(combat.snapshot().cooldowns).toEqual({ quick: 0, heavy: 0, guard: 0, counter: 0 });
  });

  it('finishes a player card without refilling AP, resumes the saved player-turn timer and rejects repeats', () => {
    const combat = start(); combat.tick(1);
    play(combat, 'quick');
    expect(combat.snapshot()).toMatchObject({ phase: 'planning', activeSide: 'player', ap: 2, enemyAp: 3, enemyHp: 11, remaining: 3 });
    expect(combat.playCard('quick')).toBe(false);
    play(combat, 'guard');
    expect(combat.snapshot()).toMatchObject({ phase: 'turn-end', ap: 1, guard: 2, activeSide: 'player' });
    combat.tick(.44); expect(combat.snapshot().ap).toBe(1);
    combat.tick(.01);
    expect(combat.snapshot()).toMatchObject({ phase: 'telegraph', activeSide: 'enemy', ap: 3, enemyAp: 2, guard: 2, lastRecoverySide: 'player' });
  });

  it('never inserts player ordinary selection into an enemy turn', () => {
    const combat = start(); enemyTurn(combat);
    expect(combat.playCard('quick')).toBe(false);
    const seen = new Set<Phase>();
    while (combat.snapshot().activeSide === 'enemy') {
      seen.add(combat.snapshot().phase);
      if (combat.snapshot().phase === 'counter') combat.skip();
      combat.tick(.01);
    }
    expect(seen.has('planning')).toBe(false);
    expect(seen).toEqual(new Set(['telegraph', 'counter', 'resolve', 'turn-end']));
  });

  it('commits and pays the enemy card before Counter, cancels once and preserves player spending after enemy turn end', () => {
    const combat = start(); play(combat, 'heavy');
    expect(combat.snapshot().ap).toBe(1);
    enemyTurn(combat); until(combat, 'counter');
    expect(combat.snapshot()).toMatchObject({ ap: 3, enemyAp: 2, pendingEnemyCard: { id: 'light', kind: 'damage', cost: 1 } });
    expect(combat.playCard('counter')).toBe(true);
    expect(combat.playCard('counter')).toBe(false);
    expect(combat.snapshot()).toMatchObject({ phase: 'resolve', ap: 1, enemyAp: 2, enemyHp: 7 });
    until(combat, 'turn-end');
    expect(combat.snapshot()).toMatchObject({ ap: 1, enemyAp: 2, playerHp: 10 });
    until(combat, 'planning');
    expect(combat.snapshot()).toMatchObject({ ap: 1, enemyAp: 3, activeSide: 'player', playerTurn: 2, lastRecoverySide: 'enemy' });
    combat.skip(); until(combat, 'telegraph');
    expect(combat.snapshot()).toMatchObject({ ap: 3, enemyAp: 1, lastRecoverySide: 'player' });
  });

  it('skips Counter when the card is on cooldown despite sufficient AP', () => {
    const combat = start(); enemyTurn(combat); until(combat, 'counter'); combat.playCard('counter'); nextPlayer(combat);
    expect(combat.availability('counter')).toContain('第 3 个玩家回合');
    enemyTurn(combat); until(combat, 'resolve');
    expect(combat.snapshot()).toMatchObject({ ap: 3, activeSide: 'enemy', enemyTurn: 2 });
    expect(combat.snapshot().log.filter(line => line === 'Counter window open.')).toHaveLength(1);
    nextPlayer(combat); enemyTurn(combat); until(combat, 'counter');
    expect(combat.availability('counter')).toBeNull();
  });

  it('enemy-first Counter spending persists into the first player turn with insufficient AP for Heavy', () => {
    // Enemy-first establishes a genuine reaction before the player's first turn.
    const combat = start({ firstSide: 'enemy' });
    until(combat, 'counter'); combat.playCard('counter'); nextPlayer(combat);
    expect(combat.snapshot().ap).toBe(1);
    expect(combat.playCard('heavy')).toBe(false);
    expect(combat.availability('heavy')).toBe('Not enough action points.');
  });

  it('resolves a non-damage enemy card without offering Counter, and guard absorbs only the next hit', () => {
    const combat = start({ enemyCards: [{ id: 'defend', name: '敌方格挡', kind: 'guard', cost: 1, damage: 0, attack: 'light' }] });
    enemyTurn(combat); until(combat, 'resolve');
    expect(combat.snapshot().log).not.toContain('Counter window open.');
    nextPlayer(combat); expect(combat.snapshot().enemyGuard).toBe(2);
    play(combat, 'heavy'); expect(combat.snapshot()).toMatchObject({ enemyHp: 11, enemyGuard: 0 });
  });

  it('keeps Guard through turn end and a cancelled attack, consuming it on the next real hit', () => {
    const combat = start(); play(combat, 'guard'); enemyTurn(combat); until(combat, 'counter'); combat.playCard('counter'); nextPlayer(combat);
    expect(combat.snapshot().guard).toBe(2);
    enemyTurn(combat); until(combat, 'resolve'); nextPlayer(combat);
    expect(combat.snapshot()).toMatchObject({ playerHp: 8, guard: 0 });
  });

  it('skips damage-card Counter checks when the hand has no Counter card', () => {
    const combat = start({ playerHand: ['quick', 'guard'] });
    enemyTurn(combat); until(combat, 'resolve');
    expect(combat.snapshot().log).not.toContain('Counter window open.');
    expect(combat.playCard('counter')).toBe(false);
  });

  it('fully blocks light damage and consumes Guard once', () => {
    const combat = start(); play(combat, 'guard'); enemyTurn(combat); until(combat, 'counter'); nextPlayer(combat);
    expect(combat.snapshot()).toMatchObject({ playerHp: 10, guard: 0 });
    expect(combat.snapshot().log).toContain('Enemy attack: 2 damage guarded.');
  });

  it('retains queue reservation, removal, ordered commit and rejects direct play in queue mode', () => {
    const combat = start({}, 'queue');
    expect(combat.playCard('quick')).toBe(false);
    combat.toggleCard('heavy'); combat.toggleCard('heavy');
    expect(combat.snapshot().queue).toEqual([]);
    expect(combat.toggleCard('quick')).toBe(true); expect(combat.toggleCard('heavy')).toBe(true);
    expect(combat.toggleCard('guard')).toBe(false);
    combat.submit(); combat.submit();
    expect(combat.snapshot()).toMatchObject({ phase: 'acting', ap: 0, committed: ['quick', 'heavy'] });
    combat.tick(.55); expect(combat.snapshot()).toMatchObject({ enemyHp: 11, activeCard: 'heavy' });
    combat.tick(.55); expect(combat.snapshot()).toMatchObject({ enemyHp: 8, phase: 'turn-end', ap: 0 });
  });

  it('auto-submits queue and Counter previews on expiry without double spending', () => {
    const combat = start({}, 'queue'); combat.toggleCard('quick'); until(combat, 'counter');
    expect(combat.snapshot()).toMatchObject({ enemyHp: 11, ap: 3, enemyAp: 2 });
    combat.toggleCard('counter'); until(combat, 'resolve');
    expect(combat.snapshot()).toMatchObject({ enemyHp: 9, ap: 1 });
    combat.submit(); nextPlayer(combat); expect(combat.snapshot()).toMatchObject({ playerHp: 10, ap: 1, enemyAp: 3 });
  });

  it('uses real decision time, slow visual time and consumes deltas across turn boundaries', () => {
    const combat = start(); const initial = combat.snapshot();
    for (const delta of [NaN, Infinity, -1, 0]) combat.tick(delta);
    expect(combat.snapshot()).toEqual(initial);
    combat.tick(1); expect(combat.snapshot()).toMatchObject({ remaining: 3, visualTime: .15 });
    combat.tick(3.55);
    expect(combat.snapshot()).toMatchObject({ activeSide: 'enemy', phase: 'telegraph', ap: 3, enemyAp: 2 });
    expect(combat.snapshot().phaseElapsed).toBeCloseTo(.1);
  });

  it('pauses selection, reaction and turn-end recovery; restart removes pause', () => {
    const combat = start(); combat.skip(); combat.setPaused(true);
    const end = combat.snapshot(); combat.tick(10); expect(combat.snapshot()).toEqual(end);
    expect(combat.playCard('quick')).toBe(false);
    combat.setPaused(false); until(combat, 'counter'); combat.setPaused(true);
    const counter = combat.snapshot(); combat.tick(10); expect(combat.snapshot()).toEqual(counter);
    expect(combat.playCard('counter')).toBe(false);
    combat.restart(); expect(combat.snapshot()).toMatchObject({ phase: 'planning', paused: false });
  });

  it('returns detached snapshots including the committed enemy card and bounds logs', () => {
    const combat = start(); enemyTurn(combat);
    const snapshot = combat.snapshot(); (snapshot.pendingEnemyCard as { damage: number }).damage = 99;
    snapshot.cooldowns.counter = 99; snapshot.log.push('injected'); snapshot.queue.push('quick');
    expect(combat.snapshot().pendingEnemyCard!.damage).toBe(2);
    expect(combat.snapshot().queue).toEqual([]);
    expect(combat.snapshot().cooldowns.counter).toBe(0);
    expect(combat.snapshot().log).not.toContain('injected');
  });

  it('offers a configurable untimed player turn without consuming action budget', () => {
    const combat = start({ playerTurnSeconds: 0 }); combat.tick(99);
    expect(combat.snapshot().phase).toBe('planning');
    play(combat, 'quick'); expect(combat.snapshot()).toMatchObject({ phase: 'planning', remaining: 0, ap: 2 });
  });

  it('allows an attack strategy to win, cancels remaining work on death and freezes terminal state', () => {
    const combat = start();
    for (let cycle = 0; cycle < 8 && combat.snapshot().phase !== 'victory'; cycle++) {
      if (combat.availability('heavy') === null) play(combat, 'heavy');
      if (combat.snapshot().phase === 'planning' && combat.availability('quick') === null) play(combat, 'quick');
      if (combat.snapshot().phase === 'victory') break;
      enemyTurn(combat);
      if (combat.snapshot().phase === 'telegraph') until(combat, combat.snapshot().cooldowns.counter ? 'resolve' : 'counter');
      if (combat.snapshot().phase === 'counter') combat.playCard('counter');
      if (combat.snapshot().phase === 'victory') break;
      nextPlayer(combat);
    }
    expect(combat.snapshot()).toMatchObject({ phase: 'victory', enemyHp: 0, pendingEnemyCard: null, committed: [], activeCard: null });
    const terminal = combat.snapshot(); combat.skip(); combat.submit(); combat.tick(99);
    expect(combat.playCard('quick')).toBe(false); expect(combat.snapshot()).toEqual(terminal);
    expect(terminal.log.length).toBeLessThanOrEqual(16);
  });

  it('idle play loses; lethal damage stops recovery and further turns', () => {
    const combat = start();
    for (let cycle = 0; cycle < 6 && combat.snapshot().phase !== 'defeat'; cycle++) {
      enemyTurn(combat); until(combat, 'counter'); combat.skip();
      combat.tick(.65);
      if (combat.snapshot().phase !== 'defeat') nextPlayer(combat);
    }
    expect(combat.snapshot()).toMatchObject({ phase: 'defeat', playerHp: 0, pendingEnemyCard: null });
    const end = combat.snapshot(); combat.tick(100); expect(combat.snapshot()).toEqual(end);
  });
});
