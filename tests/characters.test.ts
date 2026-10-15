import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
// @ts-expect-error The project omits Node typings; Vitest executes in Node.
import { readFile } from 'node:fs/promises';
import { Combat, type CombatSnapshot, type Side } from '../src/combat';
import { CharacterVisual } from '../src/characters';

const asset = (name: string) => new URL(`../public/assets/characters/kaykit/${name}.glb`, import.meta.url);
let originalGlobals: Map<string, PropertyDescriptor | undefined>;
let closedBitmaps = 0;

beforeAll(() => {
  const names = ['self', 'createImageBitmap', 'ProgressEvent'];
  originalGlobals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.self = globalThis;
  globals.createImageBitmap = async () => ({ width: 1024, height: 1024, close() { closedBitmaps += 1; } });
  globals.ProgressEvent = class extends Event {
    readonly lengthComputable = false; readonly loaded = 0; readonly total = 0;
    constructor(type: string) { super(type); }
  };
});

afterAll(() => {
  const globals = globalThis as unknown as Record<string, unknown>;
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globals[name];
  }
});

async function load(name: 'Knight' | 'Barbarian', variant: 'knight' | 'barbarian'): Promise<CharacterVisual> {
  const bytes = await readFile(asset(name));
  return loadBuffer(bytes, variant);
}

function loadBuffer(bytes: Uint8Array, variant: 'knight' | 'barbarian'): Promise<CharacterVisual> {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return CharacterVisual.load(`data:application/octet-stream;base64,${btoa(binary)}`, variant);
}

async function withoutAnimations(name: 'Knight' | 'Barbarian'): Promise<Uint8Array> {
  const source = await readFile(asset(name));
  const sourceView = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const originalJsonLength = sourceView.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(source.subarray(20, 20 + originalJsonLength))) as { animations?: unknown[] };
  delete json.animations;
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = (jsonBytes.length + 3) & ~3;
  const binaryOffset = 20 + originalJsonLength;
  const output = new Uint8Array(20 + jsonLength + source.length - binaryOffset);
  output.set(source.subarray(0, 12), 0);
  const outputView = new DataView(output.buffer);
  outputView.setUint32(8, output.length, true);
  outputView.setUint32(12, jsonLength, true);
  outputView.setUint32(16, 0x4e4f534a, true);
  output.set(jsonBytes, 20);
  output.fill(0x20, 20 + jsonBytes.length, 20 + jsonLength);
  output.set(source.subarray(binaryOffset), 20 + jsonLength);
  return output;
}

async function withRootYMotion(name: 'Knight' | 'Barbarian'): Promise<Uint8Array> {
  const source = await readFile(asset(name));
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(source.subarray(20, 20 + jsonLength))) as {
    animations: Array<{ name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ output: number }> }>;
    nodes: Array<{ name?: string }>;
    accessors: Array<{ bufferView: number; byteOffset?: number; count: number; type: string }>;
    bufferViews: Array<{ byteOffset?: number }>;
  };
  const animation = json.animations.find((item) => item.name === '1H_Melee_Attack_Slice_Horizontal');
  const channel = animation?.channels.find((item) => item.target.path === 'translation' && json.nodes[item.target.node]?.name === 'root');
  if (!animation || !channel) throw new Error('Test GLB has no root translation track.');
  const accessor = json.accessors[animation.samplers[channel.sampler].output];
  const bufferView = json.bufferViews[accessor.bufferView];
  const binaryChunkOffset = 20 + jsonLength + 8;
  const yOffset = binaryChunkOffset + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + (accessor.count - 1) * 12 + 4;
  const output = source.slice();
  new DataView(output.buffer, output.byteOffset, output.byteLength).setFloat32(yOffset, 0.8, true);
  return output;
}

function snapshot(overrides: Partial<CombatSnapshot> = {}): CombatSnapshot {
  const combat = new Combat(); combat.start();
  return { ...combat.snapshot(), ...overrides };
}

function update(visual: CharacterVisual, phase: CombatSnapshot['phase'], side: Side, phaseElapsed: number, overrides: Partial<CombatSnapshot> = {}, realSeconds = 0, cues = { counterResolved: false, hit: 0, block: 0 }): void {
  visual.update(snapshot({ phase, phaseElapsed, ...overrides }), side, realSeconds, cues);
}

describe('CharacterVisual', () => {
  it('loads the chosen native equipment, clips, and grounded normalized model', async () => {
    const visual = await load('Knight', 'knight');
    expect(visual.clipName).toBe('Idle');
    const names: string[] = [];
    visual.object.traverse((node) => { if (node.name) names.push(node.name); });
    expect(names).toContain('1H_Sword');
    expect(names).toContain('Round_Shield');
    expect(visual.object.getObjectByName('2H_Sword')).toBeUndefined();
    expect(visual.object.getObjectByName('1H_Sword_Offhand')).toBeUndefined();
    const bounds = new THREE.Box3().setFromObject(visual.object);
    expect(bounds.min.y).toBeCloseTo(0, 1);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeCloseTo(2.85, 1);
    update(visual, 'acting', 'player', 0, { activeCard: 'heavy' });
    expect(visual.clipName).toBe('1H_Melee_Attack_Chop');
    visual.dispose();
  });

  it('maps attacks through contact and recovery without queued input resetting the active pose', async () => {
    const visual = await load('Barbarian', 'barbarian');
    const duration = 1.0666667;
    update(visual, 'acting', 'player', 0.55, { activeCard: 'quick', actionResolved: true });
    expect(visual.clipName).toBe('1H_Melee_Attack_Slice_Horizontal');
    expect(visual.poseTime).toBeCloseTo(duration / 15, 2);
    visual.object.updateMatrixWorld(true);
    const sword = visual.object.getObjectByName('1H_Axe')!;
    const contactMatrix = sword.matrixWorld.clone();
    update(visual, 'acting', 'player', 0.67, { activeCard: 'quick', actionResolved: true, pendingActions: ['heavy'] });
    expect(visual.clipName).toBe('1H_Melee_Attack_Slice_Horizontal');
    expect(visual.poseTime).toBeCloseTo(duration * (8 / 15), 2);
    visual.object.updateMatrixWorld(true);
    expect(sword.matrixWorld.elements).not.toEqual(contactMatrix.elements);
    update(visual, 'acting', 'player', 0.79, { activeCard: 'heavy', pendingActions: [] });
    expect(visual.clipName).toBe('1H_Melee_Attack_Chop');
    expect(visual.poseTime).toBeCloseTo(duration, 2);
    visual.dispose();
  });

  it('freezes every visual field on pause, even if a caller supplies a changed snapshot and cues', async () => {
    const visual = await load('Knight', 'knight');
    update(visual, 'acting', 'player', 0.3, { activeCard: 'heavy' }, 0.1);
    const clip = visual.clipName, time = visual.poseTime;
    const material = visual.object.getObjectByName('root');
    const before = material?.position.clone();
    update(visual, 'telegraph', 'enemy', 1, { paused: true, visualTime: -10, activeCard: null }, 4, { counterResolved: true, hit: 1, block: 1 });
    expect(visual.clipName).toBe(clip);
    expect(visual.poseTime).toBe(time);
    expect(material?.position.toArray()).toEqual(before?.toArray());
    visual.dispose();
  });

  it('holds enemy anticipation through counter, maps normal and canceled resolve, and keeps guarding through resolve', async () => {
    const visual = await load('Barbarian', 'barbarian');
    const duration = 1.0666667;
    update(visual, 'telegraph', 'enemy', 1.1);
    expect(visual.poseTime).toBeCloseTo(duration * 0.95, 2);
    update(visual, 'telegraph', 'enemy', 0.55);
    expect(visual.poseTime).toBeCloseTo(duration * 0.7, 2);
    update(visual, 'counter', 'enemy', 0.5);
    expect(visual.poseTime).toBeCloseTo(duration * 0.95, 2);
    update(visual, 'resolve', 'enemy', 0, { guard: 0 });
    expect(visual.poseTime).toBeCloseTo(duration * 0.95, 2);
    update(visual, 'resolve', 'enemy', 0.65, { guard: 0 });
    expect(visual.poseTime).toBeCloseTo(duration / 15, 2);
    update(visual, 'resolve', 'enemy', 0.4, {}, 0, { counterResolved: true, hit: 0, block: 0 });
    expect(visual.clipName).toBe('Hit_A');
    update(visual, 'resolve', 'player', 0, { guard: 1 });
    expect(visual.clipName).toBe('Blocking');
    update(visual, 'resolve', 'player', 0.65, { guard: 1 });
    expect(visual.clipName).toBe('Blocking');
    update(visual, 'resolve', 'player', 0, { guard: 0 }, 0, { counterResolved: true, hit: 0, block: 0 });
    expect(visual.clipName).toBe('Block_Attack');
    expect(visual.poseTime).toBeGreaterThan(0.5);
    update(visual, 'turn-end', 'enemy', 0.09);
    expect(visual.poseTime).toBeCloseTo(duration * (8 / 15), 2);
    update(visual, 'turn-end', 'enemy', 0.09, {}, 0, { counterResolved: true, hit: 0, block: 0 });
    expect(visual.clipName).toBe('Idle');
    update(visual, 'turn-end', 'enemy', 0.19);
    expect(visual.clipName).toBe('Idle');
    visual.dispose();
  });

  it('holds root XZ tracks at their first values while retaining animated Y', async () => {
    const visual = await loadBuffer(await withRootYMotion('Knight'), 'knight');
    const root = visual.object.getObjectByName('root');
    expect(root).toBeDefined();
    update(visual, 'acting', 'player', 0.12, { activeCard: 'quick' });
    const early = root!.position.clone();
    update(visual, 'acting', 'player', 0.38, { activeCard: 'quick' });
    const later = root!.position.clone();
    expect(later.x).toBeCloseTo(early.x, 5);
    expect(later.z).toBeCloseTo(early.z, 5);
    expect(Math.abs(later.y - early.y)).toBeGreaterThan(1e-4);
    visual.dispose();
  });

  it('holds through pause, clears terminal state on restart, and samples terminal actions on its own clock', async () => {
    const visual = await load('Knight', 'knight');
    update(visual, 'victory', 'player', 0, {}, 0.35);
    expect(visual.clipName).toBe('Cheer');
    const time = visual.poseTime;
    update(visual, 'victory', 'player', 0, { paused: true }, 0.5);
    expect(visual.poseTime).toBe(time);
    update(visual, 'ready', 'player', 0, { visualTime: 0 });
    expect(visual.clipName).toBe('Idle');
    update(visual, 'defeat', 'player', 0);
    update(visual, 'defeat', 'player', 0, {}, 10);
    expect(visual.clipName).toBe('Death_A_Pose');
    visual.dispose();
  });

  it('plays hit and block feedback, exposes effect anchors, and disposes idempotently', async () => {
    const closedBefore = closedBitmaps;
    const visual = await load('Barbarian', 'barbarian');
    update(visual, 'planning', 'enemy', 0, {}, 0, { counterResolved: false, hit: 1, block: 0 });
    expect(visual.clipName).toBe('Hit_A');
    update(visual, 'planning', 'enemy', 0, {}, 0, { counterResolved: false, hit: 0, block: 1 });
    expect(visual.clipName).toBe('Block_Hit');
    const shield = visual.contactPosition(new THREE.Vector3(), 'shield');
    const chest = visual.contactPosition(new THREE.Vector3(), 'body');
    expect(shield.y).toBeGreaterThan(0);
    expect(chest.y).toBeGreaterThan(0);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), images = new Set<unknown>();
    visual.object.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(mat);
        for (const value of Object.values(mat)) if ((value as THREE.Texture | null)?.isTexture && (value as THREE.Texture).image) images.add((value as THREE.Texture).image);
      }
    });
    let disposedResources = 0;
    for (const geometry of geometries) geometry.addEventListener('dispose', () => { disposedResources += 1; });
    for (const material of materials) material.addEventListener('dispose', () => { disposedResources += 1; });
    visual.dispose(); visual.dispose();
    expect(visual.object.parent).toBeNull();
    expect(disposedResources).toBe(geometries.size + materials.size);
    expect(closedBitmaps - closedBefore).toBe(images.size);
    const afterDispose = closedBitmaps;
    visual.dispose();
    expect(closedBitmaps).toBe(afterDispose);
  });

  it('rejects an asset missing required clips and closes its decoded images', async () => {
    const closedBefore = closedBitmaps;
    const invalid = await withoutAnimations('Knight');
    await expect(loadBuffer(invalid, 'knight')).rejects.toThrow(/missing clips/);
    expect(closedBitmaps).toBeGreaterThan(closedBefore);
  });
});
