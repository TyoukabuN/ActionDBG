export type CardId = 'quick' | 'heavy' | 'guard' | 'counter';
export type ControlMode = 'queue' | 'qte';

export type Phase =
  | 'ready'
  | 'telegraph'
  | 'planning'
  | 'acting'
  | 'counter'
  | 'resolve'
  | 'victory'
  | 'defeat';

export interface CardDefinition {
  readonly id: CardId;
  readonly name: string;
  readonly cost: number;
  readonly damage: number;
  readonly description: string;
  readonly cooldownRounds: number;
}

export const CARDS: readonly CardDefinition[] = [
  { id: 'quick', name: 'Quick Strike', cost: 1, damage: 1, description: 'Deal 1 damage.', cooldownRounds: 0 },
  { id: 'heavy', name: 'Heavy Strike', cost: 2, damage: 3, description: 'Deal 3 damage. One-round cooldown.', cooldownRounds: 1 },
  { id: 'guard', name: 'Guard', cost: 1, damage: 0, description: 'Reduce the next hit this round by 2.', cooldownRounds: 0 },
  { id: 'counter', name: 'Counter', cost: 2, damage: 2, description: 'Cancel the incoming attack and deal 2 damage.', cooldownRounds: 1 },
];

export interface CombatSnapshot {
  controlMode: ControlMode;
  phase: Phase;
  round: number;
  playerHp: number;
  enemyHp: number;
  ap: number;
  maxAp: number;
  remaining: number;
  queue: CardId[];
  committed: CardId[];
  activeCard: CardId | null;
  guard: number;
  enemyAttack: 'light' | 'heavy';
  enemyDamage: number;
  visualTime: number;
  phaseElapsed: number;
  paused: boolean;
  log: string[];
  cooldowns: Record<CardId, number>;
}

const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card])) as Record<CardId, CardDefinition>;
const MAX_LOG_ENTRIES = 16;
const ACTION_BEAT_SECONDS = 0.55;
const RESOLVE_SECONDS = 0.65;
const LIGHT_TELEGRAPH_SECONDS = 1.1;
const HEAVY_TELEGRAPH_SECONDS = 1.6;
const DEFAULT_REACTION_SPEED = 4;
const DEFAULT_ATTACK_SPEED = 4;
const PLAN_SECONDS = 2 + DEFAULT_REACTION_SPEED * 0.5;
const COUNTER_SECONDS = 1 + DEFAULT_REACTION_SPEED * 0.25;
const DEFAULT_ACTION_POINTS = 1 + Math.floor(DEFAULT_ATTACK_SPEED / 2);
const SLOW_MOTION = 0.15;

/** Deterministic combat rules. `tick` receives elapsed real-world seconds. */
export class Combat {
  constructor(private readonly controlMode: ControlMode = 'queue') {}

  private phase: Phase = 'ready';
  private round = 1;
  private playerHp = 10;
  private enemyHp = 12;
  private ap = DEFAULT_ACTION_POINTS;
  private maxAp = DEFAULT_ACTION_POINTS;
  private remaining = 0;
  private queue: CardId[] = [];
  private committed: CardId[] = [];
  private activeCard: CardId | null = null;
  private actionIndex = 0;
  private guard = 0;
  private enemyAttack: 'light' | 'heavy' = 'light';
  private visualTime = 0;
  private phaseElapsed = 0;
  private paused = false;
  private log: string[] = [];
  private readyRound: Partial<Record<CardId, number>> = {};
  private usedRound: Partial<Record<CardId, number>> = {};
  private enemyAttackCancelled = false;
  private started = false;
  private planningDuration = PLAN_SECONDS;
  private savedPlanningBudget = 0;

  start(): void {
    this.reset();
  }

  restart(): void {
    this.reset();
  }

  private reset(): void {
    this.phase = 'telegraph';
    this.round = 1;
    this.playerHp = 10;
    this.enemyHp = 12;
    this.maxAp = DEFAULT_ACTION_POINTS;
    this.ap = this.maxAp;
    this.remaining = LIGHT_TELEGRAPH_SECONDS;
    this.planningDuration = PLAN_SECONDS;
    this.savedPlanningBudget = 0;
    this.queue = [];
    this.committed = [];
    this.activeCard = null;
    this.actionIndex = 0;
    this.guard = 0;
    this.enemyAttack = 'light';
    this.visualTime = 0;
    this.phaseElapsed = 0;
    this.paused = false;
    this.log = [];
    this.readyRound = {};
    this.usedRound = {};
    this.enemyAttackCancelled = false;
    this.started = true;
    this.addLog('Encounter started. Light attack incoming for 2 damage.');
  }

  tick(realSeconds: number): void {
    if (!this.started || this.paused || !Number.isFinite(realSeconds) || realSeconds <= 0 || this.isTerminal()) return;

    // Consume the whole delta across phase boundaries so fixed-step callers do
    // not lose time when one tick happens to straddle a transition.
    let left = realSeconds;
    while (left > 0 && !this.paused && !this.isTerminal()) {
      const duration = this.phaseDuration();
      if (duration === null) {
        this.advanceContinuous(left);
        left = 0;
        break;
      }
      const toBoundary = Math.max(0, duration - this.phaseElapsed);
      if (toBoundary > left) {
        this.advanceContinuous(left);
        this.phaseElapsed += left;
        if (this.phase === 'planning' || this.phase === 'counter') this.remaining = Math.max(0, this.remaining - left);
        left = 0;
      } else {
        this.advanceContinuous(toBoundary);
        this.phaseElapsed = duration;
        if (this.phase === 'planning' || this.phase === 'counter') this.remaining = 0;
        left -= toBoundary;
        this.finishPhase();
      }
    }
  }

  toggleCard(id: CardId): boolean {
    if (this.controlMode === 'qte') return false;
    if (!this.started || this.paused) return false;
    if (this.phase !== 'planning' && this.phase !== 'counter') return false;
    if (!CARD_BY_ID[id] || this.availability(id) !== null) return false;

    if (this.phase === 'counter') {
      if (id !== 'counter' || this.ap < CARD_BY_ID[id].cost) return false;
      this.queue = this.queue.includes(id) ? [] : [id];
      return true;
    }

    const currentIndex = this.queue.indexOf(id);
    if (currentIndex >= 0) {
      this.queue.splice(currentIndex, 1);
      return true;
    }
    const reserved = this.queue.reduce((sum, cardId) => sum + CARD_BY_ID[cardId].cost, 0);
    if (reserved + CARD_BY_ID[id].cost > this.ap) return false;
    this.queue.push(id);
    return true;
  }

  /** Immediately plays one available card in QTE mode. */
  playCard(id: CardId): boolean {
    if (this.controlMode !== 'qte' || !this.started || this.paused || this.isTerminal()) return false;
    if (this.queue.length > 0 || !CARD_BY_ID[id] || this.availability(id) !== null) return false;

    if (this.phase === 'counter') {
      if (id !== 'counter') return false;
      this.ap -= CARD_BY_ID.counter.cost;
      this.usedRound.counter = this.round;
      this.readyRound.counter = this.round + CARD_BY_ID.counter.cooldownRounds + 1;
      this.enemyAttackCancelled = true;
      this.dealDamage('enemy', CARD_BY_ID.counter.damage, 'Counter');
      if (!this.isTerminal()) {
        this.setPhase('resolve', RESOLVE_SECONDS);
        this.addLog('Counter cancels the incoming attack.');
      }
      return true;
    }

    if (this.phase !== 'planning' || id === 'counter') return false;
    this.savedPlanningBudget = this.remaining;
    this.ap -= CARD_BY_ID[id].cost;
    this.committed = [id];
    this.actionIndex = 0;
    this.activeCard = id;
    this.setPhase('acting', ACTION_BEAT_SECONDS);
    this.addLog(`Committed: ${CARD_BY_ID[id].name}.`);
    return true;
  }

  submit(): void {
    if (!this.started || this.paused || this.isTerminal()) return;
    if (this.phase === 'planning') {
      if (this.queue.length === 0) {
        this.addLog('Planning skipped.');
        this.beginCounterOrResolve();
        return;
      }
      this.committed = [...this.queue];
      this.ap -= this.committed.reduce((sum, id) => sum + CARD_BY_ID[id].cost, 0);
      this.queue = [];
      this.actionIndex = 0;
      this.activeCard = this.committed[0] ?? null;
      this.setPhase('acting', ACTION_BEAT_SECONDS);
      this.addLog(`Committed: ${this.committed.map((id) => CARD_BY_ID[id].name).join(', ')}.`);
      return;
    }
    if (this.phase === 'counter') {
      if (!this.queue.includes('counter') || this.availability('counter') !== null || this.ap < CARD_BY_ID.counter.cost) {
        this.queue = [];
        this.skipCounter();
        return;
      }
      this.ap -= CARD_BY_ID.counter.cost;
      this.usedRound.counter = this.round;
      this.readyRound.counter = this.round + CARD_BY_ID.counter.cooldownRounds + 1;
      this.enemyAttackCancelled = true;
      this.queue = [];
      this.dealDamage('enemy', CARD_BY_ID.counter.damage, 'Counter');
      if (!this.isTerminal()) {
        this.setPhase('resolve', RESOLVE_SECONDS);
        this.addLog('Counter cancels the incoming attack.');
      }
    }
  }

  skip(): void {
    if (!this.started || this.paused || this.isTerminal()) return;
    if (this.phase === 'planning') {
      this.queue = [];
      this.addLog('Planning skipped.');
      this.beginCounterOrResolve();
    } else if (this.phase === 'counter') {
      this.queue = [];
      this.skipCounter();
    }
  }

  setPaused(paused: boolean): void {
    if (this.isTerminal()) return;
    this.paused = paused;
  }

  availability(id: CardId): string | null {
    if (!CARD_BY_ID[id]) return 'Unknown card.';
    if (this.isTerminal()) return 'Combat has ended.';
    if (this.paused) return 'Combat is paused.';
    if (this.isOnCooldown(id)) return `On cooldown until round ${this.readyRound[id]}.`;
    if (this.phase !== 'planning' && this.phase !== 'counter') return 'Card selection is unavailable in this phase.';
    if (this.phase === 'counter' && id !== 'counter') return 'Only Counter is available during the counter phase.';
    if (this.phase === 'planning' && id === 'counter') return 'Counter is only available during the counter phase.';
    if (this.queue.includes(id)) return null;
    const reserved = this.queue.reduce((sum, cardId) => sum + CARD_BY_ID[cardId].cost, 0);
    if (reserved + CARD_BY_ID[id].cost > this.ap) return 'Not enough action points.';
    return null;
  }

  snapshot(): CombatSnapshot {
    const cooldowns = {} as Record<CardId, number>;
    for (const { id } of CARDS) {
      const ready = this.readyRound[id] ?? 0;
      const used = this.usedRound[id] === this.round;
      cooldowns[id] = Math.max(0, ready - this.round - (used ? 1 : 0));
    }
    return {
      controlMode: this.controlMode,
      phase: this.phase,
      round: this.round,
      playerHp: this.playerHp,
      enemyHp: this.enemyHp,
      ap: this.ap,
      maxAp: this.maxAp,
      remaining: this.remaining,
      queue: [...this.queue],
      committed: [...this.committed],
      activeCard: this.activeCard,
      guard: this.guard,
      enemyAttack: this.enemyAttack,
      enemyDamage: this.enemyAttack === 'light' ? 2 : 4,
      visualTime: this.visualTime,
      phaseElapsed: this.phaseElapsed,
      paused: this.paused,
      log: [...this.log],
      cooldowns,
    };
  }

  private phaseDuration(): number | null {
    switch (this.phase) {
      case 'telegraph': return this.enemyAttack === 'light' ? LIGHT_TELEGRAPH_SECONDS : HEAVY_TELEGRAPH_SECONDS;
      case 'planning': return this.planningDuration;
      case 'acting': return ACTION_BEAT_SECONDS;
      case 'counter': return COUNTER_SECONDS;
      case 'resolve': return RESOLVE_SECONDS;
      default: return null;
    }
  }

  private advanceContinuous(seconds: number): void {
    this.visualTime += seconds * (this.phase === 'planning' || this.phase === 'counter' ? SLOW_MOTION : 1);
  }

  private finishPhase(): void {
    switch (this.phase) {
      case 'telegraph':
        this.setPhase('planning', PLAN_SECONDS);
        this.addLog(`Enemy ${this.enemyAttack} attack incoming for ${this.enemyDamage()} damage.`);
        break;
      case 'planning':
        if (this.queue.length > 0) this.submit();
        else {
          this.addLog('Planning window expired.');
          this.beginCounterOrResolve();
        }
        break;
      case 'acting':
        this.resolveActiveCard();
        break;
      case 'counter':
        if (this.queue.includes('counter')) this.submit();
        else {
          this.addLog('Counter window expired.');
          this.skipCounter();
        }
        break;
      case 'resolve':
        this.resolveIncomingAttackAndAdvance();
        break;
      default:
        break;
    }
  }

  private resolveActiveCard(): void {
    const id = this.committed[this.actionIndex];
    if (!id) {
      this.beginCounterOrResolve();
      return;
    }
    this.activeCard = id;
    this.usedRound[id] = this.round;
    this.readyRound[id] = this.round + CARD_BY_ID[id].cooldownRounds + 1;
    if (id === 'guard') {
      this.guard += 2;
      this.addLog('Guard is ready to reduce the next hit by 2.');
    } else {
      this.dealDamage('enemy', CARD_BY_ID[id].damage, CARD_BY_ID[id].name);
      if (this.isTerminal()) return;
    }
    this.actionIndex++;
    if (this.actionIndex < this.committed.length) {
      this.activeCard = this.committed[this.actionIndex];
      this.setPhase('acting', ACTION_BEAT_SECONDS);
    } else {
      this.committed = [];
      this.activeCard = null;
      if (this.controlMode === 'qte' && this.canResumePlanning()) {
        this.setPhase('planning', this.savedPlanningBudget);
      } else {
        this.beginCounterOrResolve();
      }
    }
  }

  private beginCounterOrResolve(): void {
    this.committed = [];
    this.activeCard = null;
    this.queue = [];
    if (this.isTerminal()) return;
    if (!this.isOnCooldown('counter') && this.ap >= CARD_BY_ID.counter.cost) {
      this.setPhase('counter', COUNTER_SECONDS);
      this.addLog('Counter window open.');
    } else {
      this.setPhase('resolve', RESOLVE_SECONDS);
    }
  }

  private skipCounter(): void {
    if (this.phase !== 'counter') return;
    this.setPhase('resolve', RESOLVE_SECONDS);
    this.addLog('Counter skipped.');
  }

  private resolveIncomingAttackAndAdvance(): void {
    if (!this.enemyAttackCancelled) {
      const prevented = Math.min(this.guard, this.enemyDamage());
      this.guard -= prevented;
      const damage = Math.max(0, this.enemyDamage() - prevented);
      if (prevented > 0) this.addLog(`Enemy attack: ${prevented} damage guarded.`);
      this.dealDamage('player', damage, 'Enemy attack');
      if (this.isTerminal()) return;
    } else {
      this.addLog('Incoming attack cancelled.');
    }
    this.round++;
    this.enemyAttack = this.enemyAttack === 'light' ? 'heavy' : 'light';
    this.ap = this.maxAp;
    this.guard = 0;
    this.enemyAttackCancelled = false;
    this.queue = [];
    this.committed = [];
    this.activeCard = null;
    this.setPhase('telegraph', this.enemyAttack === 'light' ? LIGHT_TELEGRAPH_SECONDS : HEAVY_TELEGRAPH_SECONDS);
    this.addLog(`Round ${this.round}. ${this.enemyAttack} attack incoming for ${this.enemyDamage()} damage.`);
  }

  private dealDamage(target: 'player' | 'enemy', amount: number, source: string): void {
    if (amount <= 0 || this.isTerminal()) return;
    if (target === 'enemy') {
      this.enemyHp = Math.max(0, this.enemyHp - amount);
      this.addLog(`${source} deals ${amount} damage to the enemy (${this.enemyHp} HP left).`);
      if (this.enemyHp === 0) this.endCombat('victory');
    } else {
      this.playerHp = Math.max(0, this.playerHp - amount);
      this.addLog(`${source} deals ${amount} damage to the player (${this.playerHp} HP left).`);
      if (this.playerHp === 0) this.endCombat('defeat');
    }
  }

  private endCombat(result: 'victory' | 'defeat'): void {
    this.phase = result;
    this.remaining = 0;
    this.phaseElapsed = 0;
    this.queue = [];
    this.committed = [];
    this.activeCard = null;
    this.paused = false;
    this.addLog(result === 'victory' ? 'Victory.' : 'Defeat.');
  }

  private setPhase(phase: Phase, duration = 0): void {
    this.phase = phase;
    this.phaseElapsed = 0;
    this.remaining = duration;
    if (phase === 'planning') this.planningDuration = duration;
  }

  private canResumePlanning(): boolean {
    if (this.savedPlanningBudget <= 0 || this.ap <= 0) return false;
    return (['quick', 'heavy', 'guard'] as const).some((id) =>
      !this.isOnCooldown(id) && this.ap >= CARD_BY_ID[id].cost,
    );
  }

  private isOnCooldown(id: CardId): boolean {
    return this.usedRound[id] === this.round || this.round < (this.readyRound[id] ?? 0);
  }

  private enemyDamage(): number {
    return this.enemyAttack === 'light' ? 2 : 4;
  }

  private isTerminal(): boolean {
    return this.phase === 'victory' || this.phase === 'defeat';
  }

  private addLog(message: string): void {
    this.log.push(message);
    if (this.log.length > MAX_LOG_ENTRIES) this.log.splice(0, this.log.length - MAX_LOG_ENTRIES);
  }
}
