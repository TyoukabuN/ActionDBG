import type { CombatSnapshot } from './combat';

export type ShotId =
  | 'overview' | 'enemy-windup' | 'decision' | 'quick-strike' | 'heavy-strike'
  | 'guard' | 'counter-window' | 'parry' | 'enemy-strike' | 'impact' | 'victory' | 'defeat';

export interface CameraPose {
  readonly id: ShotId;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
  /** Small authored Dutch angle in radians; stable decision shots stay level. */
  readonly roll: number;
}

const POSES: Readonly<Record<ShotId, CameraPose>> = {
  // The stable visual axis sits just behind the player's right shoulder. The
  // shoulder and cape frame the foreground while the opponent remains the
  // focal point, like a recurring manga panel rather than a distant arena cam.
  overview: { id: 'overview', position: [-4.55, 2.35, 2.75], target: [1.35, 1.3, -0.35], fov: 49, roll: 0 },
  'enemy-windup': { id: 'enemy-windup', position: [-4.25, 2.28, 2.62], target: [1.75, 1.35, -0.42], fov: 47, roll: -0.015 },
  decision: { id: 'decision', position: [-4.48, 2.42, 2.86], target: [1.35, 1.3, -0.35], fov: 49, roll: 0 },
  // Action panels keep the same screen direction but change height, cant and
  // focal length enough to read as authored cuts instead of small dollies.
  'quick-strike': { id: 'quick-strike', position: [-3.72, 1.48, 3.45], target: [0.35, 1.18, -0.12], fov: 53, roll: 0.055 },
  'heavy-strike': { id: 'heavy-strike', position: [-3.18, 1.12, 4.18], target: [0.45, 1.48, -0.08], fov: 45, roll: -0.075 },
  guard: { id: 'guard', position: [-1.05, 2.05, 5.05], target: [-1.25, 1.28, 0.3], fov: 50, roll: 0.035 },
  'counter-window': { id: 'counter-window', position: [-3.82, 2.08, 2.28], target: [1.82, 1.32, -0.4], fov: 46, roll: -0.03 },
  parry: { id: 'parry', position: [-0.18, 1.62, 5.1], target: [-0.05, 1.3, 0], fov: 52, roll: 0.085 },
  'enemy-strike': { id: 'enemy-strike', position: [-3.9, 1.68, 2.75], target: [-0.2, 1.25, 0.12], fov: 51, roll: -0.05 },
  impact: { id: 'impact', position: [-1.45, 1.45, 4.65], target: [0.15, 1.28, 0], fov: 54, roll: 0.07 },
  victory: { id: 'victory', position: [-3.55, 1.75, 4.3], target: [0.15, 1.35, 0], fov: 47, roll: -0.025 },
  defeat: { id: 'defeat', position: [-4.15, 1.28, 3.35], target: [-0.75, 0.95, 0.18], fov: 50, roll: 0.04 },
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
    if (previous && snapshot.phase === 'counter' && previous.phase !== 'counter') {
      // The slow-time decision is a stronger beat than a completed card's
      // impact hold: enter its close shot as soon as the Counter opens.
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
      case 'turn-end': return snapshot.activeSide === 'player' ? 'decision' : 'overview';
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
      roll: this.from.roll + (this.targetPose.roll - this.from.roll) * eased,
    };
    return this.pose;
  }

  private lerp3(a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
}
