'use client';

import { useEffect, useRef, useState } from 'react';

const DURATION = 22;
const LINES = [
  { a: 0, b: 1.9, v: `Wait! You have a home in our world.`, c: `WAIT! *YOU HAVE A HOME* IN OUR WORLD` },
  { a: 1.9, b: 5.6, v: `Hi, I'm the Mayor of The New Republic. The first digital country built by its followers.`, c: `I'M THE *MAYOR* OF THE FIRST *DIGITAL COUNTRY*` },
  { a: 5.6, b: 9.6, v: `Here, one follower equals one home. Your own house. Your own passport. Your own role.`, c: `*1 FOLLOWER = 1 HOME* + YOUR OWN PASSPORT` },
  { a: 9.6, b: 13.6, v: `Be a mayor, a banker, open a cafe, or run a farm. You decide who you are.`, c: `BE A *MAYOR*, A *BANKER*, OR OPEN A *CAFÉ*` },
  { a: 13.6, b: 17.6, v: `Mountains, rivers, forests, and a city that grows with every follower.`, c: `A CITY THAT *GROWS* WITH EVERY FOLLOWER` },
  { a: 17.6, b: 22, v: `Follow us, tap the link in bio, and claim your home before someone takes your street!`, c: `*FOLLOW* + LINK IN BIO = *CLAIM YOUR HOME*` }
];

const WALLS = ['#f4e3c1', '#f0a8a0', '#a9cde6', '#bfe0a8', '#f7d27a'];
const ROOFS = ['#c0463a', '#3f5a9a', '#7a4a3a', '#2f7a5a', '#8e44ad'];
const ICONS = ['👑', '🏦', '☕', '🌾', '🛡️', '🔨'];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const back = (k) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
const pop = (t, start, dur = 0.4) => {
  const k = clamp((t - start) / dur);
  return k <= 0 ? 0 : back(k);
};

/* static layout */
const HOUSES = [];
for (let i = 0; i < 9; i++) HOUSES.push({ x: 20 + i * 40, y: 468, s: 0.7 });
for (let i = 0; i < 5; i++) HOUSES.push({ x: 45 + i * 68, y: 522, s: 0.95 });
HOUSES.push({ x: 28, y: 592, s: 1.2 }, { x: 332, y: 592, s: 1.2 });
HOUSES.forEach((h, i) => {
  h.start = 5.6 + ((i * 7) % HOUSES.length) * 0.2;
  h.w = WALLS[i % WALLS.length];
  h.r = ROOFS[(i * 2) % ROOFS.length];
});
const EXTRA = [];
for (let i = 0; i < 8; i++) EXTRA.push({ x: 40 + i * 40, y: 486, s: 0.55, start: 13.8 + i * 0.3, w: WALLS[(i + 2) % 5], r: ROOFS[(i + 1) % 5] });
const TREES = [[12, 438], [96, 440], [262, 444], [346, 438], [66, 508], [300, 512]];

function House({ x, y, s, k, w, r }) {
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <rect x='-18' y='-26' width='36' height='26' fill={w} />
      <polygon points='-23,-26 0,-46 23,-26' fill={r} />
      <rect x='-4' y='-15' width='8' height='15' fill='#5a3a1f' />
      <rect x='-15' y='-21' width='8' height='8' fill='#8fc6f0' />
      <rect x='7' y='-21' width='8' height='8' fill='#8fc6f0' />
    </g>
  );
}

function Mayor({ t, speaking, wave }) {
  const blink = t % 3.2 < 0.12;
  const open = speaking && Math.floor(t * 9) % 2 === 0;
  const armA = wave ? -150 + Math.sin(t * 11) * 22 : -8;
  const bob = speaking ? Math.sin(t * 7) * 2 : 0;
  return (
    <g transform={`translate(0 ${bob})`}>
      <rect x='70' y='255' width='24' height='45' rx='6' fill='#14213d' />
      <rect x='106' y='255' width='24' height='45' rx='6' fill='#14213d' />
      <ellipse cx='80' cy='299' rx='18' ry='7' fill='#0b0b0b' />
      <ellipse cx='120' cy='299' rx='18' ry='7' fill='#0b0b0b' />
      <g transform='rotate(8 54 168)'>
        <rect x='46' y='168' width='16' height='66' rx='8' fill='#1d3557' />
        <circle cx='54' cy='238' r='11' fill='#f2c9a0' />
      </g>
      <path d='M52 160 Q52 150 66 148 L134 148 Q148 150 148 160 L152 262 L48 262 Z' fill='#1d3557' />
      <path d='M84 148 L100 190 L116 148 Z' fill='#ffffff' />
      <path d='M84 148 L100 190 L70 190 Z' fill='#162a47' />
      <path d='M116 148 L100 190 L130 190 Z' fill='#162a47' />
      <path d='M95 160 L105 160 L108 200 L100 212 L92 200 Z' fill='#e0b13c' />
      <circle cx='124' cy='205' r='7' fill='#f5c842' stroke='#b8901f' strokeWidth='2' />
      <g transform={`rotate(${armA} 146 168)`}>
        <rect x='138' y='168' width='16' height='66' rx='8' fill='#1d3557' />
        <circle cx='146' cy='238' r='11' fill='#f2c9a0' />
      </g>
      <rect x='90' y='132' width='20' height='20' fill='#e3b287' />
      <ellipse cx='62' cy='94' rx='8' ry='12' fill='#3a2a1a' />
      <ellipse cx='138' cy='94' rx='8' ry='12' fill='#3a2a1a' />
      <circle cx='60' cy='106' r='8' fill='#f2c9a0' />
      <circle cx='140' cy='106' r='8' fill='#f2c9a0' />
      <ellipse cx='100' cy='102' rx='40' ry='44' fill='#f2c9a0' />
      {blink ? (
        <g stroke='#222' strokeWidth='3' strokeLinecap='round'>
          <path d='M76 99 L92 99' />
          <path d='M108 99 L124 99' />
        </g>
      ) : (
        <g>
          <ellipse cx='84' cy='98' rx='8' ry='10' fill='#fff' />
          <circle cx='86' cy='99' r='4.5' fill='#222' />
          <circle cx='87.5' cy='97' r='1.6' fill='#fff' />
          <ellipse cx='116' cy='98' rx='8' ry='10' fill='#fff' />
          <circle cx='118' cy='99' r='4.5' fill='#222' />
          <circle cx='119.5' cy='97' r='1.6' fill='#fff' />
        </g>
      )}
      <path d='M74 84 Q84 77 94 83' stroke='#3a2a1a' strokeWidth='4' fill='none' strokeLinecap='round' />
      <path d='M106 83 Q116 77 126 84' stroke='#3a2a1a' strokeWidth='4' fill='none' strokeLinecap='round' />
      <path d='M100 104 q-5 9 2 11' stroke='#c99a72' strokeWidth='3' fill='none' strokeLinecap='round' />
      <circle cx='72' cy='116' r='7' fill='#ff9e9e' opacity='0.5' />
      <circle cx='128' cy='116' r='7' fill='#ff9e9e' opacity='0.5' />
      {open ? (
        <g>
          <ellipse cx='100' cy='128' rx='11' ry='8' fill='#7a1f1f' />
          <ellipse cx='100' cy='132' rx='6' ry='3' fill='#e87a7a' />
        </g>
      ) : (
        <path d='M86 124 Q100 138 114 124' stroke='#7a1f1f' strokeWidth='4' fill='none' strokeLinecap='round' />
      )}
      <path d='M84 117 Q92 111 100 115 Q108 111 116 117 Q108 121 100 118 Q92 121 84 117 Z' fill='#3a2a1a' />
      <rect x='68' y='38' width='64' height='34' rx='4' fill='#111' />
      <rect x='68' y='60' width='64' height='8' fill='#e0b13c' />
      <ellipse cx='100' cy='72' rx='50' ry='8' fill='#111' />
    </g>
  );
}

function speak(text) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vs = s.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const pref = vs.find((v) => /daniel|google uk english male|alex|david|male/i.test(v.name)) || vs[0];
    if (pref) u.voice = pref;
    u.lang = 'en-US';
    u.rate = 1.05;
    u.pitch = 0.95;
    s.speak(u);
  } catch (e) {}
}

function renderCaption(text) {
  return text.split('*').map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: '#ffd84a' }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const CSS = `
@keyframes popin{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
.vp-cap{animation:popin .35s ease-out}
.vp-cta{animation:pulse 0.9s ease-in-out infinite}
`;

export default function VideoPage() {
  const [time, setTime] = useState(0);
  const [state, setState] = useState('idle');
  const [voice, setVoice] = useState(true);
  const [panel, setPanel] = useState(true);
  const raf = useRef(0);
  const t0 = useRef(0);
  const lineRef = useRef(-1);

  const T = state === 'idle' ? 3.4 : time;

  function play() {
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
    } catch (e) {}
    lineRef.current = -1;
    t0.current = performance.now();
    setTime(0);
    setState('playing');
    setPanel(false);
  }

  useEffect(() => {
    if (state !== 'playing') return undefined;
    const tick = () => {
      const s = (performance.now() - t0.current) / 1000;
      if (s >= DURATION) {
        setTime(DURATION);
        setState('done');
        setPanel(true);
        return;
      }
      setTime(s);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [state]);

  const idx = LINES.findIndex((l) => T >= l.a && T < l.b);

  useEffect(() => {
    if (state !== 'playing' || !voice || idx < 0 || lineRef.current === idx) return;
    lineRef.current = idx;
    speak(LINES[idx].v);
  }, [idx, state, voice]);

  useEffect(() => () => {
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
    } catch (e) {}
  }, []);

  const speaking = idx >= 0 && state !== 'done';
  const wave = T < 2.2 || T > 17.6;
  const mayorPop = Math.max(pop(T, 0.05, 0.5), 0.001);
  const flash = state === 'playing' ? clamp(1 - T / 0.25) : 0;
  const cta = T > 17.6;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <style>{CSS}</style>
      <div style={{ position: 'relative', width: 'min(100vw, 56.25dvh)', aspectRatio: '9 / 16', overflow: 'hidden', containerType: 'inline-size', background: '#2d1b69' }}>
        <svg viewBox='0 0 360 640' width='100%' height='100%' preserveAspectRatio='xMidYMid slice' style={{ display: 'block' }}>
          <defs>
            <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0' stopColor='#2d1b69' />
              <stop offset='0.55' stopColor='#d3548e' />
              <stop offset='1' stopColor='#ffb36b' />
            </linearGradient>
            <linearGradient id='ground' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0' stopColor='#6bbd57' />
              <stop offset='1' stopColor='#3f8f3a' />
            </linearGradient>
            <linearGradient id='river' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0' stopColor='#6fd0ff' />
              <stop offset='1' stopColor='#2a87c8' />
            </linearGradient>
          </defs>

          <rect width='360' height='360' fill='url(#sky)' />
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx={(i * 53) % 350 + 8} cy={(i * 37) % 150 + 20} r='1.6' fill='#fff' opacity={0.4 + 0.5 * Math.abs(Math.sin(T * 2.5 + i))} />
          ))}
          <circle cx='255' cy='262' r='64' fill='#fff2b0' opacity='0.25' />
          <circle cx='255' cy='262' r='40' fill='#fff2b0' />

          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={((i * 170 + T * 6) % 460) - 50} cy={110 + i * 38} rx='46' ry='11' fill='#fff' opacity='0.35' />
          ))}

          <polygon points='0,340 40,240 80,300 140,210 200,310 250,230 310,300 360,250 360,340' fill='#5a3d7a' />
          <polygon points='140,210 128,228 140,222 152,230' fill='#fff' />
          <polygon points='250,230 240,246 250,240 262,248' fill='#fff' />
          <polygon points='40,240 32,255 40,250 50,257' fill='#fff' />
          <polygon points='0,345 60,290 120,330 190,285 260,335 320,295 360,325 360,345' fill='#7a4f8f' />

          <rect y='338' width='360' height='40' fill='url(#river)' />
          <g clipPath='none' opacity='0.55' stroke='#fff' strokeWidth='1.5' fill='none'>
            {[348, 358, 368].map((y, i) => (
              <path key={y} transform={`translate(${((T * (14 + i * 4)) % 60) - 60} 0)`} d={`M0 ${y} ${'q15 -5 30 0 t30 0 '.repeat(10)}`} />
            ))}
          </g>

          <rect y='376' width='360' height='264' fill='url(#ground)' />
          <rect y='490' width='360' height='30' fill='#2d333b' />
          <line x1='0' y1='505' x2='360' y2='505' stroke='#e6c35c' strokeWidth='2' strokeDasharray='12 10' />
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${((T * (50 + i * 25) + i * 180) % 420) - 30} ${i ? 508 : 494})`}>
              <rect width='26' height='9' rx='3' fill={i ? '#2980b9' : '#c0392b'} />
              <rect x='6' y='-4' width='13' height='5' rx='2' fill='#2b3a4a' />
            </g>
          ))}

          {TREES.map(([x, y], i) => {
            const k = pop(T, 0.8 + i * 0.12);
            return k > 0 ? (
              <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
                <rect x='-3' y='-12' width='6' height='14' fill='#6b4a2a' />
                <circle cx='0' cy='-24' r='14' fill='#2f8f3e' />
                <circle cx='-6' cy='-20' r='9' fill='#3fa84d' />
              </g>
            ) : null;
          })}

          {HOUSES.map((h, i) => (
            <House key={i} x={h.x} y={h.y} s={h.s} k={pop(T, h.start)} w={h.w} r={h.r} />
          ))}
          {EXTRA.map((h, i) => (
            <House key={'e' + i} x={h.x} y={h.y} s={h.s} k={pop(T, h.start)} w={h.w} r={h.r} />
          ))}

          {ICONS.map((ic, i) => {
            const u = (T - (9.8 + i * 0.5)) / 1.7;
            if (u <= 0 || u >= 1) return null;
            const op = u < 0.15 ? u / 0.15 : u > 0.8 ? (1 - u) / 0.2 : 1;
            return (
              <text key={i} x={38 + i * 56} y={430 - u * 170} fontSize='34' textAnchor='middle' opacity={op}>
                {ic}
              </text>
            );
          })}

          <g transform={`translate(180 604) scale(${0.85 * mayorPop}) translate(-100 -300)`}>
            <Mayor t={T} speaking={speaking} wave={wave} />
          </g>
        </svg>

        <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, textAlign: 'center', opacity: clamp((T - 0.3) * 3) }}>
          <span style={{ display: 'inline-block', padding: '1.2cqw 3.4cqw', border: '0.5cqw solid #e0b13c', borderRadius: '2cqw', background: 'rgba(7,17,31,.75)', color: '#e0b13c', fontWeight: 800, letterSpacing: '1cqw', fontSize: '3.2cqw', fontFamily: 'Arial, sans-serif' }}>
            ♛ THE NEW REPUBLIC
          </span>
        </div>

        {idx >= 0 && (
          <div key={idx} className='vp-cap' style={{ position: 'absolute', top: '17%', left: '5%', right: '5%', textAlign: 'center', color: '#fff', fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900, fontSize: '8.4cqw', lineHeight: 1.12, WebkitTextStroke: '1.3cqw #000', paintOrder: 'stroke fill' }}>
            {renderCaption(LINES[idx].c)}
          </div>
        )}

        {cta && (
          <div style={{ position: 'absolute', top: '43%', left: 0, right: 0, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <div className='vp-cta' style={{ display: 'inline-block', padding: '3cqw 9cqw', borderRadius: '3cqw', background: '#fe2c55', color: '#fff', fontWeight: 900, fontSize: '8cqw', border: '0.8cqw solid #fff' }}>
              + FOLLOW
            </div>
            <div style={{ marginTop: '2.5cqw', color: '#fff', fontWeight: 800, fontSize: '4.4cqw', textShadow: '0 0 2cqw #000, 0 0 2cqw #000' }}>
              LINK IN BIO ⬆
            </div>
          </div>
        )}

        {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash, pointerEvents: 'none' }} />}

        {panel && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,20,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6cqw' }}>
            <div style={{ textAlign: 'center', color: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: '86cqw' }}>
              <div style={{ color: '#e0b13c', letterSpacing: '1cqw', fontSize: '3.4cqw', fontWeight: 800 }}>THE NEW REPUBLIC</div>
              <div style={{ fontSize: '7cqw', fontWeight: 900, margin: '2.5cqw 0' }}>INTRO VIDEO</div>
              <p style={{ fontSize: '3.6cqw', lineHeight: 1.5, color: '#c9d4e0' }}>
                1. Start your phone's screen recording.<br />
                2. Press play and wait 22 seconds.<br />
                3. Edit in TikTok or CapCut and add music.
              </p>
              <label style={{ display: 'flex', gap: '2cqw', justifyContent: 'center', alignItems: 'center', fontSize: '3.6cqw', margin: '3cqw 0' }}>
                <input type='checkbox' checked={voice} onChange={(e) => setVoice(e.target.checked)} style={{ width: '4.5cqw', height: '4.5cqw' }} />
                Voice (robot voice, optional)
              </label>
              <button onClick={play} style={{ padding: '3.2cqw 10cqw', fontSize: '5cqw', fontWeight: 900, borderRadius: '3cqw', border: 0, background: 'linear-gradient(110deg,#b58b3c,#f0d38a)', color: '#07111f', cursor: 'pointer' }}>
                {state === 'done' ? '\u21bb REPLAY' : '\u25b6 PLAY'}
              </button>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => setPanel((p) => !p)} aria-label='toggle panel' style={{ position: 'fixed', top: 0, right: 0, width: 56, height: 56, opacity: 0.02, background: '#fff', border: 0 }} />
    </div>
  );
}
