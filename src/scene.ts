import * as THREE from 'three';
import type { CombatSnapshot } from './combat';
import { CameraDirector } from './camera';

type Fighter = {
  root: THREE.Group;
  torso: THREE.Group;
  sword: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  shield: THREE.Group;
  armor: THREE.MeshStandardMaterial;
};
type FeedbackSprite = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  baseY: number;
  remaining: number;
  duration: number;
};

const WORLD_LAYER = 0;
const ACTOR_LAYER = 1;
const EFFECT_LAYER = 2;

class BloodBurst {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly positions = new Float32Array(18 * 3);
  private readonly velocities = new Float32Array(18 * 3);
  private remaining = 0;
  private seed = 0;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.PointsMaterial({
      color: '#9d1726', size: 0.12, sizeAttenuation: true,
      transparent: true, opacity: 0, depthTest: false, depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.visible = false;
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.points.layers.set(EFFECT_LAYER);
  }

  get activeCount(): number { return this.remaining > 0 ? 18 : 0; }

  trigger(origin: THREE.Vector3, direction: number): void {
    this.seed++;
    this.remaining = 0.56;
    this.points.visible = true;
    this.points.material.opacity = 0.95;
    for (let i = 0; i < 18; i++) {
      const p = i * 3;
      const angle = i * 2.399 + this.seed * 0.71;
      const spread = 0.28 + (i % 5) * 0.065;
      this.positions[p] = origin.x;
      this.positions[p + 1] = origin.y;
      this.positions[p + 2] = origin.z;
      this.velocities[p] = direction * (0.55 + spread * 2.1) + Math.cos(angle) * spread;
      this.velocities[p + 1] = 0.45 + (i % 6) * 0.16;
      this.velocities[p + 2] = Math.sin(angle) * (0.45 + spread);
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  update(delta: number, reducedMotion: boolean): void {
    if (this.remaining <= 0) return;
    const step = reducedMotion ? Math.min(delta, 0.025) : delta;
    this.remaining = Math.max(0, this.remaining - delta);
    for (let i = 0; i < 18; i++) {
      const p = i * 3;
      this.velocities[p + 1] -= 2.9 * step;
      this.positions[p] += this.velocities[p] * step;
      this.positions[p + 1] += this.velocities[p + 1] * step;
      this.positions[p + 2] += this.velocities[p + 2] * step;
    }
    this.points.material.opacity = Math.min(0.95, this.remaining * 2.8);
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    if (this.remaining === 0) this.points.visible = false;
  }

  clear(): void { this.remaining = 0; this.points.visible = false; }
}

class SparkBurst {
  readonly lines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  private readonly positions = new Float32Array(14 * 2 * 3);
  private readonly velocities = new Float32Array(14 * 3);
  private readonly origin = new THREE.Vector3();
  private remaining = 0;
  private seed = 0;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: '#ffe0a0', transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    });
    this.lines = new THREE.LineSegments(geometry, material);
    this.lines.visible = false;
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 11;
    this.lines.layers.set(EFFECT_LAYER);
  }

  get activeCount(): number { return this.remaining > 0 ? 14 : 0; }

  trigger(origin: THREE.Vector3): void {
    this.seed++;
    this.origin.copy(origin);
    this.remaining = 0.46;
    this.lines.visible = true;
    this.lines.material.opacity = 1;
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.18 + this.seed * 0.43;
      const speed = 1.6 + (i % 5) * 0.42;
      const v = i * 3;
      this.velocities[v] = Math.cos(angle) * speed;
      this.velocities[v + 1] = 0.45 + (i % 4) * 0.52;
      this.velocities[v + 2] = Math.sin(angle) * speed;
    }
    this.write(0);
  }

  update(delta: number, reducedMotion: boolean): void {
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - delta);
    const age = 0.46 - this.remaining;
    this.write(reducedMotion ? Math.min(age, 0.08) : age);
    this.lines.material.opacity = Math.min(1, this.remaining * 3.5);
    if (this.remaining === 0) this.lines.visible = false;
  }

  clear(): void { this.remaining = 0; this.lines.visible = false; }

  private write(age: number): void {
    for (let i = 0; i < 14; i++) {
      const v = i * 3;
      const p = i * 6;
      const tailAge = Math.max(0, age - 0.07);
      this.positions[p] = this.origin.x + this.velocities[v] * tailAge;
      this.positions[p + 1] = this.origin.y + this.velocities[v + 1] * tailAge - 1.8 * tailAge * tailAge;
      this.positions[p + 2] = this.origin.z + this.velocities[v + 2] * tailAge;
      this.positions[p + 3] = this.origin.x + this.velocities[v] * age;
      this.positions[p + 4] = this.origin.y + this.velocities[v + 1] * age - 1.8 * age * age;
      this.positions[p + 5] = this.origin.z + this.velocities[v + 2] * age;
    }
    (this.lines.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** Procedural duel presentation. The simulation owns all outcomes; this class only animates snapshots. */
export class Arena {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraDirector = new CameraDirector();
  private readonly cameraLookTarget = new THREE.Vector3();
  private readonly letterboxScene = new THREE.Scene();
  private readonly letterboxCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  private readonly topBar: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly bottomBar: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly player: Fighter;
  private readonly enemy: Fighter;
  private readonly owned: THREE.Object3D[] = [];
  private disposed = false;
  private readonly hitLight: THREE.PointLight;
  private readonly reducedMotion: MediaQueryList;
  private readonly enemyDamageLabel: FeedbackSprite;
  private readonly playerDamageLabel: FeedbackSprite;
  private readonly contactRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  private readonly blood = new BloodBurst();
  private readonly sparks = new SparkBurst();
  private previousSnapshot: CombatSnapshot | null = null;
  private enemyFlash = 0;
  private playerFlash = 0;
  private enemyRecoil = 0;
  private playerRecoil = 0;
  private playerAttackRecovery = 0;
  private enemyAttackRecovery = 0;
  private playerRecoveryCard: CombatSnapshot['activeCard'] = null;
  private counterPose = 0;
  private counterResolvedPhase = false;
  private ringRemaining = 0;
  private shakeRemaining = 0;
  private shakeStrength = 0;
  private letterboxAmount = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.info.autoReset = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.scene.background = new THREE.Color('#18292c');
    this.scene.fog = new THREE.Fog('#18292c', 13, 32);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    this.camera.position.set(-8, 4.2, 8);
    this.camera.lookAt(0.4, 1.4, 0);

    const sky = new THREE.HemisphereLight('#fff0d4', '#51433d', 2.25);
    sky.layers.enable(ACTOR_LAYER);
    this.scene.add(sky);
    const sun = new THREE.DirectionalLight('#ffe3af', 4.1);
    sun.position.set(-5, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -5;
    sun.layers.enable(ACTOR_LAYER); this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#69d1c5', 2.7); rim.position.set(5, 5, -5); rim.layers.enable(ACTOR_LAYER); this.scene.add(rim);
    this.hitLight = new THREE.PointLight('#ffb16f', 0, 8, 2); this.hitLight.position.set(0, 2, 1); this.hitLight.layers.enable(ACTOR_LAYER); this.scene.add(this.hitLight);
    this.contactRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.035, 6, 28),
      new THREE.MeshBasicMaterial({ color: '#f3d9a5', transparent: true, opacity: 0, depthWrite: false }),
    );
    this.contactRing.visible = false;
    this.contactRing.renderOrder = 2;
    this.contactRing.layers.set(EFFECT_LAYER);
    this.scene.add(this.contactRing);

    const barGeometry = new THREE.PlaneGeometry(2.32, 0.34);
    const barMaterial = new THREE.MeshBasicMaterial({ color: '#070707', transparent: true, opacity: 0.98, depthTest: false, depthWrite: false });
    this.topBar = new THREE.Mesh(barGeometry, barMaterial);
    this.bottomBar = new THREE.Mesh(barGeometry, barMaterial.clone());
    this.topBar.position.set(2.32, 0.83, -1);
    this.bottomBar.position.set(-2.32, -0.83, -1);
    this.letterboxScene.add(this.topBar, this.bottomBar);
    this.letterboxCamera.position.z = 1;

    const floorMaterial = new THREE.MeshStandardMaterial({ color: '#9b765b', roughness: 0.86 });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 8.1, 0.36, 64), floorMaterial);
    floor.position.y = -0.22; floor.receiveShadow = true; this.scene.add(floor);
    const top = new THREE.Mesh(new THREE.CircleGeometry(7.35, 64), new THREE.MeshStandardMaterial({ color: '#c4a17c', roughness: 0.92 }));
    top.rotation.x = -Math.PI / 2; top.position.y = -0.025; top.receiveShadow = true; this.scene.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.65, 0.055, 8, 96), new THREE.MeshStandardMaterial({ color: '#e4c89e', metalness: 0.3, roughness: 0.55 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.015; this.scene.add(ring);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6; const col = i % 2 ? '#ad7958' : '#c29a71';
      // Keep the fixed camera's foreground clear of columns.
      if (Math.cos(a) * 7.9 - 1.4 > 3) continue;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.3, 4.2, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
      pillar.position.set(Math.sin(a) * 8.8, 1.9, Math.cos(a) * 7.9 - 1.4); pillar.castShadow = true; this.scene.add(pillar);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 8), new THREE.MeshStandardMaterial({ color: '#d2a876', roughness: 0.62 }));
      cap.position.set(pillar.position.x, 4.05, pillar.position.z); this.scene.add(cap);
    }
    this.addBackdrop();
    this.player = this.makeFighter('#29b5aa', '#e9c69b', true);
    this.player.root.position.set(-2.35, 0, 0.5); this.player.root.rotation.y = Math.PI / 2;
    this.enemy = this.makeFighter('#d9624d', '#dfb68a', false);
    this.enemy.root.position.set(2.25, 0, -0.5); this.enemy.root.rotation.y = -Math.PI / 2;
    this.player.root.traverse(object => object.layers.set(ACTOR_LAYER));
    this.enemy.root.traverse(object => object.layers.set(ACTOR_LAYER));
    this.scene.add(this.player.root, this.enemy.root);
    this.scene.add(this.blood.points, this.sparks.lines);
    this.enemyDamageLabel = this.makeFeedbackSprite();
    this.playerDamageLabel = this.makeFeedbackSprite();
    this.owned.push(floor, top, ring, ...this.player.root.children, ...this.enemy.root.children);
    this.canvas.dataset.materials = String(this.countMaterials());
    this.canvas.dataset.compositionPasses = '4';
    this.canvas.dataset.postPasses = '0';
    this.canvas.dataset.shadowLights = '1';
    this.canvas.dataset.dprCap = '2';
    this.resize();
  }

  private countMaterials(): number {
    const materials = new Set<THREE.Material>();
    const collect = (root: THREE.Object3D) => root.traverse(object => {
      const material = (object as THREE.Mesh).material;
      if (Array.isArray(material)) material.forEach(item => materials.add(item));
      else if (material) materials.add(material);
    });
    collect(this.scene);
    collect(this.letterboxScene);
    return materials.size;
  }

  private addBackdrop(): void {
    const wallMat = new THREE.MeshStandardMaterial({ color: '#513f37', roughness: 0.92, side: THREE.BackSide });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(10.7, 10.7, 7.6, 48, 1, true), wallMat);
    wall.position.y = 2.3; wall.receiveShadow = true; this.scene.add(wall);
    const plinthMat = new THREE.MeshStandardMaterial({ color: '#705248', roughness: 0.8 });
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 2.12;
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.7 + (i % 3) * 0.26, 0.5), plinthMat);
      plinth.position.set(x, 1.05, -6.8); plinth.castShadow = true; this.scene.add(plinth);
      const inset = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.1, 0.54), new THREE.MeshStandardMaterial({ color: '#bb8c67', roughness: 0.65 }));
      inset.position.set(x, 1.1, -6.53); this.scene.add(inset);
    }
    this.owned.push(wall);
  }

  private makeFighter(armor: string, skin: string, teal: boolean): Fighter {
    const root = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: armor, roughness: 0.42, metalness: 0.33, emissive: '#ffffff', emissiveIntensity: 0 });
    const trim = new THREE.MeshStandardMaterial({ color: teal ? '#f0ce91' : '#6a332e', roughness: 0.38, metalness: 0.48 });
    const flesh = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: '#302d30', roughness: 0.72 });
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, pos: [number, number, number], scale?: [number, number, number]) => {
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(...pos); if (scale) mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const legs = new THREE.Group(); root.add(legs);
    part(new THREE.CapsuleGeometry(0.22, 0.65, 5, 10), dark, legs, [-0.24, 0.58, 0]);
    part(new THREE.CapsuleGeometry(0.22, 0.65, 5, 10), dark, legs, [0.24, 0.58, 0]);
    part(new THREE.BoxGeometry(0.38, 0.18, 0.62), trim, legs, [-0.24, 0.17, 0.1]);
    part(new THREE.BoxGeometry(0.38, 0.18, 0.62), trim, legs, [0.24, 0.17, 0.1]);
    const torso = new THREE.Group(); torso.position.y = 1.35; root.add(torso);
    part(new THREE.CapsuleGeometry(0.49, 0.53, 5, 12), metal, torso, [0, 0.2, 0], [1, 0.83, 0.78]);
    // Broad pauldrons and a layered back silhouette keep the fighters readable
    // at the fixed diagonal camera distance without changing their footprint.
    part(new THREE.SphereGeometry(0.32, 12, 9), metal, torso, [-0.51, 0.56, 0], [1.25, 0.72, 0.94]);
    part(new THREE.SphereGeometry(0.32, 12, 9), metal, torso, [0.51, 0.56, 0], [1.25, 0.72, 0.94]);
    part(new THREE.TorusGeometry(0.47, 0.075, 8, 24), trim, torso, [0, 0.05, 0], [1.06, 0.82, 0.92]);
    part(new THREE.TorusGeometry(0.43, 0.07, 8, 20), trim, torso, [0, -0.07, 0]);
    part(new THREE.SphereGeometry(0.3, 16, 12), flesh, torso, [0, 0.98, 0]);
    part(new THREE.SphereGeometry(0.34, 16, 12), metal, torso, [0, 1.15, 0], [1.13, 0.63, 1.1]);
    part(new THREE.ConeGeometry(0.16, 0.37, 8), trim, torso, [0, 1.53, 0]);
    // A narrow visor makes facing direction readable from the fixed camera.
    part(new THREE.BoxGeometry(0.34, 0.07, 0.08), dark, torso, [0, 1.02, 0.28]);
    part(new THREE.BoxGeometry(0.44, 0.055, 0.12), trim, torso, [0, 0.95, 0.29]);
    if (teal) {
      part(new THREE.ConeGeometry(0.15, 0.68, 5), trim, torso, [0, 1.6, -0.05]);
      part(new THREE.ConeGeometry(0.08, 0.34, 5), trim, torso, [-0.22, 1.37, -0.04]);
      part(new THREE.ConeGeometry(0.08, 0.34, 5), trim, torso, [0.22, 1.37, -0.04]);
    } else {
      part(new THREE.ConeGeometry(0.1, 0.38, 5), trim, torso, [-0.3, 1.13, 0]);
      part(new THREE.ConeGeometry(0.1, 0.38, 5), trim, torso, [0.3, 1.13, 0]);
    }
    const mantleShape = new THREE.Shape();
    mantleShape.moveTo(-0.42, 0.55); mantleShape.lineTo(0.42, 0.55);
    mantleShape.lineTo(0.58, -0.84); mantleShape.lineTo(0.26, -1.12);
    mantleShape.lineTo(0, -0.93); mantleShape.lineTo(-0.26, -1.12); mantleShape.lineTo(-0.58, -0.84);
    mantleShape.closePath();
    const mantleMaterial = new THREE.MeshStandardMaterial({ color: teal ? '#246b69' : '#713a34', roughness: 0.88, side: THREE.DoubleSide });
    const mantle = part(new THREE.ShapeGeometry(mantleShape), mantleMaterial, torso, [0, 0, -0.3]);
    mantle.renderOrder = -1;
    const leftArm = new THREE.Group(); leftArm.position.set(-0.48, 0.48, 0); torso.add(leftArm);
    part(new THREE.CapsuleGeometry(0.15, 0.48, 4, 8), metal, leftArm, [0, -0.28, 0]);
    const rightArm = new THREE.Group(); rightArm.position.set(0.48, 0.48, 0); torso.add(rightArm);
    part(new THREE.CapsuleGeometry(0.15, 0.48, 4, 8), metal, rightArm, [0, -0.28, 0]);
    part(new THREE.SphereGeometry(0.16, 10, 8), flesh, rightArm, [0, -0.55, 0]);
    const sword = new THREE.Group(); sword.position.set(0.04, -0.61, 0.02); sword.rotation.z = -0.2; rightArm.add(sword);
    part(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8), trim, sword, [0, 0, 0]);
    part(new THREE.BoxGeometry(0.35, 0.065, 0.08), trim, sword, [0, 0.2, 0]);
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#e7e8db', metalness: 0.8, roughness: 0.22, emissive: '#61706b', emissiveIntensity: 0.18 });
    part(new THREE.BoxGeometry(0.12, 1.38, 0.055), bladeMat, sword, [0, 0.91, 0]);
    part(new THREE.ConeGeometry(0.06, 0.23, 4), bladeMat, sword, [0, 1.72, 0]);
    const shield = new THREE.Group(); shield.position.set(-0.11, -0.52, 0.06); shield.rotation.z = 0.12; leftArm.add(shield);
    part(new THREE.CylinderGeometry(0.33, 0.27, 0.11, 8), trim, shield, [0, -0.05, 0], [1, 1.24, 0.46]);
    return { root, torso, sword, leftArm, rightArm, shield, armor: metal };
  }

  private makeFeedbackSprite(): FeedbackSprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is unavailable for combat feedback.');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.62, 0.42, 1);
    sprite.renderOrder = 3;
    sprite.layers.set(EFFECT_LAYER);
    sprite.visible = false;
    this.scene.add(sprite);
    return { canvas, context, sprite, material, baseY: 2.22, remaining: 0, duration: 0.38 };
  }

  render(snapshot: CombatSnapshot, realSeconds = 0): void {
    if (this.disposed) return;
    const delta = Number.isFinite(realSeconds) ? Math.min(0.1, Math.max(0, realSeconds)) : 0;
    // Terminal combat stops simulation, but the final hit feedback should settle.
    if (!snapshot.paused) this.advanceFeedback(delta);
    this.observeSnapshot(snapshot);
    this.updateLetterbox(snapshot, delta);
    const t = snapshot.visualTime;
    const enemy = this.enemy, player = this.player;
    const breathing = Math.sin(t * 2.25);
    enemy.torso.position.y = 1.35 + breathing * 0.035;
    player.torso.position.y = 1.35 + Math.sin(t * 2.7 + 0.7) * 0.025;
    enemy.root.position.x = 2.25;
    player.root.position.x = -2.35;
    player.torso.rotation.z = 0;
    player.rightArm.rotation.x = 0;
    player.leftArm.rotation.x = 0;
    player.leftArm.rotation.z = 0;
    player.sword.rotation.z = -0.2;
    player.shield.rotation.z = 0;
    player.shield.rotation.x = 0;
    enemy.torso.rotation.z = 0;
    enemy.sword.rotation.z = -0.2;
    enemy.rightArm.rotation.x = 0;
    enemy.leftArm.rotation.x = 0;
    enemy.shield.rotation.z = 0;
    enemy.shield.rotation.x = 0;
    if (snapshot.phase === 'telegraph') {
      const wind = Math.min(1, snapshot.phaseElapsed / (snapshot.enemyAttack === 'heavy' ? 1.15 : 0.72));
      enemy.torso.rotation.z = -0.1 - wind * (snapshot.enemyAttack === 'heavy' ? 0.48 : 0.3);
      enemy.rightArm.rotation.x = -wind * 0.62;
      enemy.sword.rotation.z = -0.2 - wind * (snapshot.enemyAttack === 'heavy' ? 1.25 : 0.8);
      enemy.root.position.x += Math.sin(t * 3) * 0.035;
    } else if (snapshot.phase === 'planning') {
      const wind = 0.15 + (0.5 + 0.5 * Math.sin(t * 1.7)) * 0.17;
      enemy.torso.rotation.z = -wind;
      enemy.rightArm.rotation.x = -wind * 0.45;
      enemy.sword.rotation.z = -0.2 - wind * 1.1;
      enemy.root.position.x += Math.sin(t * 1.2) * 0.06;
    } else if (snapshot.phase === 'acting') {
      const progress = Math.min(1, snapshot.phaseElapsed / 0.55);
      const strike = this.strikeCurve(progress);
      if (snapshot.activeCard === 'guard') {
        const lift = this.smoothstep(0.12, 0.78, progress);
        player.leftArm.rotation.x = -0.18 - lift * 0.82;
        player.shield.rotation.z = 0.18 + lift * 0.52;
        player.shield.rotation.x = -lift * 0.12;
      } else if (snapshot.activeCard) {
        const anticipation = 1 - this.smoothstep(0, 0.3, progress);
        player.root.position.x = -2.35 - anticipation * 0.12 + strike * 0.92;
        player.torso.rotation.z = -anticipation * 0.12 - strike * (snapshot.activeCard === 'heavy' ? 0.68 : 0.4);
        player.rightArm.rotation.x = -anticipation * 0.45 - strike * 0.52;
        player.sword.rotation.z = -0.2 - anticipation * 0.8 - strike * 1.05;
      } else {
        player.root.position.x = -2.35;
      }
    } else {
      player.root.position.x = -2.35;
      player.torso.rotation.z = 0;
      player.rightArm.rotation.x = 0;
      player.sword.rotation.z = -0.2;
      player.shield.rotation.z = 0;
      enemy.torso.rotation.z = 0;
    }
    if (snapshot.phase === 'counter') {
      const hold = 0.5 + 0.5 * Math.sin(t * 2);
      enemy.torso.rotation.z = -0.2 - hold * 0.1;
      enemy.rightArm.rotation.x = -0.32 - hold * 0.12;
      enemy.sword.rotation.z = -0.76 - hold * 0.08;
    }
    const counterResolved = this.counterResolvedPhase || this.counterPose > 0;
    if (counterResolved) {
      const parry = this.smoothstep(0, 0.18, this.counterPose);
      player.root.position.x = -2.35 + parry * 0.25;
      player.torso.rotation.z = -0.2 * parry;
      player.leftArm.rotation.x = -0.9 * parry;
      player.shield.rotation.z = -0.65 * parry;
      player.rightArm.rotation.x = -0.55 * parry;
      player.sword.rotation.z = -1.2 * parry;
      enemy.torso.rotation.z = 0.38 * parry;
      enemy.rightArm.rotation.x = 0.25 * parry;
      enemy.root.position.x = 2.25 + parry * 0.2;
    }
    if (snapshot.phase === 'resolve' && !counterResolved) {
      const progress = Math.min(1, snapshot.phaseElapsed / 0.65);
      // Hold the blade through the last frame: Combat applies damage when the
      // resolve phase ends, so visual contact must land on that same boundary.
      const arc = this.smoothstep(0.04, 0.9, progress);
      enemy.root.position.x -= arc * 1.35;
      enemy.torso.rotation.z = -0.16 + arc * 0.4;
      enemy.rightArm.rotation.x = -0.12 - arc * 1.1;
      enemy.sword.rotation.z = -1.35 + arc * 2.2;
      if (snapshot.guard > 0) {
        player.leftArm.rotation.x = -0.95;
        player.shield.rotation.z = -0.52 - arc * 0.24;
        player.shield.rotation.x = -0.12;
        player.torso.rotation.z = 0.05;
      }
    }
    if (snapshot.guard > 0 && snapshot.phase === 'counter') {
      player.leftArm.rotation.x = -0.92;
      player.shield.rotation.z = -0.55;
      player.shield.rotation.x = -0.1;
    }
    // Finish the action's contact frame for a short real-time beat after its
    // HP event. Never layer this over the next queued action's live animation.
    if (this.playerAttackRecovery > 0 && snapshot.phase !== 'acting' && !counterResolved) {
      const recovery = this.recoveryWeight(this.playerAttackRecovery, 0.24);
      const weight = 0.88 * recovery;
      player.root.position.x = -2.35 + weight * 0.92;
      player.torso.rotation.z = -weight * (this.playerRecoveryCard === 'heavy' ? 0.68 : 0.4);
      player.rightArm.rotation.x = -weight * 0.52;
      player.sword.rotation.z = -0.2 - weight * 1.05;
    }
    // The enemy eases out of its completed swing as the next telegraph begins.
    // This tiny step is layered beneath the next intent's wind-up pose.
    if (this.enemyAttackRecovery > 0 && snapshot.phase === 'telegraph') {
      const recovery = this.recoveryWeight(this.enemyAttackRecovery, 0.18);
      enemy.root.position.x -= recovery * 1.35;
    }
    player.root.position.x -= this.recoilOffset(this.playerRecoil) * 0.18;
    enemy.root.position.x += this.recoilOffset(this.enemyRecoil) * 0.2;
    player.armor.emissiveIntensity = this.playerFlash * 2.25;
    enemy.armor.emissiveIntensity = this.enemyFlash * 2.25;
    this.updateFeedbackSprites();
    this.hitLight.intensity = Math.max(this.playerFlash, this.enemyFlash, this.ringRemaining / 0.24) * 2.7;
    const cameraPose = this.cameraDirector.update(snapshot, delta, this.reducedMotion.matches);
    const shake = this.reducedMotion.matches ? 0 : this.shakeStrength * this.shakeEnvelope();
    this.camera.position.set(...cameraPose.position);
    this.camera.position.x += Math.sin(t * 49) * shake;
    this.cameraLookTarget.set(...cameraPose.target);
    this.camera.lookAt(this.cameraLookTarget);
    this.camera.rotation.z += cameraPose.roll;
    if (this.camera.fov !== cameraPose.fov) {
      this.camera.fov = cameraPose.fov;
      this.camera.updateProjectionMatrix();
    }
    this.canvas.dataset.shot = cameraPose.id;
    this.canvas.dataset.cameraPosition = cameraPose.position.map((value) => value.toFixed(2)).join(',');
    this.canvas.dataset.cameraRoll = cameraPose.roll.toFixed(3);
    this.canvas.dataset.letterbox = this.letterboxAmount.toFixed(3);
    this.canvas.dataset.renderOrder = 'scene,letterbox,actors,effects';
    this.canvas.dataset.bloodParticles = String(this.blood.activeCount);
    this.canvas.dataset.sparkParticles = String(this.sparks.activeCount);
    if (this.ringRemaining > 0) {
      const progress = 1 - this.ringRemaining / 0.24;
      this.contactRing.visible = true;
      this.contactRing.scale.setScalar(0.55 + progress * 1.3);
      this.contactRing.material.opacity = (1 - progress) * 0.58;
    } else {
      this.contactRing.visible = false;
    }
    this.renderLayers();
  }

  private observeSnapshot(snapshot: CombatSnapshot): void {
    const previous = this.previousSnapshot;
    this.previousSnapshot = snapshot;
    const counterWasResolved = this.counterResolvedPhase;
    if (snapshot.phase !== 'resolve') this.counterResolvedPhase = false;
    if (!previous) return;

    // A reset can be triggered while paused or before any animation time has
    // advanced. Detect both visual-clock rewind and restored health explicitly.
    if (snapshot.visualTime < previous.visualTime || snapshot.playerHp > previous.playerHp || snapshot.enemyHp > previous.enemyHp) {
      this.clearFeedback();
      return;
    }

    const enemyLoss = previous.enemyHp - snapshot.enemyHp;
    const playerLoss = previous.playerHp - snapshot.playerHp;
    const counter = enemyLoss > 0 && previous.phase === 'counter'
      && (snapshot.phase === 'resolve' || snapshot.phase === 'victory');
    if (counter && snapshot.phase === 'resolve') this.counterResolvedPhase = true;
    if (enemyLoss > 0 && previous.phase === 'acting'
      && (previous.activeCard === 'quick' || previous.activeCard === 'heavy')) {
      this.playerAttackRecovery = 0.24;
      this.playerRecoveryCard = previous.activeCard;
    }
    if (enemyLoss > 0) {
      this.triggerHit(this.enemy, this.enemyDamageLabel, counter ? `PARRY  −${enemyLoss}` : `−${enemyLoss}`, counter ? '#9ef0d6' : '#ffe7bd', 0.28);
      this.blood.trigger(new THREE.Vector3(this.enemy.root.position.x - 0.28, 1.38, this.enemy.root.position.z + 0.28), -1);
    }
    if (playerLoss > 0) {
      this.triggerHit(this.player, this.playerDamageLabel, `−${playerLoss}`, '#ffb4a3', 0.4);
      this.blood.trigger(new THREE.Vector3(this.player.root.position.x + 0.32, 1.38, this.player.root.position.z + 0.3), 1);
    }

    const guardConsumed = previous.phase === 'resolve' && previous.guard > snapshot.guard
      && previous.guard > 0 && !counterWasResolved;
    if (playerLoss > 0 || guardConsumed) this.enemyAttackRecovery = 0.18;
    if (guardConsumed && playerLoss === 0) {
      this.showFeedback(this.playerDamageLabel, 'BLOCK', '#a9eee0', this.player.root.position.x, this.player.root.position.z);
      this.ringRemaining = 0.24;
      this.contactRing.position.set(-0.55, 1.18, 0.3);
      this.contactRing.material.color.set('#88e2d3');
      this.shakeStrength = 0.018;
      this.shakeRemaining = 0.12;
      this.sparks.trigger(new THREE.Vector3(-0.55, 1.32, 0.42));
    }
    if (counter) {
      this.counterPose = 0.42;
      this.shakeStrength = 0.026;
      this.shakeRemaining = 0.16;
    }
  }

  private triggerHit(fighter: Fighter, label: FeedbackSprite, text: string, color: string, shake: number): void {
    const playerHit = fighter === this.player;
    if (playerHit) {
      this.playerFlash = 1;
      this.playerRecoil = 1;
    } else {
      this.enemyFlash = 1;
      this.enemyRecoil = 1;
    }
    this.showFeedback(label, text, color, fighter.root.position.x, fighter.root.position.z);
    this.ringRemaining = 0.24;
    this.contactRing.position.set(fighter.root.position.x + (playerHit ? 0.35 : -0.35), 1.18, fighter.root.position.z + 0.34);
    this.contactRing.material.color.set(color);
    this.shakeStrength = Math.max(this.shakeStrength, shake);
    this.shakeRemaining = Math.max(this.shakeRemaining, 0.2);
  }

  private showFeedback(label: FeedbackSprite, text: string, color: string, x: number, z: number): void {
    const { context, canvas } = label;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '800 60px system-ui, sans-serif';
    context.lineJoin = 'round';
    context.lineWidth = 13;
    context.strokeStyle = 'rgba(22, 26, 27, 0.88)';
    context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    label.sprite.position.set(x, label.baseY, z + 0.38);
    label.remaining = label.duration;
    label.material.opacity = 1;
    label.sprite.visible = true;
    const texture = label.material.map;
    if (texture) texture.needsUpdate = true;
  }

  private advanceFeedback(delta: number): void {
    this.enemyFlash = Math.max(0, this.enemyFlash - delta / 0.22);
    this.playerFlash = Math.max(0, this.playerFlash - delta / 0.22);
    this.enemyRecoil = Math.max(0, this.enemyRecoil - delta / 0.2);
    this.playerRecoil = Math.max(0, this.playerRecoil - delta / 0.2);
    this.counterPose = Math.max(0, this.counterPose - delta);
    this.playerAttackRecovery = Math.max(0, this.playerAttackRecovery - delta);
    this.enemyAttackRecovery = Math.max(0, this.enemyAttackRecovery - delta);
    this.ringRemaining = Math.max(0, this.ringRemaining - delta);
    this.shakeRemaining = Math.max(0, this.shakeRemaining - delta);
    if (this.shakeRemaining === 0) this.shakeStrength = 0;
    this.advanceSprite(this.enemyDamageLabel, delta);
    this.advanceSprite(this.playerDamageLabel, delta);
    this.blood.update(delta, this.reducedMotion.matches);
    this.sparks.update(delta, this.reducedMotion.matches);
  }

  private updateFeedbackSprites(): void {
    this.updateSprite(this.enemyDamageLabel, this.enemy);
    this.updateSprite(this.playerDamageLabel, this.player);
  }

  private clearFeedback(): void {
    this.enemyFlash = 0; this.playerFlash = 0;
    this.enemyRecoil = 0; this.playerRecoil = 0;
    this.playerAttackRecovery = 0; this.enemyAttackRecovery = 0;
    this.playerRecoveryCard = null;
    this.counterPose = 0; this.ringRemaining = 0;
    this.counterResolvedPhase = false;
    this.shakeRemaining = 0; this.shakeStrength = 0;
    this.clearSprite(this.enemyDamageLabel);
    this.clearSprite(this.playerDamageLabel);
    this.contactRing.visible = false;
    this.blood.clear();
    this.sparks.clear();
    this.letterboxAmount = 0;
  }

  private updateLetterbox(snapshot: CombatSnapshot, delta: number): void {
    const active = snapshot.phase === 'counter' || this.counterResolvedPhase || this.counterPose > 0;
    const target = active ? 1 : 0;
    if (this.reducedMotion.matches) this.letterboxAmount = target;
    else {
      const speed = target > this.letterboxAmount ? 5.8 : 8.2;
      this.letterboxAmount = THREE.MathUtils.clamp(this.letterboxAmount + Math.sign(target - this.letterboxAmount) * speed * delta, 0, 1);
    }
    const eased = 1 - Math.pow(1 - this.letterboxAmount, 3);
    this.topBar.position.x = (1 - eased) * 2.32;
    this.bottomBar.position.x = -(1 - eased) * 2.32;
    this.topBar.visible = this.bottomBar.visible = this.letterboxAmount > 0.001;
  }

  private renderLayers(): void {
    this.renderer.info.reset();
    this.renderer.autoClear = true;
    this.camera.layers.set(WORLD_LAYER);
    this.camera.layers.enable(ACTOR_LAYER);
    this.renderer.render(this.scene, this.camera);

    this.renderer.autoClear = false;
    if (this.letterboxAmount > 0.001) this.renderer.render(this.letterboxScene, this.letterboxCamera);

    const background = this.scene.background;
    this.scene.background = null;
    this.renderer.clearDepth();
    this.camera.layers.set(ACTOR_LAYER);
    this.renderer.render(this.scene, this.camera);

    this.renderer.clearDepth();
    this.camera.layers.set(EFFECT_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.scene.background = background;
    this.renderer.autoClear = true;
    this.canvas.dataset.drawCalls = String(this.renderer.info.render.calls);
    this.canvas.dataset.triangles = String(this.renderer.info.render.triangles);
    this.canvas.dataset.geometries = String(this.renderer.info.memory.geometries);
    this.canvas.dataset.textures = String(this.renderer.info.memory.textures);
  }

  private advanceSprite(label: FeedbackSprite, delta: number): void {
    if (label.remaining <= 0) return;
    label.remaining = Math.max(0, label.remaining - delta);
    const progress = 1 - label.remaining / label.duration;
    label.material.opacity = 1 - progress;
  }

  private updateSprite(label: FeedbackSprite, fighter: Fighter): void {
    if (label.remaining <= 0) {
      label.sprite.visible = false;
      return;
    }
    const progress = 1 - label.remaining / label.duration;
    const drift = this.reducedMotion.matches ? 0 : progress;
    label.sprite.position.set(fighter.root.position.x, label.baseY + drift * 0.42, fighter.root.position.z + 0.38);
    label.sprite.scale.set(1.62 * (1 + drift * 0.08), 0.42 * (1 + drift * 0.08), 1);
  }

  private clearSprite(label: FeedbackSprite): void {
    label.remaining = 0;
    label.material.opacity = 0;
    label.sprite.visible = false;
  }

  private strikeCurve(progress: number): number {
    const release = this.smoothstep(0.12, 0.93, progress);
    const recovery = this.smoothstep(0.98, 1, progress);
    return release * (1 - recovery * 0.12);
  }

  private smoothstep(edge0: number, edge1: number, value: number): number {
    const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  }

  private recoilOffset(amount: number): number {
    return this.reducedMotion.matches ? 0 : amount * amount;
  }

  private recoveryWeight(remaining: number, duration: number): number {
    if (this.reducedMotion.matches) return 0;
    const progress = THREE.MathUtils.clamp(remaining / duration, 0, 1);
    return progress * progress;
  }

  private shakeEnvelope(): number {
    return this.shakeRemaining > 0 ? Math.pow(THREE.MathUtils.clamp(this.shakeRemaining / 0.2, 0, 1), 2) : 0;
  }

  resize(): void {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width)); const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else if (mesh.material) mesh.material.dispose();
    });
    this.enemyDamageLabel.material.map?.dispose();
    this.playerDamageLabel.material.map?.dispose();
    this.topBar.geometry.dispose();
    this.topBar.material.dispose();
    this.bottomBar.material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
