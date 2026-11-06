"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rpc, TYPES, ROLES } from "../lib/rpc";

const CELL = 30;
const ROAD = 16;
const BLOCK = 5;
const COLS = 40;
const BLOCK_W = BLOCK * CELL + ROAD;
const px = (i) => ROAD + Math.floor(i / BLOCK) * BLOCK_W + (i % BLOCK) * CELL;

const WALLS = ["#ead9b4", "#e0a896", "#a5c5db", "#b9d9a6"];
const ROOFS = ["#b5483a", "#47588a", "#6b4a3a", "#3a6b5a"];

function drawHouse(ctx, x, y, h) {
  const s = CELL;
  const t = h.house_type;
  const st = (h.style || 0) % 4;

  if (t === "park") {
    ctx.fillStyle = "#1f5a34";
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    ctx.fillStyle = "#2f8f4e";
    for (const [a, b] of [[9, 10], [21, 12], [13, 21], [22, 22]]) {
      ctx.beginPath();
      ctx.arc(x + a, y + b, 5, 0, 7);
      ctx.fill();
    }
  } else if (t === "tower") {
    ctx.fillStyle = "#6f9fd0";
    ctx.fillRect(x + 7, y + 2, s - 14, s - 4);
    ctx.fillStyle = "#d8ecff";
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(x + 10, y + 5 + r * 6, 3, 3);
      ctx.fillRect(x + s - 13, y + 5 + r * 6, 3, 3);
    }
  } else if (t === "shop") {
    ctx.fillStyle = "#f0c05a";
    ctx.fillRect(x + 4, y + 10, s - 8, s - 13);
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(x + 3, y + 7, s - 6, 6);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 5 + i * 6, y + 7, 3, 6);
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(x + s / 2 - 3, y + s - 10, 6, 7);
  } else if (t === "cafe") {
    ctx.fillStyle = "#e9a3c0";
    ctx.fillRect(x + 4, y + 10, s - 8, s - 13);
    ctx.fillStyle = "#7a3b6b";
    ctx.fillRect(x + 3, y + 7, s - 6, 5);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + s / 2, y + 19, 4, 0, 7);
    ctx.fill();
  } else if (t === "bank") {
    ctx.fillStyle = "#cfd3dc";
    ctx.fillRect(x + 4, y + 12, s - 8, s - 15);
    ctx.fillStyle = "#9aa0ad";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 12);
    ctx.lineTo(x + s / 2, y + 3);
    ctx.lineTo(x + s - 2, y + 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 7 + i * 5, y + 13, 2, s - 18);
  } else if (t === "farm") {
    ctx.fillStyle = "#b5483a";
    ctx.fillRect(x + 4, y + 11, s - 8, s - 14);
    ctx.fillStyle = "#7a2e25";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 12);
    ctx.lineTo(x + s / 2, y + 3);
    ctx.lineTo(x + s - 2, y + 12);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 10, y + 17, s - 20, 8);
  } else if (t === "villa") {
    ctx.fillStyle = WALLS[st];
    ctx.fillRect(x + 2, y + 10, s - 4, s - 13);
    ctx.fillStyle = ROOFS[st];
    ctx.beginPath();
    ctx.moveTo(x, y + 11);
    ctx.lineTo(x + s / 2, y + 1);
    ctx.lineTo(x + s, y + 11);
    ctx.fill();
    ctx.fillStyle = "#3b6ea5";
    ctx.fillRect(x + 6, y + 15, 5, 5);
    ctx.fillRect(x + s - 11, y + 15, 5, 5);
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(x + s / 2 - 3, y + s - 10, 6, 7);
  } else {
    ctx.fillStyle = WALLS[st];
    ctx.fillRect(x + 5, y + 12, s - 10, s - 16);
    ctx.fillStyle = ROOFS[st];
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 13);
    ctx.lineTo(x + s / 2, y + 3);
    ctx.lineTo(x + s - 3, y + 13);
    ctx.fill();
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(x + s / 2 - 2, y + s - 11, 5, 7);
  }

  if (h.role === "mayor") {
    ctx.fillStyle = "#f5c842";
    ctx.beginPath();
    ctx.arc(x + s - 5, y + 5, 4, 0, 7);
    ctx.fill();
  } else if (h.role && h.role !== "citizen") {
    ctx.fillStyle = "#8fc4ff";
    ctx.beginPath();
    ctx.arc(x + s - 5, y + 5, 3, 0, 7);
    ctx.fill();
  }
}

export default function CityPage() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const view = useRef({ x: 0, y: 0, k: 1 });
  const housesRef = useRef([]);
  const mapRef = useRef(new Map());
  const rowsRef = useRef(10);
  const selRef = useRef(null);
  const pointers = useRef(new Map());
  const drag = useRef({ moved: 0, lastDist: 0 });
  const fitted = useRef(false);

  const [population, setPopulation] = useState(null);
  const [status, setStatus] = useState("loading");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#050d18";
    ctx.fillRect(0, 0, w, h);

    const v = view.current;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.k, v.k);

    const rows = rowsRef.current;
    const blocksY = Math.ceil(rows / BLOCK);
    const worldW = (COLS / BLOCK) * BLOCK_W + ROAD;
    const worldH = blocksY * BLOCK_W + ROAD;

    ctx.fillStyle = "#12301f";
    ctx.fillRect(0, 0, worldW, worldH);

    ctx.fillStyle = "#2a3441";
    for (let b = 0; b <= COLS / BLOCK; b++) ctx.fillRect(b * BLOCK_W, 0, ROAD, worldH);
    for (let b = 0; b <= blocksY; b++) ctx.fillRect(0, b * BLOCK_W, worldW, ROAD);

    if (v.k > 0.5) {
      ctx.strokeStyle = "rgba(214,173,80,.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      for (let b = 0; b <= COLS / BLOCK; b++) {
        ctx.beginPath();
        ctx.moveTo(b * BLOCK_W + ROAD / 2, 0);
        ctx.lineTo(b * BLOCK_W + ROAD / 2, worldH);
        ctx.stroke();
      }
      for (let b = 0; b <= blocksY; b++) {
        ctx.beginPath();
        ctx.moveTo(0, b * BLOCK_W + ROAD / 2);
        ctx.lineTo(worldW, b * BLOCK_W + ROAD / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    const x0 = -v.x / v.k - CELL;
    const x1 = (w - v.x) / v.k + CELL;
    const y0 = -v.y / v.k - CELL;
    const y1 = (h - v.y) / v.k + CELL;
    const map = mapRef.current;

    if (v.k > 0.7) {
      ctx.fillStyle = "#17402a";
      for (let gy = 0; gy < rows; gy++) {
        const yy = px(gy);
        if (yy < y0 || yy > y1) continue;
        for (let gx = 0; gx < COLS; gx++) {
          const xx = px(gx);
          if (xx < x0 || xx > x1) continue;
          if (!map.has(gx + "," + gy)) ctx.fillRect(xx + 4, yy + 4, CELL - 8, CELL - 8);
        }
      }
    }

    for (const hh of housesRef.current) {
      const xx = px(hh.plot_x);
      const yy = px(hh.plot_y);
      if (xx < x0 || xx > x1 || yy < y0 || yy > y1) continue;
      if (v.k < 0.35) {
        ctx.fillStyle = hh.role === "mayor" ? "#f5c842" : "#e0a896";
        ctx.fillRect(xx + 3, yy + 3, CELL - 6, CELL - 6);
      } else {
        drawHouse(ctx, xx, yy, hh);
      }
    }

    const sel = selRef.current;
    if (sel) {
      ctx.strokeStyle = "#f5c842";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px(sel.plot_x) - 1, px(sel.plot_y) - 1, CELL + 2, CELL + 2);
    }
    ctx.restore();
  }, []);

  const centerOn = useCallback(
    (hh, k) => {
      const c = canvasRef.current;
      if (!c) return;
      view.current.k = k;
      view.current.x = c.clientWidth / 2 - (px(hh.plot_x) + CELL / 2) * k;
      view.current.y = c.clientHeight / 2 - (px(hh.plot_y) + CELL / 2) * k;
      draw();
    },
    [draw]
  );

  const select = useCallback(
    (hh) => {
      selRef.current = hh;
      setSelected(hh);
      draw();
    },
    [draw]
  );

  const applyData = useCallback(
    (list, pop) => {
      housesRef.current = list;
      const m = new Map();
      let maxY = 0;
      for (const hh of list) {
        m.set(hh.plot_x + "," + hh.plot_y, hh);
        if (hh.plot_y > maxY) maxY = hh.plot_y;
      }
      mapRef.current = m;
      rowsRef.current = Math.max(10, maxY + 6);
      setPopulation(pop);

      const c = canvasRef.current;
      if (c && !fitted.current) {
        fitted.current = true;
        const maxX = list.reduce((a, b) => Math.max(a, b.plot_x), 0);
        const bw = px(maxX) + CELL;
        const bh = px(maxY) + CELL;
        const k = Math.min(1.6, Math.max(0.4, Math.min(c.clientWidth / (bw + 60), c.clientHeight / (bh + 60))));
        view.current.k = k;
        view.current.x = 20;
        view.current.y = 20;

        const tag = decodeURIComponent((window.location.hash || "").replace("#", "")).toLowerCase();
        if (tag) {
          const found = list.find((x) => x.tiktok_username.replace("@", "") === tag.replace("@", ""));
          if (found) {
            selRef.current = found;
            setSelected(found);
            centerOn(found, 2);
            return;
          }
        }
      }
      draw();
    },
    [draw, centerOn]
  );

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [list, pop] = await Promise.all([rpc("get_city", { p_limit: 20000 }), rpc("city_population")]);
        if (!alive) return;
        applyData(list, Number(pop));
        setStatus("ok");
      } catch (e) {
        if (alive) setStatus("error");
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [applyData]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);

    const onWheel = (e) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      c.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  function zoomAt(sx, sy, f) {
    const v = view.current;
    const nk = Math.min(4, Math.max(0.15, v.k * f));
    v.x = sx - (sx - v.x) * (nk / v.k);
    v.y = sy - (sy - v.y) * (nk / v.k);
    v.k = nk;
    draw();
  }

  function pickAt(sx, sy) {
    const v = view.current;
    const tx = (sx - v.x) / v.k - ROAD;
    const ty = (sy - v.y) / v.k - ROAD;
    if (tx < 0 || ty < 0) return null;
    const bx = Math.floor(tx / BLOCK_W);
    const by = Math.floor(ty / BLOCK_W);
    const wx = tx - bx * BLOCK_W;
    const wy = ty - by * BLOCK_W;
    if (wx >= BLOCK * CELL || wy >= BLOCK * CELL) return null;
    const col = bx * BLOCK + Math.floor(wx / CELL);
    const row = by * BLOCK + Math.floor(wy / CELL);
    return mapRef.current.get(col + "," + row) || null;
  }

  function onDown(e) {
    const r = canvasRef.current.getBoundingClientRect();
    canvasRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    drag.current.moved = 0;
    drag.current.lastDist = 0;
  }

  function onMove(e) {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const r = canvasRef.current.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const ny = e.clientY - r.top;
    const dx = nx - p.x;
    const dy = ny - p.y;
    p.x = nx;
    p.y = ny;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag.current.lastDist) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / drag.current.lastDist);
      drag.current.lastDist = dist;
      drag.current.moved = 99;
      return;
    }
    drag.current.moved += Math.abs(dx) + Math.abs(dy);
    view.current.x += dx;
    view.current.y += dy;
    draw();
  }

  function onUp(e) {
    const p = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    drag.current.lastDist = 0;
    if (p && drag.current.moved < 6 && pointers.current.size === 0) {
      const hh = pickAt(p.x, p.y);
      selRef.current = hh;
      setSelected(hh);
      if (hh) history.replaceState(null, "", "#" + hh.tiktok_username.replace("@", ""));
      draw();
    }
  }

  function zoomBtn(f) {
    const c = canvasRef.current;
    zoomAt(c.clientWidth / 2, c.clientHeight / 2, f);
  }

  function search(e) {
    e.preventDefault();
    const q = query.trim().replace(/^@/, "").toLowerCase();
    if (!q) return;
    const found = housesRef.current.find((x) => x.tiktok_username.replace("@", "") === q);
    if (!found) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    select(found);
    centerOn(found, 2);
  }

  const t = selected ? TYPES[selected.house_type] || TYPES.house : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#07111f] text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <a href="/" className="text-yellow-400 text-xs tracking-widest">← THE NEW REPUBLIC</a>
        <div className="text-xs tracking-widest text-gray-300">
          🏠 {population === null ? "…" : population.toLocaleString("ru-RU")}
        </div>
      </header>

      <form onSubmit={search} className="flex gap-2 px-4 py-3 border-b border-white/10">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setNotFound(false);
          }}
          placeholder="Найти дом по нику…"
          className="flex-1 bg-[#0c1d31] border border-white/15 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button className="bg-yellow-500 text-[#07111f] font-bold text-xs px-4 rounded-lg">НАЙТИ</button>
      </form>
      {notFound && <p className="text-red-300 text-xs px-4 pt-2">Такого жителя пока нет.</p>}

      <div ref={wrapRef} className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Строим город…</div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-red-300 text-sm px-8 text-center">
            Не удалось загрузить город. Попробуй позже.
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button onClick={() => zoomBtn(1.3)} className="w-10 h-10 rounded-lg bg-[#0c1d31]/90 border border-white/15 text-xl">+</button>
          <button onClick={() => zoomBtn(1 / 1.3)} className="w-10 h-10 rounded-lg bg-[#0c1d31]/90 border border-white/15 text-xl">−</button>
        </div>

        {selected && (
          <div className="absolute left-3 right-3 bottom-3 max-w-md mx-auto rounded-2xl bg-[#0c1d31]/95 border border-yellow-600/60 p-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{t[0]}</div>
              <div className="min-w-0">
                <p className="font-bold truncate">{selected.tiktok_username}</p>
                <p className="text-xs text-yellow-400 tracking-widest">{selected.citizen_id}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
              <div className="bg-white/5 rounded-lg py-2"><p className="text-gray-400">РОЛЬ</p><p className="font-bold mt-1">{ROLES[selected.role] || selected.role}</p></div>
              <div className="bg-white/5 rounded-lg py-2"><p className="text-gray-400">ЗДАНИЕ</p><p className="font-bold mt-1">{t[1]}</p></div>
              <div className="bg-white/5 rounded-lg py-2"><p className="text-gray-400">С НАМИ</p><p className="font-bold mt-1">{new Date(selected.joined_at).toLocaleDateString("ru-RU")}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
