import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const CELL = 5;
const ROAD = 4;
const BLOCK = 5;
const COLS = 40;
const BLOCK_W = BLOCK * CELL + ROAD;
const W = (COLS / BLOCK) * BLOCK_W + ROAD;

const pos = (i) => ROAD + Math.floor(i / BLOCK) * BLOCK_W + (i % BLOCK) * CELL;
const blocksFor = (rows) => Math.ceil(rows / BLOCK);
const hx = (h) => pos(h.plot_x) + CELL / 2;
const hz = (h) => pos(h.plot_y) + CELL / 2;

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
const cGrassA = C("#4f8f3a");
const cGrassB = C("#6aa84a");
const cCity = C("#5b9a45");
const cSand = C("#d2c08a");
const cWet = C("#7a6e4e");
const cRock = C("#8a8680");
const cRock2 = C("#6e6a66");
const cSnow = C("#f4f7fa");
const tmp = new THREE.Color();

function terrainColor(x, z, h, Hc, out) {
  const rd = Math.abs(x - riverX(z));
  const noise = fbm(x * 0.05, z * 0.05);
  const inCity = x > -6 && x < W + 6 && z > -6 && z < Hc + 6;

  if (h < -0.7) return out.copy(cWet);
  if (rd < 32 && h < 1.5) return out.copy(cSand).lerp(cGrassA, smooth(0.2, 1.5, h) * 0.6);
  if (h > 62) return out.copy(cSnow);
  if (h > 42) return out.copy(cRock2).lerp(cSnow, smooth(42, 62, h));
  if (h > 26) return out.copy(cGrassA).lerp(cRock, smooth(26, 40, h));
  if (inCity) return out.copy(cCity).lerp(cGrassB, noise * 0.5);
  out.copy(cGrassA).lerp(cGrassB, noise);
  return out.lerp(cRock, smooth(18, 28, h) * 0.5);
}

/* ---------- house parts ---------- */
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const pyr = (r, h, x, y, z) => new THREE.ConeGeometry(r, h, 4).rotateY(Math.PI / 4).translate(x, y + h / 2, z);
const cyl = (rt, rb, h, x, y, z, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s).translate(x, y + h / 2, z);
const ball = (r, x, y, z) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z);

const WALLS = ["#ead9b4", "#e0a896", "#a5c5db", "#b9d9a6"];
const ROOFS = ["#b5483a", "#47588a", "#6b4a3a", "#3a6b5a"];
const DOOR = "#5a3a1f";
const GLASS = "#9fd0ff";

function makeParts() {
  return {
    house: [
      [box(3.2, 2.2, 3.2, 0, 1.1, 0), WALLS],
      [pyr(2.6, 1.8, 0, 2.2, 0), ROOFS],
      [box(0.7, 1.2, 0.12, 0, 0.6, 1.62), DOOR],
      [box(0.6, 0.6, 0.1, -1.0, 1.3, 1.62), GLASS],
      [box(0.6, 0.6, 0.1, 1.0, 1.3, 1.62), GLASS],
      [box(0.5, 1.1, 0.5, 0.9, 2.7, -0.7), "#8a8a8a"]
    ],
    villa: [
      [box(4, 2.2, 3.6, 0, 1.1, 0), WALLS],
      [box(3, 1.6, 2.8, 0, 3.0, 0), "#f3ead6"],
      [pyr(3.0, 1.7, 0, 3.8, 0), ROOFS],
      [box(0.8, 1.3, 0.12, 0, 0.65, 1.82), DOOR],
      [box(0.7, 0.7, 0.1, -1.3, 1.3, 1.82), GLASS],
      [box(0.7, 0.7, 0.1, 1.3, 1.3, 1.82), GLASS],
      [box(0.7, 0.7, 0.1, 0, 3.0, 1.42), GLASS]
    ],
    shop: [
      [box(3.8, 2.4, 3.6, 0, 1.2, 0), "#f2c14e"],
      [box(4.0, 0.2, 3.8, 0, 2.5, 0), "#6b6b6b"],
      [box(4.1, 0.18, 1.2, 0, 2.0, 2.1), "#c0392b"],
      [box(2.6, 1.0, 0.1, 0, 1.1, 1.85), GLASS],
      [box(2.4, 0.6, 0.15, 0, 2.95, 1.7), "#ffffff"]
    ],
    cafe: [
      [box(3.6, 2.1, 3.4, 0, 1.05, 0), "#f0a6c6"],
      [box(3.8, 0.2, 3.6, 0, 2.2, 0), "#7a3b6b"],
      [box(3.9, 0.16, 1.1, 0, 1.9, 2.0), "#7a3b6b"],
      [box(2.2, 0.9, 0.1, 0, 1.0, 1.75), GLASS],
      [cyl(0.4, 0.4, 0.5, -1.3, 0, 2.2), "#ffffff"],
      [cyl(0.4, 0.4, 0.5, 1.3, 0, 2.2), "#ffffff"]
    ],
    bank: [
      [box(4, 2.4, 3.6, 0, 1.2, 0), "#cfd3dc"],
      [pyr(3.4, 1.2, 0, 2.4, 0), "#9aa0ad"],
      [box(4.4, 0.2, 0.9, 0, 0.1, 2.2), "#aaaaaa"],
      [cyl(0.22, 0.22, 2.4, -1.4, 0, 1.9), "#ffffff"],
      [cyl(0.22, 0.22, 2.4, -0.5, 0, 1.9), "#ffffff"],
      [cyl(0.22, 0.22, 2.4, 0.5, 0, 1.9), "#ffffff"],
      [cyl(0.22, 0.22, 2.4, 1.4, 0, 1.9), "#ffffff"],
      [ball(0.5, 0, 3.8, 0), "#f5c842"]
    ],
    tower: [
      [box(2.8, 9, 2.8, 0, 4.5, 0), "#5f8fc4"],
      [box(3.1, 0.3, 3.1, 0, 9.15, 0), "#3d5a80"],
      [cyl(0.08, 0.08, 2.5, 0, 9.3, 0, 6), "#cccccc"],
      [box(2.9, 0.25, 2.9, 0, 1.5, 0), "#cfe8ff"],
      [box(2.9, 0.25, 2.9, 0, 3.0, 0), "#cfe8ff"],
      [box(2.9, 0.25, 2.9, 0, 4.5, 0), "#cfe8ff"],
      [box(2.9, 0.25, 2.9, 0, 6.0, 0), "#cfe8ff"],
      [box(2.9, 0.25, 2.9, 0, 7.5, 0), "#cfe8ff"]
    ],
    farm: [
      [box(3.4, 2.2, 3.6, 0, 1.1, 0), "#b5483a"],
      [pyr(3.0, 1.6, 0, 2.2, 0), "#7a2e25"],
      [box(1.2, 1.5, 0.1, 0, 0.75, 1.82), "#f1e6d0"],
      [cyl(0.7, 0.7, 3.4, 1.9, 0, -1.5, 12), "#d8d2c0"],
      [new THREE.ConeGeometry(0.8, 0.8, 12).translate(1.9, 3.8, -1.5), "#8a8a8a"]
    ],
    park: [
      [box(4.6, 0.12, 4.6, 0, 0.06, 0), "#3f9a4f"],
      [cyl(0.9, 0.9, 0.16, 0.3, 0, 0.4, 14), "#4aa3df"],
      [cyl(0.2, 0.25, 1.2, -1.5, 0, -1.4, 6), "#6b4a2a"],
      [ball(1.1, -1.5, 2.0, -1.4), "#2f8f3e"],
      [cyl(0.2, 0.25, 1.2, 1.6, 0, -1.5, 6), "#6b4a2a"],
      [ball(1.0, 1.6, 1.9, -1.5), "#3a9a48"],
      [cyl(0.2, 0.25, 1.2, -1.6, 0, 1.5, 6), "#6b4a2a"],
      [ball(1.0, -1.6, 1.9, 1.5), "#2a8238"],
      [box(1.2, 0.3, 0.4, 1.4, 0.3, 1.6), "#8a5a2b"]
    ]
  };
}

function roadTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 64;
  const x = c.getContext("2d");
  x.fillStyle = "#2d333b";
  x.fillRect(0, 0, 32, 64);
  x.fillStyle = "#e6c35c";
  x.fillRect(15, 6, 2, 22);
  x.fillStyle = "#555e69";
  x.fillRect(0, 0, 2, 64);
  x.fillRect(30, 0, 2, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const dom = renderer.domElement;
  dom.style.display = "block";
  dom.style.width = "100%";
  dom.style.height = "100%";
  container.appendChild(dom);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#a9d6f5");
  scene.fog = new THREE.Fog("#c5e3f6", 350, 1300);

  const camera = new THREE.PerspectiveCamera(50, 1, 1, 3000);
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 8;
  controls.maxDistance = 650;
  controls.screenSpacePanning = false;

  scene.add(new THREE.HemisphereLight("#cfe8ff", "#4a6b3a", 0.8));
  const sun = new THREE.DirectionalLight("#fff3d6", 2.2);
  sun.castShadow = true;
  const small = window.innerWidth < 700;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.4;
  scene.add(sun, sun.target);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
  const baseRoad = roadTexture();
  const parts = makeParts();

  let worldGroup = null;
  let cityGroup = null;
  let capRows = 0;
  let Hc = 0;
  let pickables = [];
  let current = [];
  let selected = null;
  let firstFit = true;

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

  /* ---------- world (terrain, river, bridge, forest) ---------- */
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
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    terrain.receiveShadow = true;
    g.add(terrain);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth).rotateX(-Math.PI / 2).translate((minX + maxX) / 2, WATER_Y, (minZ + maxZ) / 2),
      new THREE.MeshStandardMaterial({ color: 0x2f8ec7, transparent: true, opacity: 0.82, roughness: 0.15, metalness: 0.1 })
    );
    water.name = "water";
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

    /* forest */
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

    const treeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    const addInst = (geom, arr, y0, base, jitter) => {
      if (!arr.length) return;
      const mesh = new THREE.InstancedMesh(geom, treeMat, arr.length);
      arr.forEach((t, i) => {
        m4.compose(new THREE.Vector3(t[0], t[1] + y0 * t[3], t[2]), new THREE.Quaternion(), new THREE.Vector3(t[3], t[3], t[3]));
        mesh.setMatrixAt(i, m4);
        col.set(base).offsetHSL((t[4] - 0.5) * jitter, 0, (t[4] - 0.5) * 0.08);
        mesh.setColorAt(i, col);
      });
      mesh.castShadow = false;
      g.add(mesh);
    };
    const all = [...round, ...pines];
    addInst(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6).translate(0, 0, 0), all, 1.2, "#6b4a2a", 0);
    addInst(new THREE.IcosahedronGeometry(2.2, 0), round, 3.4, "#3f8f3a", 0.08);
    addInst(new THREE.ConeGeometry(2.1, 6, 7), pines, 5, "#2d6b3a", 0.05);

    worldGroup = g;
    scene.add(g);
  }

  /* ---------- city (roads, lots, houses) ---------- */
  function buildCity(list) {
    if (cityGroup) {
      disposeObject(cityGroup);
      scene.remove(cityGroup);
    }
    const g = new THREE.Group();
    let maxY = 0;
    const occupied = new Set();
    for (const h of list) {
      if (h.plot_y > maxY) maxY = h.plot_y;
      occupied.add(h.plot_x + "," + h.plot_y);
    }
    const rows = Math.max(10, maxY + 6);
    const blocksY = blocksFor(rows);
    const Hs = blocksY * BLOCK_W + ROAD;

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

    /* lawns for every lot */
    const lawnCount = COLS * rows;
    const lawns = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL - 0.4, 0.06, CELL - 0.4), baseMat, lawnCount);
    const mm = new THREE.Matrix4();
    const cc = new THREE.Color();
    let li = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        mm.makeTranslation(pos(x) + CELL / 2, 0.03, pos(y) + CELL / 2);
        lawns.setMatrixAt(li, mm);
        cc.set(occupied.has(x + "," + y) ? "#5fa24b" : "#68ad52").offsetHSL(0, 0, (hash(x, y) - 0.5) * 0.06);
        lawns.setColorAt(li, cc);
        li++;
      }
    }
    lawns.receiveShadow = true;
    g.add(lawns);

    /* trees on some empty lots */
    const lotTrees = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < COLS; x++) {
        if (occupied.has(x + "," + y)) continue;
        if (hash(x + 91, y + 17) < 0.4) lotTrees.push([pos(x) + CELL / 2, pos(y) + CELL / 2, 0.7 + hash(x, y + 5) * 0.6, hash(x + 3, y + 9)]);
      }
    }
    if (lotTrees.length) {
      const tm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
      const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 1.4, 6).translate(0, 0.7, 0), tm, lotTrees.length);
      const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5, 1).translate(0, 2.4, 0), tm, lotTrees.length);
      lotTrees.forEach((t, i) => {
        mm.compose(new THREE.Vector3(t[0], 0.06, t[1]), new THREE.Quaternion(), new THREE.Vector3(t[2], t[2], t[2]));
        trunk.setMatrixAt(i, mm);
        crown.setMatrixAt(i, mm);
        trunk.setColorAt(i, cc.set("#6b4a2a"));
        crown.setColorAt(i, cc.set("#3f8f3a").offsetHSL((t[3] - 0.5) * 0.08, 0, (t[3] - 0.5) * 0.1));
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
      mm.makeTranslation(p[0], 0.06, p[1]);
      poles.setMatrixAt(i, mm);
      bulbs.setMatrixAt(i, mm);
    });
    g.add(poles, bulbs);

    /* houses */
    const byType = {};
    for (const h of list) (byType[h.house_type in parts ? h.house_type : "house"] ||= []).push(h);
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const sc = new THREE.Vector3(1, 1, 1);
    const pv = new THREE.Vector3();
    const picks = [];
    for (const type of Object.keys(byType)) {
      const arr = byType[type];
      for (const [geom, colDef] of parts[type]) {
        const mesh = new THREE.InstancedMesh(geom.clone(), baseMat, arr.length);
        arr.forEach((h, i) => {
          pv.set(hx(h), 0.06, hz(h));
          q.setFromAxisAngle(up, Math.floor(hash(h.plot_x, h.plot_y) * 4) * (Math.PI / 2));
          mm.compose(pv, q, sc);
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
    return maxY;
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
    marker.position.set(hx(h), 0.2, hz(h));
    marker.visible = true;
  }

  function zoom(f) {
    const dir = camera.position.clone().sub(controls.target);
    const len = Math.min(650, Math.max(8, dir.length() / f));
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
  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointerup", onUp);

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

    if (worldGroup) {
      const w = worldGroup.getObjectByName("water");
      if (w) w.position.y = Math.sin(t * 0.8) * 0.06;
    }

    controls.update();
    renderer.render(scene, camera);
  });

  function dispose() {
    renderer.setAnimationLoop(null);
    ro.disconnect();
    dom.removeEventListener("pointerdown", onDown);
    dom.removeEventListener("pointerup", onUp);
    controls.dispose();
    if (cityGroup) disposeObject(cityGroup);
    if (worldGroup) disposeObject(worldGroup);
    disposeObject(clouds);
    renderer.dispose();
    if (dom.parentNode) dom.parentNode.removeChild(dom);
  }

  return { setData, select, flyTo, zoom, dispose, get data() { return current; } };
}
