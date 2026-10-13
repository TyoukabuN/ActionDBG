import type { CombatSnapshot } from './combat';

export type ShotId =
  | 'overview' | 'enemy-windup' | 'decision' | 'quick-strike' | 'heavy-strike'
  | 'guard' | 'counter-window' | 'parry' | 'enemy-strike' | 'impact' | 'victory' | 'defeat';

export interface CameraPose {
  readonly id: ShotId;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
}

const POSES: Readonly<Record<ShotId, CameraPose>> = {
  overview: { id: 'overview', position: [-8, 4.2, 8], target: [0.4, 1.4, 0], fov: 36 },
  'enemy-windup': { id: 'enemy-windup', position: [-1.6, 2.7, 7.2], target: [0.8, 1.3, 0], fov: 44 },
  decision: { id: 'decision', position: [-6.2, 3.4, 8.2], target: [0.2, 1.35, 0], fov: 41 },
  'quick-strike': { id: 'quick-strike', position: [-4.6, 2.5, 6.8], target: [-0.4, 1.3, 0], fov: 44 },
  'heavy-strike': { id: 'heavy-strike', position: [-3.6, 2, 7.5], target: [-0.1, 1.35, 0], fov: 44 },
  guard: { id: 'guard', position: [-5.4, 2.6, 6.8], target: [-0.8, 1.3, 0.2], fov: 46 },
  'counter-window': { id: 'counter-window', position: [0.4, 2.8, 7.5], target: [0.1, 1.3, 0], fov: 44 },
  parry: { id: 'parry', position: [-0.3, 2.5, 7.3], target: [-0.2, 1.35, 0], fov: 46 },
  'enemy-strike': { id: 'enemy-strike', position: [-1.8, 2.5, 7.3], target: [0.3, 1.25, 0], fov: 45 },
  impact: { id: 'impact', position: [-2.9, 2.4, 7], target: [-0.2, 1.35, 0], fov: 45 },
  victory: { id: 'victory', position: [-6.6, 3.6, 8.4], target: [0, 1.25, 0], fov: 39 },
  defeat: { id: 'defeat', position: [-6.6, 3.1, 8.4], target: [0, 1.1, 0], fov: 39 },
};

const TRANSITION_SECONDS = 0.18;
const IMPACT_HOLD_SECONDS = 0.34;
const MAX_DELTA = 0.1;

/** Selects authored same-side camera poses from presentation snapshots only. */
export class CameraDirector {
  private previous: CombatSnapshot | null = null;
  private pose: CameraPose = POSES.overview;
  private from: CameraPose = POSES.overview;
  private targetPose: CameraPose = POSES.overview;
  private transition = TRANSITION_SECONDS;
  private holdRemaining = 0;
  private heldShot: ShotId | null = null;
  private cancelledResolveRound: number | null = null;

  get current(): CameraPose { return this.pose; }

  reset(): CameraPose {
    this.previous = null;
    this.pose = this.from = this.targetPose = POSES.overview;
    this.transition = TRANSITION_SECONDS;
    this.holdRemaining = 0;
    this.heldShot = null;
    this.cancelledResolveRound = null;
    return this.pose;
  }

  update(snapshot: CombatSnapshot, realSeconds: number, reducedMotion = false): CameraPose {
    // Paused snapshots do not establish new events or advance a transition.
    if (snapshot.paused) return this.pose;
    const delta = Number.isFinite(realSeconds) ? Math.min(MAX_DELTA, Math.max(0, realSeconds)) : 0;
    const previous = this.previous;
    this.previous = snapshot;

    if (reducedMotion) {
      this.reset();
      this.previous = snapshot;
      return this.pose;
    }
    if (snapshot.phase === 'ready' || (previous && (
      snapshot.visualTime < previous.visualTime
      || snapshot.playerHp > previous.playerHp
      || snapshot.enemyHp > previous.enemyHp
    ))) return this.reset();

    if (previous && snapshot.phase === 'acting'
      && (previous.phase !== 'acting' || previous.activeCard !== snapshot.activeCard)) {
      // A new button press takes priority over the previous strike's hold.
      this.heldShot = null;
      this.holdRemaining = 0;
    }
    if (previous) {
      const enemyLost = previous.enemyHp > snapshot.enemyHp;
      const playerLost = previous.playerHp > snapshot.playerHp;
      const guardConsumed = previous.phase === 'resolve' && previous.guard > snapshot.guard
        && this.cancelledResolveRound !== previous.round;
      if (enemyLost || playerLost || guardConsumed) {
        const parry = enemyLost && previous.phase === 'counter';
        this.cancelledResolveRound = parry && snapshot.phase === 'resolve' ? snapshot.round : null;
        this.heldShot = parry ? 'parry' : 'impact';
        this.holdRemaining = IMPACT_HOLD_SECONDS;
        this.select(POSES[this.heldShot]);
      }
    }

    if (this.cancelledResolveRound !== null) {
      if (snapshot.phase !== 'resolve' || snapshot.round !== this.cancelledResolveRound) {
        this.cancelledResolveRound = null;
      } else {
        this.select(POSES.parry);
      }
    }

    if (this.holdRemaining > 0) {
      this.holdRemaining = Math.max(0, this.holdRemaining - delta);
      if (this.holdRemaining > 0) return this.advance(delta);
      this.heldShot = null;
    }

    this.select(this.cancelledResolveRound !== null
      ? POSES.parry
      : POSES[this.shotFor(snapshot)]);
    return this.advance(delta);
  }

  private shotFor(snapshot: CombatSnapshot): ShotId {
    switch (snapshot.phase) {
      case 'ready': return 'overview';
      case 'telegraph': return 'enemy-windup';
      case 'planning': return 'decision';
      case 'acting':
        if (snapshot.activeCard === 'guard') return 'guard';
        if (snapshot.activeCard === 'heavy') return 'heavy-strike';
        return 'quick-strike';
      case 'counter': return 'counter-window';
      case 'resolve': return 'enemy-strike';
      case 'victory': return 'victory';
      case 'defeat': return 'defeat';
    }
  }

  private select(next: CameraPose): void {
    if (next.id === this.targetPose.id) return;
    this.from = this.pose;
    this.targetPose = next;
    this.transition = 0;
  }

  private advance(delta: number): CameraPose {
    if (this.transition >= TRANSITION_SECONDS) return this.pose;
    this.transition = Math.min(TRANSITION_SECONDS, this.transition + delta);
    const t = this.transition / TRANSITION_SECONDS;
    const eased = t * t * (3 - 2 * t);
    this.pose = {
      id: this.targetPose.id,
      position: this.lerp3(this.from.position, this.targetPose.position, eased),
      target: this.lerp3(this.from.target, this.targetPose.target, eased),
      fov: this.from.fov + (this.targetPose.fov - this.from.fov) * eased,
    };
    return this.pose;
  }

  private lerp3(a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
}
