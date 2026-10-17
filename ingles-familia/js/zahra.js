/* =========================================================
   MODO ZAHRA — "Pregúntale a Zahra" (estilo Learna)
   ¿Cómo se dice...? · ¿Cómo se pronuncia...? · ¿Qué significa...?
   Dilo tú y Zahra te corrige. Funciona sin IA (frasario + curso
   + traductor gratuito) y mejor con IA (Gemini u otro).
   ========================================================= */
'use strict';

/* ---------- índice offline (frasario + curso) ---------- */
const nES = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[¿?¡!.,;:"'“”‘’()«»]/g, ' ').replace(/\s+/g, ' ').trim();
const ZIDX = (() => {
  const es = [], en = [];
  const add = (e, s, src) => {
    String(s).split('/').map(x => x.trim()).filter(Boolean).forEach(v => es.push({ k: nES(v), t: new Set(nES(v).split(' ')), en: e, es: s, src }));
    en.push({ k: nES(e), t: new Set(nES(e).split(' ')), en: e, es: s, src });
  };
  PHRASEBOOK.forEach(b => b.items.forEach(([e, s]) => add(e, s, b.title)));
  UNITS.forEach(u => { u.words.forEach(([e, s]) => add(e, s, u.title)); u.phrases.forEach(([e, s]) => add(e, s, u.title)); });
  return { es, en };
})();
function lookup(list, q) {
  const k = nES(q); if (!k) return null;
  const exact = list.find(x => x.k === k); if (exact) return exact;
  const qt = new Set(k.split(' '));
  let best = null, bs = 0;
  list.forEach(x => {
    let inter = 0; qt.forEach(w => { if (x.t.has(w)) inter++; });
    const j = inter / (qt.size + x.t.size - inter);
    if (j > bs) { bs = j; best = x; }
  });
  return bs >= 0.72 ? best : null;
}
async function freeTranslate(text, pair) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`, { signal: ctl.signal });
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (!t || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(t)) return null;
    const ta = document.createElement('textarea'); ta.innerHTML = t; return ta.value;
  } catch (e) { return null; } finally { clearTimeout(tm); }
}

/* ---------- entender la pregunta ---------- */
const EN_WORDS = new Set('the a an is are am was were be you i he she it we they my your his her our their this that what how where when why who do does did have has can could would should will to of in on at for with and or but not no yes please thank thanks hello hi good morning today tomorrow like want need go going get make let me'.split(' '));
const ES_WORDS = new Set('el la los las un una de que y en es son mi tu su yo por para como con no si se lo le me te nos del al esta este eso pero muy mas quiero tengo hay donde cuando porque gracias hola buenos dias hoy manana'.split(' '));
function looksEnglish(t) {
  if (/[ñáéíóú¿¡]/i.test(t)) return false;
  const w = nES(t).split(' ');
  let en = 0, es = 0; w.forEach(x => { if (EN_WORDS.has(x)) en++; if (ES_WORDS.has(x)) es++; });
  return en > es || (en === es && en > 0);
}
function clean(x) { return x.replace(/^[\s¿"“'‘:]+|[\s?"”'’.:!]+$/g, '').replace(/\s+en\s+ingl[eé]s$/i, '').replace(/^(?:la\s+(?:palabra|frase)\s+)/i, '').replace(/^[\s"“'‘]+|[\s"”'’]+$/g, '').trim(); }
function parseAsk(text) {
  const t = text.trim().replace(/^[¿\s]+/, '');
  let m;
  if ((m = t.match(/^(?:y\s+)?c[oó]mo\s+se\s+pronuncia\s+(.+)$/i))) return { kind: 'pron', q: clean(m[1]) };
  if ((m = t.match(/^(?:y\s+)?qu[eé]\s+(?:significa|quiere\s+decir)\s+(.+)$/i))) return { kind: 'mean', q: clean(m[1]) };
  if ((m = t.match(/^(?:y\s+)?c[oó]mo\s+(?:se\s+)?(?:dice|digo|dir[ií]a|escribe|traduce)\s+(?:en\s+ingl[eé]s\s+)?(.+)$/i))) return { kind: 'say', q: clean(m[1]) };
  if ((m = t.match(/^(?:trad[uú]ceme|traduce|traducir|traducci[oó]n\s+de)\s+(.+)$/i))) return { kind: 'say', q: clean(m[1]) };
  if (looksEnglish(t)) return { kind: 'english', q: t };
  return { kind: 'say', q: clean(t) };
}

/* ---------- IA ---------- */
function zahraPrompt(p) {
  const lv = currentLevel(p);
  return `You are "Zahra", a cheerful, patient robot English tutor inside a family app. You speak fluent American English and Venezuelan Spanish. Learner: ${p.name}, native Spanish speaker from Venezuela, CEFR level ${lv}.
Focus: ${scopeText(p)}
The learner may: (a) ask in Spanish how to say something in English; (b) ask how to pronounce something, or what an English word/phrase means, or a grammar/usage question; (c) write or speak in English to practice conversation.
Respond ONLY with valid JSON, exactly one of these shapes:
(a) {"type":"say","en":"the most natural English for what they want to say","alts":["up to 2 alternatives, e.g. more formal / more casual"],"pron_es":"approximate pronunciation written with Spanish spelling, e.g. 'jáu ar iú'","tip_es":"one short useful tip in Spanish (tricky sound, usage, or when to use it) or empty","intro_es":"very short friendly intro in Spanish (max 10 words)"}
(b) {"type":"explain","text_es":"clear explanation in Spanish, max 60 words","examples":[{"en":"...","es":"..."}],"pron_es":"if they asked about pronunciation, Spanish-spelling pronunciation of the word/phrase, else empty"}
(c) {"type":"chat","reply":"short natural English reply (max 30 words) ending with a simple question, level ${lv}","translation_es":"Spanish translation of reply","correction":"natural corrected version of the learner's English if it had a real mistake, else empty","explanation_es":"very short Spanish explanation of the correction, else empty"}
Voice transcripts may lack punctuation: ignore that. Keep it family-friendly and encouraging. Max 3 examples.`;
}
async function askAI(p, text, hist) {
  const h = hist.slice(-8).concat([{ role: 'user', content: text }]);
  const raw = await callAI(zahraPrompt(p), h);
  const m = raw.match(/\{[\s\S]*\}/);
  const o = JSON.parse(m ? m[0] : raw);
  if (!o.type) throw new Error('Respuesta no válida');
  return o;
}

/* ---------- respuesta sin IA ---------- */
async function offlineAnswer(ask) {
  if (ask.kind === 'say') {
    const hit = lookup(ZIDX.es, ask.q);
    if (hit) return { type: 'say', en: hit.en, es: hit.es, intro_es: `Así se dice 👇 (de «${hit.src}»)` };
    const tr = await freeTranslate(ask.q, 'es|en');
    if (tr) return { type: 'say', en: tr, es: ask.q, intro_es: 'Así se dice 👇', tip_es: DB.settings.ai.key ? '' : 'Traducción automática. Con la clave de IA te doy la forma más natural, alternativas y cómo suena.' };
    return { type: 'info', text_es: `No encontré «${ask.q}» en mi frasario y no pude conectarme al traductor. Revisa tu internet o intenta con otra frase. 🙏` };
  }
  if (ask.kind === 'mean') {
    const hit = lookup(ZIDX.en, ask.q);
    if (hit) return { type: 'explain', text_es: `«${hit.en}» significa: ${hit.es}`, examples: [{ en: hit.en, es: hit.es }] };
    const tr = await freeTranslate(ask.q, 'en|es');
    if (tr) return { type: 'explain', text_es: `«${ask.q}» significa: ${tr}`, examples: [{ en: ask.q, es: tr }] };
    return { type: 'info', text_es: 'No pude buscar ese significado ahora. Revisa tu internet. 🙏' };
  }
  if (ask.kind === 'pron') return { type: 'say', en: ask.q, intro_es: 'Escúchala bien y luego dila tú 👇' };
  // english
  return { type: 'say', en: ask.q, intro_es: DB.settings.ai.key ? 'Practiquemos tu frase 👇' : 'Escucha cómo suena tu frase y dila tú. (Para conversar libre conmigo, activa la clave de IA en Perfil.)' };
}

/* ---------- vista ---------- */
const ZCHIPS = {
  daily: ['¿Cómo se dice "tengo hambre"?', '¿Cómo se pronuncia "thought"?', '¿Qué significa "awesome"?', '¿Cómo se dice "te extraño"?', 'Hi Zahra! How are you?'],
  work: ['¿Cómo se dice "necesito una cotización"?', '¿Cómo se dice "el embarque está retrasado"?', '¿Qué significa "lead time"?', '¿Cómo se pronuncia "warranty"?', 'Hello Zahra, can we talk about business?']
};
function viewZahra(c, p) {
  ensureTutor(p);
  p.zchat = p.zchat || [];
  p.scope = p.scope || 'daily';
  const hasAI = !!DB.settings.ai.key;
  let lang = p.zlang || 'es';
  c.innerHTML = `
    <div class="zhead">
      <div class="avatar-wrap zav">${avatarSVG()}</div>
      <div style="flex:1;min-width:0"><b>Zahra</b> <span class="zdot ${hasAI ? 'on' : ''}"></span><br><small class="muted">${hasAI ? 'Tutora con IA · ' : 'Modo sin IA · '}${p.scope === 'work' ? '💼 Trabajo' : '🏠 Cotidiano'}</small></div>
      ${scopeSwitch(p)}
      <button class="chip" id="zsaved" title="Mis frases">⭐ ${p.saved.length}</button>
      <button class="chip" id="zmenu" title="Opciones">⋯</button>
    </div>
    <div class="chat" id="zchat"></div>
    <div class="zchips" id="zchips">${ZCHIPS[p.scope].map(t => `<button class="chip-btn sm">${esc(t)}</button>`).join('')}</div>
    <div class="chat-bar">
      <button class="langbtn" id="zlang" title="Idioma del micrófono">${lang === 'es' ? '🇪🇸<small>ES</small>' : '🇺🇸<small>EN</small>'}</button>
      <textarea id="ztxt" rows="1" placeholder="${lang === 'es' ? 'Pregúntame: ¿cómo se dice...?' : 'Say something in English...'}"></textarea>
      ${Speech.supported() ? `<button class="mic" id="zmic">🎤</button>` : ''}<button class="send" id="zsend">➤</button>
    </div>`;
  const chat = $('#zchat', c), txt = $('#ztxt', c), mic = $('#zmic', c);
  wireScope(c, p);
  const scroll = () => { chat.scrollTop = chat.scrollHeight; };
  const setLang = l => { lang = l; p.zlang = l; save(); $('#zlang', c).innerHTML = l === 'es' ? '🇪🇸<small>ES</small>' : '🇺🇸<small>EN</small>'; txt.placeholder = l === 'es' ? 'Pregúntame: ¿cómo se dice...?' : 'Say something in English...'; };
  $('#zlang', c).onclick = () => { setLang(lang === 'es' ? 'en' : 'es'); toast(lang === 'es' ? '🎤 Micrófono en ESPAÑOL: pregúntame cómo se dice algo' : '🎤 Micrófono en INGLÉS: háblame en inglés', 2200); };
  $('#zsaved', c).onclick = () => p.saved.length ? showSaved() : toast('Aún no tienes frases guardadas. Toca ⭐ en una respuesta.');
  $('#zmenu', c).onclick = () => modal(`<h2>🤖 Zahra</h2>
      <button class="list-item" data-a="rev"><span class="ic">⭐</span><span class="t"><b>Repasar mis frases</b><small>${p.saved.length} guardadas · lección de repaso</small></span></button>
      <button class="list-item" data-a="classes"><span class="ic">📚</span><span class="t"><b>Clase de hoy y frasario</b><small>Pestaña Clases</small></span></button>
      ${hasAI ? '' : `<button class="list-item" data-a="ai"><span class="ic">🔑</span><span class="t"><b>Activar IA gratis</b><small>Conversación libre y respuestas más naturales</small></span></button>`}
      <button class="list-item" data-a="clear"><span class="ic">🧹</span><span class="t"><b>Borrar esta conversación</b><small>No borra tus frases guardadas</small></span></button>`, (m, close) => {
    $$('[data-a]', m).forEach(b => b.onclick = () => {
      close();
      const a = b.dataset.a;
      if (a === 'rev') { if (p.saved.length >= 3) startSavedReview(); else toast('Guarda al menos 3 frases para repasar ⭐'); }
      if (a === 'classes') { TAB = 'classes'; renderMain(); }
      if (a === 'ai') { TAB = 'me'; renderMain(); setTimeout(() => $('#aisec') && $('#aisec').scrollIntoView({ behavior: 'smooth' }), 60); }
      if (a === 'clear') { p.zchat = []; save(); renderMain(); }
    });
  });

  /* ----- burbujas ----- */
  const meBubble = t => { const el = document.createElement('div'); el.className = 'msg me'; el.textContent = t; chat.appendChild(el); scroll(); return el; };
  const zBubble = (html, cls = '') => { const el = document.createElement('div'); el.className = 'msg bot ' + cls; el.innerHTML = html; chat.appendChild(el); scroll(); return el; };
  const typing = () => { const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<span></span><span></span><span></span>'; chat.appendChild(t); scroll(); return t; };
  const saveBtn = (en, es) => `<button class="chip-btn sm" data-save="${esc(en)}" data-es="${esc(es || '')}">${p.saved.some(x => x.en === en) ? '✅ Guardada' : '⭐ Guardar'}</button>`;
  chat.addEventListener('click', e => {
    const s = e.target.closest('[data-save]'); if (s && !p.saved.some(x => x.en === s.dataset.save)) { p.saved.push({ en: s.dataset.save, es: s.dataset.es, from: 'zahra', d: dayKey() }); save(); s.textContent = '✅ Guardada'; $('#zsaved', c).textContent = '⭐ ' + p.saved.length; addXP(1); }
    const say = e.target.closest('[data-say]'); if (say) Speech.speak(say.dataset.say, { slow: say.hasAttribute('data-slow') });
    const pr = e.target.closest('[data-prac]'); if (pr) practice(pr.closest('.ccard, .msg'), pr.dataset.prac);
  });

  /* ----- "Dilo tú": práctica con corrección ----- */
  function practice(host, en) {
    if (!Speech.supported()) { toast('Tu navegador no reconoce voz. Abre la app en Google Chrome.'); return; }
    let box = host.querySelector('.prac');
    if (!box) { box = document.createElement('div'); box.className = 'prac'; host.appendChild(box); }
    box.innerHTML = '<small>🎤 Te escucho... di la frase en inglés</small>';
    scroll();
    Speech.listen({
      lang: 'en-US',
      onInterim: t => box.innerHTML = `<small>“${esc(t)}”</small>`,
      onResult: alts => {
        const r = Speech.evaluate(en, alts);
        const ok = r.score >= 70;
        const tips = ok ? [] : Speech.tipsFor(r.words.filter(w => !w.ok).map(w => w.w));
        box.innerHTML = `<div class="target sm">${r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ')}</div>
          <div class="prac-score"><b style="color:${ok ? 'var(--ok)' : r.score >= 50 ? 'var(--sun)' : 'var(--bad)'}">${r.score}%</b> · Escuché: “${esc(r.heard)}”</div>
          ${tips.length ? `<div class="tipbox" style="margin-top:6px">${tips.join('<br>')}</div>` : ''}
          <button class="chip-btn sm" data-prac="${esc(en)}">🔁 Otra vez</button>`;
        if (ok) { sfxOk(); if (!box.dataset.won) { box.dataset.won = 1; addXP(2); } }
        else { sfxBad(); }
        const msg = ok ? pick(['¡Perfecto! 🎉 Se entendió clarito.', '¡Muy bien dicho! 👏', '¡Excelente pronunciación! 🔥', '¡Así mismo! 💯'])
          : r.score >= 50 ? '¡Casi! 💪 Las palabras en rojo necesitan un poquito más. Escúchala lento 🐢 y repite.' : 'Vamos de nuevo 😊 Escucha primero con 🐢 y luego repite despacio.';
        zBubble(esc(msg), 'mini');
        if (!ok) Speech.speak(en, { slow: true });
      },
      onError: e => { box.innerHTML = '<small>' + micErrorText(e) + '</small>'; },
      onEnd: got => { if (!got && box.textContent.includes('Te escucho')) box.innerHTML = `<small>No te escuché. </small><button class="chip-btn sm" data-prac="${esc(en)}">🎤 Intentar de nuevo</button>`; }
    });
  }

  /* ----- pintar respuestas de Zahra ----- */
  function renderZ(o, fresh) {
    if (o.type === 'say') {
      if (o.intro_es) zBubble(`<span class="es-only">${esc(o.intro_es)}</span>`);
      const card = document.createElement('div'); card.className = 'ccard saycard';
      card.innerHTML = `<div class="ttl">🇺🇸 EN INGLÉS</div><div class="say-en">${esc(o.en)}</div>
        ${o.es ? `<div class="muted">${esc(o.es)}</div>` : ''}
        ${o.pron_es ? `<div class="pron">🗣️ Suena como: <b>${esc(o.pron_es)}</b></div>` : ''}
        ${(o.alts || []).filter(Boolean).length ? `<div class="alts">${o.alts.filter(Boolean).map(a => `<button class="alt" data-say="${esc(a)}">🔊 ${esc(a)}</button>`).join('')}</div>` : ''}
        ${o.tip_es ? `<div class="tipbox">💡 ${esc(o.tip_es)}</div>` : ''}
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="mini-aud" data-say="${esc(o.en)}">🔊</button><button class="mini-aud slowb" data-say="${esc(o.en)}" data-slow>🐢</button>
          <button class="chip-btn" data-prac="${esc(o.en)}">🎤 Dilo tú</button>${saveBtn(o.en, o.es || '')}</div>`;
      chat.appendChild(card); scroll();
      if (fresh) Speech.speak(o.en);
    } else if (o.type === 'explain') {
      zBubble(`<span class="es-only">${esc(o.text_es)}</span>${o.pron_es ? `<div class="pron">🗣️ Suena como: <b>${esc(o.pron_es)}</b></div>` : ''}`);
      (o.examples || []).slice(0, 3).forEach(x => {
        const card = document.createElement('div'); card.className = 'ccard';
        card.innerHTML = `<div class="row" style="gap:8px"><div style="flex:1"><b>${esc(x.en)}</b><br><small class="muted">${esc(x.es || '')}</small></div>
          <button class="mini-aud" data-say="${esc(x.en)}">🔊</button></div>
          <div class="row" style="gap:8px;margin-top:8px"><button class="chip-btn sm" data-prac="${esc(x.en)}">🎤 Dilo tú</button>${saveBtn(x.en, x.es)}</div>`;
        chat.appendChild(card);
      });
      scroll();
      if (fresh && o.examples && o.examples[0]) Speech.speak(o.examples[0].en);
    } else if (o.type === 'chat') {
      if (o.correction) {
        const card = document.createElement('div'); card.className = 'ccard fixcard';
        card.innerHTML = `<div class="ttl">✏️ MEJOR DI</div><div style="font-weight:800;font-size:17px">${esc(o.correction)}</div>
          ${o.explanation_es ? `<small class="muted">${esc(o.explanation_es)}</small>` : ''}
          <div class="row" style="gap:8px;margin-top:8px"><button class="mini-aud" data-say="${esc(o.correction)}">🔊</button><button class="chip-btn sm" data-prac="${esc(o.correction)}">🎤 Dilo tú</button>${saveBtn(o.correction, o.explanation_es)}</div>`;
        chat.appendChild(card);
      }
      zBubble(`${esc(o.reply)}${o.translation_es ? `<div class="tr">${esc(o.translation_es)}</div>` : ''}
        <div class="acts"><button data-say="${esc(o.reply)}">🔊</button><button data-say="${esc(o.reply)}" data-slow>🐢</button><button data-prac="${esc(o.reply)}">🎤</button></div>`);
      if (fresh) Speech.speak(o.reply);
    } else {
      zBubble(`<span class="es-only">${esc(o.text_es)}</span>`);
    }
  }
  function pushHist(e) { p.zchat.push(e); if (p.zchat.length > 60) p.zchat = p.zchat.slice(-60); save(); }

  /* ----- historial ----- */
  if (!p.zchat.length) {
    zBubble(`<span class="es-only">¡Hola ${esc(p.name)}! 🤖💛 Soy <b>Zahra</b>. Pregúntame <b>cómo se dice</b> cualquier cosa en inglés, <b>cómo se pronuncia</b> una palabra o <b>qué significa</b>. Luego toca <b>🎤 Dilo tú</b> y te corrijo.</span>
      <div class="tr">Toca la bandera 🇪🇸/🇺🇸 para elegir en qué idioma me hablas por el micrófono.</div>`);
  } else {
    p.zchat.forEach(e => { if (e.t === 'me') meBubble(e.text); else renderZ(e.o, false); });
  }

  /* ----- enviar ----- */
  let busy = false;
  async function send(text) {
    text = (text || '').trim(); if (!text || busy) return;
    busy = true;
    meBubble(text); pushHist({ t: 'me', text });
    const ask = parseAsk(text);
    if (ask.kind === 'english' && lang === 'es') setLang('en');
    const ty = typing();
    let o = null;
    if (DB.settings.ai.key) {
      try {
        const hist = [];
        p.zchat.slice(-13, -1).forEach(e => hist.push(e.t === 'me' ? { role: 'user', content: e.text } : { role: 'assistant', content: JSON.stringify(e.o) }));
        o = await askAI(p, text, hist);
      } catch (e) { o = null; }
    }
    if (!o) o = await offlineAnswer(ask);
    ty.remove();
    renderZ(o, true);
    pushHist({ t: 'z', o });
    if (o.type !== 'info') addXP(1);
    busy = false;
  }
  $('#zsend', c).onclick = () => { const t = txt.value; txt.value = ''; send(t); };
  txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#zsend', c).click(); } });
  $$('#zchips button', c).forEach(b => b.onclick = () => { const t = b.textContent; if (looksEnglish(t)) setLang('en'); send(t); });
  if (mic) mic.onclick = () => {
    if (Speech.isActive()) return Speech.stop();
    if (window.speechSynthesis) speechSynthesis.cancel();
    mic.classList.add('on'); const ph = txt.placeholder; txt.placeholder = lang === 'es' ? 'Te escucho (español)... 👂' : 'Listening (English)... 👂';
    const go = l => Speech.listen({
      lang: l,
      onInterim: t => txt.value = t,
      onResult: alts => { txt.value = ''; send(alts[0]); },
      onError: e => {
        if (e === 'language-not-supported' && l === 'es-VE') return go('es-ES');
        mic.classList.remove('on'); toast(micErrorText(e), 4000);
      },
      onEnd: () => { mic.classList.remove('on'); txt.placeholder = ph; }
    });
    go(lang === 'es' ? 'es-VE' : 'en-US');
  };
  setTimeout(scroll, 30);
}
