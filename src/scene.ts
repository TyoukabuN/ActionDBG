import * as THREE from 'three';
import type { CombatSnapshot } from './combat';

type Fighter = { root: THREE.Group; torso: THREE.Group; sword: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group; shield: THREE.Group; color: THREE.Color };

const CAMERA_HOME = new THREE.Vector3(-8, 4.2, 8);
const CAMERA_TARGET = new THREE.Vector3(0.4, 1.4, 0);

/** Procedural duel presentation. The simulation owns all outcomes; this class only animates snapshots. */
export class Arena {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly player: Fighter;
  private readonly enemy: Fighter;
  private readonly owned: THREE.Object3D[] = [];
  private disposed = false;
  private readonly hitLight: THREE.PointLight;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.scene.background = new THREE.Color('#18292c');
    this.scene.fog = new THREE.Fog('#18292c', 13, 32);
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    this.camera.position.copy(CAMERA_HOME);
    this.camera.lookAt(CAMERA_TARGET);

    this.scene.add(new THREE.HemisphereLight('#fff0d4', '#51433d', 2.25));
    const sun = new THREE.DirectionalLight('#ffe3af', 4.1);
    sun.position.set(-5, 10, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -5;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#69d1c5', 2.7); rim.position.set(5, 5, -5); this.scene.add(rim);
    this.hitLight = new THREE.PointLight('#ffb16f', 0, 8, 2); this.hitLight.position.set(0, 2, 1); this.scene.add(this.hitLight);

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
    this.scene.add(this.player.root, this.enemy.root);
    this.owned.push(floor, top, ring, ...this.player.root.children, ...this.enemy.root.children);
    this.resize();
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
    const metal = new THREE.MeshStandardMaterial({ color: armor, roughness: 0.42, metalness: 0.33 });
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
    part(new THREE.TorusGeometry(0.43, 0.07, 8, 20), trim, torso, [0, -0.07, 0]);
    part(new THREE.SphereGeometry(0.3, 16, 12), flesh, torso, [0, 0.98, 0]);
    part(new THREE.SphereGeometry(0.34, 16, 12), metal, torso, [0, 1.15, 0], [1.13, 0.63, 1.1]);
    part(new THREE.ConeGeometry(0.16, 0.37, 8), trim, torso, [0, 1.53, 0]);
    // A narrow visor makes facing direction readable from the fixed camera.
    part(new THREE.BoxGeometry(0.34, 0.07, 0.08), dark, torso, [0, 1.02, 0.28]);
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
    return { root, torso, sword, leftArm, rightArm, shield, color: new THREE.Color(armor) };
  }

  render(snapshot: CombatSnapshot): void {
    if (this.disposed) return;
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
    player.sword.rotation.z = -0.2;
    player.shield.rotation.z = 0;
    enemy.torso.rotation.z = 0;
    enemy.sword.rotation.z = -0.2;
    enemy.rightArm.rotation.x = 0;
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
      const elapsed = snapshot.phaseElapsed;
      const beat = Math.max(0, Math.sin(Math.min(1, elapsed / 0.55) * Math.PI));
      if (snapshot.activeCard === 'guard') {
        player.leftArm.rotation.x = -beat * 1.1;
        player.shield.rotation.z = beat * 0.75;
      } else if (snapshot.activeCard) {
        player.root.position.x = -2.35 + beat * 0.8;
        player.torso.rotation.z = -beat * (snapshot.activeCard === 'heavy' ? 0.7 : 0.42);
        player.rightArm.rotation.x = -beat * 0.58;
        player.sword.rotation.z = -0.2 - beat * 1.05;
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
      enemy.torso.rotation.z = -0.2 - Math.sin(t * 2) * 0.12;
      enemy.sword.rotation.z = -0.45 - Math.sin(t * 2) * 0.08;
    }
    const roundStart = snapshot.log.map((line) => line.startsWith('Round ') || line.startsWith('Encounter started')).lastIndexOf(true);
    const counterResolved = snapshot.phase === 'resolve' && snapshot.log.slice(Math.max(0, roundStart)).some((line) => line.includes('Counter cancels the incoming attack'));
    if (counterResolved) {
      player.root.position.x = -2.1;
      player.torso.rotation.z = -0.16;
      player.rightArm.rotation.x = -0.65;
      player.sword.rotation.z = -1.15;
      enemy.torso.rotation.z = 0.35;
      enemy.root.position.x = 2.48;
    }
    if (snapshot.phase === 'resolve' && !counterResolved) {
      const strike = Math.sin(Math.min(1, snapshot.phaseElapsed / 0.65) * Math.PI);
      enemy.root.position.x -= strike * 1.4;
      enemy.rightArm.rotation.x = -strike * 1.4;
      enemy.sword.rotation.z = -0.2 + strike * 1.6;
      player.shield.rotation.z = snapshot.guard > 0 ? -strike * 0.8 : 0;
    }
    const impact = snapshot.phase === 'resolve' ? Math.max(0, 1 - snapshot.phaseElapsed * 2.5) : 0;
    this.hitLight.intensity = impact * (snapshot.guard > 0 ? 1.3 : 3.5);
    const shake = impact * 0.035;
    this.camera.position.copy(CAMERA_HOME);
    this.camera.position.x += Math.sin(t * 49) * shake;
    this.camera.lookAt(CAMERA_TARGET);
    // Subtle time-scale indicator in the arena light and a slow-moving pennant-like pulse.
    this.renderer.render(this.scene, this.camera);
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
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
