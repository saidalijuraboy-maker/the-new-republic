import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CELL = 5;
const ROAD = 4;
const BLOCK = 5;
const COLS = 40;
const BLOCK_W = BLOCK * CELL + ROAD;
const W = (COLS / BLOCK) * BLOCK_W + ROAD;
const BASE = 0.1; // top of lawns

const pos = (i) => ROAD + Math.floor(i / BLOCK) * BLOCK_W + (i % BLOCK) * CELL;
const blocksFor = (rows) => Math.ceil(rows / BLOCK);
const lotCenter = (i) => {
  const blockStart = ROAD + Math.floor(i / BLOCK) * BLOCK_W;
  return blockStart + ((i % BLOCK) < 2 ? CELL : 4 * CELL);
};
const hx = (h) => lotCenter(h.plot_x);
const hz = (h) => lotCenter(h.plot_y);

/* ---------- noise ---------- */
function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return s;
}
function ridged(x, y) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1);
    s += a * n * n;
    f *= 2;
    a *= 0.5;
  }
  return s;
}
function mulberry(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- terrain ---------- */
const riverX = (z) => W + 95 + 16 * Math.sin(z * 0.02) + 9 * Math.sin(z * 0.057 + 1.3);
const WATER_Y = -1.0;

function terrainH(x, z, Hc) {
  const dx = Math.max(0, -x, x - W);
  const dz = Math.max(0, -z, z - Hc);
  const d = Math.hypot(dx, dz);
  let h = 0;
  const n = fbm(x * 0.007 + 10, z * 0.007 + 5);
  h += Math.max(0, n - 0.42) * 38 * smooth(8, 90, d);
  const m = smooth(40, 230, d);
  h += m * m * (20 + ridged(x * 0.004 + 3, z * 0.004 + 9) * 130);

  if (x > W - 20) {
    const c = (1 - smooth(12, 34, Math.abs(z - ROAD / 2))) * (1 - smooth(120, 190, x - W));
    h *= 1 - c;
  }

  const rd = Math.abs(x - riverX(z));
  const t = smooth(8, 26, rd);
  h = h * t + -3.4 * (1 - t);
  return h;
}

const C = (hex) => new THREE.Color(hex);
const cGrassA = C('#4a8a36');
const cGrassB = C('#6fa84a');
const cCity = C('#5b9a45');
const cSand = C('#d6c48e');
const cWet = C('#6d6648');
const cRock = C('#8a857e');
const cRock2 = C('#6a6662');
const cSnow = C('#f6f9fc');
const cDirt = C('#8a7350');
const tmp = new THREE.Color();

function terrainColor(x, z, h, Hc, out) {
  const rd = Math.abs(x - riverX(z));
  const noise = fbm(x * 0.05, z * 0.05);
  const fine = vnoise(x * 0.35, z * 0.35);
  const inCity = x > -6 && x < W + 6 && z > -6 && z < Hc + 6;

  if (h < -0.7) return out.copy(cWet);
  if (rd < 32 && h < 1.5) return out.copy(cSand).lerp(cGrassA, smooth(0.2, 1.5, h) * 0.6).lerp(cDirt, fine * 0.15);
  if (h > 62) return out.copy(cSnow);
  if (h > 42) return out.copy(cRock2).lerp(cSnow, smooth(42, 62, h));
  if (h > 26) return out.copy(cGrassA).lerp(cRock, smooth(26, 40, h));
  if (inCity) return out.copy(cCity).lerp(cGrassB, noise * 0.5);
  out.copy(cGrassA).lerp(cGrassB, noise);
  out.lerp(cDirt, smooth(0.62, 0.8, fine) * 0.25);
  return out.lerp(cRock, smooth(18, 28, h) * 0.5);
}

/* ---------- textures ---------- */
function detailTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const x = c.getContext('2d');
  const img = x.createImageData(S, S);
  const rng = mulberry(9);
  for (let i = 0; i < S * S; i++) {
    const v = 205 + Math.floor(rng() * 50);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function waterNormalTexture() {
  const S = 128;
  const TP = Math.PI * 2;
  const hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      hgt[y * S + x] =
        Math.sin(TP * (3 * u + Math.sin(TP * 2 * v) * 0.25)) * 0.5 +
        Math.sin(TP * (5 * v + 2 * u)) * 0.3 +
        Math.sin(TP * 7 * (u + v)) * 0.2;
    }
  }
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const l = hgt[y * S + ((x - 1 + S) % S)];
      const r = hgt[y * S + ((x + 1) % S)];
      const u = hgt[((y - 1 + S) % S) * S + x];
      const d = hgt[((y + 1) % S) * S + x];
      let nx = (l - r) * 1.2;
      let ny = (u - d) * 1.2;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * S + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#2d333b';
  x.fillRect(0, 0, 32, 64);
  x.fillStyle = '#e6c35c';
  x.fillRect(15, 6, 2, 22);
  x.fillStyle = '#d8dde3';
  x.fillRect(1, 0, 1, 64);
  x.fillRect(30, 0, 1, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------- house parts ---------- */
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const pyr = (r, h, x, y, z) => new THREE.ConeGeometry(r, h, 4).rotateY(Math.PI / 4).translate(x, y + h / 2, z);
const cyl = (rt, rb, h, x, y, z, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s).translate(x, y + h / 2, z);
const ball = (r, x, y, z) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z);

const WALLS = ['#ead9b4', '#e0a896', '#a5c5db', '#b9d9a6'];
const ROOFS = ['#b5483a', '#47588a', '#6b4a3a', '#3a6b5a'];
const DOOR = '#5a3a1f';
const GLASS = '#8fc6f0';
const FRAME = '#ffffff';
const HEDGE = '#3f7f35';

function hedges() {
  return [
    [box(4.6, 0.5, 0.25, 0, 0.25, -2.3), HEDGE],
    [box(0.25, 0.5, 4.4, -2.3, 0.25, 0), HEDGE],
    [box(0.25, 0.5, 4.4, 2.3, 0.25, 0), HEDGE]
  ];
}
const paving = () => [box(4.6, 0.04, 4.6, 0, 0.02, 0), '#a9adb3'];

function makeParts() {
  return {
    house: [
      [box(3.2, 2.2, 3.2, 0, 1.1, 0), WALLS],
      [box(3.6, 0.15, 3.6, 0, 2.2, 0), '#d8d0c0'],
      [pyr(2.6, 1.8, 0, 2.25, 0), ROOFS],
      [box(0.7, 1.2, 0.12, 0, 0.6, 1.62), DOOR],
      [box(1.3, 0.1, 0.8, 0, 0.05, 2.0), '#c9c2b4'],
      [box(0.78, 0.78, 0.06, -1.0, 1.3, 1.6), FRAME],
      [box(0.6, 0.6, 0.1, -1.0, 1.3, 1.63), GLASS],
      [box(0.78, 0.78, 0.06, 1.0, 1.3, 1.6), FRAME],
      [box(0.6, 0.6, 0.1, 1.0, 1.3, 1.63), GLASS],
      [box(0.5, 1.1, 0.5, 0.9, 2.7, -0.7), '#8a8a8a'],
      [box(0.38, 0.1, 0.38, 0.9, 3.28, -0.7), '#4a4a4a'],
      ...hedges()
    ],
    villa: [
      [box(4, 2.2, 3.6, 0, 1.1, 0), WALLS],
      [box(3, 1.6, 2.8, 0, 3.0, 0), '#f3ead6'],
      [box(4.2, 0.12, 3.8, 0, 2.2, 0), '#d8d0c0'],
      [pyr(3.0, 1.7, 0, 3.8, 0), ROOFS],
      [box(0.8, 1.3, 0.12, 0, 0.65, 1.82), DOOR],
      [box(1.6, 0.1, 0.8, 0, 0.05, 2.2), '#c9c2b4'],
      [box(0.78, 0.78, 0.06, -1.3, 1.3, 1.8), FRAME],
      [box(0.62, 0.62, 0.1, -1.3, 1.3, 1.83), GLASS],
      [box(0.78, 0.78, 0.06, 1.3, 1.3, 1.8), FRAME],
      [box(0.62, 0.62, 0.1, 1.3, 1.3, 1.83), GLASS],
      [box(0.78, 0.78, 0.06, 0, 3.0, 1.4), FRAME],
      [box(0.62, 0.62, 0.1, 0, 3.0, 1.43), GLASS],
      [cyl(0.15, 0.15, 2.2, -1.7, 0, 2.0, 8), '#ffffff'],
      [cyl(0.15, 0.15, 2.2, 1.7, 0, 2.0, 8), '#ffffff'],
      ...hedges()
    ],
    shop: [
      paving(),
      [box(3.8, 2.4, 3.6, 0, 1.2, 0), '#f2c14e'],
      [box(4.0, 0.2, 3.8, 0, 2.5, 0), '#6b6b6b'],
      [box(4.1, 0.18, 1.2, 0, 2.0, 2.1), '#c0392b'],
      [box(2.6, 1.0, 0.1, 0, 1.1, 1.85), GLASS],
      [box(2.4, 0.6, 0.15, 0, 2.95, 1.7), '#ffffff'],
      [box(0.7, 1.3, 0.1, 1.4, 0.65, 1.86), DOOR]
    ],
    cafe: [
      paving(),
      [box(3.6, 2.1, 3.4, 0, 1.05, 0), '#f0a6c6'],
      [box(3.8, 0.2, 3.6, 0, 2.2, 0), '#7a3b6b'],
      [box(3.9, 0.16, 1.1, 0, 1.9, 2.0), '#7a3b6b'],
      [box(2.2, 0.9, 0.1, 0, 1.0, 1.75), GLASS],
      [cyl(0.4, 0.4, 0.5, -1.3, 0, 2.2), '#ffffff'],
      [cyl(0.4, 0.4, 0.5, 1.3, 0, 2.2), '#ffffff'],
      [cyl(0.05, 0.05, 1.3, 1.3, 0, 2.2, 6), '#555555'],
      [cyl(0.9, 0.05, 0.4, 1.3, 1.3, 2.2, 8), '#c0392b']
    ],
    bank: [
      paving(),
      [box(4, 2.4, 3.6, 0, 1.2, 0), '#cfd3dc'],
      [pyr(3.4, 1.2, 0, 2.4, 0), '#9aa0ad'],
      [box(4.4, 0.2, 0.9, 0, 0.1, 2.2), '#aaaaaa'],
      [cyl(0.22, 0.22, 2.4, -1.4, 0, 1.9), '#ffffff'],
      [cyl(0.22, 0.22, 2.4, -0.5, 0, 1.9), '#ffffff'],
      [cyl(0.22, 0.22, 2.4, 0.5, 0, 1.9), '#ffffff'],
      [cyl(0.22, 0.22, 2.4, 1.4, 0, 1.9), '#ffffff'],
      [ball(0.5, 0, 3.8, 0), '#f5c842']
    ],
    tower: [
      paving(),
      [box(3.6, 0.4, 3.6, 0, 0.2, 0), '#8a929c'],
      [box(2.8, 9, 2.8, 0, 4.5, 0), '#5f8fc4'],
      [box(3.1, 0.3, 3.1, 0, 9.15, 0), '#3d5a80'],
      [cyl(0.08, 0.08, 2.5, 0, 9.3, 0, 6), '#cccccc'],
      [box(2.9, 0.25, 2.9, 0, 1.5, 0), '#cfe8ff'],
      [box(2.9, 0.25, 2.9, 0, 3.0, 0), '#cfe8ff'],
      [box(2.9, 0.25, 2.9, 0, 4.5, 0), '#cfe8ff'],
      [box(2.9, 0.25, 2.9, 0, 6.0, 0), '#cfe8ff'],
      [box(2.9, 0.25, 2.9, 0, 7.5, 0), '#cfe8ff']
    ],
    farm: [
      [box(4.6, 0.05, 1.1, 0, 0.03, -1.9), '#7a5a32'],
      [box(3.4, 2.2, 3.6, 0, 1.1, 0), '#b5483a'],
      [pyr(3.0, 1.6, 0, 2.2, 0), '#7a2e25'],
      [box(1.2, 1.5, 0.1, 0, 0.75, 1.82), '#f1e6d0'],
      [cyl(0.7, 0.7, 3.4, 1.9, 0, -1.5, 12), '#d8d2c0'],
      [new THREE.ConeGeometry(0.8, 0.8, 12).translate(1.9, 3.8, -1.5), '#8a8a8a'],
      [cyl(0.5, 0.5, 0.6, -1.9, 0, 1.9, 10), '#e6c75a']
    ],
    park: [
      [box(4.6, 0.12, 4.6, 0, 0.06, 0), '#3f9a4f'],
      [cyl(0.9, 0.9, 0.16, 0.3, 0, 0.4, 14), '#4aa3df'],
      [cyl(0.2, 0.25, 1.2, -1.5, 0, -1.4, 6), '#6b4a2a'],
      [ball(1.1, -1.5, 2.0, -1.4), '#2f8f3e'],
      [cyl(0.2, 0.25, 1.2, 1.6, 0, -1.5, 6), '#6b4a2a'],
      [ball(1.0, 1.6, 1.9, -1.5), '#3a9a48'],
      [cyl(0.2, 0.25, 1.2, -1.6, 0, 1.5, 6), '#6b4a2a'],
      [ball(1.0, -1.6, 1.9, 1.5), '#2a8238'],
      [box(1.2, 0.3, 0.4, 1.4, 0.3, 1.6), '#8a5a2b']
    ]
  };
}

function disposeObject(o) {
  o.traverse((n) => {
    if (n.geometry) n.geometry.dispose();
    if (n.material) {
      const list = Array.isArray(n.material) ? n.material : [n.material];
      list.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
    if (n.isInstancedMesh) n.dispose();
  });
}

/* ---------- engine ---------- */
export function createCity(container, { onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const dom = renderer.domElement;
  dom.style.display = 'block';
  dom.style.width = '100%';
  dom.style.height = '100%';
  container.appendChild(dom);

  const HORIZON = '#d9edf9';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HORIZON);
  scene.fog = new THREE.Fog(HORIZON, 320, 1400);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 3200);
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 6;
  controls.maxDistance = 650;
  controls.screenSpacePanning = false;

  scene.add(new THREE.HemisphereLight('#cfe8ff', '#4a6b3a', 0.9));
  const sun = new THREE.DirectionalLight('#fff1d0', 2.6);
  sun.castShadow = true;
  const small = window.innerWidth < 700;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.4;
  scene.add(sun, sun.target);
  const SUN_DIR = new THREE.Vector3(220, 380, 180).normalize();

  /* sky dome + sun disc */
  const skyGeo = new THREE.SphereGeometry(2400, 24, 16);
  {
    const sp = skyGeo.attributes.position;
    const sc = new Float32Array(sp.count * 3);
    const hor = C(HORIZON);
    const zen = C('#3f86d6');
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i) / 2400;
      if (y > 0) tmp.copy(hor).lerp(zen, Math.pow(y, 0.55));
      else tmp.copy(hor);
      sc[i * 3] = tmp.r;
      sc[i * 3 + 1] = tmp.g;
      sc[i * 3 + 2] = tmp.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  }
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -2;
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(70, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfffbe6, fog: false, toneMapped: false }));
  scene.add(sunDisc);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
  const baseRoad = roadTexture();
  const detail = detailTexture();
  const waterNormal = waterNormalTexture();
  const parts = makeParts();

  let worldGroup = null;
  let cityGroup = null;
  let capRows = 0;
  let Hc = 0;
  let pickables = [];
  let current = [];
  let selected = null;
  let firstFit = true;
  let carState = null;

  /* clouds */
  const clouds = new THREE.Group();
  {
    const rng = mulberry(77);
    const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const n = 3 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) {
        const s = new THREE.Mesh(new THREE.IcosahedronGeometry(10 + rng() * 10, 1), cm);
        s.position.set(k * 14 - n * 7, rng() * 5, rng() * 8);
        s.scale.y = 0.55;
        g.add(s);
      }
      g.position.set(-400 + rng() * (W + 800), 150 + rng() * 80, -400 + rng() * 1400);
      g.userData.speed = 1.5 + rng() * 2;
      clouds.add(g);
    }
    scene.add(clouds);
  }

  /* selection marker */
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.3, 3.9, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xf5c842, side: THREE.DoubleSide })
  );
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 40, 8).translate(0, 20, 0),
    new THREE.MeshBasicMaterial({ color: 0xf5c842, transparent: true, opacity: 0.45 })
  );
  marker.add(ring, beam);
  marker.visible = false;
  scene.add(marker);

  /* ---------- world ---------- */
  function buildWorld() {
    if (worldGroup) {
      disposeObject(worldGroup);
      scene.remove(worldGroup);
    }
    const g = new THREE.Group();
    const margin = 260;
    const minX = -margin;
    const maxX = W + margin;
    const minZ = -margin;
    const maxZ = Hc + margin;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const segX = Math.round(width / 3.2);
    const segZ = Math.round(depth / 3.2);

    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const p = geo.attributes.position;
    const colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const h = terrainH(x, z, Hc);
      p.setY(i, h);
      terrainColor(x, z, h, Hc, tmp);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    /* steep slopes become bare rock */
    const nr = geo.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const ny = nr.getY(i);
      if (ny >= 0.8) continue;
      const x = p.getX(i);
      const z = p.getZ(i);
      if (x > -8 && x < W + 8 && z > -8 && z < Hc + 8) continue;
      const k = smooth(0.8, 0.5, ny);
      colors[i * 3] += (cRock.r - colors[i * 3]) * k;
      colors[i * 3 + 1] += (cRock.g - colors[i * 3 + 1]) * k;
      colors[i * 3 + 2] += (cRock.b - colors[i * 3 + 2]) * k;
    }

    detail.repeat.set(width / 10, depth / 10);
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: detail, roughness: 1 }));
    terrain.receiveShadow = true;
    g.add(terrain);

    waterNormal.repeat.set(width / 18, depth / 18);
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth).rotateX(-Math.PI / 2).translate((minX + maxX) / 2, WATER_Y, (minZ + maxZ) / 2),
      new THREE.MeshStandardMaterial({
        color: 0x2a7fb5,
        roughness: 0.1,
        metalness: 0.3,
        normalMap: waterNormal,
        normalScale: new THREE.Vector2(0.7, 0.7),
        transparent: true,
        opacity: 0.88
      })
    );
    water.name = 'water';
    g.add(water);

    /* road east over the river */
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2d333b, roughness: 0.9 });
    const ext = new THREE.Mesh(new THREE.BoxGeometry(130, 0.1, ROAD), roadMat);
    ext.position.set(W + 65, 0.05, ROAD / 2);
    ext.receiveShadow = true;
    g.add(ext);

    const rx = riverX(ROAD / 2);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.6 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(56, 0.5, ROAD + 2), new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.9 }));
    deck.position.set(rx, -0.2, ROAD / 2);
    deck.castShadow = true;
    deck.receiveShadow = true;
    g.add(deck);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(56, 0.7, 0.25), railMat);
      rail.position.set(rx, 0.55, ROAD / 2 + side * (ROAD / 2 + 0.8));
      rail.castShadow = true;
      g.add(rail);
    }
    for (let i = -2; i <= 2; i++) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4, ROAD + 1), railMat);
      pier.position.set(rx + i * 12, -2.4, ROAD / 2);
      pier.castShadow = true;
      g.add(pier);
    }

    /* forest, bushes, rocks */
    const rng = mulberry(2024);
    const round = [];
    const pines = [];
    for (let i = 0; i < 9000; i++) {
      const x = minX + rng() * width;
      const z = minZ + rng() * depth;
      if (x > -10 && x < W + 10 && z > -10 && z < Hc + 10) continue;
      if (x > W - 10 && x < W + 150 && Math.abs(z - ROAD / 2) < 14) continue;
      if (Math.abs(x - riverX(z)) < 20) continue;
      const dens = fbm(x * 0.015 + 40, z * 0.015 + 7);
      if (dens < 0.5 && rng() > 0.04) continue;
      const h = terrainH(x, z, Hc);
      if (h < 0.5 || h > 44) continue;
      (h > 20 ? pines : round).push([x, h, z, 0.8 + rng() * 0.8, rng()]);
    }
    const bushes = [];
    round.forEach((t) => {
      if (t[4] < 0.5) bushes.push([t[0] + 2.4, t[1], t[2] + 1.5, 0.6 + t[4] * 0.8, t[4]]);
    });

    const rocks = [];
    for (let i = 0; i < 900; i++) {
      const x = minX + rng() * width;
      const z = minZ + rng() * depth;
      if (x > -6 && x < W + 6 && z > -6 && z < Hc + 6) continue;
      if (x > W - 10 && x < W + 150 && Math.abs(z - ROAD / 2) < 14) continue;
      const h = terrainH(x, z, Hc);
      const nearRiver = Math.abs(x - riverX(z)) < 40 && h > -0.5;
      if (!(h > 12 || nearRiver)) continue;
      rocks.push([x, h - 0.2, z, 0.8 + rng() * 2.6, rng()]);
    }

    const treeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    const quat = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const addInst = (geom, arr, y0, base, jitter, rot, yScale) => {
      if (!arr.length) return;
      const mesh = new THREE.InstancedMesh(geom, treeMat, arr.length);
      arr.forEach((t, i) => {
        if (rot) quat.setFromEuler(eul.set(t[4] * 6, t[4] * 13, t[4] * 3));
        else quat.identity();
        m4.compose(
          new THREE.Vector3(t[0], t[1] + y0 * t[3], t[2]),
          quat,
          new THREE.Vector3(t[3], t[3] * (yScale || 1), t[3])
        );
        mesh.setMatrixAt(i, m4);
        col.set(base).offsetHSL((t[4] - 0.5) * jitter, 0, (t[4] - 0.5) * 0.08);
        mesh.setColorAt(i, col);
      });
      g.add(mesh);
    };
    const all = [...round, ...pines];
    addInst(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6), all, 1.2, '#6b4a2a', 0, false);
    addInst(new THREE.IcosahedronGeometry(2.2, 0), round, 3.4, '#3f8f3a', 0.08, false);
    addInst(new THREE.IcosahedronGeometry(1.6, 0), round, 4.9, '#4c9d40', 0.1, false);
    addInst(new THREE.ConeGeometry(2.1, 6, 7), pines, 5, '#2d6b3a', 0.05, false);
    addInst(new THREE.ConeGeometry(1.5, 4, 7), pines, 8.2, '#357a42', 0.05, false);
    addInst(new THREE.IcosahedronGeometry(0.9, 0), bushes, 0.5, '#4a9a3a', 0.1, false);
    addInst(new THREE.DodecahedronGeometry(1, 0), rocks, 0.3, '#8a857e', 0.02, true, 0.7);

    worldGroup = g;
    scene.add(g);
  }

  /* ---------- city ---------- */
  function buildCity(list) {
    if (cityGroup) {
      disposeObject(cityGroup);
      scene.remove(cityGroup);
    }
    carState = null;
    const g = new THREE.Group();
    let maxY = 0;
    const occupied = new Set();
    for (const h of list) {
      if (h.plot_y > maxY) maxY = h.plot_y;
      const bx = Math.floor(h.plot_x / BLOCK) * BLOCK;
      const bz = Math.floor(h.plot_y / BLOCK) * BLOCK;
      const x0 = bx + ((h.plot_x % BLOCK) < 2 ? 0 : 3);
      const z0 = bz + ((h.plot_y % BLOCK) < 2 ? 0 : 3);
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) occupied.add((x0 + dx) + ',' + (z0 + dy));
      }
    }
    const rows = Math.max(BLOCK * 2, maxY + 2);
    const blocksY = blocksFor(rows);
    const Hs = blocksY * BLOCK_W + ROAD;
    const mm = new THREE.Matrix4();
    const cc = new THREE.Color();

    /* roads */
    const mkRoad = (L, x, z, rotY, y) => {
      const t = baseRoad.clone();
      t.needsUpdate = true;
      t.repeat.set(1, L / 12);
      const m = new THREE.Mesh(new THREE.BoxGeometry(ROAD, 0.1, L), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      m.receiveShadow = true;
      g.add(m);
    };
    for (let b = 0; b <= COLS / BLOCK; b++) mkRoad(Hs, b * BLOCK_W + ROAD / 2, Hs / 2, 0, 0.05);
    for (let b = 0; b <= blocksY; b++) mkRoad(W, W / 2, b * BLOCK_W + ROAD / 2, Math.PI / 2, 0.06);

    /* sidewalk slab under every block */
    const nb = (COLS / BLOCK) * blocksY;
    const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(BLOCK * CELL, 0.08, BLOCK * CELL), baseMat, nb);
    let si = 0;
    for (let bx = 0; bx < COLS / BLOCK; bx++) {
      for (let bz = 0; bz < blocksY; bz++) {
        mm.makeTranslation(ROAD + bx * BLOCK_W + (BLOCK * CELL) / 2, 0.04, ROAD + bz * BLOCK_W + (BLOCK * CELL) / 2);
        slabs.setMatrixAt(si, mm);
        slabs.setColorAt(si, cc.set('#a3a9af'));
        si++;
      }
    }
    slabs.receiveShadow = true;
    g.add(slabs);

    /* lawns */
    const blocksX = COLS / BLOCK;
    const lawnCount = blocksX * blocksY * 4;
    const lotSize = CELL * 2 - 0.35;
    const lawns = new THREE.InstancedMesh(new THREE.BoxGeometry(lotSize, 0.06, lotSize), baseMat, lawnCount);
    let li = 0;
    for (let bx = 0; bx < blocksX; bx++) {
      for (let bz = 0; bz < blocksY; bz++) {
        for (const ox of [CELL, CELL * 4]) {
          for (const oz of [CELL, CELL * 4]) {
            const x = ROAD + bx * BLOCK_W + ox;
            const z = ROAD + bz * BLOCK_W + oz;
            mm.makeTranslation(x, BASE - 0.03, z);
            lawns.setMatrixAt(li, mm);
            cc.set('#5fa24b').offsetHSL(0, 0, (hash(bx * 7 + ox, bz * 7 + oz) - 0.5) * 0.06);
            lawns.setColorAt(li, cc);
            li++;
          }
        }
      }
    }
    lawns.receiveShadow = true;
    g.add(lawns);

    /* trees on some empty lots */
    const lotTrees = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        if (occupied.has(x + ',' + y)) continue;
        if (hash(x + 91, y + 17) < 0.4) lotTrees.push([pos(x) + CELL / 2, pos(y) + CELL / 2, 0.7 + hash(x, y + 5) * 0.6, hash(x + 3, y + 9)]);
      }
    }
    if (lotTrees.length) {
      const tm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
      const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 1.4, 6).translate(0, 0.7, 0), tm, lotTrees.length);
      const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5, 1).translate(0, 2.4, 0), tm, lotTrees.length);
      lotTrees.forEach((t, i) => {
        mm.compose(new THREE.Vector3(t[0], BASE, t[1]), new THREE.Quaternion(), new THREE.Vector3(t[2], t[2], t[2]));
        trunk.setMatrixAt(i, mm);
        crown.setMatrixAt(i, mm);
        trunk.setColorAt(i, cc.set('#6b4a2a'));
        crown.setColorAt(i, cc.set('#3f8f3a').offsetHSL((t[3] - 0.5) * 0.08, 0, (t[3] - 0.5) * 0.1));
      });
      crown.castShadow = true;
      trunk.castShadow = true;
      g.add(trunk, crown);
    }

    /* street lamps */
    const lampPos = [];
    for (let bx = 0; bx < COLS / BLOCK; bx++) {
      for (let bz = 0; bz < blocksY; bz++) lampPos.push([bx * BLOCK_W + ROAD + 0.4, bz * BLOCK_W + ROAD + 0.4]);
    }
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6).translate(0, 1.6, 0), new THREE.MeshStandardMaterial({ color: 0x4a4f57 }), lampPos.length);
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6).translate(0, 3.3, 0), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), lampPos.length);
    lampPos.forEach((p, i) => {
      mm.makeTranslation(p[0], BASE - 0.04, p[1]);
      poles.setMatrixAt(i, mm);
      bulbs.setMatrixAt(i, mm);
    });
    g.add(poles, bulbs);

    /* moving cars */
    {
      const count = Math.min(140, 20 + Math.floor(list.length / 6));
      const crng = mulberry(31);
      const palette = ['#c0392b', '#2980b9', '#f1c40f', '#ecf0f1', '#27ae60', '#8e44ad', '#e67e22', '#2c3e50'];
      const cars = [];
      for (let i = 0; i < count; i++) {
        const axis = crng() < 0.5 ? 'z' : 'x';
        const nbr = axis === 'z' ? COLS / BLOCK + 1 : blocksY + 1;
        const len = axis === 'z' ? Hs : W;
        cars.push({
          axis,
          b: Math.floor(crng() * nbr),
          lane: crng() < 0.5 ? -1 : 1,
          len,
          p: crng() * len,
          speed: 5 + crng() * 5
        });
      }
      const bodyM = new THREE.InstancedMesh(box(1.6, 0.6, 3.2, 0, 0.6, 0), baseMat, count);
      const cabM = new THREE.InstancedMesh(box(1.4, 0.55, 1.6, 0, 1.15, -0.2), baseMat, count);
      const baseM = new THREE.InstancedMesh(box(1.7, 0.3, 3.0, 0, 0.25, 0), baseMat, count);
      cars.forEach((c, i) => {
        bodyM.setColorAt(i, cc.set(palette[Math.floor(crng() * palette.length)]));
        cabM.setColorAt(i, cc.set('#2b3a4a'));
        baseM.setColorAt(i, cc.set('#161616'));
      });
      bodyM.castShadow = true;
      cabM.castShadow = true;
      g.add(bodyM, cabM, baseM);
      carState = { cars, bodyM, cabM, baseM };
    }

    /* houses */
    const byType = {};
    for (const h of list) (byType[h.house_type in parts ? h.house_type : 'house'] ||= []).push(h);
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const sc1 = new THREE.Vector3(1, 1, 1);
    const pv = new THREE.Vector3();
    const picks = [];
    for (const type of Object.keys(byType)) {
      const arr = byType[type];
      for (const [geom, colDef] of parts[type]) {
        const mesh = new THREE.InstancedMesh(geom.clone(), baseMat, arr.length);
        arr.forEach((h, i) => {
          pv.set(hx(h), BASE, hz(h));
          q.setFromAxisAngle(up, Math.floor(hash(h.plot_x, h.plot_y) * 4) * (Math.PI / 2));
          const houseScale = 1.90 + ((h.style || 0) % 4) * 0.03;
          sc1.setScalar(houseScale);
          mm.compose(pv, q, sc1);
          mesh.setMatrixAt(i, mm);
          const hex = Array.isArray(colDef) ? colDef[(h.style || 0) % colDef.length] : colDef;
          cc.set(hex).multiplyScalar(0.92 + hash(h.plot_x + 7, h.plot_y + 3) * 0.16);
          mesh.setColorAt(i, cc);
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.houses = arr;
        g.add(mesh);
        picks.push(mesh);
      }
    }
    pickables = picks;

    /* sun follows the city */
    const cx = W / 2;
    const cz = Hs / 2;
    const span = Math.max(W, Hs) * 0.72 + 30;
    sun.position.set(cx + 220, 380, cz + 180);
    sun.target.position.set(cx, 0, cz);
    const sh = sun.shadow.camera;
    sh.left = -span;
    sh.right = span;
    sh.top = span;
    sh.bottom = -span;
    sh.near = 10;
    sh.far = 1200;
    sh.updateProjectionMatrix();

    cityGroup = g;
    scene.add(g);
  }

  const carM = new THREE.Matrix4();
  const carQ = new THREE.Quaternion();
  const carP = new THREE.Vector3();
  const carS = new THREE.Vector3(1, 1, 1);
  const upAxis = new THREE.Vector3(0, 1, 0);
  function updateCars(dt) {
    if (!carState) return;
    const { cars, bodyM, cabM, baseM } = carState;
    cars.forEach((c, i) => {
      const dir = c.lane < 0 ? 1 : -1;
      c.p += dir * c.speed * dt;
      if (c.p > c.len) c.p -= c.len;
      if (c.p < 0) c.p += c.len;
      let x;
      let z;
      let ry;
      if (c.axis === 'z') {
        x = c.b * BLOCK_W + ROAD / 2 + c.lane * 0.9;
        z = c.p;
        ry = c.lane < 0 ? 0 : Math.PI;
      } else {
        z = c.b * BLOCK_W + ROAD / 2 + c.lane * 0.9;
        x = c.p;
        ry = c.lane < 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      carP.set(x, 0.12, z);
      carQ.setFromAxisAngle(upAxis, ry);
      carM.compose(carP, carQ, carS);
      bodyM.setMatrixAt(i, carM);
      cabM.setMatrixAt(i, carM);
      baseM.setMatrixAt(i, carM);
    });
    bodyM.instanceMatrix.needsUpdate = true;
    cabM.instanceMatrix.needsUpdate = true;
    baseM.instanceMatrix.needsUpdate = true;
  }

  /* ---------- camera helpers ---------- */
  let fly = null;
  function flyTo(h, dist = 38) {
    const target = new THREE.Vector3(hx(h), 1, hz(h));
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1) dir.set(0.4, 0.8, 0.9);
    dir.normalize();
    if (dir.y < 0.45) dir.y = 0.6;
    dir.normalize();
    fly = {
      t0: performance.now(),
      dur: 1100,
      fp: camera.position.clone(),
      tp: target.clone().add(dir.multiplyScalar(dist)),
      ft: controls.target.clone(),
      tt: target
    };
  }

  function fit(list) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const h of list) {
      minX = Math.min(minX, hx(h));
      maxX = Math.max(maxX, hx(h));
      minZ = Math.min(minZ, hz(h));
      maxZ = Math.max(maxZ, hz(h));
    }
    if (!list.length) {
      minX = maxX = minZ = maxZ = pos(0) + CELL;
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const dist = Math.min(450, Math.max(70, Math.max(maxX - minX, maxZ - minZ) * 1.1 + 60));
    controls.target.set(cx, 0, cz);
    const d = new THREE.Vector3(0.35, 0.75, 0.95).normalize().multiplyScalar(dist);
    camera.position.set(cx + d.x, d.y, cz + d.z);
  }

  /* ---------- API ---------- */
  function setData(list) {
    current = list;
    let maxY = 0;
    for (const h of list) if (h.plot_y > maxY) maxY = h.plot_y;
    const need = Math.max(40, Math.ceil((maxY + 10) / 40) * 40);
    if (need !== capRows) {
      capRows = need;
      Hc = blocksFor(capRows) * BLOCK_W + ROAD;
      buildWorld();
    }
    buildCity(list);
    if (firstFit) {
      firstFit = false;
      fit(list);
    }
    if (selected) {
      const again = list.find((x) => x.citizen_id === selected.citizen_id);
      if (again) selected = again;
    }
  }

  function select(h) {
    selected = h;
    if (!h) {
      marker.visible = false;
      return;
    }
    marker.position.set(hx(h), BASE + 0.1, hz(h));
    marker.visible = true;
  }

  function zoom(f) {
    const dir = camera.position.clone().sub(controls.target);
    const len = Math.min(650, Math.max(6, dir.length() / f));
    camera.position.copy(controls.target).add(dir.normalize().multiplyScalar(len));
  }

  /* picking */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  const onDown = (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onUp = (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const dt = performance.now() - down.t;
    down = null;
    if (moved > 6 || dt > 600) return;
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    let found = null;
    for (const hit of hits) {
      if (hit.instanceId != null && hit.object.userData.houses) {
        found = hit.object.userData.houses[hit.instanceId];
        break;
      }
    }
    select(found);
    if (onPick) onPick(found);
  };
  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointerup', onUp);

  /* resize */
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* loop */
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;

    if (fly) {
      const k = Math.min(1, (performance.now() - fly.t0) / fly.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(fly.fp, fly.tp, e);
      controls.target.lerpVectors(fly.ft, fly.tt, e);
      if (k >= 1) fly = null;
    }

    clouds.children.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > W + 450) c.position.x = -450;
    });

    if (marker.visible) {
      ring.scale.setScalar(1 + 0.12 * Math.sin(t * 4));
      beam.material.opacity = 0.35 + 0.15 * Math.sin(t * 3);
    }

    waterNormal.offset.x += dt * 0.012;
    waterNormal.offset.y += dt * 0.007;
    updateCars(dt);

    controls.update();
    sky.position.copy(camera.position);
    sunDisc.position.copy(camera.position).addScaledVector(SUN_DIR, 2000);
    renderer.render(scene, camera);
  });

  function dispose() {
    renderer.setAnimationLoop(null);
    ro.disconnect();
    dom.removeEventListener('pointerdown', onDown);
    dom.removeEventListener('pointerup', onUp);
    controls.dispose();
    if (cityGroup) disposeObject(cityGroup);
    if (worldGroup) disposeObject(worldGroup);
    disposeObject(clouds);
    disposeObject(sky);
    detail.dispose();
    waterNormal.dispose();
    renderer.dispose();
    if (dom.parentNode) dom.parentNode.removeChild(dom);
  }

  return { setData, select, flyTo, zoom, dispose, get data() { return current; } };
}
