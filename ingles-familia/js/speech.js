/* =========================================================
   VOZ: síntesis (TTS), reconocimiento (STT) y evaluación
   ========================================================= */
const Speech = (() => {
  const synth = window.speechSynthesis;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let voices = [];
  let rate = 0.95;
  let voiceURI = '';
  let onTalk = null; // callback(true/false) para animar avatar

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  function pickVoice() {
    if (!voices.length) loadVoices();
    if (voiceURI) { const v = voices.find(v => v.voiceURI === voiceURI); if (v) return v; }
    const score = v => (/en[-_]US/i.test(v.lang) ? 4 : /en[-_]GB/i.test(v.lang) ? 2 : 1) + (/google/i.test(v.name) ? 3 : 0) + (/natural|neural|enhanced|premium/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
    return voices.slice().sort((a, b) => score(b) - score(a))[0] || null;
  }

  function speak(text, opts = {}) {
    return new Promise(resolve => {
      if (!synth) return resolve();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-US';
      u.rate = opts.slow ? Math.max(0.5, rate * 0.62) : rate;
      u.pitch = opts.pitch || 1;
      let done = false;
      const end = () => { if (done) return; done = true; onTalk && onTalk(false); resolve(); };
      u.onstart = () => onTalk && onTalk(true);
      u.onend = end; u.onerror = end;
      // Seguro por si el navegador no dispara onend
      setTimeout(end, 1200 + text.length * 110 / (u.rate || 1));
      synth.speak(u);
    });
  }

  /* ---------- Reconocimiento ---------- */
  let rec = null, active = false;
  let speakStart = 0;
  let onSeconds = null; // callback(segundos hablados)

  function supported() { return !!SR; }

  function listen({ onInterim, onResult, onError, onEnd, lang }) {
    if (!SR) { onError && onError('unsupported'); return; }
    if (synth) synth.cancel();
    stop();
    rec = new SR();
    rec.lang = lang || 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    let finalAlts = null, gotFinal = false;
    rec.onstart = () => { active = true; speakStart = Date.now(); };
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          gotFinal = true;
          finalAlts = Array.from(r).map(a => a.transcript);
        } else interim += r[0].transcript;
      }
      if (!gotFinal && onInterim) onInterim(interim);
    };
    rec.onerror = e => { active = false; onError && onError(e.error || 'error'); };
    rec.onend = () => {
      const secs = (Date.now() - speakStart) / 1000;
      if (active && onSeconds && secs > 0 && secs < 60) onSeconds(secs);
      active = false;
      if (finalAlts) onResult && onResult(finalAlts);
      onEnd && onEnd(!!finalAlts);
    };
    try { rec.start(); } catch (err) { onError && onError('start'); }
  }
  function stop() { if (rec) { try { rec.stop(); } catch (e) {} } }
  function isActive() { return active; }

  /* ---------- Normalización y evaluación ---------- */
  const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function numWords(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return '';
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numWords(n % 100) : '');
    if (n < 10000) return numWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numWords(n % 1000) : '');
    return String(n);
  }
  const CONTR = {
    "i'm":"i am","you're":"you are","we're":"we are","they're":"they are","he's":"he is","she's":"she is","it's":"it is",
    "that's":"that is","there's":"there is","what's":"what is","where's":"where is","let's":"let us","i'll":"i will","you'll":"you will",
    "we'll":"we will","they'll":"they will","he'll":"he will","she'll":"she will","i've":"i have","you've":"you have","we've":"we have",
    "they've":"they have","i'd":"i would","you'd":"you would","we'd":"we would","don't":"do not","doesn't":"does not","didn't":"did not",
    "can't":"can not","cannot":"can not","won't":"will not","isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not",
    "haven't":"have not","hasn't":"has not","shouldn't":"should not","wouldn't":"would not","couldn't":"could not","how's":"how is"
  };
  function norm(s) {
    s = (s || '').toLowerCase().replace(/[’‘`´]/g, "'");
    s = s.replace(/(\d{1,2}):00\b/g, '$1 oclock').replace(/(\d{1,2}):(\d{2})/g, '$1 $2');
    s = s.replace(/o'clock/g, 'oclock').replace(/%/g, ' percent').replace(/\$(\d+)/g, '$1 dollars');
    s = s.replace(/\d+/g, m => ' ' + numWords(m) + ' ');
    s = s.replace(/-/g, ' ');
    s = s.replace(/[^a-z' ]+/g, ' ');
    let words = s.split(/\s+/).filter(Boolean).map(w => w.replace(/^'+|'+$/g, ''));
    words = words.flatMap(w => (CONTR[w] ? CONTR[w].split(' ') : [w]));
    // "ok" / "okay"
    words = words.map(w => (w === 'okay' ? 'ok' : w === 'mr' ? 'mister' : w));
    return words.filter(Boolean);
  }
  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function wordSim(a, b) {
    if (a === b) return 1;
    const d = lev(a, b);
    return 1 - d / Math.max(a.length, b.length);
  }
  /* Alinea palabras objetivo con lo reconocido (LCS difusa). Devuelve aciertos por palabra */
  function align(target, heard, strict) {
    const m = target.length, n = heard.length;
    const th = strict ? 1 : 0.75;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        const s = wordSim(target[i - 1], heard[j - 1]);
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], s >= th ? dp[i - 1][j - 1] + 1 : 0);
      }
    const hit = new Array(m).fill(false);
    let i = m, j = n;
    while (i > 0 && j > 0) {
      const s = wordSim(target[i - 1], heard[j - 1]);
      if (s >= th && dp[i][j] === dp[i - 1][j - 1] + 1) { hit[i - 1] = true; i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
    }
    return hit;
  }
  /* Evalúa una frase: devuelve {score, words:[{w,ok}], heard} con la mejor alternativa */
  function evaluate(targetText, alts, strict = false) {
    const display = targetText.split(/\s+/).filter(Boolean);
    const tNorm = display.map(w => norm(w)); // cada palabra visible puede expandirse a varias
    const flat = tNorm.flat();
    let best = null;
    for (const alt of alts) {
      const h = norm(alt);
      const hit = align(flat, h, strict);
      const sc = flat.length ? hit.filter(Boolean).length / flat.length : 0;
      // penaliza muchas palabras extra
      const extra = Math.max(0, h.length - flat.length - 2) * 0.03;
      const score = Math.max(0, sc - extra);
      if (!best || score > best.score) best = { score, hit, heard: alt };
    }
    if (!best) return { score: 0, words: display.map(w => ({ w, ok: false })), heard: '' };
    let k = 0;
    const words = display.map((w, i) => {
      const parts = tNorm[i].length || 1;
      const ok = tNorm[i].length ? best.hit.slice(k, k + parts).every(Boolean) : true;
      k += tNorm[i].length;
      return { w, ok };
    });
    return { score: Math.round(best.score * 100), words, heard: best.heard };
  }
  /* Consejos de pronunciación según las palabras fallidas (estilo ELSA) */
  function tipsFor(words) {
    const tips = new Set();
    words.forEach(w => {
      const x = w.toLowerCase().replace(/[^a-z']/g, '');
      if (/th/.test(x)) tips.add('🦷 <b>TH</b>: pon la lengua entre los dientes ("' + x + '").');
      if (/v/.test(x)) tips.add('🦷 <b>V</b>: dientes de arriba sobre el labio de abajo, no como B ("' + x + '").');
      if (/^s[ptkclmnw]/.test(x)) tips.add('🚫 No digas "e" antes de <b>' + x + '</b>: empieza directo con "sss".');
      if (/[^aeiou]ed$/.test(x) && x.length > 4) tips.add('⏮️ La <b>-ed</b> de "' + x + '" casi no se oye: suena /t/ o /d/.');
      if (/^h/.test(x)) tips.add('💨 La <b>H</b> de "' + x + '" es solo aire suave, no "j".');
      if (/^w/.test(x)) tips.add('👄 La <b>W</b> de "' + x + '": labios redondos como "u", no "gu".');
      if (/ee|ea/.test(x)) tips.add('😁 "' + x + '" lleva <b>i larga</b>: estírala sonriendo.');
      if (/^j/.test(x)) tips.add('🎯 La <b>J</b> de "' + x + '" suena "dch", no como la jota.');
    });
    return Array.from(tips).slice(0, 2);
  }

  return {
    speak, listen, stop, supported, isActive, evaluate, tipsFor, norm, lev,
    get voices() { loadVoices(); return voices; },
    setRate(r) { rate = r; }, setVoice(u) { voiceURI = u; },
    set onTalk(f) { onTalk = f; }, set onSeconds(f) { onSeconds = f; },
    ttsSupported: !!synth
  };
})();
