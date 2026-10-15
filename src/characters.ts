import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ACTION_EFFECT_SECONDS, ACTION_RECOVERY_SECONDS, type CombatSnapshot, type Side } from './combat';

export type CharacterVariant = 'knight' | 'barbarian';

const HEIGHT = 2.85;
const HIT_FLASH_COLOR = new THREE.Color('#ff362b');
const BLOCK_FLASH_COLOR = new THREE.Color('#fff1c1');
const CLIP = {
  idle: 'Idle',
  quick: '1H_Melee_Attack_Slice_Horizontal',
  heavy: '1H_Melee_Attack_Chop',
  stab: '1H_Melee_Attack_Stab',
  block: 'Block',
  blocking: 'Blocking',
  blockHit: 'Block_Hit',
  blockAttack: 'Block_Attack',
  hit: 'Hit_A',
  death: 'Death_A',
  deathPose: 'Death_A_Pose',
  cheer: 'Cheer',
} as const;

// The horizontal slash crosses the opponent shortly AFTER the native loop's
// start. Begin in its preparation segment, wrap once, then finish the recovery.
// These fractions were checked against the bundled weapon/bone motion.
const QUICK_PHASES = { start: 0.45, anticipation: 0.95, contact: 1 + 1 / 15, end: 2 };
const HEAVY_PHASES = { start: 0, anticipation: 0.25, contact: 0.55, end: 1 };
function attackPhases(clip: string) { return clip === CLIP.quick ? QUICK_PHASES : HEAVY_PHASES; }

const EQUIPMENT: Record<CharacterVariant, { weapon: string; shield: string; remove: string[] }> = {
  knight: {
    weapon: '1H_Sword', shield: 'Round_Shield',
    remove: ['1H_Sword_Offhand', 'Badge_Shield', 'Rectangle_Shield', 'Spike_Shield', '2H_Sword'],
  },
  barbarian: {
    weapon: '1H_Axe', shield: 'Barbarian_Round_Shield',
    remove: ['1H_Axe_Offhand', '2H_Axe', 'Mug'],
  },
};

type Cues = { counterResolved: boolean; hit: number; block: number };

/** A snapshot-driven, deterministic view adapter for one KayKit fighter. */
export class CharacterVisual {
  readonly object: THREE.Group;
  private readonly mixer: THREE.AnimationMixer;
  private readonly clips = new Map<string, THREE.AnimationClip>();
  private readonly resources: { geometries: Set<THREE.BufferGeometry>; materials: Set<THREE.Material>; textures: Set<THREE.Texture>; skeletons: Set<THREE.Skeleton> };
  private readonly chest: THREE.Object3D | null;
  private readonly shield: THREE.Object3D | null;
  private readonly standardMaterials: Array<{ material: THREE.MeshStandardMaterial; color: THREE.Color; emissive: THREE.Color; intensity: number }>;
  private selectedClip = '';
  private selectedTime = 0;
  private terminalElapsed = 0;
  private terminalPhase: CombatSnapshot['phase'] | null = null;
  private previousVisualTime = 0;
  private disposed = false;

  private constructor(object: THREE.Group, model: THREE.Group, clips: THREE.AnimationClip[], resources: CharacterVisual['resources'], chest: THREE.Object3D | null, shield: THREE.Object3D | null) {
    this.object = object;
    this.mixer = new THREE.AnimationMixer(model);
    this.resources = resources;
    this.chest = chest;
    this.shield = shield;
    this.standardMaterials = [...resources.materials].filter((material): material is THREE.MeshStandardMaterial => (material as THREE.MeshStandardMaterial).isMeshStandardMaterial)
      .map((material) => ({ material, color: material.color.clone(), emissive: material.emissive.clone(), intensity: material.emissiveIntensity }));
    for (const clip of clips) this.clips.set(clip.name, clip);
  }

  static async load(url: string, variant: CharacterVariant): Promise<CharacterVisual> {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const resources = { geometries: new Set<THREE.BufferGeometry>(), materials: new Set<THREE.Material>(), textures: new Set<THREE.Texture>(), skeletons: new Set<THREE.Skeleton>() };
    try {
      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (mesh.geometry) resources.geometries.add(mesh.geometry);
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of mats) if (material) {
          resources.materials.add(material);
          for (const value of Object.values(material)) if ((value as THREE.Texture | null)?.isTexture) resources.textures.add(value as THREE.Texture);
        }
        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) resources.skeletons.add((mesh as THREE.SkinnedMesh).skeleton);
      });

      const equipment = EQUIPMENT[variant];
      const clipNames = new Set(gltf.animations.map((clip) => clip.name));
      const requiredClips = Object.values(CLIP);
      const missingClips = requiredClips.filter((name) => !clipNames.has(name));
      if (missingClips.length) throw new Error(`Character asset is missing clips: ${missingClips.join(', ')}`);
      if (!model.getObjectByName(equipment.weapon) || !model.getObjectByName(equipment.shield)) throw new Error(`Character asset is missing ${variant} equipment.`);
      if (!model.getObjectByName('root') || !model.getObjectByName('chest')) throw new Error('Character asset is missing required root/chest bones.');
      let hasSkinnedMesh = false;
      model.traverse((node) => { if ((node as THREE.SkinnedMesh).isSkinnedMesh) hasSkinnedMesh = true; });
      if (!hasSkinnedMesh) throw new Error('Character asset contains no skinned mesh.');
      const shield = model.getObjectByName(equipment.shield) ?? null;
      const discarded: THREE.Object3D[] = [];
      model.traverse((node) => {
        if (equipment.remove.some((name) => node.name === name)) discarded.push(node);
        if (node.name === equipment.weapon || node.name === equipment.shield) node.visible = true;
        node.layers.set(1);
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; }
      });
      for (const node of discarded) node.removeFromParent();

      const clips = gltf.animations;
      for (const clip of clips) {
        for (const track of clip.tracks) {
          const name = track.name.toLowerCase();
          if (name !== 'root.position' || track.getValueSize() < 3) continue;
          const size = track.getValueSize();
          const x = track.values[0];
          const z = track.values[2];
          for (let i = 0; i < track.values.length; i += size) { track.values[i] = x; track.values[i + 2] = z; }
        }
      }

      const mixer = new THREE.AnimationMixer(model);
      const idle = clips.find((clip) => clip.name === CLIP.idle);
      if (idle) { mixer.clipAction(idle).play(); mixer.update(0); }
      model.updateMatrixWorld(true);
      const bodyBounds = new THREE.Box3();
      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || /sword|axe|shield|offhand|mug/i.test(node.name)) return;
        bodyBounds.expandByObject(mesh);
      });
      if (bodyBounds.isEmpty()) modelBounds(model, bodyBounds);
      const size = bodyBounds.getSize(new THREE.Vector3());
      const scale = HEIGHT / Math.max(size.y, 0.001);
      const center = bodyBounds.getCenter(new THREE.Vector3());
      const wrapper = new THREE.Group();
      wrapper.add(model);
      wrapper.scale.setScalar(scale);
      wrapper.position.set(-center.x * scale, -bodyBounds.min.y * scale, -center.z * scale);
      wrapper.layers.set(1);
      wrapper.updateMatrixWorld(true);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);

      const chest = model.getObjectByName('chest') ?? null;
      const visual = new CharacterVisual(wrapper, model, clips, resources, chest, shield);
      visual.sample(CLIP.idle, 0, true);
      return visual;
    } catch (error) {
      releaseResources(resources);
      throw error;
    }
  }

  get clipName(): string { return this.selectedClip; }
  get poseTime(): number { return this.selectedTime; }

  update(snapshot: CombatSnapshot, side: Side, realSeconds: number, cues: Cues): void {
    if (this.disposed) return;
    if (snapshot.paused) return;
    const dt = Number.isFinite(realSeconds) ? Math.max(0, realSeconds) : 0;
    const reset = snapshot.visualTime < this.previousVisualTime || (snapshot.phase === 'ready' && this.terminalPhase !== null);
    this.previousVisualTime = snapshot.visualTime;
    if (reset) { this.terminalElapsed = 0; this.terminalPhase = null; }
    if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') {
      if (this.terminalPhase !== snapshot.phase) { this.terminalPhase = snapshot.phase; this.terminalElapsed = 0; }
      else this.terminalElapsed += dt;
    } else {
      this.terminalPhase = null;
      this.terminalElapsed = 0;
    }

    if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') {
      const winning = (snapshot.phase === 'victory' && side === 'player') || (snapshot.phase === 'defeat' && side === 'enemy');
      const first = winning ? CLIP.cheer : CLIP.death;
      const t = this.terminalElapsed;
      if (!winning && t >= this.duration(first)) this.sample(CLIP.deathPose, 0);
      else this.sample(first, Math.min(t, this.duration(first)));
      return;
    }

    const hit = clamp(cues.hit), block = clamp(cues.block);
    const flash = Math.max(hit, block);
    const flashColor = hit >= block ? HIT_FLASH_COLOR : BLOCK_FLASH_COLOR;
    for (const original of this.standardMaterials) {
      original.material.color.copy(original.color).lerp(flashColor, flash * 0.24);
      original.material.emissive.copy(original.emissive).lerp(flashColor, flash);
      original.material.emissiveIntensity = original.intensity + flash * 1.8;
    }
    const cue = hit >= block && hit > 0 ? { clip: CLIP.hit, time: (1 - hit) * this.duration(CLIP.hit) } : block > 0 ? { clip: CLIP.blockHit, time: (1 - block) * this.duration(CLIP.blockHit) } : null;
    if (cues.counterResolved && side === 'enemy' && snapshot.phase === 'resolve') {
      this.sample(CLIP.hit, this.duration(CLIP.hit) * clamp(snapshot.phaseElapsed / 0.32));
      return;
    }
    if (cue) { this.sample(cue.clip, cue.time); return; }

    if (cues.counterResolved && side === 'player') {
      this.sample(CLIP.blockAttack, remap(snapshot.phaseElapsed, 0, 0.65, this.duration(CLIP.blockAttack) * 0.5, this.duration(CLIP.blockAttack)));
      return;
    }

    if (snapshot.phase === 'acting' && side === 'player' && snapshot.activeCard) {
      if (snapshot.activeCard === 'guard') {
        if (snapshot.phaseElapsed < ACTION_EFFECT_SECONDS) this.sample(CLIP.block, remap(snapshot.phaseElapsed, 0, ACTION_EFFECT_SECONDS, 0, this.duration(CLIP.block) * 0.4));
        else this.sample(CLIP.blocking, 0);
      } else {
        const clip = snapshot.activeCard === 'heavy' ? CLIP.heavy : snapshot.activeCard === 'counter' ? CLIP.stab : CLIP.quick;
        const phases = attackPhases(clip);
        const phase = snapshot.phaseElapsed <= ACTION_EFFECT_SECONDS
          ? remap(snapshot.phaseElapsed, 0, ACTION_EFFECT_SECONDS, phases.start, phases.contact)
          : remap(snapshot.phaseElapsed, ACTION_EFFECT_SECONDS, ACTION_EFFECT_SECONDS + ACTION_RECOVERY_SECONDS, phases.contact, phases.end);
        this.sampleAttack(clip, phase);
      }
      return;
    }

    if (snapshot.phase === 'counter' && side === 'enemy') {
      const clip = snapshot.enemyAttack === 'heavy' ? CLIP.heavy : CLIP.quick;
      this.sampleAttack(clip, attackPhases(clip).anticipation);
      return;
    }
    if (snapshot.phase === 'telegraph' && side === 'enemy') {
      const clip = snapshot.enemyAttack === 'heavy' ? CLIP.heavy : CLIP.quick;
      const telegraphDuration = snapshot.enemyAttack === 'heavy' ? 1.6 : 1.1;
      const phases = attackPhases(clip);
      this.sampleAttack(clip, remap(snapshot.phaseElapsed, 0, telegraphDuration, phases.start, phases.anticipation));
      return;
    }
    if (snapshot.phase === 'resolve' && side === 'enemy') {
      const clip = snapshot.enemyAttack === 'heavy' ? CLIP.heavy : CLIP.quick;
      const phases = attackPhases(clip);
      this.sampleAttack(clip, remap(snapshot.phaseElapsed, 0, 0.65, phases.anticipation, phases.contact));
      return;
    }
    if (side === 'player' && snapshot.guard > 0) { this.sample(CLIP.blocking, 0); return; }
    if (snapshot.phase === 'turn-end' && side === 'enemy' && snapshot.phaseElapsed < 0.18) {
      if (cues.counterResolved) { this.sample(CLIP.idle, snapshot.visualTime % this.duration(CLIP.idle)); return; }
      const clip = snapshot.enemyAttack === 'heavy' ? CLIP.heavy : CLIP.quick;
      const phases = attackPhases(clip);
      this.sampleAttack(clip, remap(snapshot.phaseElapsed, 0, 0.18, phases.contact, phases.end));
      return;
    }
    this.sample(CLIP.idle, snapshot.visualTime % this.duration(CLIP.idle));
  }

  contactPosition(target: THREE.Vector3, kind: 'body' | 'shield'): THREE.Vector3 {
    if (kind === 'shield' && this.shield) {
      this.shield.updateWorldMatrix(true, false);
      const bounds = new THREE.Box3().setFromObject(this.shield);
      if (!bounds.isEmpty()) return bounds.getCenter(target);
    }
    if (this.chest) { this.chest.getWorldPosition(target); return target; }
    const bounds = new THREE.Box3().setFromObject(this.object);
    return bounds.isEmpty() ? this.object.getWorldPosition(target) : bounds.getCenter(target);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
    releaseResources(this.resources);
    this.object.removeFromParent();
  }

  private duration(name: string): number { return this.clips.get(name)?.duration ?? 1; }

  private sampleAttack(name: string, phase: number): void {
    const fraction = phase > 1 ? phase % 1 : phase;
    this.sample(name, fraction * this.duration(name));
  }

  private sample(name: string, time: number, force = false): void {
    const clip = this.clips.get(name) ?? this.clips.get(CLIP.idle);
    if (!clip) return;
    const bounded = clip.duration > 0 ? clamp(time / clip.duration) * clip.duration : 0;
    if (force || this.selectedClip !== clip.name) {
      this.mixer.stopAllAction();
      const action = this.mixer.clipAction(clip);
      action.reset(); action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
      this.selectedClip = clip.name;
    }
    const action = this.mixer.clipAction(clip);
    action.time = bounded;
    this.mixer.update(0);
    this.selectedTime = bounded;
  }
}

function remap(value: number, fromA: number, fromB: number, toA: number, toB: number): number {
  return toA + (toB - toA) * clamp((value - fromA) / (fromB - fromA));
}

function clamp(value: number): number { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }

function modelBounds(model: THREE.Object3D, bounds: THREE.Box3): void {
  bounds.setFromObject(model);
}

function releaseResources(resources: CharacterVisual['resources']): void {
  for (const geometry of resources.geometries) geometry.dispose();
  for (const material of resources.materials) material.dispose();
  const images = new Set<unknown>();
  for (const texture of resources.textures) {
    const image = texture.image;
    if (image) images.add(image);
    texture.dispose();
  }
  for (const image of images) {
    if (image && typeof (image as { close?: unknown }).close === 'function') (image as { close(): void }).close();
  }
  for (const skeleton of resources.skeletons) skeleton.dispose();
}
