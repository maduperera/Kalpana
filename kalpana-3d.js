import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

console.log("🚀 Kalpanā 3D System: Initializing...");

const canvas = document.getElementById("kalpanaCanvas");
const replayBtn = document.getElementById("replayBtn");
const idleBtn = document.getElementById("idleBtn");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.2, 6.4);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log("✅ Kalpanā 3D System: Renderer Ready");
} catch (e) {
  console.error("❌ Kalpanā 3D System: Renderer Failed", e);
}

const group = new THREE.Group();
scene.add(group);

// Foolproof path detection for GitHub Pages and Local Hosting
const getAssetPath = (file) => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    const fullBase = base.startsWith('/') ? base : '/' + base;
    return origin + fullBase + file + "?v=2.9";
};

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

const charTexture = textureLoader.load(getAssetPath("kalpana-v29.png"), 
  () => console.log("✅ Kalpanā 3D: Character texture loaded"),
  undefined,
  (err) => console.error("❌ Kalpanā 3D: Character texture failed to load", err)
);
const glowTexture = textureLoader.load(getAssetPath("kalpana-glow.png"),
  () => console.log("✅ Kalpanā 3D: Glow texture loaded"),
  undefined,
  (err) => console.error("❌ Kalpanā 3D: Glow texture failed to load", err)
);

charTexture.colorSpace = THREE.SRGBColorSpace;
glowTexture.colorSpace = THREE.SRGBColorSpace;

const charMat = new THREE.MeshBasicMaterial({
  map: charTexture,
  transparent: true,
  depthWrite: false,
  opacity: 0.98,
  blending: THREE.AdditiveBlending, // Black background becomes perfectly transparent
  side: THREE.DoubleSide
});

const glowMat = new THREE.MeshBasicMaterial({
  map: glowTexture,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});

const character = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 4.15, 18, 18), charMat);
const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 4.35, 18, 18), glowMat);

group.add(glow);
group.add(character);

// Debug box removed - diagnostics complete

// Add magical orb and rings
const orb = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xb7f0ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  })
);
orb.position.set(0.88, 0.58, 0.12);
group.add(orb);

function makeRing(radius, yRot = 0, zRot = 0) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.23, 0, Math.PI * 2);
  const points = curve.getPoints(160);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0x9eeaff,
    transparent: true,
    opacity: 0.36,
    blending: THREE.AdditiveBlending
  });
  const ring = new THREE.LineLoop(geo, mat);
  ring.rotation.x = Math.PI / 2;
  ring.rotation.y = yRot;
  ring.rotation.z = zRot;
  ring.position.copy(orb.position);
  return ring;
}

const ring1 = makeRing(0.34, 0.2, 0.0);
const ring2 = makeRing(0.46, -0.15, 0.65);
group.add(ring1, ring2);

// Particle field
const particleCount = 360;
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 5.5;
  positions[i3 + 1] = (Math.random() - 0.5) * 5.0;
  positions[i3 + 2] = (Math.random() - 0.5) * 1.2;
  velocities[i] = 0.004 + Math.random() * 0.012;
}

const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particlesMat = new THREE.PointsMaterial({
  size: 0.018,
  color: 0x9feeff,
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);

// Soft hologram line
const lineGeo = new THREE.PlaneGeometry(1.75, 0.012);
const lineMat = new THREE.MeshBasicMaterial({
  color: 0xc7f4ff,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending
});
const scanLine = new THREE.Mesh(lineGeo, lineMat);
scanLine.position.set(0, 0, 0.16);
group.add(scanLine);

let startTime = performance.now();
let modeBoostUntil = 0;

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function resetEntrance() {
  startTime = performance.now();
  group.visible = true;
}

replayBtn?.addEventListener("click", resetEntrance);
idleBtn?.addEventListener("click", () => {
  modeBoostUntil = performance.now() + 2200;
});

function layoutCharacter() {
  const mobile = window.innerWidth < 760;
  if (mobile) {
    group.scale.setScalar(0.70);
  } else {
    group.scale.setScalar(0.85);
  }
}
layoutCharacter();

function animate(now) {
  requestAnimationFrame(animate);

  const elapsed = (now - startTime) / 1000;
  const entrance = Math.min(elapsed / 3.2, 1);
  const e = easeOutCubic(entrance);
  const turn = easeInOutCubic(Math.min(elapsed / 2.6, 1));

  const mobile = window.innerWidth < 760;
  const targetX = 0.0;
  const targetY = mobile ? -0.45 : -0.15;

  // Enters from left (back showing) and rotates toward camera
  group.position.x = THREE.MathUtils.lerp(-5.0, targetX, e);
  group.position.y = THREE.MathUtils.lerp(-1.0, targetY, e) + Math.sin(now * 0.0017) * 0.075;
  group.position.z = THREE.MathUtils.lerp(0.0, 2.5, e);

  // Rotation.y starts at Math.PI (back) and lerps to facing forward (0)
  group.rotation.y = THREE.MathUtils.lerp(Math.PI, 0.03 + Math.sin(now * 0.0008) * 0.045, turn);
  group.rotation.z = THREE.MathUtils.lerp(-0.25, Math.sin(now * 0.0011) * 0.018, e);
  group.rotation.x = Math.sin(now * 0.0010) * 0.018;

  const scaleEntrance = THREE.MathUtils.lerp(0.58, mobile ? 0.92 : 1.0, e);
  const breathing = 1 + Math.sin(now * 0.0022) * 0.012;
  const boost = now < modeBoostUntil ? 1.035 : 1;
  group.scale.setScalar(scaleEntrance * breathing * boost);

  // FADE OUT LOGIC
  const fadeStartTime = 3.8; // Starts after 3.8 seconds
  const fadeDuration = 1.2;  // Fades over 1.2 seconds
  let globalFade = 1.0;
  if (elapsed > fadeStartTime) {
      globalFade = Math.max(0, 1 - (elapsed - fadeStartTime) / fadeDuration);
      if (globalFade <= 0) {
          canvas.style.display = 'none'; // Nuclear hide
          return;
      }
  }

  // Character opacity with Global Fade
  charMat.opacity = THREE.MathUtils.lerp(0.50, 0.86 + Math.sin(now * 0.0024) * 0.055, e) * globalFade;
  glowMat.opacity = THREE.MathUtils.lerp(0.0, 0.48 + Math.sin(now * 0.004) * 0.18, e) * globalFade;
  particlesMat.opacity = THREE.MathUtils.lerp(0.0, 0.48, e) * globalFade;

  // LIVELY ANIMATION: Simulate waving robe and hair using vertex displacement
  const charPos = character.geometry.attributes.position;
  for (let i = 0; i < charPos.count; i++) {
    const py = charPos.getY(i);
    const px = charPos.getX(i);
    // Dynamic wave based on vertical position and time
    const wave = Math.sin(now * 0.0025 + py * 1.2) * 0.032;
    const secondary = Math.cos(now * 0.0018 + px * 0.8) * 0.015;
    charPos.setZ(i, wave + secondary);
  }
  charPos.needsUpdate = true;

  // Orb
  const pulse = 1 + Math.sin(now * 0.0055) * 0.22;
  orb.scale.setScalar(pulse);
  orb.material.opacity = 0.65 + Math.sin(now * 0.006) * 0.25;
  ring1.rotation.z += 0.010;
  ring2.rotation.z -= 0.007;
  ring1.material.opacity = 0.20 + Math.sin(now * 0.003) * 0.11;
  ring2.material.opacity = 0.16 + Math.sin(now * 0.0027) * 0.10;

  // Scan line occasionally moves through body
  const scan = (now * 0.00022) % 1;
  scanLine.position.y = 1.65 - scan * 3.15;
  scanLine.material.opacity = scan > 0.08 && scan < 0.28 ? 0.25 : 0.0;

  // Animate particle positions upward
  const pos = particlesGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    pos[i3 + 1] += velocities[i];
    pos[i3] += Math.sin(now * 0.001 + i) * 0.0008;
    if (pos[i3 + 1] > 2.6) {
      pos[i3 + 1] = -2.7;
      pos[i3] = (Math.random() - 0.5) * 5.5;
    }
  }
  particlesGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  layoutCharacter();
});

// Expose replay for your PWA code:
// window.playKalpana3D()
window.playKalpana3D = resetEntrance;
