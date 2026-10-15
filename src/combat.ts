export type CardId = 'quick' | 'heavy' | 'guard' | 'counter';
export type ControlMode = 'queue' | 'qte';
export type Side = 'player' | 'enemy';

export type Phase =
  | 'ready'
  | 'telegraph'
  | 'planning'
  | 'acting'
  | 'counter'
  | 'resolve'
  | 'turn-end'
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
  { id: 'guard', name: 'Guard', cost: 1, damage: 0, description: 'Reduce the next actual hit by 2, retaining protection across turns.', cooldownRounds: 0 },
  { id: 'counter', name: 'Counter', cost: 2, damage: 2, description: 'Cancel the incoming attack and deal 2 damage.', cooldownRounds: 1 },
];

export interface EnemyCardDefinition {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly kind: 'damage' | 'guard';
  readonly damage: number;
  readonly attack: 'light' | 'heavy';
}

export const ENEMY_CARDS: readonly EnemyCardDefinition[] = [
  { id: 'light', name: '轻攻击', cost: 1, kind: 'damage', damage: 2, attack: 'light' },
  { id: 'heavy', name: '重攻击', cost: 2, kind: 'damage', damage: 4, attack: 'heavy' },
];

export interface CombatOptions {
  readonly firstSide?: Side;
  readonly playerTurnSeconds?: number;
  readonly enemyCards?: readonly EnemyCardDefinition[];
  readonly playerHand?: readonly CardId[];
}

export interface CombatSnapshot {
  controlMode: ControlMode;
  phase: Phase;
  round: number;
  activeSide: Side;
  playerTurn: number;
  enemyTurn: number;
  enemyAp: number;
  enemyMaxAp: number;
  enemyGuard: number;
  pendingEnemyCard: EnemyCardDefinition | null;
  playerTurnSeconds: number;
  lastRecoverySide: Side | null;
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
  playerInputOpen: boolean;
  planningRemaining: number;
  pendingActions: CardId[];
  actionResolved: boolean;
}

const CARD_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card])) as Record<CardId, CardDefinition>;
const MAX_LOG_ENTRIES = 16;
export const ACTION_EFFECT_SECONDS = 0.55;
export const ACTION_RECOVERY_SECONDS = 0.24;
const RESOLVE_SECONDS = 0.65;
const TURN_END_SECONDS = 0.45;
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
  private readonly playerHand: ReadonlySet<CardId>;
  private readonly firstSide: Side;
  private readonly playerTurnSeconds: number;
  private readonly enemyCards: readonly EnemyCardDefinition[];

  constructor(private readonly controlMode: ControlMode = 'queue', options: CombatOptions = {}) {
    this.playerHand = new Set(options.playerHand ?? CARDS.map(card => card.id));
    this.firstSide = options.firstSide ?? 'player';
    this.playerTurnSeconds = options.playerTurnSeconds ?? PLAN_SECONDS;
    if (!Number.isFinite(this.playerTurnSeconds) || this.playerTurnSeconds < 0) throw new Error('Invalid player turn duration.');
    const cards = options.enemyCards ?? ENEMY_CARDS;
    if (!cards.length || cards.some(card => !Number.isFinite(card.cost) || card.cost < 0 || card.cost > DEFAULT_ACTION_POINTS || !Number.isFinite(card.damage) || card.damage < 0)) throw new Error('Invalid enemy cards.');
    this.enemyCards = cards.map(card => ({ ...card }));
  }

  private phase: Phase = 'ready';
  private round = 1;
  private activeSide: Side = 'player';
  private playerTurn = 1;
  private enemyTurn = 0;
  private enemyAp = DEFAULT_ACTION_POINTS;
  private enemyGuard = 0;
  private pendingEnemyCard: EnemyCardDefinition | null = null;
  private lastRecoverySide: Side | null = null;
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
  private playerInputOpen = false;
  private actionResolved = false;

  start(): void {
    this.reset();
  }

  restart(): void {
    this.reset();
  }

  private reset(): void {
    this.phase = 'planning';
    this.round = 1;
    this.activeSide = this.firstSide;
    this.playerTurn = this.firstSide === 'player' ? 1 : 0;
    this.enemyTurn = 0;
    this.enemyAp = DEFAULT_ACTION_POINTS;
    this.enemyGuard = 0;
    this.pendingEnemyCard = null;
    this.lastRecoverySide = null;
    this.playerHp = 10;
    this.enemyHp = 12;
    this.maxAp = DEFAULT_ACTION_POINTS;
    this.ap = this.maxAp;
    this.remaining = this.playerTurnSeconds;
    this.planningDuration = this.playerTurnSeconds;
    this.savedPlanningBudget = 0;
    this.playerInputOpen = this.firstSide === 'player';
    this.actionResolved = false;
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
    this.addLog('对决开始。');
    if (this.firstSide === 'enemy') { this.playerInputOpen = false; this.beginEnemyTurn(); }
    else this.addLog('玩家回合 1。');
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
      if (toBoundary - left > 1e-9) {
        this.advanceContinuous(left);
        this.phaseElapsed += left;
        if (this.phase === 'planning' || this.phase === 'counter') this.remaining = Math.max(0, this.remaining - left);
        left = 0;
      } else {
        this.advanceContinuous(toBoundary);
        this.phaseElapsed = duration;
        if (this.phase === 'planning' || this.phase === 'counter') this.remaining = 0;
        left = Math.max(0, left - toBoundary);
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

  /** Commits one available card immediately; ordinary actions execute in order. */
  playCard(id: CardId): boolean {
    if (this.controlMode !== 'qte' || !this.started || this.paused || this.isTerminal()) return false;
    if (this.queue.length > 0 || !CARD_BY_ID[id] || this.availability(id) !== null) return false;

    if (this.phase === 'counter') {
      if (id !== 'counter') return false;
      this.ap -= CARD_BY_ID.counter.cost;
      this.usedRound.counter = this.playerTurn;
      this.readyRound.counter = this.playerTurn + CARD_BY_ID.counter.cooldownRounds + 1;
      this.enemyAttackCancelled = true;
      this.dealDamage('enemy', CARD_BY_ID.counter.damage, 'Counter');
      if (!this.isTerminal()) {
        this.setPhase('resolve', RESOLVE_SECONDS);
        this.addLog('Counter cancels the incoming attack.');
      }
      return true;
    }

    if ((this.phase !== 'planning' && this.phase !== 'acting') || id === 'counter' || !this.playerInputOpen) return false;
    if (this.committed.includes(id)) return false;
    if (this.phase === 'acting') {
      this.commitOrdinaryCard(id);
      this.committed.push(id);
      this.addLog(`Committed: ${CARD_BY_ID[id].name}.`);
      if (!this.hasLegalOrdinaryCard()) this.playerInputOpen = false;
      return true;
    }
    this.savedPlanningBudget = this.remaining;
    this.commitOrdinaryCard(id);
    this.committed = [id]; this.actionIndex = 0;
    this.activeCard = id; this.actionResolved = false;
    this.setPhase('acting', ACTION_EFFECT_SECONDS);
    this.addLog(`Committed: ${CARD_BY_ID[id].name}.`);
    if (!this.hasLegalOrdinaryCard()) this.playerInputOpen = false;
    return true;
  }

  submit(): void {
    if (!this.started || this.paused || this.isTerminal()) return;
    if (this.phase === 'acting' && this.activeSide === 'player') {
      this.playerInputOpen = false;
      this.addLog('Planning skipped.');
      return;
    }
    if (this.phase === 'planning') {
      if (this.queue.length === 0) {
        this.addLog('Planning skipped.');
        this.endTurn();
        return;
      }
      this.savedPlanningBudget = this.remaining;
      this.committed = [...this.queue];
      this.ap -= this.committed.reduce((sum, id) => sum + CARD_BY_ID[id].cost, 0);
      for (const id of this.committed) this.markCardUsed(id);
      this.playerInputOpen = false;
      this.queue = [];
      this.actionIndex = 0;
      this.activeCard = this.committed[0] ?? null;
      this.setPhase('acting', ACTION_EFFECT_SECONDS);
      this.actionResolved = false;
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
      this.usedRound.counter = this.playerTurn;
      this.readyRound.counter = this.playerTurn + CARD_BY_ID.counter.cooldownRounds + 1;
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
      this.playerInputOpen = false;
      this.addLog('Planning skipped.');
      this.endTurn();
    } else if (this.phase === 'acting' && this.activeSide === 'player') {
      this.playerInputOpen = false;
      if (this.committed.length === 0) this.endTurn();
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
    if (!this.playerHand.has(id)) return '当前手牌中没有这张牌。';
    if (this.isTerminal()) return 'Combat has ended.';
    if (this.paused) return 'Combat is paused.';
    if (this.isOnCooldown(id)) return `冷却中，第 ${this.readyRound[id]} 个玩家回合可用。`;
    if (this.phase !== 'planning' && this.phase !== 'acting' && this.phase !== 'counter') return 'Card selection is unavailable in this phase.';
    if (this.phase === 'planning' && this.activeSide !== 'player') return '敌人回合只能按触发条件反击。';
    if (this.phase !== 'counter' && !this.playerInputOpen) return 'Card submission is closed.';
    if (this.phase === 'counter' && id !== 'counter') return 'Only Counter is available during the counter phase.';
    if (this.phase === 'planning' && id === 'counter') return 'Counter is only available during the counter phase.';
    if (this.phase === 'acting' && id === 'counter') return 'Counter is only available during the counter phase.';
    if (this.queue.includes(id)) return null;
    if (this.committed.includes(id)) return 'Card is already committed this turn.';
    const reserved = this.queue.reduce((sum, cardId) => sum + CARD_BY_ID[cardId].cost, 0);
    if (reserved + CARD_BY_ID[id].cost > this.ap) return 'Not enough action points.';
    return null;
  }

  snapshot(): CombatSnapshot {
    const cooldowns = {} as Record<CardId, number>;
    for (const { id } of CARDS) {
      const ready = this.readyRound[id] ?? 0;
      const used = this.usedRound[id] === this.playerTurn;
      cooldowns[id] = Math.max(0, ready - this.playerTurn - (used ? 1 : 0));
    }
    return {
      controlMode: this.controlMode,
      phase: this.phase,
      round: this.round,
      activeSide: this.activeSide,
      playerTurn: this.playerTurn,
      enemyTurn: this.enemyTurn,
      enemyAp: this.enemyAp,
      enemyMaxAp: DEFAULT_ACTION_POINTS,
      enemyGuard: this.enemyGuard,
      pendingEnemyCard: this.pendingEnemyCard ? { ...this.pendingEnemyCard } : null,
      playerTurnSeconds: this.playerTurnSeconds,
      lastRecoverySide: this.lastRecoverySide,
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
      enemyDamage: this.enemyDamage(),
      visualTime: this.visualTime,
      phaseElapsed: this.phaseElapsed,
      paused: this.paused,
      log: [...this.log],
      cooldowns,
      playerInputOpen: this.playerInputOpen,
      planningRemaining: this.phase === 'acting' ? this.savedPlanningBudget : this.remaining,
      pendingActions: this.phase === 'acting' ? this.committed.slice(this.actionIndex + 1) : [],
      actionResolved: this.actionResolved,
    };
  }

  private phaseDuration(): number | null {
    switch (this.phase) {
      case 'telegraph': return this.enemyAttack === 'light' ? LIGHT_TELEGRAPH_SECONDS : HEAVY_TELEGRAPH_SECONDS;
      case 'planning': return this.playerTurnSeconds === 0 ? null : this.planningDuration;
      case 'acting': return this.actionResolved ? ACTION_EFFECT_SECONDS + ACTION_RECOVERY_SECONDS : ACTION_EFFECT_SECONDS;
      case 'counter': return COUNTER_SECONDS;
      case 'resolve': return RESOLVE_SECONDS;
      case 'turn-end': return TURN_END_SECONDS;
      default: return null;
    }
  }

  private advanceContinuous(seconds: number): void {
    this.visualTime += seconds * (this.phase === 'planning' || this.phase === 'counter' ? SLOW_MOTION : 1);
  }

  private finishPhase(): void {
    switch (this.phase) {
      case 'telegraph':
        this.checkCounterOrResolve();
        break;
      case 'planning':
        if (this.queue.length > 0) this.submit();
        else {
          this.addLog('Planning window expired.');
          this.endTurn();
        }
        break;
      case 'acting':
        if (!this.actionResolved) this.resolveActiveCard();
        else this.finishActiveAction();
        break;
      case 'counter':
        if (this.queue.includes('counter')) this.submit();
        else {
          this.addLog('Counter window expired.');
          this.skipCounter();
        }
        break;
      case 'resolve':
        this.resolveEnemyCard();
        break;
      case 'turn-end':
        this.finishTurn();
        break;
      default:
        break;
    }
  }

  private resolveActiveCard(): void {
    const id = this.committed[this.actionIndex];
    if (!id) {
      this.endTurn();
      return;
    }
    this.activeCard = id;
    this.actionResolved = true;
    if (id === 'guard') {
      this.guard = 2;
      this.addLog('Guard is ready to reduce the next hit by 2.');
    } else {
      this.dealDamage('enemy', CARD_BY_ID[id].damage, CARD_BY_ID[id].name);
      if (this.isTerminal()) return;
    }
    // Keep phaseElapsed monotonic across the effect and recovery boundaries.
  }

  private finishActiveAction(): void {
    this.actionResolved = false;
    this.actionIndex++;
    if (this.actionIndex < this.committed.length) {
      this.activeCard = this.committed[this.actionIndex];
      this.setPhase('acting', ACTION_EFFECT_SECONDS);
    } else {
      this.committed = [];
      this.activeCard = null;
      if (this.controlMode === 'qte' && this.playerInputOpen && this.canResumePlanning()) {
        this.setPhase('planning', this.savedPlanningBudget);
      } else {
        this.endTurn();
      }
    }
  }

  private endTurn(): void {
    if (this.isTerminal() || this.phase === 'turn-end') return;
    this.queue = []; this.committed = []; this.activeCard = null;
    this.playerInputOpen = false; this.actionResolved = false;
    this.setPhase('turn-end', TURN_END_SECONDS);
  }

  private finishTurn(): void {
    if (this.isTerminal()) return;
    this.lastRecoverySide = this.activeSide;
    if (this.activeSide === 'player') {
      this.ap = this.maxAp;
      this.addLog('玩家回合结束，玩家行动点恢复至 3。');
      this.beginEnemyTurn();
    } else {
      this.enemyAp = DEFAULT_ACTION_POINTS;
      this.addLog('敌人回合结束，敌人行动点恢复至 3。');
      this.pendingEnemyCard = null;
      this.enemyAttackCancelled = false;
      this.activeSide = 'player';
      this.enemyAttack = this.enemyCards[this.enemyTurn % this.enemyCards.length].attack;
      this.playerTurn++;
      this.round = this.playerTurn;
      this.setPhase('planning', this.playerTurnSeconds);
      this.playerInputOpen = true;
      this.addLog(`玩家回合 ${this.playerTurn}。`);
    }
  }

  private beginEnemyTurn(): void {
    this.activeSide = 'enemy';
    this.enemyTurn++;
    this.enemyAttackCancelled = false;
    const card = this.enemyCards[(this.enemyTurn - 1) % this.enemyCards.length];
    this.pendingEnemyCard = { ...card };
    this.enemyAttack = card.attack;
    this.enemyAp -= card.cost;
    this.addLog(`敌人出牌：${card.name}，消耗 ${card.cost} 点行动点。`);
    this.setPhase('telegraph', card.attack === 'heavy' ? HEAVY_TELEGRAPH_SECONDS : LIGHT_TELEGRAPH_SECONDS);
  }

  private checkCounterOrResolve(): void {
    const card = this.pendingEnemyCard;
    const usable = card?.kind === 'damage' && card.damage > 0
      && this.playerHand.has('counter') && !this.isOnCooldown('counter') && this.ap >= CARD_BY_ID.counter.cost;
    if (usable) {
      this.setPhase('counter', COUNTER_SECONDS);
      this.addLog('Counter window open.');
    } else this.setPhase('resolve', RESOLVE_SECONDS);
  }

  private skipCounter(): void {
    if (this.phase !== 'counter') return;
    this.queue = [];
    this.setPhase('resolve', RESOLVE_SECONDS);
    this.addLog('Counter skipped.');
  }

  private resolveEnemyCard(): void {
    const card = this.pendingEnemyCard;
    if (!card) throw new Error('Enemy resolution requires a committed card.');
    if (!this.enemyAttackCancelled) {
      if (card.kind === 'damage') {
        const prevented = Math.min(this.guard, card.damage);
        // Guard protects the next actual hit only; a cancelled hit does not consume it.
        this.guard = 0;
        if (prevented > 0) this.addLog(`Enemy attack: ${prevented} damage guarded.`);
        this.dealDamage('player', Math.max(0, card.damage - prevented), 'Enemy attack');
        if (this.isTerminal()) return;
      } else {
        this.enemyGuard = 2;
        this.addLog('敌人架起格挡，下次受击减伤 2 点。');
      }
    } else this.addLog('Incoming attack cancelled.');
    this.endTurn();
  }

  private dealDamage(target: 'player' | 'enemy', amount: number, source: string): void {
    if (amount <= 0 || this.isTerminal()) return;
    if (target === 'enemy') {
      const prevented = Math.min(this.enemyGuard, amount);
      this.enemyGuard = 0;
      amount -= prevented;
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
    this.pendingEnemyCard = null;
    this.paused = false;
    this.playerInputOpen = false;
    this.actionResolved = false;
    this.addLog(result === 'victory' ? 'Victory.' : 'Defeat.');
  }

  private setPhase(phase: Phase, duration = 0): void {
    this.phase = phase;
    this.phaseElapsed = 0;
    this.remaining = duration;
    if (phase === 'planning') this.planningDuration = duration;
  }

  private canResumePlanning(): boolean {
    if ((this.playerTurnSeconds > 0 && this.savedPlanningBudget <= 0) || this.ap <= 0) return false;
    return (['quick', 'heavy', 'guard'] as const).some((id) =>
      this.playerHand.has(id) && !this.isOnCooldown(id) && this.ap >= CARD_BY_ID[id].cost,
    );
  }

  private commitOrdinaryCard(id: CardId): void {
    this.ap -= CARD_BY_ID[id].cost;
    this.markCardUsed(id);
  }

  private markCardUsed(id: CardId): void {
    this.usedRound[id] = this.playerTurn;
    this.readyRound[id] = this.playerTurn + CARD_BY_ID[id].cooldownRounds + 1;
  }

  private hasLegalOrdinaryCard(): boolean {
    return (['quick', 'heavy', 'guard'] as const).some(id => this.playerHand.has(id) && !this.isOnCooldown(id)
      && !this.committed.includes(id) && this.ap >= CARD_BY_ID[id].cost);
  }

  private isOnCooldown(id: CardId): boolean {
    return this.usedRound[id] === this.playerTurn || this.playerTurn < (this.readyRound[id] ?? 0);
  }

  private enemyDamage(): number {
    return this.pendingEnemyCard?.damage ?? this.enemyCards[this.enemyTurn % this.enemyCards.length].damage;
  }

  private isTerminal(): boolean {
    return this.phase === 'victory' || this.phase === 'defeat';
  }

  private addLog(message: string): void {
    this.log.push(message);
    if (this.log.length > MAX_LOG_ENTRIES) this.log.splice(0, this.log.length - MAX_LOG_ENTRIES);
  }
}
