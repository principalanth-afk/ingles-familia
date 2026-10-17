/* =========================================================
   MÓDULO TUTOR — estilo Learna (todo en un chat con Zahra)
   pero con la lógica de Duolingo: sigue tu nivel y tu unidad,
   da XP, cuenta para la racha, la meta diaria y el repaso.
   ========================================================= */
'use strict';

const SC_LEVEL = { free: 'A1', cafe: 'A1', school: 'A1', hotel: 'A2', airport: 'A2', doctor: 'A2', interview: 'B1', supplier: 'B1',
  meeting: 'B1', call: 'A2', customer: 'A2', present: 'B1', worktalk: 'A2', email: 'B1' };
const scopeText = p => (p.scope === 'work'
  ? 'WORK / BUSINESS English: meetings, calls, emails, negotiation, importing machinery, customer service. Offer a professional tone.'
  : 'EVERYDAY English: family, home, school, food, shopping, travel, friends. Natural, casual tone.');
function scopeSwitch(p) {
  return `<div class="scopebar"><button data-scope="daily" class="${(p.scope || 'daily') === 'daily' ? 'on' : ''}">🏠 Cotidiano</button><button data-scope="work" class="${p.scope === 'work' ? 'on' : ''}">💼 Trabajo</button></div>`;
}
function wireScope(c, p) { $$('[data-scope]', c).forEach(b => b.onclick = () => { p.scope = b.dataset.scope; save(); renderMain(); }); }
const lvIdx = id => LEVELS.findIndex(l => l.id === id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function ensureTutor(p) { p.saved = p.saved || []; p.tutor = p.tutor || {}; return p; }
function greet(p) { const h = new Date().getHours(); return `${h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'}, ${p.name}!`; }

/* ======================= HUB DEL TUTOR ======================= */
function viewTutor(c, p) {
  ensureTutor(p);
  const cur = currentPos(p);
  const u = UNITS[Math.min(cur.ui, UNITS.length - 1)];
  const doneToday = p.tutorDay === dayKey();
  const mins = (p.speak[dayKey()] || 0) / 60;
  const hasAI = !!DB.settings.ai.key;
  const lv = currentLevel(p);
  const scope = p.scope || 'daily';
  const scs = SCENARIOS.filter(s => (s.scope || 'daily') === scope || s.id === 'free').sort((a, b) => lvIdx(SC_LEVEL[a.id] || 'A1') - lvIdx(SC_LEVEL[b.id] || 'A1'));
  const books = PHRASEBOOK.filter(b => b.scope === scope);
  c.innerHTML = `
  <div class="hero">
    <div class="avatar-wrap hero-av">${avatarSVG()}</div>
    <div style="flex:1;min-width:0">
      <div class="hero-say">${esc(greet(p))} ${doneToday ? 'Great job today! 🎉' : 'Ready to talk? 😊'}</div>
      <div class="hero-meta">🎤 ${mins.toFixed(1)} / 10 min de voz hoy</div>
      <div class="hero-bar"><div style="width:${Math.min(100, mins * 10)}%"></div></div>
    </div>
  </div>

  <div class="card today">
    <div class="tag">💬 CLASE DE HOY CON ZAHRA</div>
    <div class="row" style="margin-top:6px"><span style="font-size:40px">${u.icon}</span>
      <div style="flex:1"><b style="font-size:18px">${esc(u.title)}</b><br><small class="muted">Unidad ${unitIndex(u.id) + 1} · ${u.level} · ~6 min · palabras, quiz, voz y juego de rol</small></div>
      ${p.tutor[u.id] != null ? `<span class="badge g">${p.tutor[u.id]}%</span>` : ''}</div>
    <button class="btn" id="today" style="margin-top:12px">${doneToday ? 'Repetir clase' : 'Empezar clase'}</button>
    ${doneToday ? '' : `<small class="muted" style="display:block;margin-top:8px">+15 XP · sigue la misma unidad de tu camino ⭐</small>`}
  </div>

  <div style="margin-top:18px">${scopeSwitch(p)}</div>
  <h2 style="margin-top:14px">📖 Frasario ${scope === 'work' ? 'de trabajo' : 'cotidiano'}</h2>
  <p class="muted" style="margin-top:0">${books.reduce((a, b) => a + b.items.length, 0)} frases listas para usar. Escúchalas, dilas y practícalas como lección.</p>
  <div class="topic-grid">${books.map(b => `<button class="topic" data-book="${b.id}"><span class="ic">${b.icon}</span><b>${esc(b.title)}</b><small>${b.items.length} frases${p.books && p.books[b.id] != null ? ' · ' + p.books[b.id] + '%' : ''}</small></button>`).join('')}</div>
  <h2 style="margin-top:20px">🗣️ Conversar con Zahra (IA)</h2>
  ${hasAI ? `<p class="muted" style="margin-top:0">Habla de lo que quieras. Te sugiere respuestas, te enseña palabras y guarda tus correcciones.</p>
    <div class="topic-grid">${scs.map(s => { const sl = SC_LEVEL[s.id] || 'A1'; const above = lvIdx(sl) > lvIdx(lv);
      return `<button class="topic ${above ? 'above' : ''}" data-sc="${s.id}"><span class="ic">${s.icon}</span><b>${esc(s.title)}</b><small>${esc(s.desc)}</small><span class="lvb" style="background:${LEVEL[sl].color}">${sl}${above ? ' · reto' : ''}</span></button>`; }).join('')}</div>`
  : `<div class="notice"><b>Actívala gratis en 3 minutos</b><br>Con una clave gratuita de Google Gemini, Zahra conversa contigo por voz sobre cualquier tema. La clase diaria de arriba funciona sin clave.
      <button class="btn small" id="setai" style="margin-top:10px">Configurar tutor</button></div>`}

  <div class="card" style="margin-top:16px">
    <div class="row"><span style="font-size:28px">⭐</span><div style="flex:1"><b>Mis correcciones guardadas</b><br><small class="muted">${p.saved.length ? p.saved.length + ' frases para repasar' : 'Cuando Zahra te corrija, toca ⭐ Guardar'}</small></div></div>
    ${p.saved.length ? `<div class="row" style="margin-top:10px"><button class="btn small" id="rev" ${p.saved.length < 3 ? 'disabled' : ''}>Repasar</button><button class="btn ghost small" id="seesaved">Ver lista</button></div>` : ''}
  </div>

  <h2 style="margin-top:20px">📚 Clases por unidad</h2>
  <p class="muted" style="margin-top:0">Se desbloquean a medida que avanzas en el camino.</p>
  <div class="unit-tiles">${UNITS.map((x, i) => { const unl = i <= cur.ui; const sc = p.tutor[x.id];
    return `<button class="utile ${unl ? '' : 'locked'}" data-gu="${x.id}"><span>${unl ? x.icon : '🔒'}</span><small>U${i + 1} · ${x.level}</small>${sc != null ? `<em>${sc}%</em>` : ''}</button>`; }).join('')}</div>

  <details class="card" style="margin-top:16px"><summary><b>🎭 Juegos de rol (diálogos completos)</b></summary>
    ${LEVELS.map(l => `<h3 style="color:${l.color}">${l.id} · ${l.name}</h3>` + UNITS.filter(x => x.level === l.id).map(x =>
      `<button class="list-item" data-dl="${x.id}"><span class="ic">${x.icon}</span><span class="t"><b>${esc(x.dialogue.title)}</b><small>${esc(x.dialogue.scene)}</small></span>›</button>`).join('')).join('')}
  </details>`;
  $('#today', c).onclick = () => startGuidedChat(u);
  wireScope(c, p);
  $$('[data-book]', c).forEach(b => b.onclick = () => showBook(PHRASEBOOK.find(x => x.id === b.dataset.book)));
  $$('[data-gu]', c).forEach(b => b.onclick = () => {
    if (b.classList.contains('locked')) return toast('🔒 Avanza en el camino para desbloquear esta clase');
    startGuidedChat(UNITS.find(x => x.id === b.dataset.gu));
  });
  $$('[data-sc]', c).forEach(b => b.onclick = () => startChat(SCENARIOS.find(s => s.id === b.dataset.sc)));
  $$('[data-dl]', c).forEach(b => b.onclick = () => startDialogue(UNITS.find(x => x.id === b.dataset.dl), { xp: 10 }));
  const s = $('#setai', c); if (s) s.onclick = () => { TAB = 'me'; renderMain(); setTimeout(() => $('#aisec') && $('#aisec').scrollIntoView({ behavior: 'smooth' }), 50); };
  const r = $('#rev', c); if (r) r.onclick = startSavedReview;
  const sv = $('#seesaved', c); if (sv) sv.onclick = showSaved;
}

/* ======================= KIT DE CHAT ======================= */
function chatShell(title, subtitle) {
  app.innerHTML = `<div class="screen" style="height:100dvh">
    <div class="lesson-top" style="border-bottom:2px solid var(--line)"><button class="x" id="quit">✕</button>
      <div class="avatar-wrap" style="width:46px;height:46px;flex:none">${avatarSVG().replace('class="avatar"', 'class="avatar" style="width:46px;height:46px"')}</div>
      <div style="flex:1;min-width:0"><b>Zahra 🤖</b><br><small class="muted">${subtitle}</small></div>
      <button class="chip" id="trt" title="Traducción">🇪🇸</button><button class="chip" id="spk" title="Voz automática">🔊</button></div>
    <div class="pbar thin hidden" id="cpb"><div style="width:0%"></div></div>
    <div class="chat" id="chat"></div>
    <div class="chat-bar"><textarea id="txt" rows="1" placeholder="Habla o escribe..."></textarea>
      ${Speech.supported() ? `<button class="mic" id="mic">🎤</button>` : ''}<button class="send" id="send">➤</button></div></div>`;
  const p = P();
  const K = {
    chat: $('#chat'), txt: $('#txt'), mic: $('#mic'), send: $('#send'),
    showTr: ['A1', 'A2'].includes(currentLevel(p)), autoSpeak: true, closed: false, onInput: null
  };
  const setChips = () => { $('#trt').style.opacity = K.showTr ? 1 : 0.4; $('#spk').style.opacity = K.autoSpeak ? 1 : 0.4; };
  setChips();
  $('#trt').onclick = () => { K.showTr = !K.showTr; setChips(); $$('.tr', K.chat).forEach(e => e.classList.toggle('hidden', !K.showTr)); };
  $('#spk').onclick = () => { K.autoSpeak = !K.autoSpeak; setChips(); if (!K.autoSpeak && window.speechSynthesis) speechSynthesis.cancel(); };
  K.scroll = () => { K.chat.scrollTop = K.chat.scrollHeight; };
  K.progress = f => { const b = $('#cpb'); b.classList.remove('hidden'); b.firstElementChild.style.width = Math.round(f * 100) + '%'; };
  K.typing = async (ms = 550) => {
    const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<span></span><span></span><span></span>';
    K.chat.appendChild(t); K.scroll(); await sleep(ms); t.remove();
  };
  K.bot = async (en, es, opt = {}) => {
    if (K.closed) return;
    if (!opt.instant) await K.typing(Math.min(900, 300 + (en || es || '').length * 8));
    const el = document.createElement('div'); el.className = 'msg bot';
    el.innerHTML = en ? `${esc(en)}${es ? `<div class="tr ${K.showTr ? '' : 'hidden'}">${esc(es)}</div>` : ''}
      <div class="acts"><button data-a="say">🔊</button><button data-a="slow">🐢</button></div>` : `<span class="es-only">${esc(es)}</span>`;
    if (en) { $('[data-a="say"]', el).onclick = () => Speech.speak(en); $('[data-a="slow"]', el).onclick = () => Speech.speak(en, { slow: true }); }
    K.chat.appendChild(el); K.scroll();
    if (en && K.autoSpeak && !opt.silent) await Speech.speak(en);
    return el;
  };
  K.me = html => { const el = document.createElement('div'); el.className = 'msg me'; el.innerHTML = html; K.chat.appendChild(el); K.scroll(); return el; };
  K.card = html => { const el = document.createElement('div'); el.className = 'ccard'; el.innerHTML = html; K.chat.appendChild(el); K.scroll(); return el; };
  K.chips = (labels, echo = true) => new Promise(res => {
    const box = document.createElement('div'); box.className = 'chips';
    box.innerHTML = labels.map((l, i) => `<button class="chip-btn" data-i="${i}">${esc(l)}</button>`).join('');
    K.chat.appendChild(box); K.scroll();
    $$('button', box).forEach(b => b.onclick = () => { box.remove(); const l = labels[+b.dataset.i]; if (echo) K.me(esc(l)); res(l); });
  });
  K.choice = (options, opts = {}) => new Promise(res => {
    const el = K.card(`<div class="opts">${options.map((o, i) => `<button class="opt" data-i="${i}"><span class="n">${i + 1}</span>${esc(o)}</button>`).join('')}</div>`);
    K.input('off', 'Elige una opción ↑');
    $$('.opt', el).forEach(b => b.onclick = () => {
      const v = options[+b.dataset.i];
      if (opts.speakOpts) Speech.speak(v);
      $$('.opt', el).forEach(x => { x.disabled = true; const o = options[+x.dataset.i]; if (o === opts.answer) x.classList.add('right'); else if (o === v) x.classList.add('wrong'); });
      res(v);
    });
  });
  /* Modo de la barra: 'off' | 'free' (chat IA) | 'speak' (evaluado) */
  K.input = (mode, ph) => {
    const off = mode === 'off';
    K.txt.disabled = off; K.send.disabled = off; if (K.mic) K.mic.disabled = off;
    K.txt.placeholder = ph || (off ? '...' : 'Habla o escribe...');
  };
  K.submit = text => { if (K.onInput && text.trim()) K.onInput(text.trim()); };
  K.send.onclick = () => { const t = K.txt.value; K.txt.value = ''; K.submit(t); };
  K.txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); K.send.click(); } });
  if (K.mic) K.mic.onclick = () => {
    if (Speech.isActive()) return Speech.stop();
    if (window.speechSynthesis) speechSynthesis.cancel();
    K.mic.classList.add('on'); const ph = K.txt.placeholder; K.txt.placeholder = 'Te escucho... 👂';
    Speech.listen({
      onInterim: t => K.txt.value = t,
      onResult: alts => { K.txt.value = ''; K.lastAlts = alts; K.submit(alts[0]); },
      onError: e => { K.mic.classList.remove('on'); toast(micErrorText(e), 4000); },
      onEnd: () => { K.mic.classList.remove('on'); K.txt.placeholder = ph; }
    });
  };
  /* Pide que el usuario diga una frase y la evalúa (estilo ELSA dentro del chat) */
  K.speech = (target, opt = {}) => new Promise(res => {
    let tries = 0;
    const max = opt.tries || 3, pass = opt.pass || 70;
    const tc = K.card(`<div class="ttl">${opt.hide ? '🗣️ DILO EN INGLÉS' : '🗣️ TU TURNO · LEE EN VOZ ALTA'}</div>
      ${opt.es ? `<div class="muted" style="font-weight:700">${esc(opt.es)}</div>` : ''}
      <div class="target ${opt.hide ? 'hidden' : ''}" style="font-size:21px">${esc(target)}</div>
      <div class="row" style="gap:8px;margin-top:6px">${opt.hide ? `<button class="chip-btn sm" data-h>💡 Pista</button>` : `<button class="mini-aud" data-p style="width:38px;height:38px">🔊</button><button class="mini-aud" data-s style="width:38px;height:38px;background:var(--purple);box-shadow:0 3px 0 #7a3fc4">🐢</button>`}
      <div class="spacer"></div><button class="chip-btn sm ghosty" data-k>Saltar</button></div>`);
    const hb = $('[data-h]', tc); if (hb) hb.onclick = () => { $('.target', tc).classList.remove('hidden'); hb.remove(); Speech.speak(target); };
    const pb = $('[data-p]', tc); if (pb) pb.onclick = () => Speech.speak(target);
    const sb = $('[data-s]', tc); if (sb) sb.onclick = () => Speech.speak(target, { slow: true });
    K.input('speak', Speech.supported() ? 'Toca 🎤 y habla (o escribe)' : 'Escribe la frase en inglés');
    const done = r => { K.onInput = null; $('[data-k]', tc) && $('[data-k]', tc).remove(); K.input('off'); res(r); };
    $('[data-k]', tc).onclick = () => { Speech.stop(); K.me('<i>(saltado)</i>'); done({ score: 0, pass: false, skipped: true }); };
    K.onInput = async text => {
      const r = Speech.evaluate(target, K.lastAlts && K.lastAlts[0] === text ? K.lastAlts : [text]);
      K.lastAlts = null; tries++;
      const ok = r.score >= pass;
      K.me(`<div class="target sm">${r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ')}</div>
        <div class="heardline">“${esc(text)}” · <b>${r.score}%</b></div>`);
      if (ok) { sfxOk(); return done({ score: r.score, pass: true }); }
      sfxBad();
      if (tries >= max) { await K.bot(`Good effort! It's: "${target}". Keep practicing! 💪`, `¡Buen intento! Se dice así. ¡Sigue practicando!`); return done({ score: r.score, pass: false }); }
      const tips = Speech.tipsFor(r.words.filter(w => !w.ok).map(w => w.w));
      await K.bot('Almost! Listen and try again.', 'Casi! Escucha y repite.', { silent: true });
      if (tips.length) K.card(`<div class="tipbox" style="margin:0">${tips.join('<br>')}</div>`);
      if (opt.hide) $('.target', tc).classList.remove('hidden');
      await Speech.speak(target, { slow: true });
    };
  });
  return K;
}

/* ======================= CLASE GUIADA (sin IA) ======================= */
function startGuidedChat(u) {
  const p = ensureTutor(P());
  const K = chatShell(u.title, `${u.icon} Clase · ${esc(u.title)}`);
  K.input('off');
  let pts = 0, max = 0;
  const steps = 4 + 3 + 2 + 1 + u.dialogue.lines.filter(l => l.you).length;
  let st = 0; const tick = () => K.progress(++st / steps);
  $('#quit').onclick = () => {
    modal(`<div class="center">${MASCOT}<h2>¿Salir de la clase?</h2><p class="muted">Perderás el progreso de esta clase.</p>
      <button class="btn" data-k>Seguir con Zahra</button><button class="link" data-q style="width:100%;color:var(--bad)">Salir</button></div>`, (m, close) => {
      $('[data-k]', m).onclick = close; $('[data-q]', m).onclick = () => { close(); K.closed = true; Speech.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); TAB = 'classes'; renderMain(); };
    });
  };
  const ws = unitWords(u), ps = unitPhrases(u);
  const lvl = it => (p.items[it.key] ? p.items[it.key].s : -1);
  const words = shuffle(ws).sort((a, b) => lvl(a) - lvl(b)).slice(0, 4); // prioriza las que menos sabes
  const phrases = shuffle(ps);
  (async () => {
    await K.bot(`Hi ${p.name}! 👋 Let's practice together.`, `¡Hola ${p.name}! Hoy practicamos: ${u.title}.`);
    K.card(`<div class="ttl">📖 TIP RÁPIDO · ${esc(u.grammar.title)}</div><details><summary class="muted">Ver la mini-guía</summary><div class="gram">${u.grammar.html}</div></details>`);
    await K.chips(['¡Vamos! 🚀']);
    // 1) Palabras
    await K.bot('First, four useful words. Tap them to listen.', 'Primero, cuatro palabras útiles. Tócalas para escucharlas.');
    const vc = K.card(`<div class="ttl">✨ PALABRAS DE HOY</div><div class="vocab">${words.map(w => `<button class="vcard" data-say="${esc(w.en)}"><b>${esc(w.en)}</b><small>${esc(w.es)}</small><span>🔊</span></button>`).join('')}</div>`);
    $$('[data-say]', vc).forEach(b => b.onclick = () => Speech.speak(b.dataset.say));
    for (const w of words) { await Speech.speak(w.en); tick(); }
    await K.chips(['¡Listo! 👍']);
    // 2) Mini quiz
    await K.bot("Quick quiz! Let's see what you remember.", '¡Mini quiz! A ver qué recuerdas.');
    const qs = [G.mcEnEs(words[0], ws), G.listenMc(words[1], ws), G.mcEsEn(words[2], ws)];
    for (const q of qs) {
      if (q.audio) await K.bot('What did I say? 👂', '¿Qué dije?', { silent: true }), await Speech.speak(q.audio);
      else if (q.say) await K.bot(`What does "${q.say}" mean?`, `¿Qué significa "${q.say}"?`);
      else await K.bot('How do you say this in English?', `¿Cómo se dice "${words[2].es}" en inglés?`);
      const a = await K.choice(q.options, { answer: q.answer, speakOpts: !!q.audioOpts });
      K.me(esc(a)); max++;
      const ok = a === q.answer; markItem(q.key, ok);
      if (ok) { pts++; sfxOk(); await K.bot(pick(['Correct! 🎉', 'Exactly! ✨', 'Nice! 👏', 'Perfect! 💯']), null, { instant: true }); }
      else { sfxBad(); await K.bot(`Not quite. It's "${q.answer}".`, `No exactamente. La respuesta es "${q.answer}".`); }
      tick();
    }
    // 3) Pronunciación
    await K.bot('Now you speak! Read this out loud.', '¡Ahora hablas tú! Lee esto en voz alta.');
    for (const ph of phrases.slice(0, 2)) {
      const r = await K.speech(ph.en, { es: ph.es });
      max++; pts += r.score / 100; markItem(ph.key, r.pass); tick();
      if (r.pass) await K.bot(pick(['Great pronunciation! 🔥', 'I understood you perfectly!', 'Wow, very clear! 👏']), null, { instant: true });
    }
    // 4) Reto: traducir hablando
    const ch = phrases[2];
    await K.bot("Challenge! Say this in English, without reading it.", '¡Reto! Dilo en inglés sin leerlo.');
    const rc = await K.speech(ch.en, { es: ch.es, hide: true, pass: 60 });
    max++; pts += rc.score / 100; markItem(ch.key, rc.pass); tick();
    if (rc.pass) await K.bot('Amazing! You got it! 🏆', '¡Increíble! ¡Lo lograste!');
    // 5) Juego de rol
    const d = u.dialogue;
    await K.bot("Now let's role-play!", `¡Ahora un juego de rol! ${d.scene}`);
    for (const l of d.lines) {
      if (l.bot) await K.bot(l.bot, l.es);
      else {
        const r = await K.speech(l.you, { es: l.es, pass: 60, hide: DB.settings.challenge });
        max++; pts += r.score / 100; tick();
      }
    }
    // 6) Resumen
    const score = Math.round(pts / Math.max(1, max) * 100);
    const xp = 15 + (score >= 90 ? 5 : 0);
    addXP(xp);
    p.tutor[u.id] = Math.max(p.tutor[u.id] || 0, score); p.tutorDay = dayKey(); save();
    K.progress(1); sfxWin(); confetti();
    await K.bot(score >= 80 ? 'Fantastic class! See you tomorrow! 🌟' : 'Good job! Practice makes perfect. See you tomorrow! 💪',
      score >= 80 ? '¡Clase fantástica! ¡Nos vemos mañana!' : '¡Buen trabajo! La práctica hace al maestro. ¡Hasta mañana!');
    K.card(`<div class="ttl">📊 RESUMEN DE LA CLASE</div><div class="sum">
      <div><b>⭐ ${xp}</b><small>XP</small></div><div><b>🎯 ${score}%</b><small>Puntaje</small></div><div><b>🔥 ${liveStreak(p)}</b><small>Racha</small></div></div>
      <small class="muted">${todayXP(p) >= p.goal ? '🎯 ¡Meta diaria cumplida!' : `Te faltan ${p.goal - todayXP(p)} XP para tu meta de hoy`}</small>`);
    const opts = ['Ir al camino ⭐', 'Volver al Tutor'];
    if (DB.settings.ai.key) opts.splice(1, 0, 'Charla libre 🤖');
    const go = await K.chips(opts, false);
    K.closed = true;
    if (go.startsWith('Ir')) { TAB = 'learn'; renderMain(); }
    else if (go.startsWith('Charla')) startChat(SCENARIOS[0]);
    else { TAB = 'classes'; renderMain(); }
  })();
}

/* ======================= CHARLA LIBRE CON IA ======================= */
function systemPrompt(sc) {
  const p = P(), lv = currentLevel(p);
  return `You are "Zahra", a friendly robot English tutor inside a family app (cheerful, patient, fluent in American English and Venezuelan Spanish). The learner (${p.name}) is a native Spanish speaker from Venezuela. Learner's CEFR level: ${lv} (${LEVEL[lv].name}).
Focus: ${scopeText(p)}
Scenario: ${sc.prompt}
Rules:
- Write "reply" ONLY in English. Keep it short: 1 to 3 sentences (max ~35 words). Use vocabulary and grammar appropriate for ${lv}${lv === 'A1' || lv === 'A2' ? ', very simple' : ''}.
- Always keep the conversation going with one simple question.
- The learner usually speaks by voice, so ignore punctuation, capitalization and small transcription glitches.
- If the learner's last message has a real grammar or vocabulary mistake, or uses Spanish, put a corrected natural English version in "correction" and a very short explanation in Spanish in "explanation_es". Otherwise use empty strings.
- "translation_es": natural Spanish translation of your reply.
- "suggestions": 2 short possible answers the learner could say next, in English, at their level (max 10 words each).
- "new_word": if your reply uses a useful word the learner may not know, give {"en":"word","es":"traducción"}; otherwise {"en":"","es":""}.
- Be encouraging. Never be rude. Keep content family-friendly.
Respond ONLY with valid JSON: {"reply":"...","translation_es":"...","correction":"...","explanation_es":"...","suggestions":["...","..."],"new_word":{"en":"","es":""}}`;
}
function startChat(sc) {
  const p = ensureTutor(P());
  const K = chatShell(sc.title, `${sc.icon} ${esc(sc.title)} · ${currentLevel(p)}`);
  const hist = [];
  let busy = false, sent = 0, fixes = 0, words = 0, saved = 0;
  const speak0 = p.speak[dayKey()] || 0, t0 = Date.now();
  K.input('free');
  const finish = () => {
    K.closed = true; Speech.stop(); if (window.speechSynthesis) speechSynthesis.cancel();
    if (!sent) { TAB = 'classes'; return renderMain(); }
    const xp = Math.min(30, sent * 2 + saved);
    addXP(xp);
    const voice = ((p.speak[dayKey()] || 0) - speak0) / 60, mins = (Date.now() - t0) / 60000;
    showDone({ title: '¡Buena charla! 💬', xp, acc: null, time: `${Math.floor(mins)}:${pad(Math.round((mins % 1) * 60))}`,
      extra: `<div class="card" style="text-align:left;min-width:260px">💬 Mensajes: <b>${sent}</b><br>🎤 Minutos de voz: <b>${voice.toFixed(1)}</b><br>✏️ Correcciones: <b>${fixes}</b> (${saved} guardadas)<br>✨ Palabras nuevas: <b>${words}</b></div>`,
      onBtn: () => { TAB = 'classes'; renderMain(); } });
  };
  $('#quit').onclick = finish;
  const saveBtn = (en, es, from) => `<button class="chip-btn sm" data-save data-en="${esc(en)}" data-es="${esc(es || '')}" data-from="${esc(from || '')}">⭐ Guardar</button>`;
  K.chat.addEventListener('click', e => {
    const b = e.target.closest('[data-save]'); if (!b) return;
    if (!p.saved.some(x => x.en === b.dataset.en)) { p.saved.push({ en: b.dataset.en, es: b.dataset.es, from: b.dataset.from, d: dayKey() }); saved++; save(); }
    b.textContent = '✅ Guardada'; b.disabled = true;
  });
  async function send(text, hidden) {
    if (busy || K.closed) return;
    busy = true;
    $$('.chips.sug').forEach(x => x.remove());
    let meEl = null;
    if (!hidden) { meEl = K.me(esc(text)); sent++; }
    hist.push({ role: 'user', content: text });
    const ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<span></span><span></span><span></span>'; K.chat.appendChild(ty); K.scroll();
    try {
      const o = parseAI(await callAI(systemPrompt(sc), hist));
      ty.remove();
      if (K.closed) return;
      hist.push({ role: 'assistant', content: JSON.stringify({ reply: o.reply }) });
      if (meEl && o.correction && Speech.norm(o.correction).join(' ') !== Speech.norm(text).join(' ')) {
        fixes++;
        const fx = K.card(`<div class="ttl">✏️ MEJOR DI</div><div style="font-weight:800;font-size:17px">${esc(o.correction)}</div>
          ${o.explanation_es ? `<small class="muted">${esc(o.explanation_es)}</small>` : ''}
          <div class="row" style="gap:8px;margin-top:8px"><button class="mini-aud" data-p style="width:36px;height:36px">🔊</button>${saveBtn(o.correction, o.explanation_es, text)}</div>`);
        fx.classList.add('fixcard');
        $('[data-p]', fx).onclick = () => Speech.speak(o.correction);
      }
      await K.bot(o.reply, o.translation_es || '', { instant: true });
      const nw = o.new_word || {};
      if (nw.en && nw.es) {
        words++;
        const wc = K.card(`<div class="row" style="gap:10px"><span style="font-size:22px">✨</span><div style="flex:1"><small class="muted">PALABRA NUEVA</small><br><b>${esc(nw.en)}</b> — ${esc(nw.es)}</div>
          <button class="mini-aud" data-p style="width:36px;height:36px">🔊</button>${saveBtn(nw.en, nw.es, 'palabra')}</div>`);
        $('[data-p]', wc).onclick = () => Speech.speak(nw.en);
      }
      const sug = (o.suggestions || []).filter(Boolean).slice(0, 2);
      if (sug.length) {
        const box = document.createElement('div'); box.className = 'chips sug';
        box.innerHTML = `<small class="muted" style="width:100%;text-align:right">💡 Ideas para responder (tócala y luego dila con 🎤):</small>` + sug.map((s, i) => `<button class="chip-btn" data-i="${i}">${esc(s)}</button>`).join('');
        $$('button', box).forEach(b => b.onclick = () => { const s = sug[+b.dataset.i]; K.txt.value = s; Speech.speak(s); });
        K.chat.appendChild(box); K.scroll();
      }
    } catch (e) {
      ty.remove(); hist.pop();
      K.card(`⚠️ No pude responder: <small>${esc(e.message)}</small><br><small class="muted">Revisa tu internet o la clave en Perfil → Tutor de IA.</small>`);
    }
    busy = false;
  }
  K.onInput = text => send(text);
  send('Start the conversation now with a short friendly greeting that fits the scenario.', true);
}

/* ======================= CORRECCIONES GUARDADAS ======================= */
function startSavedReview() {
  const p = ensureTutor(P());
  const items = shuffle(p.saved).slice(0, 8).map(s => ({ en: s.en, es: s.es || '', key: null }));
  const ex = [];
  items.forEach((it, i) => {
    const multi = it.en.split(/\s+/).length > 1;
    if (i % 2 === 0 && speakAllowed()) ex.push(G.speak(it));
    else if (multi) { const b = G.build(it, items, true); b.es = it.es; ex.push(b); }
    else ex.push(G.speak(it));
  });
  runLesson({ title: 'Mis correcciones', exercises: ex, xp: 10 });
}
function showSaved() {
  const p = ensureTutor(P());
  modal(`<h2>⭐ Mis correcciones</h2><p class="muted">Frases que Zahra te corrigió y palabras nuevas que guardaste.</p>
    <table>${p.saved.map((s, i) => `<tr><td><button class="mini-aud" data-say="${esc(s.en)}" style="width:34px;height:34px;font-size:15px">🔊</button></td>
      <td><b>${esc(s.en)}</b>${s.es ? `<br><small class="muted">${esc(s.es)}</small>` : ''}${s.from && s.from !== 'palabra' ? `<br><small style="color:var(--bad)">Dijiste: ${esc(s.from)}</small>` : ''}</td>
      <td><button class="x" data-del="${i}" style="font-size:18px">✕</button></td></tr>`).join('')}</table>
    <button class="btn" data-close style="margin-top:10px">Cerrar</button>`, (m, close) => {
    $$('[data-say]', m).forEach(b => b.onclick = () => Speech.speak(b.dataset.say));
    $$('[data-del]', m).forEach(b => b.onclick = () => { p.saved.splice(+b.dataset.del, 1); save(); close(); renderMain(); showSaved(); });
    $('[data-close]', m).onclick = () => { close(); renderMain(); };
  });
}

/* ======================= DIÁLOGOS (modo Lecciones) ======================= */
function viewDialogs(c, p) {
  c.innerHTML = `<h1>🎭 Diálogos</h1><p class="muted" style="margin-top:0">Juegos de rol con Zahra: ella dice su parte y tú respondes en voz alta. No necesitan clave de IA.</p>
    ${LEVELS.map(l => `<h3 style="color:${l.color}">${l.id} · ${l.name}</h3>` + UNITS.filter(x => x.level === l.id).map(x => {
      const unl = unitIndex(x.id) <= currentPos(p).ui;
      return `<button class="list-item" data-dl="${x.id}" style="${unl ? '' : 'opacity:.55'}"><span class="ic">${unl ? x.icon : '🔒'}</span><span class="t"><b>${esc(x.dialogue.title)}</b><small>${esc(x.dialogue.scene)}</small></span>›</button>`; }).join('')).join('')}`;
  $$('[data-dl]', c).forEach(b => b.onclick = () => startDialogue(UNITS.find(x => x.id === b.dataset.dl), { xp: 10 }));
}

/* ======================= FRASARIO ======================= */
function showBook(book) {
  const p = ensureTutor(P());
  modal(`<h2>${book.icon} ${esc(book.title)}</h2><p class="muted">Toca 🔊 para escuchar, 🎤 para decirla y ⭐ para guardarla.</p>
    <button class="btn" data-prac style="margin-bottom:12px">Practicar como lección (+10 XP)</button>
    <div class="book">${book.items.map(([en, es], i) => `<div class="bk-row"><div class="bk-t"><b>${esc(en)}</b><small>${esc(es)}</small><div class="bk-res" id="bk${i}"></div></div>
      <button class="mini-aud" data-say="${i}">🔊</button><button class="mini-aud mic-sm" data-mic="${i}">🎤</button><button class="star" data-star="${i}">${p.saved.some(x => x.en === en) ? '⭐' : '☆'}</button></div>`).join('')}</div>
    <button class="btn ghost" data-close style="margin-top:12px">Cerrar</button>`, (m, close) => {
    $$('[data-say]', m).forEach(b => b.onclick = () => Speech.speak(book.items[+b.dataset.say][0]));
    $$('[data-star]', m).forEach(b => b.onclick = () => {
      const [en, es] = book.items[+b.dataset.star];
      const i = p.saved.findIndex(x => x.en === en);
      if (i >= 0) { p.saved.splice(i, 1); b.textContent = '☆'; } else { p.saved.push({ en, es, from: 'frasario', d: dayKey() }); b.textContent = '⭐'; }
      save();
    });
    $$('[data-mic]', m).forEach(b => b.onclick = () => {
      const i = +b.dataset.mic, en = book.items[i][0], out = $('#bk' + i, m);
      if (!Speech.supported()) { out.innerHTML = '<small>Tu navegador no reconoce voz. Usa Chrome.</small>'; return; }
      b.classList.add('on'); out.innerHTML = '<small>Te escucho... 👂</small>';
      Speech.listen({
        onResult: alts => {
          const r = Speech.evaluate(en, alts);
          out.innerHTML = `<div class="target sm">${r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ')}</div><small><b>${r.score}%</b> · “${esc(r.heard)}”</small>`;
          if (r.score >= 70) { sfxOk(); addXP(1); } else sfxBad();
        },
        onError: e => { out.innerHTML = '<small>' + micErrorText(e) + '</small>'; },
        onEnd: () => b.classList.remove('on')
      });
    });
    $('[data-prac]', m).onclick = () => { close(); startBookLesson(book); };
    $('[data-close]', m).onclick = () => { close(); renderMain(); };
  });
}
function startBookLesson(book) {
  const items = book.items.map(([en, es]) => ({ en, es, key: null }));
  const pick8 = shuffle(items).slice(0, 8), ex = [];
  pick8.forEach((it, i) => {
    const t = i % 4;
    if (t === 0) ex.push(G.mcEnEs(it, items));
    else if (t === 1) { const b = G.build(it, items); b.key = null; ex.push(b); }
    else if (t === 2) ex.push(maybeSpeak(it, G.build(it, items, true)));
    else ex.push(G.mcEsEn(it, items));
  });
  ex.forEach(e => e.key = null);
  runLesson({ title: book.title, exercises: ex, xp: 10, onDone: acc => { const p = P(); p.books = p.books || {}; p.books[book.id] = Math.max(p.books[book.id] || 0, acc); save(); } });
}
