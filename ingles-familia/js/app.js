/* =========================================================
   INGLÉS EN FAMILIA — app principal
   Uso personal/doméstico. Todo se guarda en el teléfono.
   ========================================================= */
'use strict';

/* ---------------- utilidades ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const pick = a => a[Math.floor(Math.random() * a.length)];
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
function weekStart(d = new Date()) { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return dayKey(x); }
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------- almacenamiento ---------------- */
const KEY = 'ingles-familia-v1';
const DEFAULT_DB = () => ({
  profiles: [], current: null, family: [],
  settings: { rate: 0.95, voice: '', theme: 'auto', sfx: true, challenge: false,
    ai: { provider: 'gemini', key: '', model: 'gemini-flash-latest', base: '' } }
});
let DB;
try { DB = JSON.parse(localStorage.getItem(KEY)) || DEFAULT_DB(); } catch (e) { DB = DEFAULT_DB(); }
DB.settings = Object.assign(DEFAULT_DB().settings, DB.settings || {});
DB.settings.ai = Object.assign(DEFAULT_DB().settings.ai, DB.settings.ai || {});
DB.family = DB.family || [];
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('No se pudo guardar el progreso'); } }
const P = () => DB.profiles.find(p => p.id === DB.current);

function newProfile(name, avatar, goal) {
  return { id: uid(), name, avatar, goal, xp: 0, streak: 0, lastDay: '', days: {}, speak: {}, progress: {},
    items: {}, sounds: {}, created: Date.now(), skipSpeakUntil: 0 };
}

/* ---------------- curso: índices ---------------- */
const NODES = [
  { k: 'words1', icon: '⭐', label: 'Palabras 1' },
  { k: 'words2', icon: '⭐', label: 'Palabras 2' },
  { k: 'phrases', icon: '🧩', label: 'Frases' },
  { k: 'listen', icon: '🎧', label: 'Escucha y habla' },
  { k: 'talk', icon: '🎭', label: 'Conversación' },
  { k: 'test', icon: '🏆', label: 'Prueba de unidad' }
];
const LEVEL = Object.fromEntries(LEVELS.map(l => [l.id, l]));
const ITEMS = {}; // key -> {en, es, unit, kind}
UNITS.forEach(u => {
  u.words.forEach(([en, es]) => ITEMS['w:' + en] = { en, es, unit: u.id, kind: 'w' });
  u.phrases.forEach(([en, es]) => ITEMS['p:' + en] = { en, es, unit: u.id, kind: 'p' });
});
const unitIndex = id => UNITS.findIndex(u => u.id === id);
const nodesDone = (p, u) => p.progress[u.id] || 0;
function currentPos(p) {
  for (let i = 0; i < UNITS.length; i++) if (nodesDone(p, UNITS[i]) < NODES.length) return { ui: i, ni: nodesDone(p, UNITS[i]) };
  return { ui: UNITS.length, ni: 0 };
}
function isUnlocked(p, ui, ni) {
  const cur = currentPos(p);
  return ui < cur.ui || (ui === cur.ui && ni <= cur.ni);
}
function currentLevel(p) { const c = currentPos(p); return (UNITS[Math.min(c.ui, UNITS.length - 1)] || UNITS[0]).level; }

/* ---------------- XP, racha, metas ---------------- */
function addXP(n) {
  const p = P(); if (!p) return;
  const t = dayKey();
  if (p.lastDay !== t) { p.streak = p.lastDay === yesterdayKey() ? p.streak + 1 : 1; p.lastDay = t; }
  p.xp += n; p.days[t] = (p.days[t] || 0) + n;
  save();
}
function liveStreak(p) { return (p.lastDay === dayKey() || p.lastDay === yesterdayKey()) ? p.streak : 0; }
function weekXP(p) { const ws = weekStart(); return Object.entries(p.days).filter(([d]) => d >= ws).reduce((a, [, v]) => a + v, 0); }
function todayXP(p) { return p.days[dayKey()] || 0; }
function addSpeak(sec) { const p = P(); if (!p) return; const t = dayKey(); p.speak[t] = (p.speak[t] || 0) + sec; save(); }
Speech.onSeconds = addSpeak;
function markItem(key, ok) {
  const p = P(); if (!p || !key) return;
  const it = p.items[key] || { s: 0, n: 0 };
  it.s = Math.max(0, Math.min(5, it.s + (ok ? 1 : -1))); it.n++; it.d = dayKey();
  p.items[key] = it;
}

/* ---------------- efectos ---------------- */
let AC;
function tone(seq) {
  if (!DB.settings.sfx) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    seq.forEach(([f, t, d, type = 'sine', vol = 0.14]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, AC.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + t + d);
      o.connect(g).connect(AC.destination); o.start(AC.currentTime + t); o.stop(AC.currentTime + t + d + 0.05);
    });
  } catch (e) {}
}
const sfxOk = () => tone([[660, 0, 0.12], [990, 0.09, 0.22]]);
const sfxBad = () => { tone([[200, 0, 0.28, 'square', 0.05]]); navigator.vibrate && navigator.vibrate(120); };
const sfxWin = () => tone([[523, 0, 0.15], [659, 0.12, 0.15], [784, 0.24, 0.15], [1046, 0.36, 0.4]]);

function toast(msg, ms = 2600) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal"><div class="grab"></div>${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  const close = () => bg.remove();
  document.body.appendChild(bg);
  onMount && onMount(bg.firstElementChild, close);
  return close;
}
function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti';
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const cols = ['#12a594', '#ff9f1c', '#1fa2ff', '#a463f2', '#22b55e', '#ff5d3a', '#ffc531'];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: pick(cols) }));
  let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
    if (++f < 180) requestAnimationFrame(draw); else c.remove();
  })();
}

/* ---------------- ilustraciones (originales) ---------------- */
const MASCOT = `<svg class="mascot" viewBox="0 0 170 160" aria-label="Tuki el tucán">
  <ellipse cx="78" cy="152" rx="42" ry="6" fill="rgba(0,0,0,.12)"/>
  <ellipse cx="72" cy="96" rx="44" ry="52" fill="#1d2433"/>
  <ellipse cx="80" cy="104" rx="24" ry="34" fill="#fff1c9"/>
  <ellipse class="wing" cx="42" cy="102" rx="14" ry="30" fill="#2e3a52"/>
  <circle cx="90" cy="64" r="17" fill="#7ee0d0"/>
  <circle cx="92" cy="64" r="8.5" fill="#fff"/><circle cx="94" cy="64" r="4.6" fill="#111"/><circle cx="95.6" cy="62.4" r="1.6" fill="#fff"/>
  <path d="M102 58 C130 48 158 56 164 74 C146 81 122 82 102 77 Z" fill="#ff9f1c"/>
  <path d="M102 77 C122 82 146 81 164 74 C157 88 128 92 104 85 Z" fill="#ff5d3a"/>
  <path d="M158 63 C162 66 164 70 164 74 C160 74 157 71 156 67Z" fill="#1d2433"/>
  <path d="M60 146 h12 M84 146 h12" stroke="#ff9f1c" stroke-width="5" stroke-linecap="round"/>
</svg>`;
const SKIN = '#f1c7a5', SKIN_D = '#d9a985';
function avatarSVG(kind = 'emma') {
  const isEmma = kind === 'emma';
  const hair = isEmma ? '#5b3a29' : '#2b2b2b', shirt = isEmma ? '#12a594' : '#ff9f1c', bg = isEmma ? '#d8f3ee' : '#ffe9cc';
  return `<svg class="avatar" viewBox="0 0 200 200" aria-label="Tutor">
  <circle cx="100" cy="100" r="98" fill="${bg}"/>
  ${isEmma ? `<path d="M44 112 C36 36 164 36 156 112 L160 168 L40 168Z" fill="${hair}"/>` : ''}
  <rect x="86" y="140" width="28" height="26" fill="${SKIN_D}"/>
  <path d="M34 200 C40 158 160 158 166 200Z" fill="${shirt}"/>
  <ellipse cx="100" cy="106" rx="44" ry="51" fill="${SKIN}"/>
  <ellipse cx="57" cy="110" rx="7" ry="11" fill="${SKIN_D}"/><ellipse cx="143" cy="110" rx="7" ry="11" fill="${SKIN_D}"/>
  ${isEmma ? `<path d="M56 98 C58 52 142 48 147 98 C128 74 92 70 56 98Z" fill="${hair}"/>`
           : `<path d="M57 92 C56 52 144 50 144 92 C132 72 100 66 57 92Z" fill="${hair}"/>`}
  <path d="M74 94 q8 -6 16 0" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M110 94 q8 -6 16 0" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="82" cy="107" r="5.5" fill="#222"/><circle cx="118" cy="107" r="5.5" fill="#222"/>
  <circle cx="84" cy="105" r="1.6" fill="#fff"/><circle cx="120" cy="105" r="1.6" fill="#fff"/>
  <g class="lids"><rect x="74" y="99" width="17" height="14" rx="6" fill="${SKIN}"/><rect x="110" y="99" width="17" height="14" rx="6" fill="${SKIN}"/></g>
  <circle cx="72" cy="124" r="7" fill="#f4a3a3" opacity=".5"/><circle cx="128" cy="124" r="7" fill="#f4a3a3" opacity=".5"/>
  <path d="M96 112 q4 10 0 12" stroke="${SKIN_D}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse class="mouth" cx="100" cy="135" rx="11" ry="5" fill="#a63d4a"/>
</svg>`;
}
Speech.onTalk = on => $$('.avatar-wrap').forEach(w => w.classList.toggle('talking', on));

/* ---------------- navegación ---------------- */
const app = $('#app');
let TAB = 'learn';
function applyTheme() {
  const t = DB.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  Speech.setRate(DB.settings.rate); Speech.setVoice(DB.settings.voice);
}
function boot() {
  applyTheme();
  if (!DB.profiles.length) return renderWelcome();
  if (!P()) DB.current = DB.profiles[0].id;
  renderMain();
}

/* ======================= BIENVENIDA / PERFIL ======================= */
function renderWelcome() {
  app.innerHTML = `<div class="screen"><div class="scroll center" style="padding-top:40px">
    ${MASCOT}
    <h1>¡Hola! Soy Tuki 🧡</h1>
    <p class="muted" style="font-size:17px">Vamos a aprender a <b>hablar</b> inglés en familia: unos minutos al día, hablando en voz alta desde la primera lección.</p>
    <div class="card" style="text-align:left">
      <div class="row"><span style="font-size:26px">🎯</span><div><b>Por niveles</b><br><small class="muted">A1 → B2, 20 unidades y 120 lecciones</small></div></div><br>
      <div class="row"><span style="font-size:26px">🗣️</span><div><b>Hablas y te corrige</b><br><small class="muted">Pronunciación palabra por palabra</small></div></div><br>
      <div class="row"><span style="font-size:26px">🤖</span><div><b>Tutor de IA opcional</b><br><small class="muted">Conversación libre por voz</small></div></div><br>
      <div class="row"><span style="font-size:26px">👨‍👩‍👧‍👦</span><div><b>Liga familiar</b><br><small class="muted">Compitan sanamente cada semana</small></div></div>
    </div>
    <button class="btn" id="go">Crear mi perfil</button>
    <button class="link" id="imp" style="margin-top:10px">Ya tengo un respaldo</button>
  </div></div>`;
  $('#go').onclick = () => renderCreateProfile();
  $('#imp').onclick = importBackup;
}
const AVATARS = ['👨🏻', '👩🏻', '👦🏻', '👧🏻', '🧔🏻', '👩🏽', '👨🏽', '👧🏽', '👦🏽', '👵🏻', '👴🏻', '🧑🏻'];
const GOALS = [[20, 'Casual', '5 min'], [30, 'Normal', '10 min'], [50, 'Serio', '15 min'], [80, 'Intenso', '20 min']];
function renderCreateProfile() {
  let av = AVATARS[0], goal = 30;
  app.innerHTML = `<div class="screen"><div class="lesson-top"><button class="x" id="back">✕</button><h2 style="margin:0">Nuevo perfil</h2></div>
  <div class="scroll" style="padding-top:4px">
    <label class="lbl">¿Cómo te llamas?</label>
    <input class="field" id="nm" maxlength="18" placeholder="Ej: Papá, Mamá, Sofía..." autocomplete="off">
    <label class="lbl">Elige tu avatar</label>
    <div class="grid-av" id="avs" style="margin:6px 0 16px">${AVATARS.map((a, i) => `<button data-a="${a}" class="${i ? '' : 'sel'}">${a}</button>`).join('')}</div>
    <label class="lbl">Meta diaria</label>
    <div class="seg" id="goals">${GOALS.map(([x, n, m]) => `<button data-g="${x}" class="${x === goal ? 'sel' : ''}">${n}<br><small>${m}</small></button>`).join('')}</div>
    <label class="lbl">¿Ya sabes algo de inglés?</label>
    <button class="btn" id="zero" style="margin-top:8px">Empiezo desde cero</button>
    <button class="btn sun" id="test">Hacer prueba de nivel (3 min)</button>
  </div></div>`;
  $('#back').onclick = () => DB.profiles.length ? renderMain() : renderWelcome();
  $$('#avs button').forEach(b => b.onclick = () => { $$('#avs button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); av = b.dataset.a; });
  $$('#goals button').forEach(b => b.onclick = () => { $$('#goals button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); goal = +b.dataset.g; });
  const create = () => {
    const name = $('#nm').value.trim();
    if (!name) { toast('Escribe tu nombre 🙂'); $('#nm').focus(); return null; }
    const p = newProfile(name, av, goal); DB.profiles.push(p); DB.current = p.id; save(); return p;
  };
  $('#zero').onclick = () => { if (create()) { TAB = 'learn'; renderMain(); toast('¡Bienvenido! Toca la primera lección ⭐'); } };
  $('#test').onclick = () => { if (create()) startPlacement(); };
}

/* ======================= PANTALLA PRINCIPAL ======================= */
function ringSVG(frac) {
  const r = 14, c = 2 * Math.PI * r, f = Math.min(1, frac);
  return `<svg class="ring" viewBox="0 0 34 34"><circle cx="17" cy="17" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/>
  <circle cx="17" cy="17" r="${r}" fill="none" stroke="${f >= 1 ? 'var(--ok)' : 'var(--sun)'}" stroke-width="4" stroke-linecap="round"
   stroke-dasharray="${c * f} ${c}" transform="rotate(-90 17 17)"/><text x="17" y="21" text-anchor="middle" font-size="11" font-weight="900" fill="var(--ink)">${f >= 1 ? '✓' : Math.round(f * 100)}</text></svg>`;
}
function renderMain() {
  const p = P(); if (!p) return renderWelcome();
  const tabs = [['learn', '🏠', 'Aprender'], ['sounds', '👄', 'Pronuncia'], ['talk', '💬', 'Tutor'], ['family', '🏆', 'Familia'], ['me', '⚙️', 'Perfil']];
  app.innerHTML = `<div class="screen">
    <div class="topbar">
      <button class="who" id="who"><span class="av">${p.avatar}</span>${esc(p.name)}</button>
      <div class="spacer"></div>
      <span class="stat fire" title="Racha">🔥 ${liveStreak(p)}</span>
      <span class="stat xp" title="XP">⭐ ${p.xp}</span>
      <span title="Meta diaria">${ringSVG(todayXP(p) / p.goal)}</span>
    </div>
    <div class="scroll" id="content"></div>
    <nav class="nav">${tabs.map(([k, i, l]) => `<button data-t="${k}" class="${TAB === k ? 'on' : ''}"><span class="i">${i}</span>${l}</button>`).join('')}</nav>
  </div>`;
  $('#who').onclick = () => { TAB = 'family'; renderMain(); };
  $$('.nav button').forEach(b => b.onclick = () => { TAB = b.dataset.t; renderMain(); });
  const c = $('#content');
  ({ learn: viewLearn, sounds: viewSounds, talk: viewTutor, family: viewFamily, me: viewMe })[TAB](c, p);
}

/* ---------- Aprender (ruta) ---------- */
const OFFS = [0, 52, 78, 52, 0, -52];
function viewLearn(c, p) {
  const cur = currentPos(p);
  const weak = Object.keys(p.items).filter(k => ITEMS[k]).length;
  let html = '';
  const goalPct = Math.min(100, Math.round(todayXP(p) / p.goal * 100));
  html += `<div class="card"><div class="row"><b>Meta de hoy</b><div class="spacer"></div><span class="muted">${todayXP(p)} / ${p.goal} XP</span></div>
    <div class="goalbar"><div style="width:${goalPct}%"></div></div>
    ${weak >= 6 ? `<button class="btn ghost small" id="practice" style="margin-top:6px">💪 Repaso inteligente</button>` : `<small class="muted">Consejo: la clave es hablar en voz alta todos los días, aunque te equivoques.</small>`}</div>`;
  LEVELS.forEach(lv => {
    const units = UNITS.filter(u => u.level === lv.id);
    const firstUi = unitIndex(units[0].id);
    const locked = firstUi > cur.ui;
    html += `<div class="level-head" style="background:${lv.color}"><div class="lv">NIVEL ${lv.id}</div><h2>${lv.name}</h2><p>${lv.desc}</p>
      ${locked ? `<button class="jump" data-jump="${lv.id}">🔑 Examen para saltar a ${lv.id}</button>` : ''}</div>`;
    units.forEach(u => {
      const ui = unitIndex(u.id);
      html += `<div class="unit-head"><span class="ic">${u.icon}</span><div class="t"><small>Unidad ${ui + 1} · ${lv.id}</small><div>${u.title}</div></div>
        <button class="guide" data-guide="${u.id}">📖 Guía</button></div><div class="path" style="--lvc:${lv.color}">`;
      NODES.forEach((n, ni) => {
        const done = nodesDone(p, u) > ni, unl = isUnlocked(p, ui, ni), isCur = ui === cur.ui && ni === cur.ni;
        const off = OFFS[ni];
        html += `<div class="node-wrap ${off > 0 ? 'flip' : ''}" style="transform:translateX(${off}px)">
          ${isCur ? `<div class="bubble">${ui === 0 && ni === 0 ? 'EMPIEZA' : 'SIGUIENTE'}</div>` : ''}
          <button class="node ${done ? 'done' : unl ? '' : 'locked'} ${isCur ? 'current' : ''}" data-u="${u.id}" data-n="${ni}" ${isCur ? 'id="curnode"' : ''}>${done ? '✔️' : unl ? n.icon : '🔒'}</button>
          <span class="node-label">${n.label}</span></div>`;
      });
      html += `</div>`;
    });
  });
  html += `<div class="center" style="margin:30px 0">${MASCOT}<p class="muted">¡Al final del camino hablarás inglés con confianza!</p></div>`;
  c.innerHTML = html;
  $$('.node', c).forEach(b => b.onclick = () => {
    const u = UNITS.find(x => x.id === b.dataset.u), ni = +b.dataset.n, ui = unitIndex(u.id);
    if (!isUnlocked(p, ui, ni)) return toast('🔒 Completa la lección anterior para desbloquear esta');
    startNode(u, ni);
  });
  $$('[data-guide]', c).forEach(b => b.onclick = () => showGuide(UNITS.find(u => u.id === b.dataset.guide)));
  $$('[data-jump]', c).forEach(b => b.onclick = () => startJumpTest(b.dataset.jump));
  const pr = $('#practice', c); if (pr) pr.onclick = startPractice;
  const cn = $('#curnode', c);
  if (cn) setTimeout(() => cn.scrollIntoView({ block: 'center' }), 30);
}
function showGuide(u) {
  modal(`<h2>${u.icon} ${u.title}</h2><h3 style="color:var(--purple)">${u.grammar.title}</h3>${u.grammar.html}
    <h3 style="margin-top:18px">Vocabulario</h3><table>${u.words.map(([e, s]) => `<tr><td><button class="mini-aud" data-say="${esc(e)}" style="width:34px;height:34px;font-size:15px">🔊</button></td><td><b>${esc(e)}</b></td><td class="muted">${esc(s)}</td></tr>`).join('')}</table>
    <h3>Frases clave</h3><table>${u.phrases.map(([e, s]) => `<tr><td><button class="mini-aud" data-say="${esc(e)}" style="width:34px;height:34px;font-size:15px">🔊</button></td><td><b>${esc(e)}</b><br><span class="muted">${esc(s)}</span></td></tr>`).join('')}</table>
    <button class="btn" data-close style="margin-top:14px">Entendido</button>`, (m, close) => {
    $$('[data-say]', m).forEach(b => b.onclick = () => Speech.speak(b.dataset.say));
    $('[data-close]', m).onclick = close;
  });
}

/* ======================= GENERADORES DE EJERCICIOS ======================= */
const cleanTok = t => t.replace(/^[¿¡"]+/, '').replace(/[.,!?"]+$/, '');
const tokens = s => s.split(/\s+/).map(cleanTok).filter(Boolean);
function others(list, item, n, f = x => x) { return sample(list.filter(x => f(x) !== f(item)), n); }
const W = (u, i) => ({ en: u.words[i][0], es: u.words[i][1], key: 'w:' + u.words[i][0] });
const PH = (u, i) => ({ en: u.phrases[i][0], es: u.phrases[i][1], key: 'p:' + u.phrases[i][0] });
const unitWords = u => u.words.map((_, i) => W(u, i));
const unitPhrases = u => u.phrases.map((_, i) => PH(u, i));

const G = {
  intro: it => ({ type: 'intro', en: it.en, es: it.es, key: it.key }),
  mcEnEs: (it, pool) => ({ type: 'mc', tag: 'Elige la traducción', q: `¿Qué significa?`, say: it.en, options: shuffle([it.es, ...others(pool, it, 3, x => x.es).map(x => x.es)]), answer: it.es, key: it.key }),
  mcEsEn: (it, pool) => ({ type: 'mc', tag: 'Elige la correcta', q: `¿Cómo se dice “${it.es}”?`, options: shuffle([it.en, ...others(pool, it, 3, x => x.en).map(x => x.en)]), answer: it.en, audioOpts: true, key: it.key }),
  listenMc: (it, pool) => ({ type: 'mc', tag: 'Escucha', q: '¿Qué escuchaste?', audio: it.en, options: shuffle([it.en, ...others(pool, it, 3, x => x.en).map(x => x.en)]), answer: it.en, key: it.key }),
  match: items => ({ type: 'match', pairs: items.map(i => [i.en, i.es]), keys: items.map(i => i.key) }),
  build: (it, pool, listen) => {
    const own = tokens(it.en), ownL = new Set(own.map(t => t.toLowerCase()));
    const extra = shuffle([...new Set(pool.flatMap(x => tokens(x.en)).map(t => t === 'I' ? t : t.toLowerCase()))].filter(t => !ownL.has(t.toLowerCase()))).slice(0, own.length > 6 ? 2 : 3);
    return { type: 'build', tag: listen ? 'Escucha y ordena' : 'Traduce', q: listen ? 'Toca lo que escuchas' : 'Traduce esta frase', prompt: listen ? null : it.es, audio: listen ? it.en : null, bank: shuffle([...own, ...extra]), answer: it.en, es: it.es, key: it.key };
  },
  dictation: it => ({ type: 'type', tag: 'Dictado', q: 'Escribe lo que escuchas', audio: it.en, answer: it.en, es: it.es, key: it.key }),
  speak: (it, strict) => ({ type: 'speak', tag: 'Habla', q: 'Lee en voz alta', text: it.en, es: it.es, key: it.key, strict }),
  fill: (it, u) => {
    const toks = it.en.split(/\s+/);
    const singles = u.words.map(w => w[0]).filter(w => !w.includes(' '));
    let idx = toks.findIndex(t => singles.some(w => cleanTok(t).toLowerCase() === w.toLowerCase()));
    let distract;
    if (idx >= 0) distract = others(singles, cleanTok(toks[idx]).toLowerCase(), 3, x => x.toLowerCase()).filter(w => !toks.some(t => cleanTok(t).toLowerCase() === w.toLowerCase()));
    if (idx < 0 || distract.length < 2) {
      const cands = toks.map((t, i) => [cleanTok(t), i]).filter(([t]) => t.length >= 4 && !/'/.test(t));
      if (!cands.length) return G.build(it, unitPhrases(u));
      idx = pick(cands)[1];
      const pool = [...new Set(unitPhrases(u).flatMap(x => tokens(x.en)).filter(t => t.length >= 3 && !/'/.test(t)).map(t => t.toLowerCase()))];
      distract = sample(pool.filter(w => !toks.some(t => cleanTok(t).toLowerCase() === w)), 3);
    }
    const ans = cleanTok(toks[idx]);
    const before = toks.slice(0, idx).join(' '), after = toks.slice(idx + 1).join(' ');
    const trail = toks[idx].slice(toks[idx].indexOf(ans) + ans.length);
    return { type: 'fill', tag: 'Completa', q: 'Completa la frase', before, after: trail + (after ? ' ' + after : ''), es: it.es, options: shuffle([ans, ...distract.slice(0, 3)]), answer: ans, full: it.en, key: it.key };
  }
};

function speakAllowed() { const p = P(); return Speech.supported() && !(p && p.skipSpeakUntil > Date.now()); }
function maybeSpeak(it, fallback) { return speakAllowed() ? G.speak(it) : fallback; }

function buildLesson(u, kind) {
  const ws = unitWords(u), ps = unitPhrases(u), ex = [];
  if (kind === 'words1' || kind === 'words2') {
    const set = kind === 'words1' ? ws.slice(0, 5) : ws.slice(5);
    const [a, b, c, d, e] = set;
    ex.push(G.intro(a), G.intro(b), G.mcEnEs(a, ws), G.intro(c), G.listenMc(b, ws), G.intro(d), G.mcEsEn(c, ws),
      maybeSpeak(a, G.listenMc(a, ws)), G.intro(e), G.mcEnEs(d, ws), G.match(set), G.mcEsEn(e, ws), maybeSpeak(c, G.mcEnEs(c, ws)));
    if (kind === 'words2') ex.push(G.match(ws.slice(0, 5)));
  } else if (kind === 'phrases') {
    const s = shuffle(ps);
    ex.push(G.build(s[0], ps), G.mcEnEs(s[1], ps), G.build(s[2], ps), G.fill(s[3], u), G.build(s[4], ps), maybeSpeak(s[0], G.build(s[5], ps, true)),
      G.mcEsEn(s[5], ps), G.fill(s[6], u), G.build(s[7], ps), maybeSpeak(s[2], G.mcEnEs(s[2], ps)));
  } else if (kind === 'listen') {
    const s = shuffle(ps), short = ps.slice().sort((x, y) => x.en.length - y.en.length);
    ex.push(G.build(s[0], ps, true), maybeSpeak(s[0], G.dictation(short[0])), G.listenMc(s[1], ps), G.dictation(short[1]), maybeSpeak(s[2], G.build(s[2], ps, true)),
      G.build(s[3], ps, true), maybeSpeak(s[4], G.listenMc(s[4], ps)), G.dictation(short[2]), maybeSpeak(s[5], G.build(s[5], ps, true)), G.build(s[6], ps, true));
  } else if (kind === 'test' || kind === 'review') {
    const gens = [it => it.kind === 'w' ? G.mcEnEs(it, ws) : G.build(it, ps), it => it.kind === 'w' ? G.mcEsEn(it, ws) : G.fill(it, u),
      it => it.kind === 'w' ? G.listenMc(it, ws) : G.build(it, ps, true), it => maybeSpeak(it, G.mcEnEs(it, it.kind === 'w' ? ws : ps))];
    const all = shuffle([...ws.map(x => ({ ...x, kind: 'w' })), ...ps.map(x => ({ ...x, kind: 'p' }))]).slice(0, 11);
    all.forEach((it, i) => ex.push(gens[i % gens.length](it)));
    ex.splice(5, 0, G.match(sample(ws, 5)));
    ex.push(...weakExercises(3, u.id));
  }
  return ex;
}
function weakExercises(n, excludeUnit) {
  const p = P();
  const keys = Object.keys(p.items).filter(k => ITEMS[k] && ITEMS[k].unit !== excludeUnit)
    .sort((a, b) => (p.items[a].s - p.items[b].s) || (p.items[a].d < p.items[b].d ? -1 : 1)).slice(0, n * 2);
  return sample(keys, n).map(k => {
    const it = { ...ITEMS[k], key: k }, u = UNITS.find(x => x.id === it.unit);
    const pool = it.kind === 'w' ? unitWords(u) : unitPhrases(u);
    return it.kind === 'w' ? pick([G.mcEnEs, G.mcEsEn, G.listenMc])(it, pool) : pick([() => G.build(it, pool), () => G.build(it, pool, true), () => maybeSpeak(it, G.build(it, pool))])();
  });
}

/* ======================= MOTOR DE LECCIONES ======================= */
function startNode(u, ni) {
  const kind = NODES[ni].k;
  const p = P();
  const finish = () => { if (nodesDone(p, u) === ni) { p.progress[u.id] = ni + 1; save(); } };
  if (kind === 'talk') return startDialogue(u, { onDone: finish, xp: 15 });
  runLesson({ title: `${u.title} · ${NODES[ni].label}`, exercises: buildLesson(u, kind), onDone: finish, xp: kind === 'test' ? 20 : 10 });
}
function startPractice() {
  const ex = weakExercises(10, null);
  if (ex.length < 4) return toast('Completa algunas lecciones primero');
  runLesson({ title: 'Repaso inteligente', exercises: ex, xp: 10 });
}

function runLesson(opts) {
  const L = { ex: opts.exercises.slice(), i: 0, graded: 0, firstOk: 0, combo: 0, retried: new Set(), start: Date.now(), stopped: false, stage: {} };
  const baseLen = L.ex.length;
  app.innerHTML = `<div class="screen" id="lesson">
    <div class="lesson-top"><button class="x" id="quit">✕</button><div class="pbar"><div id="pb" style="width:0%"></div></div><div class="combo" id="combo"></div></div>
    <div class="ex" id="ex"></div><div class="footer" id="foot"></div></div>`;
  $('#quit').onclick = () => {
    if (opts.noConfirm) return (Speech.stop(), renderMain());
    modal(`<div class="center">${MASCOT}<h2>¿Seguro que quieres salir?</h2><p class="muted">Perderás el progreso de esta lección.</p>
      <button class="btn" data-k>Seguir aprendiendo</button><button class="link" data-q style="width:100%;color:var(--bad)">Salir</button></div>`, (m, close) => {
      $('[data-k]', m).onclick = close; $('[data-q]', m).onclick = () => { close(); Speech.stop(); renderMain(); };
    });
  };
  const ctx = {};
  function setFoot(state, info = {}) {
    const f = $('#foot');
    f.className = 'footer' + (state === 'ok' ? ' okf' : state === 'bad' ? ' badf' : '');
    if (state === 'check') {
      f.innerHTML = `${info.skip ? `<div class="skip-row"><button class="link" id="skipspk">🙊 No puedo hablar ahora</button></div>` : ''}
        <button class="btn" id="chk" ${info.ready ? '' : 'disabled'} ${info.hide ? 'style="display:none"' : ''}>Comprobar</button>`;
      $('#chk').onclick = () => { const r = ctx.check(); if (r) grade(r.ok, r); };
      if (info.skip) $('#skipspk').onclick = () => { P().skipSpeakUntil = Date.now() + 15 * 60000; save(); Speech.stop(); toast('Sin ejercicios de voz por 15 minutos'); grade(null, {}); };
    } else if (state === 'continue') {
      f.innerHTML = `<button class="btn" id="cont">Continuar</button>`; $('#cont').onclick = next;
    } else {
      const okTitles = ['¡Excelente!', '¡Muy bien!', '¡Correcto!', '¡Genial!', '¡Así se hace!'];
      f.innerHTML = `<div class="fb-title">${state === 'ok' ? '✅ ' + pick(okTitles) : '❌ ' + pick(['¡Casi!', 'Uy, no exactamente', 'Sigue intentando'])}</div>
        ${info.text ? `<div class="fb-text">${info.text}</div>` : ''}
        <button class="btn ${state === 'ok' ? 'ok' : 'bad'}" id="cont">Continuar</button>`;
      $('#cont').onclick = next;
    }
  }
  ctx.ready = (v = true) => { const b = $('#chk'); if (b) b.disabled = !v; };
  ctx.finish = (ok, info) => grade(ok, info || {});
  ctx.setFoot = setFoot;

  function grade(ok, info) {
    const ex = L.ex[L.i];
    if (ok === null) { // saltado (voz)
      L.ex.splice(L.i + 1, 0, ...[]); next(); return;
    }
    const first = !L.retried.has(ex);
    if (first) { L.graded++; if (ok) L.firstOk++; }
    if (ex.key) markItem(ex.key, ok);
    if (ex.keys) ex.keys.forEach(k => markItem(k, ok));
    if (ok) { sfxOk(); L.combo++; } else { sfxBad(); L.combo = 0; if (!ex.noRetry && ex.type !== 'speak' && !L.retried.has(ex)) { L.retried.add(ex); L.ex.push(ex); } }
    $('#combo').textContent = L.combo >= 3 ? `🔥${L.combo}` : '';
    if (opts.onGraded && opts.onGraded(ex, ok, L) === 'stop') L.stopped = true;
    const answerText = info.text || (ex.answer ? `Respuesta correcta:<br><b>${esc(ex.answer)}</b>${ex.es && ex.type !== 'mc' ? `<br><small>${esc(ex.es)}</small>` : ''}` : '');
    setFoot(ok ? 'ok' : 'bad', { text: ok ? (info.note || (ex.es && ex.type !== 'mc' ? esc(ex.es) : '')) : answerText });
    const sayTxt = { build: ex.answer, type: ex.answer, fill: ex.full }[ex.type];
    if (sayTxt) Speech.speak(sayTxt);
  }
  function next() {
    Speech.stop();
    L.i++;
    if (L.stopped || L.i >= L.ex.length) return done();
    show();
  }
  function show() {
    const ex = L.ex[L.i];
    window.__curEx = ex; // (usado solo por pruebas automáticas)
    $('#pb').style.width = Math.min(100, (L.i / Math.max(baseLen, L.ex.length)) * 100) + '%';
    const box = $('#ex'); box.innerHTML = '';
    ctx.check = null;
    RENDER[ex.type](ex, box, ctx);
  }
  function done() {
    $('#pb').style.width = '100%';
    const acc = L.graded ? Math.round(L.firstOk / L.graded * 100) : 100;
    if (opts.custom) return opts.custom(L, acc);
    const xp = (opts.xp || 10) + (acc === 100 && L.graded >= 5 ? 5 : 0);
    addXP(xp);
    opts.onDone && opts.onDone(acc);
    const secs = Math.round((Date.now() - L.start) / 1000);
    showDone({ title: acc === 100 ? '¡Lección perfecta!' : '¡Lección completada!', xp, acc, time: `${Math.floor(secs / 60)}:${pad(secs % 60)}` });
  }
  show();
}

function showDone({ title, xp, acc, time, extra = '', btn = 'Continuar', onBtn }) {
  sfxWin(); confetti();
  const p = P();
  app.innerHTML = `<div class="screen"><div class="done-screen">${MASCOT}<h1>${title}</h1>
    <p class="muted">${todayXP(p) >= p.goal ? '🎯 ¡Cumpliste tu meta de hoy! Racha: 🔥 ' + liveStreak(p) : `Te faltan ${Math.max(0, p.goal - todayXP(p))} XP para tu meta de hoy`}</p>
    <div class="done-boxes"><div class="b"><div class="h">XP GANADOS</div><div class="v">⭐ ${xp}</div></div>
    ${acc != null ? `<div class="b g"><div class="h">PRECISIÓN</div><div class="v">🎯 ${acc}%</div></div>` : ''}
    ${time ? `<div class="b bl"><div class="h">TIEMPO</div><div class="v">⏱️ ${time}</div></div>` : ''}</div>${extra}</div>
    <div class="footer"><button class="btn" id="fin">${btn}</button></div></div>`;
  $('#fin').onclick = onBtn || (() => renderMain());
}

/* ---------------- renderizadores ---------------- */
function audioButtons(text) {
  return `<div class="big-audio"><button class="aud" data-play>🔊</button><button class="aud slow" data-slow>🐢</button></div>`;
}
function wireAudio(box, text) {
  const a = $('[data-play]', box), s = $('[data-slow]', box);
  if (a) a.onclick = () => Speech.speak(text);
  if (s) s.onclick = () => Speech.speak(text, { slow: true });
}
const RENDER = {
  intro(ex, box, ctx) {
    box.innerHTML = `<div class="tag">Palabra nueva</div><div class="intro-card"><div class="new">✨ NUEVA</div>
      <div class="en">${esc(ex.en)}</div><div class="es">${esc(ex.es)}</div>
      <div class="big-audio" style="margin:18px 0 0"><button class="aud" data-play>🔊</button><button class="aud slow" data-slow>🐢</button></div></div>`;
    wireAudio(box, ex.en); Speech.speak(ex.en);
    ctx.setFoot('continue');
  },
  tip(ex, box, ctx) {
    box.innerHTML = `<div class="tag">${esc(ex.ipa)}</div><div class="q">${esc(ex.title)}</div><div class="card">${ex.html}
      <table class="pair-table">${ex.pairs.map(([a, b]) => `<tr><td><button data-say="${esc(a)}">🔊</button> <b>${esc(a)}</b></td><td>${ex.noListen ? `<span class="muted">✗ ${esc(b)}</span>` : `<button data-say="${esc(b)}">🔊</button> ${esc(b)}`}</td></tr>`).join('')}</table></div>`;
    $$('[data-say]', box).forEach(b => b.onclick = () => Speech.speak(b.dataset.say, { slow: true }));
    ctx.setFoot('continue');
  },
  mc(ex, box, ctx) {
    let sel = null;
    box.innerHTML = `<div class="tag">${ex.tag}</div><div class="q">${esc(ex.q)}</div>
      ${ex.audio ? audioButtons() : ''}
      ${ex.say ? `<div class="prompt-line"><button class="mini-aud" data-play>🔊</button><div class="say">${esc(ex.say)}</div></div>` : ''}
      <div class="opts">${ex.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${i + 1}</span>${esc(o)}</button>`).join('')}</div>`;
    const t = ex.audio || ex.say;
    if (t) { wireAudio(box, t); Speech.speak(t); }
    $$('.opt', box).forEach(b => b.onclick = () => {
      $$('.opt', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = ex.options[+b.dataset.i];
      if (ex.audioOpts) Speech.speak(sel);
      ctx.ready(true);
    });
    ctx.check = () => {
      const ok = sel === ex.answer;
      $$('.opt', box).forEach(x => { const v = ex.options[+x.dataset.i]; if (v === ex.answer) x.classList.add('right'); else if (v === sel) x.classList.add('wrong'); x.disabled = true; });
      return { ok };
    };
    ctx.setFoot('check', {});
  },
  build(ex, box, ctx) {
    const chosen = [];
    box.innerHTML = `<div class="tag">${ex.tag}</div><div class="q">${esc(ex.q)}</div>
      ${ex.audio ? audioButtons() : `<div class="prompt-line"><div style="font-size:40px">🦜</div><div class="say">${esc(ex.prompt)}</div></div>`}
      <div class="answer-line" id="ans"></div><div class="bank" id="bank">${ex.bank.map((t, i) => `<button class="tok" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
    if (ex.audio) { wireAudio(box, ex.audio); Speech.speak(ex.audio); }
    const ans = $('#ans', box);
    const redraw = () => {
      ans.innerHTML = chosen.map((i, k) => `<button class="tok" data-k="${k}">${esc(ex.bank[i])}</button>`).join('');
      $$('#bank .tok', box).forEach(b => b.classList.toggle('used', chosen.includes(+b.dataset.i)));
      $$('.tok', ans).forEach(b => b.onclick = () => { chosen.splice(+b.dataset.k, 1); redraw(); });
      ctx.ready(chosen.length > 0);
    };
    $$('#bank .tok', box).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (!chosen.includes(i)) { chosen.push(i); redraw(); } });
    ctx.check = () => {
      const got = Speech.norm(chosen.map(i => ex.bank[i]).join(' ')).join(' ');
      const ok = got === Speech.norm(ex.answer).join(' ');
      $$('.tok', box).forEach(b => b.disabled = true);
      return { ok };
    };
    ctx.setFoot('check', {});
  },
  type(ex, box, ctx) {
    box.innerHTML = `<div class="tag">${ex.tag}</div><div class="q">${esc(ex.q)}</div>${audioButtons()}
      <textarea class="text-in" id="ti" placeholder="Escribe en inglés..." autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea>`;
    wireAudio(box, ex.audio); Speech.speak(ex.audio);
    const ti = $('#ti', box);
    ti.oninput = () => ctx.ready(ti.value.trim().length > 0);
    ctx.check = () => {
      const a = Speech.norm(ti.value).join(' '), b = Speech.norm(ex.answer).join(' ');
      const d = Speech.lev(a, b);
      const ok = d <= Math.max(1, Math.floor(b.length / 12));
      ti.disabled = true;
      return { ok, note: ok && d > 0 ? `Casi perfecto. Ojo con la ortografía: <b>${esc(ex.answer)}</b>` : esc(ex.es) };
    };
    ctx.setFoot('check', {});
  },
  fill(ex, box, ctx) {
    let sel = null;
    box.innerHTML = `<div class="tag">${ex.tag}</div><div class="q">${esc(ex.q)}</div><p class="muted" style="margin-top:-8px">${esc(ex.es)}</p>
      <div class="say card" style="font-size:21px;font-weight:700">${esc(ex.before)} <span id="blank" style="display:inline-block;min-width:80px;border-bottom:3px solid var(--blue);color:var(--blue);text-align:center">&nbsp;</span>${esc(ex.after)}</div>
      <div class="opts two">${ex.options.map((o, i) => `<button class="opt center" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
    $$('.opt', box).forEach(b => b.onclick = () => {
      $$('.opt', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = ex.options[+b.dataset.i];
      $('#blank', box).textContent = sel; ctx.ready(true);
    });
    ctx.check = () => {
      const ok = sel && sel.toLowerCase() === ex.answer.toLowerCase();
      $$('.opt', box).forEach(x => { const v = ex.options[+x.dataset.i]; if (v === ex.answer) x.classList.add('right'); else if (v === sel) x.classList.add('wrong'); x.disabled = true; });
      return { ok, text: ok ? '' : `Respuesta correcta:<br><b>${esc(ex.full)}</b><br><small>${esc(ex.es)}</small>` };
    };
    ctx.setFoot('check', {});
  },
  match(ex, box, ctx) {
    const left = shuffle(ex.pairs.map((p, i) => ({ t: p[0], i }))), right = shuffle(ex.pairs.map((p, i) => ({ t: p[1], i })));
    let selL = null, selR = null, matched = 0, errors = 0;
    box.innerHTML = `<div class="tag">Une las parejas</div><div class="q">Toca las parejas</div><div class="match">
      <div class="opts" id="L">${left.map(x => `<button class="opt" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>
      <div class="opts" id="R">${right.map(x => `<button class="opt" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div></div>`;
    const tryMatch = () => {
      if (!selL || !selR) return;
      const a = selL, b = selR; selL = selR = null;
      if (a.dataset.i === b.dataset.i) {
        a.classList.replace('sel', 'right'); b.classList.replace('sel', 'right'); tone([[880, 0, 0.08]]);
        setTimeout(() => { a.classList.add('gone'); b.classList.add('gone'); }, 350);
        if (++matched === ex.pairs.length) setTimeout(() => ctx.finish(errors <= 1, errors <= 1 ? { note: errors ? '1 error' : '¡Sin errores!' } : { text: `Tuviste ${errors} errores. ¡Repasa estas palabras en la 📖 Guía!` }), 400);
      } else {
        errors++; sfxBad();
        a.classList.replace('sel', 'wrong'); b.classList.replace('sel', 'wrong');
        setTimeout(() => { a.classList.remove('wrong'); b.classList.remove('wrong'); }, 450);
      }
    };
    $$('#L .opt', box).forEach(b => b.onclick = () => { $$('#L .opt', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); selL = b; Speech.speak(b.textContent); tryMatch(); });
    $$('#R .opt', box).forEach(b => b.onclick = () => { $$('#R .opt', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); selR = b; tryMatch(); });
    ctx.setFoot('check', { hide: true });
    ex.noRetry = true;
  },
  pair(ex, box, ctx) {
    let sel = null;
    box.innerHTML = `<div class="tag">${esc(ex.ipa)} · Oído fino</div><div class="q">¿Cuál escuchaste?</div>${audioButtons()}
      <div class="opts two">${ex.options.map((o, i) => `<button class="opt center" data-i="${i}" style="font-size:22px">${esc(o)}</button>`).join('')}</div>`;
    wireAudio(box, ex.answer); setTimeout(() => Speech.speak(ex.answer), 250);
    $$('.opt', box).forEach(b => b.onclick = () => { $$('.opt', box).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = ex.options[+b.dataset.i]; ctx.ready(true); });
    ctx.check = () => {
      const ok = sel === ex.answer;
      $$('.opt', box).forEach(x => { const v = ex.options[+x.dataset.i]; if (v === ex.answer) x.classList.add('right'); else if (v === sel) x.classList.add('wrong'); });
      return { ok, text: ok ? '' : `Era: <b>${esc(ex.answer)}</b>` };
    };
    ex.noRetry = true;
    ctx.setFoot('check', {});
  },
  speak(ex, box, ctx) {
    if (!speakAllowed()) {
      const it = { en: ex.text, es: ex.es || '', key: ex.key };
      Object.assign(ex, G.build(it, [it], true)); ex.bank = shuffle(tokens(ex.text)); return RENDER.build(ex, box, ctx);
    }
    let attempts = 0, closed = false;
    box.innerHTML = `<div class="tag">${esc(ex.tag || 'Habla')}</div><div class="q">${esc(ex.q || 'Lee en voz alta')}</div>
      <div class="prompt-line"><button class="mini-aud" data-play>🔊</button><button class="mini-aud" data-slow style="background:var(--purple);box-shadow:0 3px 0 #7a3fc4">🐢</button>
      <div class="say"><div class="target" id="tg">${ex.text.split(/\s+/).map(w => `<span class="w">${esc(w)}</span>`).join(' ')}</div>${ex.es ? `<div class="muted center" style="font-size:15px">${esc(ex.es)}</div>` : ''}</div></div>
      <button class="mic" id="mic">🎤</button><div class="heard" id="heard">Toca el micrófono y habla</div><div id="res"></div>`;
    $('[data-play]', box).onclick = () => Speech.speak(ex.text);
    $('[data-slow]', box).onclick = () => Speech.speak(ex.text, { slow: true });
    const mic = $('#mic', box), heard = $('#heard', box), res = $('#res', box);
    mic.onclick = () => {
      if (closed) return;
      if (Speech.isActive()) { Speech.stop(); return; }
      mic.classList.add('on'); heard.textContent = 'Te escucho... 👂'; res.innerHTML = '';
      Speech.listen({
        onInterim: t => heard.textContent = '“' + t + '”',
        onResult: alts => {
          if (closed) return;
          const r = Speech.evaluate(ex.text, alts, ex.strict);
          heard.innerHTML = 'Escuché: “' + esc(r.heard) + '”';
          $('#tg', box).innerHTML = r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ');
          const pass = ex.strict ? r.score >= 100 : r.score >= 70;
          attempts++;
          const bad = r.words.filter(w => !w.ok).map(w => w.w);
          const tips = Speech.tipsFor(bad);
          res.innerHTML = `<div class="score"><b style="color:${pass ? 'var(--ok)' : r.score >= 50 ? 'var(--sun)' : 'var(--bad)'}">${r.score}%</b><br>${pass ? '¡Se entendió muy bien!' : 'Intenta de nuevo: escucha el modelo 🔊 y repite'}</div>
            ${!pass && tips.length ? `<div class="tipbox">${tips.join('<br>')}</div>` : ''}`;
          if (pass || attempts >= 3) { closed = true; mic.disabled = true; }
          if (pass) ctx.finish(true, { note: `Pronunciación: ${r.score}%` });
          else if (attempts >= 3) ctx.finish(false, { text: `${esc(ex.text)}<br><small>Sigue practicando, ¡mejora con cada intento!</small>` });
        },
        onError: err => {
          mic.classList.remove('on');
          heard.innerHTML = micErrorText(err);
        },
        onEnd: got => { mic.classList.remove('on'); if (!got && heard.textContent.startsWith('Te escucho')) heard.textContent = 'No te escuché. Toca y habla un poco más fuerte.'; }
      });
    };
    ctx.setFoot('check', { hide: true, skip: true });
    setTimeout(() => Speech.speak(ex.text), 200);
  }
};
function micErrorText(err) {
  return ({
    'not-allowed': '🚫 Permiso de micrófono bloqueado. Actívalo en Ajustes del navegador → Permisos del sitio → Micrófono.',
    'service-not-allowed': '🚫 El reconocimiento de voz no está permitido. Usa Google Chrome.',
    'network': '📶 El reconocimiento de voz necesita internet.',
    'no-speech': 'No te escuché. Toca y habla un poco más fuerte.',
    'audio-capture': '🎤 No se encontró micrófono.',
    'unsupported': 'Este navegador no reconoce voz. Usa Google Chrome en Android.'
  })[err] || 'No se pudo escuchar (' + esc(err) + '). Intenta de nuevo.';
}

/* ======================= PRUEBAS DE NIVEL ======================= */
function levelQuestions(levelId, n) {
  const units = UNITS.filter(u => u.level === levelId);
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = pick(units), ps = unitPhrases(u), ws = unitWords(u);
    const t = i % 4;
    const ex = t === 0 ? G.build(pick(ps), ps) : t === 1 ? G.mcEnEs(pick(ps), ps) : t === 2 ? G.fill(pick(ps), u) : G.mcEsEn(pick(ws), ws);
    ex.key = null; ex.noRetry = true; ex.level = levelId;
    out.push(ex);
  }
  return out;
}
function completeBefore(levelId) {
  const p = P(); const idx = LEVELS.findIndex(l => l.id === levelId);
  UNITS.forEach(u => { if (LEVELS.findIndex(l => l.id === u.level) < idx) p.progress[u.id] = NODES.length; });
  save();
}
function startPlacement() {
  const per = 4;
  const ex = LEVELS.flatMap(l => levelQuestions(l.id, per));
  const score = {};
  let reached = 'A1';
  runLesson({
    title: 'Prueba de nivel', exercises: ex, noConfirm: true,
    onGraded: (e, ok, L) => {
      score[e.level] = (score[e.level] || 0) + (ok ? 1 : 0);
      const pos = L.i + 1;
      if (pos % per === 0) {
        if (score[e.level] >= 3) { const li = LEVELS.findIndex(l => l.id === e.level); reached = LEVELS[Math.min(li + 1, LEVELS.length - 1)].id; if (li === LEVELS.length - 1) reached = 'B2'; }
        else return 'stop';
      }
    },
    custom: () => {
      completeBefore(reached);
      const lv = LEVEL[reached];
      addXP(10);
      showDone({ title: `Tu nivel de inicio: ${reached}`, xp: 10, acc: null, time: null,
        extra: `<div class="card"><b style="color:${lv.color}">${lv.name}</b><br><span class="muted">${lv.desc}</span></div><p class="muted">Siempre puedes repasar los niveles anteriores.</p>`,
        btn: '¡A aprender!' });
    }
  });
}
function startJumpTest(levelId) {
  const idx = LEVELS.findIndex(l => l.id === levelId);
  const prev = LEVELS.slice(0, idx).slice(-2).map(l => l.id);
  const ex = shuffle(prev.flatMap(l => levelQuestions(l, prev.length > 1 ? 5 : 10)));
  let wrong = 0;
  modal(`<div class="center"><div style="font-size:50px">🔑</div><h2>Examen para saltar a ${levelId}</h2>
    <p class="muted">${ex.length} preguntas de los niveles anteriores. Puedes fallar máximo 2. Si apruebas, se desbloquea todo hasta ${levelId}.</p>
    <button class="btn" data-go>Empezar</button><button class="link" data-no style="width:100%">Ahora no</button></div>`, (m, close) => {
    $('[data-no]', m).onclick = close;
    $('[data-go]', m).onclick = () => {
      close();
      runLesson({
        title: 'Examen', exercises: ex,
        onGraded: (e, ok) => { if (!ok && ++wrong > 2) return 'stop'; },
        custom: () => {
          if (wrong <= 2) { completeBefore(levelId); addXP(30); showDone({ title: `¡Saltaste a ${levelId}! 🚀`, xp: 30, acc: null }); }
          else {
            app.innerHTML = `<div class="screen"><div class="done-screen">${MASCOT}<h1 style="color:var(--ink)">¡Casi!</h1><p class="muted">Fallaste ${wrong} preguntas. Practica un poco más los niveles anteriores y vuelve a intentarlo.</p></div>
            <div class="footer"><button class="btn" id="fin">Volver</button></div></div>`;
            $('#fin').onclick = () => renderMain();
          }
        }
      });
    };
  });
}

/* ======================= DIÁLOGOS (juego de rol) ======================= */
function startDialogue(u, { onDone, xp = 15 } = {}) {
  const d = u.dialogue, lines = d.lines;
  let li = 0, scores = [];
  const total = lines.filter(l => l.you).length;
  app.innerHTML = `<div class="screen">
    <div class="lesson-top"><button class="x" id="quit">✕</button><div class="pbar"><div id="pb" style="width:0%"></div></div></div>
    <div class="scroll" style="padding-bottom:20px" id="dlg">
      <div class="center"><div class="tag" style="color:var(--purple);font-weight:900;font-size:12px;letter-spacing:.08em">JUEGO DE ROL · ${u.level}</div><h2>${esc(d.title)}</h2><p class="muted" style="margin-top:0">${esc(d.scene)}</p></div>
      <div class="avatar-wrap">${avatarSVG('emma')}</div><div class="center muted" style="font-weight:800">Emma</div>
      <div id="stage"></div>
    </div><div class="footer" id="foot"><button class="btn" id="cont">Empezar</button></div></div>`;
  $('#quit').onclick = () => { Speech.stop(); renderMain(); };
  const stage = $('#stage'), foot = $('#foot');
  const prog = () => $('#pb').style.width = (scores.length / total * 100) + '%';
  function step() {
    if (li >= lines.length) return finish();
    const l = lines[li];
    if (l.bot) {
      stage.innerHTML = `<div class="subtitle"><div class="row"><div style="flex:1">${esc(l.bot)}</div><button class="mini-aud" id="rep">🔊</button></div>
        <div class="es hidden" id="tr">${esc(l.es)}</div><button class="link" id="trb" style="padding:6px 0 0">Traducir</button></div>`;
      $('#rep').onclick = () => Speech.speak(l.bot);
      $('#trb').onclick = () => { $('#tr').classList.toggle('hidden'); };
      Speech.speak(l.bot);
      li++;
      if (li < lines.length && lines[li].you) return yourTurn(true);
      foot.innerHTML = `<button class="btn" id="cont">Continuar</button>`; $('#cont').onclick = step;
    } else yourTurn(false);
  }
  function yourTurn(keepBot) {
    const l = lines[li];
    const challenge = DB.settings.challenge;
    const turn = document.createElement('div'); turn.className = 'yourturn';
    turn.innerHTML = `<div class="lbl">TU TURNO · DI EN INGLÉS</div><div style="font-size:17px;font-weight:700;margin:6px 0">${esc(l.es)}</div>
      <div class="target ${challenge ? 'hidden' : ''}" id="tg" style="font-size:20px">${l.you.split(/\s+/).map(w => `<span class="w">${esc(w)}</span>`).join(' ')}</div>
      ${challenge ? `<button class="link" id="hint">💡 Ver pista</button>` : ''}
      <div class="row" style="justify-content:center;gap:14px"><button class="mini-aud" id="model">🔊</button>
      ${Speech.supported() ? `<button class="mic" id="mic" style="width:90px;height:90px;font-size:38px">🎤</button>` : ''}</div>
      ${Speech.supported() ? '' : `<input class="field" id="typed" placeholder="Escribe tu respuesta en inglés">`}
      <div class="heard" id="heard">${Speech.supported() ? 'Toca el micrófono y habla' : ''}</div><div id="res"></div>`;
    if (!keepBot) stage.innerHTML = '';
    stage.appendChild(turn);
    turn.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if ($('#hint', turn)) $('#hint', turn).onclick = () => $('#tg', turn).classList.remove('hidden');
    $('#model', turn).onclick = () => Speech.speak(l.you);
    let attempts = 0, closed = false;
    const handle = alts => {
      if (closed) return;
      const r = Speech.evaluate(l.you, alts);
      attempts++;
      $('#tg', turn).classList.remove('hidden');
      $('#tg', turn).innerHTML = r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ');
      $('#heard', turn).innerHTML = 'Escuché: “' + esc(r.heard) + '”';
      const pass = r.score >= 60;
      $('#res', turn).innerHTML = `<div class="score"><b style="color:${pass ? 'var(--ok)' : 'var(--sun)'}">${r.score}%</b> ${pass ? '¡Bien dicho!' : 'Inténtalo otra vez'}</div>`;
      if (pass) sfxOk(); else sfxBad();
      if (pass || attempts >= 3) {
        closed = true; if ($('#mic', turn)) $('#mic', turn).disabled = true;
        scores.push(r.score); prog(); li++;
        foot.innerHTML = `<button class="btn ${pass ? 'ok' : ''}" id="cont">Continuar</button>`; $('#cont').onclick = step;
      }
    };
    const mic = $('#mic', turn);
    if (mic) mic.onclick = () => {
      if (closed) return;
      if (Speech.isActive()) return Speech.stop();
      mic.classList.add('on'); $('#heard', turn).textContent = 'Te escucho... 👂';
      Speech.listen({
        onInterim: t => $('#heard', turn).textContent = '“' + t + '”',
        onResult: handle,
        onError: e => { mic.classList.remove('on'); $('#heard', turn).innerHTML = micErrorText(e); },
        onEnd: () => mic.classList.remove('on')
      });
    };
    foot.innerHTML = Speech.supported() ? `<button class="link" id="skip" style="width:100%">Saltar esta frase</button>` : `<button class="btn" id="send">Comprobar</button>`;
    if ($('#send')) $('#send').onclick = () => handle([$('#typed', turn).value]);
    if ($('#skip')) $('#skip').onclick = () => { Speech.stop(); scores.push(0); prog(); li++; step(); };
  }
  function finish() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    addXP(xp); onDone && onDone(avg);
    showDone({ title: '¡Conversación completada!', xp, acc: avg, extra: `<p class="muted">Puntaje de pronunciación promedio</p>` });
  }
  $('#cont').onclick = step;
}

/* ======================= PRONUNCIACIÓN ======================= */
function viewSounds(c, p) {
  c.innerHTML = `<h1>👄 Laboratorio de pronunciación</h1>
    <p class="muted">Los ${SOUNDS.length} sonidos que más le cuestan a quien habla español. Escucha la diferencia y luego dilo: la app te marca palabra por palabra.</p>
    ${Speech.supported() ? '' : `<div class="notice warn">Tu navegador no reconoce voz. Abre la app en <b>Google Chrome</b> para practicar hablando.</div>`}
    ${SOUNDS.map(s => { const best = p.sounds[s.id]; return `<button class="list-item" data-s="${s.id}"><span class="ic">${s.icon}</span><span class="t"><b>${esc(s.title)}</b><small>${esc(s.ipa)} · ${s.pairs.map(x => x[0]).slice(0, 3).join(', ')}</small></span>${best != null ? `<span class="badge ${best >= 80 ? 'g' : ''}">${best}%</span>` : '<span class="badge">Nuevo</span>'}</button>`; }).join('')}`;
  $$('[data-s]', c).forEach(b => b.onclick = () => startSound(SOUNDS.find(s => s.id === b.dataset.s)));
}
function startSound(s) {
  const ex = [{ type: 'tip', ipa: s.ipa, title: s.title, html: `<p>${s.tip}</p>`, pairs: s.pairs, noListen: s.noListen }];
  if (!s.noListen) shuffle(s.pairs).forEach(pr => ex.push({ type: 'pair', ipa: s.ipa, options: shuffle(pr), answer: pick(pr) }));
  if (speakAllowed()) {
    sample(s.words, 4).forEach(w => ex.push({ type: 'speak', tag: s.ipa + ' · Habla', q: 'Di esta palabra', text: w }));
    if (!s.noListen) sample(s.pairs, 2).forEach(pr => ex.push({ type: 'speak', tag: 'Precisión', q: 'Di exactamente esta palabra', text: pr[0], strict: true }));
    ex.push({ type: 'speak', tag: 'Trabalenguas', q: 'Reto final: trabalenguas', text: s.twister });
  } else ex.push({ type: 'tip', ipa: s.ipa, title: 'Practica en voz alta', html: `<p>Repite cada palabra 3 veces escuchando el modelo:</p><p><b>${s.words.join(' · ')}</b></p><p>Trabalenguas: <b>${esc(s.twister)}</b></p>`, pairs: [] });
  runLesson({ title: s.title, exercises: ex, xp: 10, onDone: acc => { const p = P(); p.sounds[s.id] = Math.max(p.sounds[s.id] || 0, acc); save(); TAB = 'sounds'; } });
}

/* ======================= HABLA (IA + juegos de rol) ======================= */
const AI_PRESETS = {
  gemini: { name: 'Google Gemini (gratis)', model: 'gemini-flash-latest', base: '' },
  deepseek: { name: 'DeepSeek', model: 'deepseek-chat', base: 'https://api.deepseek.com' },
  openrouter: { name: 'OpenRouter', model: 'deepseek/deepseek-chat', base: 'https://openrouter.ai/api/v1' },
  groq: { name: 'Groq (gratis)', model: 'llama-3.3-70b-versatile', base: 'https://api.groq.com/openai/v1' },
  custom: { name: 'Otro (compatible OpenAI)', model: '', base: '' }
};
async function callAI(system, history) {
  const ai = DB.settings.ai;
  const preset = AI_PRESETS[ai.provider] || AI_PRESETS.custom;
  const model = ai.model || preset.model;
  if (ai.provider === 'gemini') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ai.key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] },
        contents: history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 } })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    return parts.filter(x => !x.thought).map(x => x.text || '').join('');
  }
  const base = (ai.base || preset.base).replace(/\/+$/, '');
  const r = await fetch(base + '/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ai.key },
    body: JSON.stringify({ model, temperature: 0.8, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, ...history] })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || ('HTTP ' + r.status));
  return j.choices[0].message.content;
}
function parseAI(txt) {
  try { const m = txt.match(/\{[\s\S]*\}/); const o = JSON.parse(m ? m[0] : txt); if (o.reply) return o; } catch (e) {}
  return { reply: txt.trim(), translation_es: '', correction: '', explanation_es: '' };
}
/* ======================= FAMILIA ======================= */
function myCode(p) {
  const data = { i: p.id, n: p.name, a: p.avatar, w: weekXP(p), wk: weekStart(), x: p.xp, s: liveStreak(p), l: currentLevel(p), t: Date.now() };
  return 'IEF1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function readCode(code) {
  const m = code.trim().match(/IEF1:([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error('Código no válido');
  return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
}
function viewFamily(c, p) {
  const ws = weekStart();
  const rows = [
    ...DB.profiles.map(x => ({ id: x.id, n: x.name, a: x.avatar, w: weekXP(x), s: liveStreak(x), l: currentLevel(x), local: true })),
    ...DB.family.filter(f => !DB.profiles.some(x => x.id === f.i)).map(f => ({ id: f.i, n: f.n, a: f.a, w: f.wk === ws ? f.w : 0, s: f.s, l: f.l, t: f.t }))
  ].sort((a, b) => b.w - a.w);
  const medals = ['🥇', '🥈', '🥉'];
  c.innerHTML = `<h1>🏆 Liga familiar</h1><p class="muted" style="margin-top:0">XP de esta semana (se reinicia cada lunes).</p>
    <div class="card" style="padding:6px 10px">${rows.map((r, i) => `<div class="rank ${r.id === p.id ? 'me' : ''}"><span class="pos">${medals[i] || i + 1}</span><span class="av">${r.a}</span>
      <span class="nm">${esc(r.n)}<br><small class="muted">${r.l} · 🔥${r.s}${r.local ? '' : ' · 📲 ' + new Date(r.t).toLocaleDateString()}</small></span><span class="xp">${r.w} XP</span></div>`).join('')}</div>
    <button class="btn" id="share">📤 Compartir mi progreso</button>
    <button class="btn ghost" id="addcode">📥 Agregar código de un familiar</button>
    <p class="muted" style="font-size:14px">Cada uno usa la app en su propio teléfono. Para ver a todos en la liga, compartan su código por WhatsApp y péguenlo aquí.</p>
    <h2 style="margin-top:24px">👥 Perfiles en este teléfono</h2>
    ${DB.profiles.map(x => `<button class="list-item" data-p="${x.id}"><span class="ic">${x.avatar}</span><span class="t"><b>${esc(x.name)}</b><small>${currentLevel(x)} · ⭐ ${x.xp} XP · 🔥 ${liveStreak(x)}</small></span>${x.id === p.id ? '<span class="badge g">Activo</span>' : 'Cambiar'}</button>`).join('')}
    <button class="btn ghost" id="newp">➕ Agregar persona en este teléfono</button>`;
  $$('[data-p]', c).forEach(b => b.onclick = () => { DB.current = b.dataset.p; save(); TAB = 'learn'; renderMain(); toast('¡Hola, ' + esc(P().name) + '! ' + P().avatar); });
  $('#newp', c).onclick = () => renderCreateProfile();
  $('#share', c).onclick = async () => {
    const code = myCode(p);
    const text = `🏆 ${p.name} en Inglés en Familia: ${weekXP(p)} XP esta semana, racha 🔥${liveStreak(p)}.\nPega este código en la app (Familia → Agregar código):\n${code}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Copiado. Pégalo en WhatsApp 📋'); }
    catch (e) { modal(`<h3>Copia este texto</h3><textarea class="text-in" readonly>${esc(text)}</textarea>`); }
  };
  $('#addcode', c).onclick = () => modal(`<h2>Agregar código</h2><p class="muted">Pega aquí el mensaje que te compartió tu familiar.</p>
    <textarea class="text-in" id="cd" placeholder="IEF1:..."></textarea><button class="btn" id="ok" style="margin-top:12px">Agregar</button>`, (m, close) => {
    $('#ok', m).onclick = () => {
      try {
        const d = readCode($('#cd', m).value);
        if (DB.profiles.some(x => x.id === d.i)) { toast('Ese perfil ya está en este teléfono'); return; }
        const ex = DB.family.find(f => f.i === d.i);
        if (ex) { if (d.t > ex.t) Object.assign(ex, d); } else DB.family.push(d);
        save(); close(); renderMain(); toast(`${d.a} ${esc(d.n)} agregado a la liga`);
      } catch (e) { toast('Código no válido 🤔'); }
    };
  });
}

/* ======================= PERFIL Y AJUSTES ======================= */
function viewMe(c, p) {
  const learned = Object.entries(p.items).filter(([k, v]) => k.startsWith('w:') && v.s >= 2).length;
  const phrases = Object.entries(p.items).filter(([k, v]) => k.startsWith('p:') && v.s >= 2).length;
  const mins = Math.round(Object.values(p.speak).reduce((a, b) => a + b, 0) / 60);
  const unitsDone = UNITS.filter(u => nodesDone(p, u) >= NODES.length).length;
  const s = DB.settings, ai = s.ai;
  const voices = Speech.voices;
  c.innerHTML = `<div class="row"><span style="font-size:54px">${p.avatar}</span><div><h1 style="margin:0">${esc(p.name)}</h1><span class="muted">Nivel actual: <b>${currentLevel(p)}</b> · ${unitsDone}/${UNITS.length} unidades</span></div></div>
    <div class="stats" style="margin-top:14px">
      <div class="s"><span style="font-size:26px">🔥</span><div><div class="v">${liveStreak(p)}</div><div class="k">Días de racha</div></div></div>
      <div class="s"><span style="font-size:26px">⭐</span><div><div class="v">${p.xp}</div><div class="k">XP total</div></div></div>
      <div class="s"><span style="font-size:26px">📚</span><div><div class="v">${learned}</div><div class="k">Palabras aprendidas</div></div></div>
      <div class="s"><span style="font-size:26px">💬</span><div><div class="v">${phrases}</div><div class="k">Frases dominadas</div></div></div>
      <div class="s"><span style="font-size:26px">🎤</span><div><div class="v">${mins}</div><div class="k">Minutos hablados</div></div></div>
      <div class="s"><span style="font-size:26px">📅</span><div><div class="v">${weekXP(p)}</div><div class="k">XP esta semana</div></div></div>
    </div>
    <div class="card"><h3>🎯 Meta diaria</h3><div class="seg" id="goals">${GOALS.map(([x, n, m]) => `<button data-g="${x}" class="${x === p.goal ? 'sel' : ''}">${n}<br><small>${x} XP</small></button>`).join('')}</div></div>

    <div class="card"><h3>🔊 Voz y sonido</h3>
      <label class="lbl">Voz en inglés</label>
      <select class="field" id="voice"><option value="">Automática (recomendada)</option>${voices.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select>
      <label class="lbl">Velocidad</label>
      <div class="seg" id="rate">${[[0.75, '🐢 Lenta'], [0.95, 'Normal'], [1.1, '🐇 Rápida']].map(([r, n]) => `<button data-r="${r}" class="${s.rate === r ? 'sel' : ''}">${n}</button>`).join('')}</div>
      <div class="row"><button class="btn ghost small" id="testv">Probar voz</button><button class="btn ghost small" id="testm">Probar micrófono</button></div>
      <div class="heard" id="mt"></div>
      <label class="row" style="margin-top:8px"><input type="checkbox" id="sfx" ${s.sfx ? 'checked' : ''}> Efectos de sonido</label>
      <label class="row" style="margin-top:8px"><input type="checkbox" id="chal" ${s.challenge ? 'checked' : ''}> Modo reto: ocultar el texto en inglés en los juegos de rol</label>
      <label class="lbl" style="display:block;margin-top:14px">Tema</label>
      <div class="seg" id="theme">${[['auto', 'Automático'], ['light', '☀️ Claro'], ['dark', '🌙 Oscuro']].map(([k, n]) => `<button data-t="${k}" class="${s.theme === k ? 'sel' : ''}">${n}</button>`).join('')}</div>
    </div>

    <div class="card" id="aisec"><h3>🤖 Tutor de IA (opcional)</h3>
      <p class="muted" style="font-size:14px;margin-top:0">La clave se guarda solo en este teléfono. Se comparte entre los perfiles del teléfono.</p>
      <label class="lbl">Proveedor</label>
      <select class="field" id="prov">${Object.entries(AI_PRESETS).map(([k, v]) => `<option value="${k}" ${ai.provider === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
      <label class="lbl">Clave API</label><input class="field" id="key" type="password" value="${esc(ai.key)}" placeholder="Pega tu clave aquí" autocomplete="off">
      <label class="lbl">Modelo</label><input class="field" id="model" value="${esc(ai.model)}" autocomplete="off">
      <div id="basew" class="${ai.provider === 'gemini' ? 'hidden' : ''}"><label class="lbl">URL base</label><input class="field" id="base" value="${esc(ai.base)}" placeholder="https://..." autocomplete="off"></div>
      <div class="row"><button class="btn small" id="saveai">Guardar</button><button class="btn ghost small" id="testai">Probar conexión</button></div>
      <div class="heard" id="aiout"></div>
      <details style="margin-top:8px"><summary><b>¿Cómo saco una clave gratis de Gemini?</b></summary>
        <ol class="steps"><li>Entra a <b>aistudio.google.com</b> con tu cuenta de Google.</li><li>Toca <b>Get API key</b> → <b>Create API key</b>.</li>
        <li>Copia la clave (empieza con <code>AIza...</code>) y pégala arriba.</li><li>Toca <b>Guardar</b> y luego <b>Probar conexión</b>.</li></ol>
        <p class="muted" style="font-size:13px">El plan gratuito de Google tiene un límite diario de mensajes, suficiente para practicar en familia. Puedes usar la misma clave en todos los teléfonos.</p></details>
    </div>

    <div class="card"><h3>💾 Respaldo</h3><p class="muted" style="font-size:14px;margin-top:0">Guarda el progreso de todos los perfiles de este teléfono en un archivo, por si cambias de teléfono o borras el navegador.</p>
      <div class="row"><button class="btn ghost small" id="exp">Descargar respaldo</button><button class="btn ghost small" id="imp">Restaurar</button></div></div>

    <div class="card"><h3>🗑️ Zona de cuidado</h3><button class="btn bad small" id="del">Borrar el perfil de ${esc(p.name)}</button></div>
    <p class="center muted" style="font-size:12px">Inglés en Familia · uso personal · v1.1</p>`;
  $$('#goals button', c).forEach(b => b.onclick = () => { p.goal = +b.dataset.g; save(); renderMain(); });
  $('#voice', c).onchange = e => { s.voice = e.target.value; save(); applyTheme(); Speech.speak('Hello! Nice to meet you.'); };
  $$('#rate button', c).forEach(b => b.onclick = () => { s.rate = +b.dataset.r; save(); applyTheme(); renderMain(); Speech.speak('This is my speaking speed.'); });
  $$('#theme button', c).forEach(b => b.onclick = () => { s.theme = b.dataset.t; save(); applyTheme(); renderMain(); });
  $('#sfx', c).onchange = e => { s.sfx = e.target.checked; save(); };
  $('#chal', c).onchange = e => { s.challenge = e.target.checked; save(); };
  $('#testv', c).onclick = () => Speech.speak('Hello! I am your English voice. How are you today?');
  $('#testm', c).onclick = () => {
    const out = $('#mt', c); out.textContent = 'Di algo en inglés... 👂';
    Speech.listen({ onInterim: t => out.textContent = '“' + t + '”', onResult: a => out.innerHTML = '✅ Escuché: “' + esc(a[0]) + '”', onError: e => out.innerHTML = micErrorText(e), onEnd: g => { if (!g && out.textContent.includes('👂')) out.textContent = 'No escuché nada. Intenta de nuevo.'; } });
  };
  $('#prov', c).onchange = e => {
    const pr = AI_PRESETS[e.target.value]; $('#model', c).value = pr.model; $('#base', c).value = pr.base;
    $('#basew', c).classList.toggle('hidden', e.target.value === 'gemini');
  };
  const readAI = () => { ai.provider = $('#prov', c).value; ai.key = $('#key', c).value.trim(); ai.model = $('#model', c).value.trim(); ai.base = $('#base', c).value.trim(); save(); };
  $('#saveai', c).onclick = () => { readAI(); toast('Tutor guardado ✅'); };
  $('#testai', c).onclick = async () => {
    readAI(); const out = $('#aiout', c);
    if (!ai.key) { out.textContent = 'Primero pega tu clave.'; return; }
    out.textContent = 'Probando...';
    try { const r = await callAI('Reply only with JSON {"reply":"..."}', [{ role: 'user', content: 'Say hello in 5 words.' }]); out.innerHTML = '✅ Funciona: “' + esc(parseAI(r).reply) + '”'; }
    catch (e) { out.innerHTML = '❌ ' + esc(e.message); }
  };
  $('#exp', c).onclick = exportBackup;
  $('#imp', c).onclick = importBackup;
  $('#del', c).onclick = () => modal(`<h2>¿Borrar a ${esc(p.name)}?</h2><p class="muted">Se perderá todo su progreso en este teléfono.</p>
    <button class="btn bad" data-y>Sí, borrar</button><button class="link" data-n style="width:100%">Cancelar</button>`, (m, close) => {
    $('[data-n]', m).onclick = close;
    $('[data-y]', m).onclick = () => { DB.profiles = DB.profiles.filter(x => x.id !== p.id); DB.current = DB.profiles[0] && DB.profiles[0].id; save(); close(); TAB = 'learn'; boot(); };
  });
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(DB, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ingles-familia-respaldo-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
}
function importBackup() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text());
      if (!Array.isArray(d.profiles)) throw 0;
      d.profiles.forEach(np => { const i = DB.profiles.findIndex(x => x.id === np.id); if (i >= 0) DB.profiles[i] = np; else DB.profiles.push(np); });
      if (d.settings && d.settings.ai && d.settings.ai.key && !DB.settings.ai.key) DB.settings.ai = d.settings.ai;
      DB.current = DB.current || (DB.profiles[0] && DB.profiles[0].id);
      save(); boot(); toast('Respaldo restaurado ✅');
    } catch (e) { toast('Archivo no válido'); }
  };
  inp.click();
}

/* boot() se llama al final de tutor.js */
