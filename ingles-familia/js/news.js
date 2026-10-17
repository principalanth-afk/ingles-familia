/* =========================================================
   NOTICIAS EN INGLÉS — leer, escuchar, traducir palabra por
   palabra, leer en voz alta con corrección y, con IA,
   versión simplificada + vocabulario + preguntas.
   ========================================================= */
'use strict';

const FEEDS = {
  daily: [
    { id: 'bbc-world', name: 'Mundo', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { id: 'bbc-sci', name: 'Ciencia', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
    { id: 'bbc-health', name: 'Salud', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
    { id: 'bbc-ent', name: 'Entretenimiento', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
    { id: 'npr', name: 'EE. UU.', src: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' }
  ],
  work: [
    { id: 'bbc-biz', name: 'Negocios', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { id: 'bbc-tech', name: 'Tecnología', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { id: 'npr-econ', name: 'Economía', src: 'NPR', url: 'https://feeds.npr.org/1017/rss.xml' },
    { id: 'bbc-world-w', name: 'Mundo', src: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }
  ]
};
const enc = encodeURIComponent;
const stripHTML = s => { const d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
async function fetchT(url, ms = 9000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return r; } finally { clearTimeout(t); }
}
function parseRSS(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(doc.getElementsByTagName('item')).map(it => {
    const g = n => { const e = it.getElementsByTagName(n)[0]; return e ? e.textContent : ''; };
    const th = it.getElementsByTagNameNS('*', 'thumbnail')[0] || it.getElementsByTagNameNS('*', 'content')[0];
    return { title: stripHTML(g('title')), desc: stripHTML(g('description')), link: g('link'), date: g('pubDate'), img: th ? th.getAttribute('url') : '' };
  }).filter(x => x.title);
}
async function fetchFeed(feed, force) {
  const ck = 'ief-news-' + feed.id;
  let cache = null;
  try { cache = JSON.parse(localStorage.getItem(ck)); } catch (e) {}
  if (!force && cache && Date.now() - cache.t < 30 * 60000) return cache.items;
  const tries = [
    async () => { const j = await (await fetchT(`https://api.rss2json.com/v1/api.json?rss_url=${enc(feed.url)}`)).json();
      if (j.status !== 'ok') throw 0;
      return j.items.map(i => ({ title: stripHTML(i.title), desc: stripHTML(i.description), link: i.link, date: i.pubDate, img: i.thumbnail || (i.enclosure && i.enclosure.link) || '' })); },
    async () => parseRSS(await (await fetchT(`https://api.allorigins.win/raw?url=${enc(feed.url)}`)).text()),
    async () => parseRSS(await (await fetchT(`https://api.codetabs.com/v1/proxy?quest=${enc(feed.url)}`)).text()),
    async () => parseRSS(await (await fetchT(feed.url)).text())
  ];
  for (const t of tries) {
    try { const items = (await t()).filter(x => x.title).slice(0, 25); if (items.length) { try { localStorage.setItem(ck, JSON.stringify({ t: Date.now(), items })); } catch (e) {} return items; } } catch (e) {}
  }
  if (cache) return cache.items;
  throw new Error('sin conexión');
}
/* Titulares del día con búsqueda de Google (solo Gemini) */
async function aiHeadlines(p) {
  const ai = DB.settings.ai;
  if (ai.provider !== 'gemini') throw new Error('Esta opción usa Gemini');
  const topic = p.scope === 'work' ? 'business, economy, technology, agriculture and trade' : 'world news, science, health and culture (family-friendly)';
  const prompt = `Use Google Search to find 6 important real news stories from the last 48 hours about ${topic}. Return ONLY a JSON array, no other text: [{"title":"English headline","desc":"2-3 short sentences in simple English for a CEFR ${currentLevel(p)} learner, only facts from the source","source":"outlet name","link":"source URL if available"}]`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${enc(ai.model || 'gemini-flash-latest')}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ai.key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ google_search: {} }] })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status);
  const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(x => !x.thought).map(x => x.text || '').join('');
  const m = txt.match(/\[[\s\S]*\]/);
  const arr = JSON.parse(m ? m[0] : txt);
  return arr.filter(x => x.title).map(x => ({ title: x.title, desc: x.desc || '', link: x.link || '', date: '', img: '', src: x.source || 'Gemini' }));
}

let NEWS_FEED = null;
function viewNews(c, p) {
  p.scope = p.scope || 'daily';
  const feeds = FEEDS[p.scope];
  if (!NEWS_FEED || !feeds.some(f => f.id === NEWS_FEED)) NEWS_FEED = feeds[0].id;
  const hasGem = DB.settings.ai.key && DB.settings.ai.provider === 'gemini';
  c.innerHTML = `<h1>📰 Noticias en inglés</h1>
    <p class="muted" style="margin-top:0">Noticias reales de hoy. Toca una para leerla con Zahra: escúchala, toca cualquier palabra para traducirla y léela en voz alta.</p>
    ${scopeSwitch(p)}
    <div class="feedbar">${feeds.map(f => `<button class="chip-btn sm ${f.id === NEWS_FEED ? 'on' : ''}" data-feed="${f.id}">${f.name} · ${f.src}</button>`).join('')}
      ${hasGem ? `<button class="chip-btn sm ${NEWS_FEED === 'ai' ? 'on' : ''}" data-feed="ai">🤖 Zahra busca</button>` : ''}</div>
    <div id="newslist"><div class="center muted" style="padding:30px">Cargando noticias... 📡</div></div>`;
  wireScope(c, p);
  $$('[data-feed]', c).forEach(b => b.onclick = () => { NEWS_FEED = b.dataset.feed; renderMain(); });
  const list = $('#newslist', c);
  const load = async force => {
    try {
      let items;
      if (NEWS_FEED === 'ai') items = await aiHeadlines(p);
      else { const f = feeds.find(x => x.id === NEWS_FEED); items = (await fetchFeed(f, force)).map(x => ({ ...x, src: f.src })); }
      if (!list.isConnected) return;
      list.innerHTML = items.map((a, i) => `<button class="news-item" data-n="${i}">
        ${a.img ? `<img src="${esc(a.img)}" alt="" loading="lazy" onerror="this.remove()">` : `<div class="nimg">📰</div>`}
        <div class="nt"><b>${esc(a.title)}</b><small>${esc(a.src || '')}${a.date ? ' · ' + esc(timeAgo(a.date)) : ''}</small></div></button>`).join('')
        + `<button class="link" id="reload" style="width:100%">🔄 Actualizar</button>`;
      $$('[data-n]', list).forEach(b => b.onclick = () => openArticle(items[+b.dataset.n]));
      $('#reload', list).onclick = () => { list.innerHTML = '<div class="center muted" style="padding:30px">Actualizando... 📡</div>'; load(true); };
    } catch (e) {
      if (!list.isConnected) return;
      list.innerHTML = `<div class="notice warn">No pude cargar las noticias (${esc(e.message || 'sin conexión')}). Revisa tu internet e intenta de nuevo.${hasGem ? ' También puedes tocar <b>🤖 Zahra busca</b>.' : ''}
        <br><button class="btn small" id="retry" style="margin-top:10px">Reintentar</button></div>`;
      $('#retry', list).onclick = () => { list.innerHTML = '<div class="center muted" style="padding:30px">Cargando... 📡</div>'; load(true); };
    }
  };
  load(false);
}
function timeAgo(d) {
  const t = new Date(d); if (isNaN(t)) return '';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : t.toLocaleDateString();
}

/* ---------------- lector ---------------- */
function openArticle(a) {
  const p = ensureTutor(P());
  const text = [a.title.replace(/[.!?]?$/, '.'), a.desc].filter(Boolean).join(' ');
  const sents = text.match(/[^.!?]+[.!?]+["”']?|[^.!?]+$/g).map(s => s.trim()).filter(Boolean);
  const wordify = s => s.split(/(\s+)/).map(tok => /[A-Za-z]/.test(tok) ? `<span class="tw">${esc(tok)}</span>` : esc(tok)).join('');
  let earned = false;
  app.innerHTML = `<div class="screen">
    <div class="lesson-top" style="border-bottom:2px solid var(--line)"><button class="x" id="back">✕</button><div style="flex:1"><b>Leer con Zahra</b><br><small class="muted">${esc(a.src || '')}${a.date ? ' · ' + esc(timeAgo(a.date)) : ''}</small></div>
      <div class="avatar-wrap" style="width:44px;height:44px">${avatarSVG().replace('class="avatar robot"', 'class="avatar robot" style="width:44px;height:44px"')}</div></div>
    <div class="scroll" style="padding-bottom:30px">
      ${a.img ? `<img class="hero-img" src="${esc(a.img)}" alt="" onerror="this.remove()">` : ''}
      <div class="article">${sents.map((s, i) => `<p class="sent" data-i="${i}">${wordify(s)}</p>`).join('')}</div>
      <p class="muted" style="font-size:13px">👆 Toca cualquier palabra para ver qué significa.</p>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <button class="chip-btn" id="listen">🔊 Escuchar</button><button class="chip-btn" id="slow">🐢 Lento</button>
        <button class="chip-btn" id="trall">🇪🇸 Traducir</button><button class="chip-btn" id="readal">🎤 Léela en voz alta</button>
      </div>
      <div id="trout"></div><div id="readout"></div>
      ${DB.settings.ai.key ? `<div class="card" style="margin-top:14px"><h3>🤖 Zahra te la explica</h3><p class="muted" style="margin-top:0;font-size:14px">Versión fácil para tu nivel, vocabulario clave y preguntas.</p>
        <button class="btn small" id="explain">Explícamela</button> <button class="btn ghost small" id="talk">💬 Comentarla</button><div id="aiout"></div></div>`
        : `<div class="notice" style="margin-top:14px">Con la clave de IA, Zahra te explica la noticia a tu nivel, te enseña el vocabulario y te hace preguntas.</div>`}
      ${a.link ? `<p><a href="${esc(a.link)}" target="_blank" rel="noopener" class="link" style="padding:0">Abrir la noticia completa ↗</a></p>` : ''}
      <button class="btn ok" id="done" style="margin-top:10px">✓ Leída (+3 XP)</button>
    </div></div>`;
  $('#back').onclick = () => { Speech.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); TAB = 'news'; renderMain(); };
  $('#done').onclick = () => { if (!earned) { earned = true; addXP(3); sfxOk(); } TAB = 'news'; renderMain(); toast('+3 XP por leer en inglés 📰'); };
  /* escuchar con resaltado */
  const readAll = async slow => {
    for (let i = 0; i < sents.length; i++) {
      const el = $(`.sent[data-i="${i}"]`); if (!el) return;
      $$('.sent').forEach(x => x.classList.remove('hl')); el.classList.add('hl');
      await Speech.speak(sents[i], { slow });
    }
    $$('.sent').forEach(x => x.classList.remove('hl'));
  };
  $('#listen').onclick = () => readAll(false);
  $('#slow').onclick = () => readAll(true);
  /* palabra → traducción */
  $$('.tw').forEach(w => w.onclick = async () => {
    const word = w.textContent.replace(/[^A-Za-z'-]/g, '').replace(/^'+|'+$/g, '');
    if (!word) return;
    Speech.speak(word);
    const close = modal(`<div class="center"><div style="font-size:30px;font-weight:900">${esc(word)}</div><div id="wtr" class="muted" style="font-size:20px;margin:8px 0">Buscando...</div>
      <div class="row" style="justify-content:center;gap:10px"><button class="mini-aud" data-s>🔊</button><button class="chip-btn" data-p>🎤 Dilo tú</button><button class="chip-btn" data-v>⭐ Guardar</button></div><div id="wres"></div></div>`, (m) => {
      $('[data-s]', m).onclick = () => Speech.speak(word);
      $('[data-p]', m).onclick = () => quickPractice(word, $('#wres', m));
    });
    const hit = lookup(ZIDX.en, word);
    const tr = hit ? hit.es : (await freeTranslate(word.toLowerCase(), 'en|es')) || '(sin conexión)';
    const out = $('#wtr'); if (out) out.textContent = tr;
    const sv = document.querySelector('.modal [data-v]');
    if (sv) sv.onclick = () => { if (!p.saved.some(x => x.en === word)) { p.saved.push({ en: word, es: tr, from: 'noticia', d: dayKey() }); save(); } sv.textContent = '✅ Guardada'; };
  });
  /* traducir todo */
  $('#trall').onclick = async () => {
    const out = $('#trout'); out.innerHTML = '<div class="card muted">Traduciendo...</div>';
    const parts = await Promise.all(sents.map(s => freeTranslate(s, 'en|es')));
    out.innerHTML = `<div class="card"><div class="ttl" style="color:var(--purple);font-weight:900;font-size:12px">🇪🇸 TRADUCCIÓN</div>${parts.map(x => `<p>${esc(x || '—')}</p>`).join('')}</div>`;
  };
  /* leer en voz alta, oración por oración */
  $('#readal').onclick = () => {
    const out = $('#readout');
    let i = 0;
    const next = () => {
      if (i >= sents.length) { out.innerHTML = `<div class="card center">🎉 ¡Leíste toda la noticia en voz alta!</div>`; return; }
      out.innerHTML = `<div class="card"><div class="ttl" style="color:var(--purple);font-weight:900;font-size:12px">🎤 ORACIÓN ${i + 1} DE ${sents.length}</div>
        <div class="target sm" style="font-size:18px;text-align:left">${esc(sents[i])}</div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="mini-aud" data-s>🔊</button><button class="chip-btn" data-r>🎤 Leer</button><button class="chip-btn sm ghosty" data-n>Siguiente ›</button></div><div data-o></div></div>`;
      out.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('[data-s]', out).onclick = () => Speech.speak(sents[i], { slow: true });
      $('[data-n]', out).onclick = () => { i++; next(); };
      $('[data-r]', out).onclick = () => quickPractice(sents[i], $('[data-o]', out), ok => { if (ok) setTimeout(() => { i++; next(); }, 1600); });
    };
    next();
  };
  /* IA: explicar */
  const ex = $('#explain');
  if (ex) ex.onclick = async () => {
    const out = $('#aiout'); out.innerHTML = '<p class="muted">Zahra está leyendo la noticia... 🤖</p>';
    try {
      const lv = currentLevel(p);
      const raw = await callAI(`You are Zahra, a friendly robot English tutor for a Spanish-speaking learner (CEFR ${lv}). Use ONLY the facts in the given news text; never invent facts. Respond ONLY with JSON: {"simple_en":"the news retold in 2-4 short sentences of simple English for ${lv}","summary_es":"2 sentence summary in Spanish","vocab":[{"en":"key word or phrase","es":"traducción"}],"questions":[{"q":"comprehension question in English","options":["a","b","c"],"answer":"exact text of correct option"}]} with 5 vocab items and 3 questions.`,
        [{ role: 'user', content: `NEWS (${a.src || ''}): ${text}` }]);
      const o = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]);
      out.innerHTML = `<div class="ccard" style="margin-top:10px"><div class="ttl">📗 VERSIÓN FÁCIL</div><p style="font-size:17px;font-weight:700">${esc(o.simple_en)}</p>
          <div class="row" style="gap:8px"><button class="mini-aud" data-say="${esc(o.simple_en)}">🔊</button><button class="chip-btn sm" data-pr>🎤 Léela</button></div><div data-po></div>
          <p class="muted">${esc(o.summary_es || '')}</p></div>
        <div class="ccard" style="margin-top:10px"><div class="ttl">✨ VOCABULARIO</div>${(o.vocab || []).map(v => `<div class="bk-row"><div class="bk-t"><b>${esc(v.en)}</b><small>${esc(v.es)}</small></div><button class="mini-aud" data-say="${esc(v.en)}">🔊</button><button class="star" data-sv="${esc(v.en)}" data-es="${esc(v.es)}">☆</button></div>`).join('')}</div>
        <div class="ccard" style="margin-top:10px"><div class="ttl">❓ PREGUNTAS</div>${(o.questions || []).map((q, qi) => `<div class="nq" data-q="${qi}"><b>${esc(q.q)}</b><div class="opts" style="margin-top:6px">${q.options.map(op => `<button class="opt">${esc(op)}</button>`).join('')}</div></div>`).join('')}</div>`;
      $$('[data-say]', out).forEach(b => b.onclick = () => Speech.speak(b.dataset.say));
      $('[data-pr]', out).onclick = () => quickPractice(o.simple_en, $('[data-po]', out));
      $$('[data-sv]', out).forEach(b => b.onclick = () => { if (!p.saved.some(x => x.en === b.dataset.sv)) { p.saved.push({ en: b.dataset.sv, es: b.dataset.es, from: 'noticia', d: dayKey() }); save(); } b.textContent = '⭐'; });
      $$('.nq', out).forEach(div => {
        const q = o.questions[+div.dataset.q];
        $$('.opt', div).forEach(b => b.onclick = () => {
          const ok = b.textContent === q.answer;
          $$('.opt', div).forEach(x => { x.disabled = true; if (x.textContent === q.answer) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
          if (ok) { sfxOk(); addXP(1); } else sfxBad();
        });
      });
    } catch (e) { out.innerHTML = `<p class="muted">⚠️ No pude explicarla: ${esc(e.message)}</p>`; }
  };
  const tk = $('#talk');
  if (tk) tk.onclick = () => startChat({ id: 'news', icon: '📰', title: 'Charla sobre la noticia', desc: '',
    prompt: `Talk with the learner about this news story. Start by briefly saying what it is about in simple words and ask their opinion. Use only facts from this text, do not invent details: "${text}"` });
}
/* Práctica rápida de pronunciación en cualquier contenedor */
function quickPractice(target, out, cb) {
  if (!Speech.supported()) { out.innerHTML = '<small>Tu navegador no reconoce voz. Usa Chrome.</small>'; return; }
  out.innerHTML = '<small>🎤 Te escucho...</small>';
  Speech.listen({
    lang: 'en-US',
    onInterim: t => out.innerHTML = `<small>“${esc(t)}”</small>`,
    onResult: alts => {
      const r = Speech.evaluate(target, alts), ok = r.score >= 70;
      const tips = ok ? [] : Speech.tipsFor(r.words.filter(w => !w.ok).map(w => w.w));
      out.innerHTML = `<div class="target sm" style="text-align:left">${r.words.map(w => `<span class="w ${w.ok ? 'g' : 'r'}">${esc(w.w)}</span>`).join(' ')}</div>
        <small><b style="color:${ok ? 'var(--ok)' : 'var(--sun)'}">${r.score}%</b> · ${ok ? '¡Muy bien! 🎉' : 'Casi, inténtalo otra vez 💪'}</small>${tips.length ? `<div class="tipbox">${tips.join('<br>')}</div>` : ''}`;
      if (ok) { sfxOk(); addXP(2); } else sfxBad();
      cb && cb(ok);
    },
    onError: e => { out.innerHTML = '<small>' + micErrorText(e) + '</small>'; },
    onEnd: got => { if (!got && out.textContent.includes('Te escucho')) out.innerHTML = '<small>No te escuché, intenta de nuevo.</small>'; }
  });
}

boot();
