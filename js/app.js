/* Space Syntax — UI for the start screen, intro, Phase 0 and Phase 1.
 * Plain script (no modules) so it runs from file:// and any static host.
 */
(function () {
  'use strict';
  const D = window.SS_DATA, M = window.SS_MODEL;
  const ART = window.SS_ART || { milo: () => '', moon: () => '', ship: () => '', rocket: () => '' };
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal-root');
  const $toast = document.getElementById('toast-root');
  const SAVE_KEY = 'ss-save-v1';
  const NAME = D.CHARACTER.name;
  const fmt = M.fmt;
  /* Team artwork: characters and scene backgrounds are used as soon as the files exist. */
  const CHAR_IMG = {};   // id -> working image url
  const SCENE_OK = {};   // scene -> true when its background loaded
  function probeImg(urls, onOk) {
    const list = urls.filter(Boolean); if (!list.length) return;
    const img = new Image();
    img.onload = () => onOk(list[0]);
    img.onerror = () => probeImg(list.slice(1), onOk);
    img.src = list[0];
  }
  D.CHARACTERS.forEach(c => probeImg([c.img, c.alt], (u) => { CHAR_IMG[c.id] = u; render(); }));
  Object.keys(D.SCENE_ART).forEach(sc => probeImg([D.SCENE_ART[sc]], () => { SCENE_OK[sc] = true; if (sc === currentScene) render(); }));
  function who(id) { return D.CHARACTERS.find(c => c.id === id) || D.CHARACTER; }
  function avatar(mood, id) {
    const c = who(id);
    return CHAR_IMG[c.id] ? `<img class="cat" src="${esc(CHAR_IMG[c.id])}" alt="${esc(c.name)}">` : ART.milo(mood || 'happy');
  }
  let currentScene = null;
  function applyScene() {
    const sc = currentScene, b = document.body;
    b.dataset.scene = sc || '';
    if (sc && SCENE_OK[sc]) { b.style.setProperty('--scene-img', `url('${new URL(D.SCENE_ART[sc], location.href).href}')`); b.classList.add('has-scene'); }
    else { b.classList.remove('has-scene'); }
  }

  /* ---------------- state ---------------- */
  /* Game state = engine state (M.newState) + UI-only fields. */
  const UI_DEFAULTS = { activeSub: 'structure', introStep: 0, closed: {}, phase0Done: false, phase1Done: false, showMath: {}, showMel: false };
  function fresh() { return Object.assign(M.newState(), JSON.parse(JSON.stringify(UI_DEFAULTS))); }
  /** SECURITY: saved data is untrusted. Engine fields go through M.sanitizeState; UI fields are whitelisted here. */
  function sanitizeUi(raw) {
    const ui = JSON.parse(JSON.stringify(UI_DEFAULTS));
    if (!raw || typeof raw !== 'object') return ui;
    if (D.SUBSYSTEMS.some(x => x.id === raw.activeSub)) ui.activeSub = raw.activeSub;
    ui.introStep = Number.isInteger(raw.introStep) ? Math.max(0, Math.min(2, raw.introStep)) : 0;
    ui.phase0Done = raw.phase0Done === true; ui.phase1Done = raw.phase1Done === true; ui.showMel = raw.showMel === true;
    const flags = (o, keys) => { const out = {}; if (o && typeof o === 'object') keys.forEach(k => { if (o[k] === true) out[k] = true; }); return out; };
    ui.closed = flags(raw.closed, ['f0', 'f1a', 'f1b', 'f1done']);
    ui.showMath = flags(raw.showMath, ['density', 'rocket', 'battery']);
    return ui;
  }
  const params = new URLSearchParams(location.search);
  const DEMO = params.get('demo');
  let S = load() || fresh();

  function load() {
    if (DEMO) return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw || raw.length > 20000) return null;
      const parsed = JSON.parse(raw);
      const st = Object.assign(M.sanitizeState(parsed), sanitizeUi(parsed));
      M.evaluate(st); // must not throw after sanitizing
      return st;
    } catch (e) { return null; }
  }
  function save() {
    if (DEMO) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep playing in memory */ }
  }

  /* Preset states used for screenshots and judging demos (?demo=name#route) */
  const roboticDesign = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
  const crewedDesign = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'crewSolarBat', science: ['camera', 'sampler'] };
  const DEMOS = {
    'f0-empty': {},
    'f0-full': { question: 'made', measure: 'chem', missionType: 'robotic', showMath: { density: true } },
    'f1-robotic': { question: 'made', measure: 'chem', missionType: 'robotic', phase0Done: true, design: roboticDesign, activeSub: 'power', showMath: { battery: true } },
    'f1-crewed': { question: 'made', measure: 'sample', missionType: 'crewed', phase0Done: true, design: crewedDesign, activeSub: 'science', showMath: { rocket: true } },
    'f1-partial': { question: 'water', measure: 'chem', missionType: 'robotic', phase0Done: true, design: { structure: 'composite', science: [] }, activeSub: 'shield' },
    'f1b-crewed': { question: 'made', measure: 'sample', missionType: 'crewed', phase0Done: true, design: crewedDesign },
    'f1b-robotic': { question: 'made', measure: 'chem', missionType: 'robotic', phase0Done: true, design: roboticDesign, rocket: 'medium' },
    'f1b-over': { question: 'water', measure: 'chem', missionType: 'robotic', difficulty: 'director', phase0Done: true, design: { structure: 'aluminum', shield: 'solid', thermal: 'active', power: 'rps', science: ['camera', 'spectrometer', 'neutron'] }, rocket: 'medium' },
    'f1done': { question: 'made', measure: 'chem', missionType: 'robotic', phase0Done: true, phase1Done: true, design: roboticDesign, rocket: 'medium' },
  };
  if (DEMO && DEMOS[DEMO]) S = Object.assign(fresh(), JSON.parse(JSON.stringify(DEMOS[DEMO])));

  /* ---------------- helpers ---------------- */
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kg = (x) => fmt(x) + ' kg';
  const usd = (x) => '$' + fmt(x) + 'M';
  function srcOrg(key) {
    const s = D.SOURCES[key]; if (!s) return 'Game value';
    if (s.url.includes('esa.int')) return 'ESA';
    if (s.url.includes('nist.gov')) return 'NIST';
    return 'NASA';
  }
  function srcChip(key, label) {
    if (!key || key === 'game') return `<span class="chip game" role="button" tabindex="0" data-act="src" data-key="game" title="Tuned for gameplay, not a measured fact">Game value</span>`;
    return `<span class="chip src" role="button" tabindex="0" data-act="src" data-key="${esc(key)}" title="${esc(D.SOURCES[key] && D.SOURCES[key].title)}">${(label || srcOrg(key) + ' source').replace(/\s*↗$/, '')} ↗</span>`;
  }
  function fact(key) {
    const f = D.FACTS[key]; if (!f) return '';
    return `<div class="dyk"><span class="q">Did you know?</span><span>${esc(f.text)} ${srcChip(f.src)}</span></div>`;
  }
  function strengthBar(n) {
    return `<span class="strength" aria-label="Proof strength ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  }
  function bubble(id, html, mood, charId) {
    if (S.closed[id]) return '';
    const c = who(charId);
    return `<div class="bubble"><div class="avatar">${avatar(mood, c.id)}</div><p><b>${esc(c.name)}:</b> ${html}</p><button class="x" data-act="close-bubble" data-id="${id}" aria-label="Close">×</button></div>`;
  }
  function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; $toast.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
  function modal(html) {
    $modal.innerHTML = `<div class="modal-back" data-act="close-modal"><div class="modal" role="dialog" aria-modal="true">${html}<div class="actions"><button class="btn primary" data-act="close-modal">Got it</button></div></div></div>`;
    const b = $modal.querySelector('.modal .btn'); if (b) b.focus();
  }
  function mathBlock(m) {
    if (!m) return '';
    return `<div class="math"><div class="kicker" style="margin-bottom:6px">${esc(m.title)}</div>${m.steps.map(s => `<div class="row"><span class="eq">${esc(s.eq)}</span><span class="num">${esc(s.num)}</span></div>`).join('')}${m.check ? `<div class="check">${esc(m.check)} ${m.src ? srcChip(m.src) : ''}</div>` : ''}</div>`;
  }
  function mathToggle(id, label) {
    const open = !!S.showMath[id];
    return `<button class="btn ghost math-toggle" data-act="toggle-math" data-id="${id}" aria-expanded="${open}">${open ? '▾ Hide the math' : '▸ ' + (label || 'Show the math')}</button>`;
  }

  /* ---------------- derived ---------------- */
  const mission = () => D.MISSION_TYPES.find(t => t.id === S.missionType);
  const rockets = () => D.ROCKETS[S.missionType] || [];
  function profileName() {
    if (!S.missionType) return '—';
    if (S.missionType === 'crewed') return 'Crewed landing and return (Apollo-style)';
    return S.measure === 'sample' ? 'Robotic sample return (like the Luna probes)' : 'Robotic lander, one-way';
  }
  function measureStrength() { const m = D.MEASURES.find(x => x.id === S.measure); return m ? m.strength : 0; }

  /* ---------------- HUD ---------------- */
  function meterHtml(o) {
    const pct = o.limit ? Math.min(o.value / o.limit, 1.2) : 0;
    const cls = o.locked ? 'locked' : (o.limit && o.value > o.limit ? 'over' : (pct >= 0.8 ? 'warn' : ''));
    let ghost = '', delta = '';
    if (o.preview != null && o.limit && Math.abs(o.preview - o.value) > 0.5) {
      const p2 = Math.min(o.preview / o.limit, 1.2);
      const lo = Math.min(pct, p2), hi = Math.max(pct, p2);
      ghost = `<span class="ghost" style="left:${(lo / 1.2) * 100}%;width:${((hi - lo) / 1.2) * 100}%"></span>`;
      const d = o.preview - o.value;
      delta = `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${o.unitFmt(Math.abs(d))}</span>`;
    }
    return `<button class="meter ${cls}" ${o.locked ? 'tabindex="-1" aria-disabled="true"' : `data-act="meter" data-id="${o.id}"`} title="${esc(o.title + (o.note ? ' (' + o.note + ')' : ''))}">
      <div class="top"><span>${o.icon} ${esc(o.label)}</span>${delta}</div>
      <div class="val">${o.locked ? esc(o.lockedText) : esc(o.text)}</div>
      <div class="bar"><span class="fill" style="width:${(pct / 1.2) * 100}%"></span>${ghost}</div></button>`;
  }
  function hudMeters(r, pv) {
    const type = S.missionType;
    const rk = r && r.rocket;
    const capMax = type ? Math.max(...rockets().map(x => x.capacity)) : 0;
    const cap = rk ? rk.capacity : capMax;
    const budget = type ? D.BUDGET[type][S.difficulty] : 0;
    const out = [];
    out.push({
      id: 'mass', icon: '⚖️', label: 'Launch mass', title: 'Mass the rocket must send toward the Moon (spacecraft + fuel)',
      value: r ? r.tli : 0, preview: pv ? pv.tli : null, limit: r ? cap : 0, unitFmt: kg,
      text: r ? `${kg(r.tli)} / ${fmt(cap)}` : 'Pick a mission', note: rk ? 'limit: ' + rk.title : (type ? 'compared with the biggest rocket' : ''),
    });
    out.push({
      id: 'cost', icon: '💰', label: 'Budget', title: 'Total cost vs your budget',
      value: r ? r.totalCost : 0, preview: pv ? pv.totalCost : null, limit: budget, unitFmt: usd,
      text: r ? `${usd(r.totalCost)} / ${usd(budget)}` : '—', note: r && !rk ? '+ rocket' : '',
    });
    const hasPower = r && r.powerGen > 0;
    out.push({
      id: 'power', icon: '⚡', label: 'Power', title: 'Power your instruments need vs what your power system makes (in sunlight)',
      value: r ? r.powerNeed : 0, preview: pv && pv.powerGen > 0 ? pv.powerNeed : null, limit: hasPower ? r.powerGen : 0, unitFmt: (x) => fmt(x) + ' W',
      text: r ? (hasPower ? `${fmt(r.powerNeed)} / ${fmt(r.powerGen)} W` : `${fmt(r.powerNeed)} W needed`) : '—', note: r && !hasPower ? 'pick power' : '',
    });
    out.push({ id: 'dv', icon: '🚀', label: 'Delta-v', locked: true, lockedText: 'Phase 3', title: 'Delta-v = how much your spacecraft can change its speed. Unlocks in Phase 3.' });
    out.push({ id: 'days', icon: '📅', label: 'Days', locked: true, lockedText: type === 'robotic' ? 'No crew' : 'Phase 2', title: 'Mission days: how long your crew must survive. Unlocks in Phase 2.' });
    out.push({ id: 'data', icon: '📡', label: 'Data', locked: true, lockedText: 'Phase 4', title: 'Data you can send back to Earth. Unlocks in Phase 4.' });
    return out.map(meterHtml).join('');
  }
  function hud(pv) {
    const r = M.evaluate(S);
    return `<header class="hud" id="hud"><div class="brand">Space<span>Syntax</span></div><div class="meters" id="meters">${hudMeters(r, pv)}</div><button class="icon-btn" data-act="menu" aria-label="Menu">☰</button></header>`;
  }
  function refreshHud(pv) {
    const el = document.getElementById('meters'); if (el) el.innerHTML = hudMeters(M.evaluate(S), pv);
  }

  const PHASES = ['Goal', 'Spacecraft', 'Crew', 'Flight', 'Comms', 'Landing', 'Science', 'Return'];
  function phasebar(cur) {
    return `<nav class="phasebar" aria-label="Mission phases">${PHASES.map((n, i) => {
      const done = (i === 0 && S.phase0Done) || (i === 1 && S.phase1Done);
      const reachable = i === 0 || (i === 1 && S.phase0Done);
      const cls = i === cur ? 'current' : (done ? 'done' : (i > 1 ? 'locked' : ''));
      const act = reachable && i !== cur ? `data-act="go" data-to="${i === 0 ? 'f0' : 'f1a'}"` : 'tabindex="-1"';
      return `<button class="phase ${cls} ${reachable && i !== cur ? 'link' : ''}" ${act} ${i > 1 ? 'title="Coming soon"' : ''}><span class="n">${done && i !== cur ? '✓' : i}</span>${n}</button>`;
    }).join('')}</nav>`;
  }
  function footer(back, primary) {
    return `<footer class="footer">${back ? `<button class="btn" data-act="go" data-to="${back.to}">← ${esc(back.label)}</button>` : ''}
      <button class="btn ghost" data-act="howto">? Help</button><span class="spacer"></span>
      ${primary.reason ? `<span class="reason">${esc(primary.reason)}</span>` : ''}
      <button class="btn primary" data-act="${primary.act}" ${primary.reason ? 'disabled' : ''}>${esc(primary.label)} →</button></footer>`;
  }

  /* ---------------- screens ---------------- */
  function screenStart() {
    return `<div class="screen hero-wrap"><section class="hero">
      <div><div class="kicker">NASA Space Apps 2026 · Space Mission Design</div>
        <h1>Is the Moon made of <span>cheese</span>?</h1>
        <p class="sub">${esc(NAME)} is sure it is. Design a real Moon mission, with NASA data and real math, and find out.</p>
        <div class="kicker" style="margin-bottom:8px">Difficulty</div>
        <div class="diff">${D.DIFFICULTIES.map(d => `<button class="card" data-act="diff" data-id="${d.id}" aria-pressed="${S.difficulty === d.id}"><h4>${esc(d.title)}</h4><p>${esc(d.blurb)}</p></button>`).join('')}</div>
        <div class="row"><button class="btn primary big" data-act="start">Start mission 🚀</button>
          ${S.phase0Done ? `<button class="btn big" data-act="go" data-to="${S.phase1Done ? 'f1done' : 'f1a'}">Continue</button>` : ''}
          <button class="btn ghost" data-act="howto">How to play</button></div>
      </div><div class="moon">${SCENE_OK.space ? '' : ART.moon(400)}</div></section><button class="sources-link" data-act="sources">Sources</button></div>`;
  }

  const INTRO = [
    { mood: 'happy', text: `I've always believed the Moon is made of cheese.` },
    { mood: 'thinking', text: `Nobody believes me. So I'm going to test it with a real mission, starting right here on Earth.` },
    { mood: 'wow', text: `First we plan and build at the launch site. Every choice costs mass, money or power. Scientists call that a trade-off. Let's go!` },
  ];
  function screenIntro() {
    const i = Math.min(S.introStep, INTRO.length - 1), sl = INTRO[i];
    return `<div class="screen intro-wrap"><section class="intro"><div class="slide">
      <div class="avatar">${avatar(sl.mood)}</div><p>"${esc(sl.text)}"</p>
      <div class="dots">${INTRO.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn primary big" data-act="intro-next">${i < INTRO.length - 1 ? 'Next' : 'Define the mission'} →</button>
      <div style="margin-top:12px"><button class="btn ghost" data-act="go" data-to="f0">Skip intro</button></div>
    </div></section></div>`;
  }

  function screenF0() {
    const qDone = !!S.question, mDone = !!S.measure, tDone = !!S.missionType;
    const q = D.QUESTIONS.find(x => x.id === S.question);
    const tip = q && S.measure && measureStrength() < (D.MEASURES.find(x => x.id === q.bestMeasure) || {}).strength
      ? `<div class="dyk" style="margin-top:10px"><span class="q">Tip</span><span>For "${esc(q.title)}", <b>${esc(D.MEASURES.find(x => x.id === q.bestMeasure).title.toLowerCase())}</b> gives stronger proof.</span></div>` : '';
    const card = (act, o, selected, extra) => `<div role="button" tabindex="0" class="card" data-act="${act}" data-id="${o.id}" aria-pressed="${selected}"><span class="ic" aria-hidden="true">${o.icon}</span><h4>${esc(o.title)}</h4><p>${esc(o.blurb)}</p>${extra || ''}</div>`;
    const reqs = [];
    if (S.measure) {
      const need = M.requiredInstruments(S).map(id => M.findOpt('science', id).title);
      reqs.push(`Carry: ${need.join(' or ')}`);
    }
    if (S.missionType) reqs.push(M.needsReturn(S) ? 'Must come back to Earth (fuel for the return!)' : 'One-way trip: no return fuel needed');
    if (S.question === 'water') reqs.push('Hint for Phase 5: polar craters hide ice');
    if (S.question === 'age') reqs.push('Hint for Phase 5: dark lava plains (maria) have been dated');
    const missing = !qDone ? 'Pick a question' : !mDone ? 'Pick a measurement' : !tDone ? 'Pick a mission type' : '';

    return `<div class="screen">${hud()}${phasebar(0)}<main class="main"><div>
      <div class="phase-title"><span class="kicker">Phase 0 · Mission control, Earth</span></div>
      <div class="phase-title"><h1>Set your mission goal</h1></div>
      <p class="lead">Real NASA missions start with a question, not a spacecraft. Your answers here decide which instruments you can fly.</p>
      ${bubble('f0', `I'm <b>100% sure</b> the Moon is made of cheese. But a scientist needs proof. What would convince you?`, 'thinking')}
      <section class="step ${qDone ? 'done' : ''}"><div class="step-head"><span class="step-num">${qDone ? '✓' : 1}</span><h2>What do you want to find out?</h2></div>
        <div class="cards">${D.QUESTIONS.map(o => card('pick-q', o, S.question === o.id, o.src ? `<div class="chips">${srcChip(o.src)}</div>` : '')).join('')}</div></section>
      <section class="step ${mDone ? 'done' : ''} ${qDone ? '' : 'locked'}"><div class="step-head"><span class="step-num">${mDone ? '✓' : 2}</span><h2>What measurement would prove it?</h2></div>
        <div class="cards">${D.MEASURES.map(o => card('pick-m', o, S.measure === o.id, `<div class="chips"><span class="chip">${strengthBar(o.strength)} ${esc(o.strengthLabel)}</span></div>`)).join('')}</div>${tip}</section>
      <section class="step ${tDone ? 'done' : ''} ${mDone ? '' : 'locked'}"><div class="step-head"><span class="step-num">${tDone ? '✓' : 3}</span><h2>Robots or people?</h2></div>
        <div class="cards">${D.MISSION_TYPES.map(o => card('pick-t', o, S.missionType === o.id, `<div class="chips">${srcChip(D.FACTS[o.fact].src)}</div>`)).join('')}</div>
        ${S.missionType ? `<div style="margin-top:10px">${fact(mission().fact)}</div>` : ''}</section>
      <section class="panel"><h3>🧮 Test the hypothesis before you even launch</h3>
        <p class="sub-why" style="margin:0">NASA measured the Moon's mass and size. With one formula you can find its density — and compare it with water.</p>
        ${mathToggle('density', 'Do the math: how dense is the Moon?')}
        ${S.showMath.density ? mathBlock(M.moonDensityMath()) + '<div style="height:8px"></div>' + mathBlock(M.moonGravityMath()) + `<p class="gear" style="margin-top:8px">A density of 3.3× water means rock and metal. Suspicious for a cheese Moon… but you need a direct measurement to be sure.</p>` : ''}
      </section>
    </div>
    <aside><div class="panel mission-card"><div class="kicker">Mission card</div>
      <div class="hypothesis">Hypothesis: "The Moon is made of cheese."</div>
      <dl><dt>Question</dt><dd>${esc(q ? q.title : '—')}</dd>
        <dt>Measurement</dt><dd>${esc(S.measure ? D.MEASURES.find(x => x.id === S.measure).title : '—')}</dd>
        <dt>Mission</dt><dd>${esc(profileName())}</dd>
        <dt>Proof strength</dt><dd>${strengthBar(measureStrength())}</dd></dl>
      ${reqs.length ? `<div class="kicker" style="margin-top:12px">Requirements</div><ul class="reqs">${reqs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    </div><div class="panel">${fact('lifecycle')}<div style="height:8px"></div>${fact('requirements')}</div></aside></main>
    ${footer({ to: 'start', label: 'Home' }, { act: 'f0-confirm', label: 'Lock in goal', reason: missing })}</div>`;
  }

  function optionCard(sub, o, r) {
    const type = S.missionType, v = o[type] || {};
    const isMulti = !!sub.multi;
    const selected = isMulti ? (S.design.science || []).includes(o.id) : S.design[sub.id] === o.id;
    const unlocked = sub.id !== 'science' || M.unlockedInstruments(S).includes(o.id);
    const answers = sub.id === 'science' && M.requiredInstruments(S).includes(o.id);
    const pv = M.previewWith(S, sub.id, o.id);
    const dMass = selected ? 0 : pv.tli - r.tli;
    const mass = v.frac != null ? `${Math.round(v.frac * 100)}% of hull` : kg(sub.id === 'power' && type === 'robotic' ? M.powerMass(v) : v.mass);
    const chips = [
      `<span class="chip">⚖️ ${mass}</span>`,
      v.power ? `<span class="chip">⚡ uses ${fmt(v.power)} W</span>` : '',
      v.gen ? `<span class="chip ok">⚡ makes ${fmt(v.gen)} W</span>` : '',
      `<span class="chip">💰 ${usd(v.cost || 0)}</span>`,
      o.protection ? `<span class="chip">🛡️ ${'●'.repeat(o.protection)}${'○'.repeat(4 - o.protection)}</span>` : '',
      v.nightHours != null ? `<span class="chip ${v.nightHours > 300 ? 'ok' : v.nightHours > 0 ? 'warn' : 'bad'}">🌙 ${v.nightHours > 300 ? 'survives any night' : v.nightHours > 0 ? 'survives ' + v.nightHours + ' h dark' : 'no night survival'}</span>` : '',
      answers ? `<span class="chip ok">✓ answers your question</span>` : '',
      !selected && Math.abs(dMass) > 0.5 ? `<span class="chip ${dMass > 0 ? 'warn' : 'ok'}">🚀 ${dMass > 0 ? '+' : '−'}${kg(Math.abs(dMass))} at launch</span>` : '',
      srcChip(o.src, o.src && o.src !== 'game' ? 'Based on ' + srcOrg(o.src) + ' ↗' : null),
    ].join('');
    return `<div role="button" tabindex="0" class="card ${unlocked ? '' : 'blocked'}" data-act="${unlocked ? 'opt' : 'opt-locked'}" data-sub="${sub.id}" data-id="${o.id}" aria-pressed="${selected}" ${unlocked ? '' : 'aria-disabled="true"'}>
      <h4>${esc(o.title)}</h4><p>${esc(o.blurb)}</p>${unlocked ? '' : `<span class="why-locked">🔒 Your Phase 0 measurement doesn't need this</span>`}<div class="chips">${chips}</div></div>`;
  }

  function rocketMathHtml() {
    const rm = M.rocketMath(S); if (!rm) return '';
    return `<div class="math"><p class="plain">In plain words: fuel is heavy, and you need even more fuel to lift that fuel. That's why rockets are huge.</p><div class="kicker" style="margin-bottom:6px">Tsiolkovsky rocket equation (vₑ = exhaust speed, m₀ = mass before, m_f = mass after)</div>
      <div class="row"><span class="eq">Δv = vₑ · ln(m₀ / m_f)</span><span class="num">Each burn needs a mass ratio m₀/m_f = e^(Δv / vₑ)</span></div>
      <div class="row"><span class="eq">vₑ = Isp · g₀</span><span class="num">Isp ${rm.isp} s (engine efficiency) × ${D.ENGINE.g0} m/s² = ${fmt(rm.ve)} m/s ${srcChip('spsIsp', 'Apollo engine ↗')}</span></div>
      <table class="burns" style="margin-top:8px"><thead><tr><th>Burn (in flight order)</th><th>Δv m/s</th><th>m₀/m_f</th><th>Fuel kg</th><th>Tanks kg</th><th>Mass before kg</th></tr></thead><tbody>
      ${rm.burns.map(b => `<tr><td>${esc(b.name)}</td><td>${fmt(b.dv)}</td><td>${b.ratio.toFixed(2)}</td><td>${fmt(b.prop)}</td><td>${fmt(b.tanks)}</td><td>${fmt(b.mStart)}</td></tr>`).join('')}
      </tbody></table>
      <p class="gear" style="margin:8px 0 0">Δv values from NASA lunar studies ${srcChip('altair')} ${srcChip('cev')}. Mass before = mass after + fuel + tanks. Tanks weigh ${Math.round(D.ENGINE.tankFraction * 100)}% of their fuel (game value). Trans-lunar injection (${fmt(D.DV.tli.value)} m/s) is done by the rocket's upper stage, so it is not in this table.</p></div>`;
  }

  function spacecraftSummary(r) {
    return `<div class="panel"><div class="kicker">Your spacecraft</div>
      <div class="massline" style="margin-top:8px"><div><div class="big">${kg(r.dry)}</div><div class="lbl">Hardware (dry)</div></div>
        <div><div class="big">${kg(r.propellant)}</div><div class="lbl">Fuel + tanks</div></div>
        <div><div class="big" style="color:var(--cheese)">${kg(r.tli)}</div><div class="lbl">Launch mass</div></div></div>
      <p class="gear" style="margin:10px 0 0">Fuel is <b>${fmt(r.propellant / r.dry * 100)}%</b> of your hardware mass. That's the rocket equation at work.</p>
      ${mathToggle('rocket', 'Show the math: why so much fuel?')}${S.showMath.rocket ? rocketMathHtml() : ''}</div>`;
  }

  function melTable(r) {
    return `<table class="mel"><thead><tr><th>Item</th><th>kg</th><th>W</th><th>$M</th></tr></thead><tbody>
      ${r.lines.map(l => `<tr><td>${esc(l.label)}</td><td>${fmt(l.mass)}</td><td>${l.gen ? '+' + fmt(l.gen) : (l.power ? fmt(l.power) : '')}</td><td>${l.cost ? fmt(l.cost) : ''}</td></tr>`).join('')}
      ${r.rocket ? `<tr><td>Rocket: ${esc(r.rocket.title)}</td><td></td><td></td><td>${fmt(r.rocket.cost)}</td></tr>` : ''}
      </tbody><tfoot><tr><td>Total (dry)</td><td>${fmt(r.dry)}</td><td>${fmt(r.powerNeed)}</td><td>${fmt(r.totalCost)}</td></tr></tfoot></table>
      <p class="gear">MEL = Master Equipment List, the same table NASA's Mission Design Lab builds ${srcChip('mdl')}. Hardware masses and costs are game values scaled from real missions.</p>`;
  }

  function screenF1a() {
    const r = M.evaluate(S);
    const type = S.missionType;
    const sub = M.findSub(S.activeSub) || D.SUBSYSTEMS[0];
    const missing = M.missingSubsystems(S);
    const opts = M.optionsFor(sub.id, type);
    const selOpt = sub.multi ? null : S.design[sub.id];
    const gearWhere = M.whereOf(type, sub.id, selOpt);
    const ratio = M.gearForSub(type, sub.id, selOpt);
    const whereText = type === 'crewed' ? ({ all: 'the whole spacecraft (average)', orbiter: 'the orbiter', descent: 'the lander base', split: 'orbiter + lander', ascent: 'the lander cabin' }[gearWhere]) : 'your lander';
    let reason = '';
    if (missing.length) reason = 'Still to choose: ' + missing.map(id => M.findSub(id).title).join(', ');
    else if (!M.payloadAnswers(S)) reason = 'Add an instrument that answers your Phase 0 question';
    let extra = '';
    if (sub.id === 'power' && type === 'robotic') {
      extra = `<div class="panel" style="margin-top:14px"><h3>🔋 Batteries: real math</h3><p class="sub-why" style="margin:0">To survive darkness your lander needs about ${D.BATTERY.survivalPower} W ${srcChip('nightPower')}. Battery packs in this mission store ${D.BATTERY.specificEnergy} Wh per kg ${srcChip('game')}.</p>
        ${mathToggle('battery', 'Show the math: how big a battery?')}${S.showMath.battery ? mathBlock(M.batteryMath(100)) + '<div style="height:8px"></div>' + mathBlock(M.batteryMath(354)) + `<p class="gear">354 h is one night at the equator ${srcChip('rps')}. Real batteries can't be drained to 0% and need margins, so NASA studies suggest a lot more mass than this ideal number.</p>` : ''}</div>`;
    }
    if (sub.id === 'science' && type === 'crewed') {
      extra = `<p class="gear" style="margin-top:10px">Samples ride in the lander cabin: every kg you bring back costs about <b>${M.gearRatio('crewed', 'ascent').toFixed(1)} kg</b> at launch, because it must land AND lift off again.</p>`;
    }
    return `<div class="screen">${hud()}${phasebar(1)}<main class="main"><div>
      <div class="phase-title"><span class="kicker">Phase 1 · Assembly building, Earth</span></div>
      <div class="phase-title"><h1>Build your spacecraft</h1></div>
      ${bubble('f1a', `Heavier spacecraft need bigger rockets, and bigger rockets cost more. Watch the <b>Launch mass</b> meter!`, 'happy')}
      <div class="workshop"><div class="tabs" role="tablist">${D.SUBSYSTEMS.map(s => {
        const done = !missing.includes(s.id);
        return `<button class="tab" role="tab" data-act="tab" data-id="${s.id}" aria-selected="${s.id === sub.id}"><span aria-hidden="true">${s.icon}</span>${esc(s.title)}${done ? '<span class="ok">✓</span>' : '<span class="todo" aria-label="to do"></span>'}</button>`;
      }).join('')}</div>
      <div><div class="shipview">${ART.ship(type, S.design, sub.id)}</div>
        <h2 style="font-size:20px;margin-bottom:4px">${sub.icon} ${esc(sub.title)}${sub.multi ? ' <span class="chip">pick one or more</span>' : ''}</h2>
        <p class="sub-why">${esc(sub.why)}</p>
        <p class="gear">Every 1 kg added to ${whereText} costs about <b>${ratio.toFixed(1)} kg</b> at launch (fuel to push it, plus fuel to push that fuel).</p>
        <div class="cards">${opts.map(o => optionCard(sub, o, r)).join('')}</div>
        <div style="margin-top:12px">${fact(sub.fact)}</div>${extra}</div></div>
    </div><aside>${spacecraftSummary(r)}
      <div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><div class="kicker">Equipment list</div><button class="btn ghost" data-act="toggle-mel">${S.showMel ? 'Hide' : 'Show'} parts list (MEL)</button></div>${S.showMel ? melTable(r) : ''}</div></aside></main>
    ${footer({ to: 'f0', label: 'Phase 0' }, { act: 'f1a-next', label: 'Choose rocket', reason })}</div>`;
  }

  function screenF1b() {
    const r = M.evaluate(S);
    const budget = r.budget;
    const fitsAny = rockets().some(k => k.capacity >= r.tli);
    const cards = rockets().map(k => {
      const fits = k.capacity >= r.tli, margin = (k.capacity - r.tli) / k.capacity;
      const over = r.cost + k.cost > budget;
      const verdict = !fits ? `<span class="verdict bad">Too heavy by ${kg(r.tli - k.capacity)}</span>`
        : margin < 0.1 ? `<span class="verdict warn">Fits, only ${fmt(margin * 100)}% margin</span>` : `<span class="verdict ok">Fits with ${fmt(margin * 100)}% margin</span>`;
      return `<div role="button" tabindex="0" class="card rocket-card ${fits ? '' : 'blocked'}" data-act="${fits ? 'rocket' : 'rocket-no'}" data-id="${k.id}" aria-pressed="${S.rocket === k.id}">
        ${ART.rocket(k.id, r.tli / k.capacity, fits)}<h4 style="padding:0">${esc(k.title)}</h4><div class="cap">${fmt(k.capacity / 1000)} t</div>
        <p>${esc(k.blurb)}</p>${verdict}<div class="chips" style="justify-content:center"><span class="chip ${over ? 'bad' : ''}">💰 ${usd(k.cost)}</span>${srcChip(k.capSrc, k.capSrc === 'game' ? null : 'Capacity: NASA ↗')}${k.costSrc !== k.capSrc ? srcChip(k.costSrc, k.costSrc === 'game' ? null : 'Cost: NASA OIG ↗') : ''}</div></div>`;
    }).join('');
    const total = r.totalCost;
    let reason = '';
    if (!S.rocket) reason = fitsAny ? 'Pick a rocket that can lift your spacecraft' : 'No rocket can lift this — make your spacecraft lighter';
    else if (total > budget) reason = `Over budget by ${usd(total - budget)}`;
    const needDescope = !fitsAny || (S.rocket && total > budget);
    const by = descopeMode();
    const sugg = needDescope ? M.descopeSuggestions(S, by) : [];
    const verdictFor = (sg) => {
      if (by === 'cost') { const left = sg.after.totalCost - budget; return left <= 0 ? '<span class="chip ok">fixes the budget</span>' : `<span class="chip warn">still ${usd(left)} over</span>`; }
      const maxCap = Math.max(...rockets().map(x => x.capacity)); return sg.after.tli <= maxCap ? '<span class="chip ok">fits a rocket</span>' : `<span class="chip warn">still ${kg(sg.after.tli - maxCap)} too heavy</span>`;
    };
    return `<div class="screen">${hud()}${phasebar(1)}<main class="main"><div>
      <div class="phase-title"><span class="kicker">Phase 1 · Launch pad, Earth</span></div>
      <div class="phase-title"><h1>Pick your rocket</h1></div>
      ${bubble('f1b', `The rocket's job: throw our spacecraft toward the Moon. The green gauge shows how full each rocket would be.`, 'wow')}
      <div class="panel" style="margin-bottom:14px"><div class="massline"><div><div class="big">${kg(r.dry)}</div><div class="lbl">Hardware</div></div><div><div class="big">+ ${kg(r.propellant)}</div><div class="lbl">Fuel for the Moon trip</div></div><div><div class="big" style="color:var(--cheese)">= ${kg(r.tli)}</div><div class="lbl">Rocket must lift</div></div></div></div>
      <div class="rockets">${cards}</div>
      ${needDescope ? `<div class="panel descope" style="margin-top:14px;border-color:var(--warn)"><h3>✂️ ${by === 'cost' ? 'Over budget?' : 'Too heavy?'} Trim the design</h3><p class="sub-why" style="margin:0">Real NASA teams "descope" (cut back) when a design doesn't fit ${srcChip('seHandbook')}. Biggest ${by === 'cost' ? 'money' : 'launch-mass'} savings first:</p>
        <ul>${sugg.map((s, i) => `<li><span>${esc(s.label)} ${s.saves > 0.5 ? `<span class="chip ok">−${kg(s.saves)}</span>` : ''} ${s.costSaves > 0 ? `<span class="chip ok">−${usd(s.costSaves)}</span>` : s.costSaves < 0 ? `<span class="chip warn">+${usd(-s.costSaves)}</span>` : ''} ${verdictFor(s)}</span><button class="btn" data-act="descope" data-i="${i}">Apply</button></li>`).join('')}</ul></div>` : ''}
    </div><aside><div class="panel"><div class="kicker">Budget</div><table class="mel" style="margin-top:6px"><tbody>
        <tr><td>Spacecraft</td><td>${usd(r.cost)}</td></tr><tr><td>Rocket</td><td>${r.rocket ? usd(r.rocket.cost) : '—'}</td></tr></tbody>
        <tfoot><tr><td>Total / budget</td><td style="color:${total > budget ? 'var(--danger)' : 'var(--ok)'}">${usd(total)} / ${usd(budget)}</td></tr></tfoot></table>
        <p class="gear">The SLS rocket alone costs about $2.2 billion per launch, according to NASA's Inspector General ${srcChip('oig')}.</p></div>
      <div class="panel">${fact(S.missionType === 'crewed' ? 'apolloStack' : 'lro')}<div style="height:8px"></div>${fact('slsCap')}</div>
      ${spacecraftSummary(r)}</aside></main>
    ${footer({ to: 'f1a', label: 'Workshop' }, { act: 'f1b-confirm', label: 'Confirm spacecraft', reason })}</div>`;
  }

  function screenF1Done() {
    const r = M.evaluate(S);
    const items = [
      ['Launch mass', r.rocket && r.tli <= r.rocket.capacity, `${kg(r.tli)} / ${fmt(r.rocket ? r.rocket.capacity : 0)}`],
      ['Budget', r.totalCost <= r.budget, `${usd(r.totalCost)} / ${usd(r.budget)}`],
      ['Power', r.powerGen >= r.powerNeed, `${fmt(r.powerNeed)} / ${fmt(r.powerGen)} W`],
      ['Science', M.payloadAnswers(S), 'answers your question'],
    ];
    const night = S.missionType === 'robotic' ? (r.nightHours > 300 ? 'Survives any lunar night' : r.nightHours > 0 ? `Survives about ${r.nightHours} h of darkness: pick a polar site in Phase 5` : 'Will not survive the lunar night: plan a short mission') : 'Crew lander power sized in later phases';
    return `<div class="screen">${hud()}${phasebar(1)}<main class="main"><div>
      <div class="done-hero"><div class="kicker">Phase 1 complete · Launch site, Earth</div><h1>Ready on the launch pad! 🚀</h1><p class="lead" style="margin:8px auto">${esc(profileName())} on ${esc(r.rocket ? r.rocket.title : '')}.</p></div>
      ${bubble('f1done', `Our spacecraft passed the design review. Next stop: ${S.missionType === 'crewed' ? 'feeding the crew' : 'the flight plan'}. The cheese truth is getting closer…`, 'wow')}
      <div class="panel"><div class="kicker" style="margin-bottom:8px">Design review: GO / NO GO</div><div class="gonogo">${items.map(([n, ok, v]) => `<div class="item"><span>${esc(n)}<br><span class="gear">${esc(v)}</span></span><span class="${ok ? 'go' : 'nogo'}">${ok ? 'GO' : 'NO GO'}</span></div>`).join('')}</div>
        <p class="gear" style="margin-top:10px">🌙 ${esc(night)}</p></div>
      <div class="panel"><div class="kicker">Master Equipment List</div>${melTable(r)}</div>
    </div><aside><div class="panel"><div class="kicker">Coming next</div><h3 style="margin-top:6px">${S.missionType === 'crewed' ? 'Phase 2 · Crew & life support' : 'Phase 3 · Flight plan & delta-v'}</h3>
      <p class="gear">${S.missionType === 'crewed' ? 'Each astronaut needs about 0.9 kg of oxygen, 0.8 kg of food and 3.2 kg of water per day (NASA BVAD).' : 'Spend your delta-v budget maneuver by maneuver.'}</p>
      <button class="btn primary" disabled style="width:100%;margin-top:8px">Next phase: coming soon</button><p class="gear" style="text-align:center">Our team is building it right now.</p></div>
      <div class="panel"><button class="btn" data-act="go" data-to="f1a" style="width:100%">← Back to workshop</button><div style="height:8px"></div><button class="btn ghost" data-act="sources" style="width:100%">See all NASA sources</button><button class="btn ghost" data-act="reset" style="width:100%">Start a new mission</button></div></aside></main></div>`;
  }

  /* ---------------- router ---------------- */
  const ROUTES = { start: screenStart, intro: screenIntro, f0: screenF0, f1a: screenF1a, f1b: screenF1b, f1done: screenF1Done };
  function route() {
    let r = (location.hash || '#start').slice(1);
    if (!ROUTES[r]) r = 'start';
    if ((r === 'f1a' || r === 'f1b') && !S.phase0Done) r = 'f0';
    if (r === 'f1b' && (M.missingSubsystems(S).length || !M.payloadAnswers(S))) r = 'f1a';
    if (r === 'f1done' && !S.phase1Done) r = S.phase0Done ? 'f1a' : 'f0';
    return r;
  }
  function focusKey(el) { return el && el.dataset ? [el.dataset.act, el.dataset.id, el.dataset.sub, el.dataset.to].join('|') : null; }
  function render() {
    const r = route();
    if (('#' + r) !== (location.hash || '#start')) history.replaceState(null, '', location.pathname + location.search + '#' + r);
    const y = window.scrollY;
    const fk = focusKey(document.activeElement);
    $app.innerHTML = ROUTES[r]();
    currentScene = D.SCENES[r] || null; applyScene();
    if (fk && render.keepScroll) {
      const match = [...$app.querySelectorAll('[data-act]')].find(n => focusKey(n) === fk);
      if (match) match.focus({ preventScroll: true });
    }
    document.title = 'Space Syntax — ' + ({ start: 'Is the Moon made of cheese?', intro: 'Intro', f0: 'Phase 0: Mission goal', f1a: 'Phase 1: Build', f1b: 'Phase 1: Rocket', f1done: 'Phase 1 complete' }[r]);
    if (render.keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    render.keepScroll = false;
  }
  function go(to) {
    if (('#' + to) === location.hash) render(); else location.hash = to;
  }
  /** Keep the design consistent after any change (stale rocket, broken Phase 1 approval). */
  function revalidate() {
    const r = M.evaluate(S); if (!r) { S.rocket = null; S.phase1Done = false; return; }
    if (S.rocket) { const k = rockets().find(x => x.id === S.rocket); if (!k || k.capacity < r.tli) { S.rocket = null; toast('Your spacecraft got too heavy for that rocket. Pick again.'); } }
    if (S.phase1Done) {
      const r2 = M.evaluate(S);
      const ok = S.rocket && !M.missingSubsystems(S).length && M.payloadAnswers(S) && r2.totalCost <= r2.budget;
      if (!ok) { S.phase1Done = false; toast('Design changed: your spacecraft needs a new check.'); }
    }
  }
  function descopeMode() {
    const r = M.evaluate(S); if (!r) return 'mass';
    return rockets().some(k => k.capacity >= r.tli) ? 'cost' : 'mass';
  }
  function update(fn, keepScroll) { fn(); revalidate(); save(); render.keepScroll = keepScroll !== false; render(); }

  /* ---------------- events ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    if (act === 'close-modal') { if (e.target === el) $modal.innerHTML = ''; return; }
    switch (act) {
      case 'go': $modal.innerHTML = ''; go(el.dataset.to); break;
      case 'diff': update(() => { S.difficulty = id; }); break;
      case 'start': S.introStep = 0; save(); go('intro'); break;
      case 'intro-next': if (S.introStep < INTRO.length - 1) update(() => { S.introStep++; }); else go('f0'); break;
      case 'close-bubble': update(() => { S.closed[id] = true; }); break;
      case 'pick-q': update(() => { S.question = id; }); break;
      case 'pick-m': update(() => { S.measure = id; const ok = M.unlockedInstruments(S); S.design.science = (S.design.science || []).filter(x => ok.includes(x)); }); break;
      case 'pick-t': update(() => {
        if (S.missionType !== id) { S.design.power = null; S.rocket = null; S.phase1Done = false; }
        S.missionType = id;
      }); break;
      case 'f0-confirm': S.phase0Done = true; save(); toast('Mission goal locked in ✓'); go('f1a'); break;
      case 'tab': update(() => { S.activeSub = id; }); break;
      case 'opt': update(() => {
        const sub = M.findSub(el.dataset.sub);
        if (sub.multi) { const a = S.design.science || []; S.design.science = a.includes(id) ? a.filter(x => x !== id) : a.concat(id); }
        else S.design[sub.id] = id;
        S.phase1Done = false;
        // auto-advance to the next unfinished subsystem for single-choice picks
        if (!sub.multi) { const miss = M.missingSubsystems(S); if (miss.length) S.activeSub = miss[0]; }
      }); break;
      case 'opt-locked': toast('Locked: your Phase 0 measurement doesn\'t need this instrument.'); break;
      case 'f1a-next': go('f1b'); break;
      case 'rocket': update(() => { S.rocket = id; }); break;
      case 'rocket-no': toast('Too heavy for this rocket. Make your spacecraft lighter or pick a bigger one.'); break;
      case 'descope': update(() => {
        const s = M.descopeSuggestions(S, descopeMode())[Number(el.dataset.i)]; if (!s) return;
        if (s.remove) S.design.science = S.design.science.filter(x => x !== s.opt); else S.design[s.sub] = s.opt;
        toast('Descoped: ' + s.label);
      }); break;
      case 'f1b-confirm': S.phase1Done = true; save(); toast('Spacecraft design locked ✓'); go('f1done'); break;
      case 'toggle-math': update(() => { S.showMath[id] = !S.showMath[id]; }); break;
      case 'toggle-mel': update(() => { S.showMel = !S.showMel; }); break;
      case 'src': {
        const k = el.dataset.key;
        if (k === 'game') modal(`<h2>Game value</h2><p>This number is tuned for gameplay and scaled from real missions. It is not a measured fact. Numbers marked with a NASA chip come straight from NASA sources.</p>`);
        else { const s = D.SOURCES[k]; modal(`<h2>Source</h2><p><b>${esc(s.title)}</b></p><p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a></p><p class="gear">Opened and checked by the Space Syntax team on Nov 14, 2026.</p>`); }
        break;
      }
      case 'meter': meterModal(id); break;
      case 'howto': modal(`<h2>How to play</h2><ol><li><b>Phase 0:</b> choose what you want to find out. That decides your instruments.</li><li><b>Phase 1:</b> build your spacecraft. Every part adds mass, cost and power.</li><li><b>Watch the meters on top.</b> Hover a card to preview its effect. Red means over the limit.</li><li><b>Show the math</b> panels use the real formulas NASA engineers use.</li><li>Blue chips = NASA facts. Yellow chips = game values.</li></ol>`); break;
      case 'sources': modal(`<h2>Sources</h2><ul>${Object.values(D.SOURCES).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul>`); break;
      case 'menu': modal(`<h2>Menu</h2><p><button class="btn" data-act="go" data-to="start">Home</button> <button class="btn" data-act="sources">Sources</button> <button class="btn" data-act="howto">How to play</button> <button class="btn warnish" data-act="reset">Restart mission</button></p>`); break;
      case 'reset': modal(`<h2>Start a new mission?</h2><p>Your current design will be erased.</p><p><button class="btn warnish" data-act="reset-yes">Yes, start over</button></p>`); break;
      case 'reset-yes': S = fresh(); save(); $modal.innerHTML = ''; go('start'); break;
    }
    if (act !== 'close-modal' && act !== 'src' && act !== 'meter' && act !== 'howto' && act !== 'sources' && act !== 'menu' && el.closest('.modal')) { /* modal nav */ if (act === 'go') $modal.innerHTML = ''; }
  });

  function meterModal(id) {
    const r = M.evaluate(S); if (!r) return modal('<h2>Pick a mission first</h2><p>Finish Phase 0 to see your budget.</p>');
    if (id === 'mass') return modal(`<h2>⚖️ Launch mass</h2><p>Your rocket must send your spacecraft <b>and all the fuel it will burn later</b> toward the Moon.</p>${rocketMathHtml()}`);
    if (id === 'cost') return modal(`<h2>💰 Budget</h2>${melTable(r)}`);
    if (id === 'power') return modal(`<h2>⚡ Power</h2><p>In sunlight your power system makes ${fmt(r.powerGen)} W; your spacecraft needs ${fmt(r.powerNeed)} W.</p>${melTable(r)}`);
  }

  // Hover / focus preview: show the ghost effect of an option in the HUD
  let lastPreview = null;
  function previewFrom(el) {
    const key = el && el.dataset.act === 'opt' ? el.dataset.sub + ':' + el.dataset.id : null;
    if (key === lastPreview) return;
    lastPreview = key;
    if (!key) return refreshHud(null);
    refreshHud(M.previewWith(S, el.dataset.sub, el.dataset.id));
  }
  document.addEventListener('focusout', () => previewFrom(null));
  document.addEventListener('mouseover', (e) => { const el = e.target.closest('[data-act="opt"]'); previewFrom(el); });
  document.addEventListener('focusin', (e) => { const el = e.target.closest('[data-act="opt"]'); if (el) previewFrom(el); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $modal.innerHTML = '';
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });
  window.addEventListener('hashchange', render);
  render();

})();
