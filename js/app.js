/* Space Syntax — UI for the start screen, intro, Phase 0 and Phase 1.
 * Plain script (no modules) so it runs from file:// and any static host.
 */
(function () {
  'use strict';
  const D = window.SS_DATA, M = window.SS_MODEL, SIM = window.SS_SIM;
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
  const UI_DEFAULTS = { activeSub: 'structure', introStep: 0, closed: {}, phase0Done: false, phase1Done: false, phase2Done: false, showMath: {}, showMel: false, seeds: {}, passed: {} };
  function fresh() { return Object.assign(M.newState(), JSON.parse(JSON.stringify(UI_DEFAULTS))); }
  /** SECURITY: saved data is untrusted. Engine fields go through M.sanitizeState; UI fields are whitelisted here. */
  function sanitizeUi(raw) {
    const ui = JSON.parse(JSON.stringify(UI_DEFAULTS));
    if (!raw || typeof raw !== 'object') return ui;
    if (D.SUBSYSTEMS.some(x => x.id === raw.activeSub)) ui.activeSub = raw.activeSub;
    ui.introStep = Number.isInteger(raw.introStep) ? Math.max(0, Math.min(2, raw.introStep)) : 0;
    ui.phase0Done = raw.phase0Done === true; ui.phase1Done = raw.phase1Done === true; ui.phase2Done = raw.phase2Done === true; ui.showMel = raw.showMel === true;
    const flags = (o, keys) => { const out = {}; if (o && typeof o === 'object') keys.forEach(k => { if (o[k] === true) out[k] = true; }); return out; };
    ui.closed = flags(raw.closed, ['f0', 'f1a', 'f1b', 'f1done', 'f2done']);
    ui.showMath = flags(raw.showMath, ['density', 'rocket', 'battery', 'life', 'play1', 'play2', 'play3', 'play4', 'play5', 'comms']);
    // Play layer: one seed per phase, and the fingerprint of the state each phase was passed with.
    if (raw.seeds && typeof raw.seeds === 'object') ['1', '2', '3', '4', '5'].forEach(k => { const v = raw.seeds[k]; if (Number.isInteger(v) && v >= 0 && v < 1e9) ui.seeds[k] = v; });
    if (raw.passed && typeof raw.passed === 'object') ['2', '3', '4', '5', 'launch'].forEach(k => { const v = raw.passed[k]; if (typeof v === 'string' && /^[0-9a-z]{1,12}$/.test(v)) ui.passed[k] = v; });
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
    'f2-crewed': { question: 'made', measure: 'sample', missionType: 'crewed', phase0Done: true, phase1Done: true, design: crewedDesign, rocket: 'sls2', crew: { size: 4, days: 10, reserve: 0, suit: 'lunar', recycler: false }, showMath: { life: true } },
    'f2-robotic': { question: 'made', measure: 'chem', missionType: 'robotic', phase0Done: true, phase1Done: true, design: roboticDesign, rocket: 'medium' },
    'f2done': { question: 'made', measure: 'sample', missionType: 'crewed', phase0Done: true, phase1Done: true, phase2Done: true, design: crewedDesign, rocket: 'sls2', crew: { size: 4, days: 10, reserve: 0.2, suit: 'lunar', recycler: false } },
    'f1done': { question: 'made', measure: 'chem', missionType: 'robotic', phase0Done: true, phase1Done: true, design: roboticDesign, rocket: 'medium' },
  };
  /* Later phases. _pass lists phases already passed, _play shows a finished or paused Play run (see demoPlay). */
  const gone = { phase0Done: true, phase1Done: true, phase2Done: true };
  const robo = Object.assign({ question: 'made', measure: 'chem', missionType: 'robotic', design: roboticDesign, rocket: 'medium' }, gone);
  const crew = Object.assign({ question: 'made', measure: 'sample', missionType: 'crewed', design: crewedDesign, rocket: 'sls2', crew: { size: 4, days: 10, reserve: 0.2, suit: 'lunar', recycler: false } }, gone);
  Object.assign(DEMOS, {
    'f2-played': Object.assign({}, crew, { phase2Done: false, seeds: { 2: 7 }, _play: { n: 2 } }),
    'f2-failed': Object.assign({}, crew, { phase2Done: false, crew: { size: 4, days: 3, reserve: 0, suit: 'lunar', recycler: false }, seeds: { 2: 7 }, _play: { n: 2 } }),
    'f3a': Object.assign({}, crew, { flight: { margin: 0.05 } }),
    'f3a-played': Object.assign({}, crew, { flight: { margin: 0.05 }, seeds: { 3: 7 }, _play: { n: 3 } }),
    'f3a-robotic': Object.assign({}, robo, { flight: { margin: 0.15 }, seeds: { 3: 7 }, _play: { n: 3 } }),
    'f4': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, _pass: [3] }),
    'f4-played': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, seeds: { 3: 7, 4: 7 }, _pass: [3], _play: { n: 4 } }),
    'f4-bottleneck': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'sband', dish: 'dsn34' }, seeds: { 3: 7, 4: 7 }, _pass: [3], _play: { n: 4 } }),
    'f3b-go': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, seeds: { 3: 7, 4: 7 }, _pass: [3, 4] }),
    'f3b-crewed': Object.assign({}, crew, { flight: { margin: 0.05 }, comms: { link: 'ka', dish: 'dsn70' }, seeds: { 3: 7, 4: 7 }, _pass: [2, 3, 4] }),
    'f3b-nogo': Object.assign({}, robo, { flight: { margin: 0 }, comms: null, _pass: [] }),
    'f3b-launched': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, seeds: { 1: 7, 3: 7, 4: 7 }, _pass: [3, 4], _play: { n: 1, kind: 'launch' } }),
    'f5a': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, seeds: { 1: 7, 3: 7, 4: 7 }, _pass: [3, 4, 'launch'] }),
    'f5a-crewed': Object.assign({}, crew, { flight: { margin: 0.05 }, comms: { link: 'ka', dish: 'dsn70' }, site: 'southPole', seeds: { 1: 7, 3: 7, 4: 7 }, _pass: [2, 3, 4, 'launch'] }),
    'f5b': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, site: 'tranquility', seeds: { 1: 7, 3: 7, 4: 7, 5: 7 }, _pass: [3, 4, 'launch'] }),
    'f5b-decision': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, site: 'tranquility', seeds: { 1: 7, 3: 7, 4: 7, 5: 7 }, _pass: [3, 4, 'launch'], _play: { n: 5, mode: 'decision' } }),
    'f5b-landed': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, site: 'tranquility', seeds: { 1: 7, 3: 7, 4: 7, 5: 7 }, _pass: [3, 4, 'launch'], _play: { n: 5, mode: 'detour' } }),
    'f5b-abort': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, site: 'tranquility', seeds: { 1: 7, 3: 7, 4: 7, 5: 7 }, _pass: [3, 4, 'launch'], _play: { n: 5, mode: 'abort' } }),
    'f5done': Object.assign({}, robo, { flight: { margin: 0.15 }, comms: { link: 'ka', dish: 'dsn34' }, site: 'tranquility', seeds: { 1: 7, 3: 7, 4: 7, 5: 7 }, _pass: [3, 4, 'launch'], _play: { n: 5, mode: 'detour' } }),
  });
  let demoSpec = null;
  if (DEMO && DEMOS[DEMO]) {
    const spec = JSON.parse(JSON.stringify(DEMOS[DEMO]));
    demoSpec = { pass: spec._pass || [], play: spec._play || null }; delete spec._pass; delete spec._play;
    S = Object.assign(fresh(), spec);
  }

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
    const late = ['f3a', 'f4', 'f3b', 'f5a', 'f5b', 'f5done'].includes(curRoute);
    if (late && r && r.dvPlanned) {
      const afterLoi = ['f5a', 'f5b', 'f5done'].includes(curRoute);
      const loi = M.flightPlan(S).burns.find(b => b.key === 'loi');
      const dv = afterLoi && loi ? r.dvPlanned - loi.dvPlanned : r.dvPlanned;
      out.push({ id: 'dv', icon: '🚀', label: 'Delta-v', title: afterLoi ? 'Delta-v left after the lunar orbit burn' : 'Delta-v you plan for, margin included', value: dv, limit: 0, unitFmt: (x) => fmt(x) + ' m/s', text: `${fmt(dv)} m/s` });
    } else out.push({ id: 'dv', icon: '🚀', label: 'Delta-v', locked: true, lockedText: 'Phase 3', title: 'Delta-v = how much your spacecraft can change its speed. Unlocks in Phase 3.' });
    const life = r && r.life, run4 = commsRun();
    if (life) out.push({ id: 'days', icon: '📅', label: 'Days', title: 'Mission days your crew must survive', value: life.days, limit: D.LIFE.daysMax, unitFmt: (x) => fmt(x) + ' d', text: `${life.days} days`, note: `${fmt(life.suppliesTotal)} kg of supplies` });
    else if (type === 'robotic' && run4) { const d = Math.round(run4.time.total / 24); out.push({ id: 'days', icon: '📅', label: 'Days', title: 'Days of science data flowing home', value: d, limit: 0, unitFmt: (x) => fmt(x) + ' d', text: `${d} days` }); }
    else out.push({ id: 'days', icon: '📅', label: 'Days', locked: true, lockedText: type === 'robotic' ? 'After Phase 4' : 'Phase 2', title: 'Mission days. Crews set them in Phase 2, robots get them from the Phase 4 radio test.' });
    if (['f4', 'f3b', 'f5a', 'f5b', 'f5done'].includes(curRoute)) {
      const got = launched() && run4 && run4.frames.length ? run4.frames[run4.frames.length - 1].delivered : 0;
      out.push({ id: 'data', icon: '📡', label: 'Data', title: 'Science data delivered to Earth', value: got || 0, limit: 0, unitFmt: (x) => fmt(x) + ' Gb', text: `${fmt(got || 0, 0)} Gb` });
    } else out.push({ id: 'data', icon: '📡', label: 'Data', locked: true, lockedText: 'Phase 4', title: 'Data you can send back to Earth. Unlocks in Phase 4.' });
    return out.map(meterHtml).join('');
  }
  const HUD_LOC = { f3b: 'Earth to Ship', f5a: 'Moon orbit', f5b: 'Ship', f5done: 'Moon surface' };
  let curRoute = 'start';
  let commsCache = { k: '', v: null };
  /** The Phase 4 run behind the HUD (days for robots, data delivered). Same seed, same run. */
  function commsRun() {
    if (!passedValid(4)) return null;
    const k = sigOf(4) + ':' + seedOf(4);
    if (commsCache.k !== k) { const r = SIM.simulate(S, 4, { seed: seedOf(4) }); commsCache = { k, v: r.ready ? r : null }; }
    return commsCache.v;
  }
  function hud(pv) {
    const r = M.evaluate(S);
    return `<header class="hud" id="hud"><div class="brand">Space<span>Syntax</span></div><div class="loc" title="Where the story is right now">📍 ${esc(HUD_LOC[curRoute] || 'Earth')}</div><div class="meters" id="meters">${hudMeters(r, pv)}</div><button class="icon-btn" data-act="menu" aria-label="Menu">☰</button></header>`;
  }
  function refreshHud(pv) {
    const el = document.getElementById('meters'); if (el) el.innerHTML = hudMeters(M.evaluate(S), pv);
  }

  /* Phase bar in play order. Launch (3B) sits between Comms and Landing because the radio flies on the ship. */
  function barItems() {
    const L = launched();
    return [
      { label: 'Goal', n: '0', to: 'f0', done: S.phase0Done, reach: true },
      { label: 'Spacecraft', n: '1', to: 'f1a', done: S.phase1Done, reach: S.phase0Done },
      { label: 'Crew', n: '2', to: 'f2', done: S.phase2Done, reach: S.phase1Done },
      { label: 'Flight', n: '3', to: 'f3a', done: passedValid(3), reach: S.phase2Done },
      { label: 'Comms', n: '4', to: 'f4', done: passedValid(4), reach: passedValid(3) },
      { label: 'Launch', n: '🚀', to: 'f3b', done: L, reach: passedValid(4) },
      { label: 'Landing', n: '5', to: 'f5a', done: passedValid(5), reach: L },
      { label: 'Science', n: '6', soon: true },
      { label: 'Return', n: '7', soon: true },
    ].map((it, i) => Object.assign(it, { i, locked: L && i < 5 }));
  }
  function phasebar(cur) {
    return `<nav class="phasebar" aria-label="Mission phases">${barItems().map(it => {
      const link = it.reach && !it.locked && it.i !== cur;
      const cls = it.i === cur ? 'current' : (it.done ? 'done' : (!it.reach ? 'locked' : ''));
      const act = link ? `data-act="go" data-to="${it.to}"` : 'tabindex="-1"';
      return `<button class="phase ${cls} ${link ? 'link' : ''}" ${act} ${it.soon ? 'title="Coming soon"' : it.locked ? 'title="Locked in at launch"' : ''}><span class="n">${it.done && it.i !== cur ? '✓' : it.n}</span>${it.label}</button>`;
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
          ${S.phase0Done ? `<button class="btn big" data-act="go" data-to="${resumeRoute()}">Continue</button>` : ''}
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
    </div><aside><div class="panel"><div class="kicker">Coming next</div><h3 style="margin-top:6px">${S.missionType === 'crewed' ? 'Phase 2 · Crew &amp; life support' : 'Phase 2 · Crew check (robots skip it)'}</h3>
      <p class="gear">${S.missionType === 'crewed' ? 'Each astronaut needs about 0.9 kg of oxygen, 0.8 kg of food and 3.2 kg of water per day (NASA BVAD).' : 'Spend your delta-v budget maneuver by maneuver.'}</p>
      <button class="btn primary" data-act="go" data-to="f2" style="width:100%;margin-top:8px">Next: Phase 2 →</button></div>
      <div class="panel"><button class="btn" data-act="go" data-to="f1a" style="width:100%">← Back to workshop</button><div style="height:8px"></div><button class="btn ghost" data-act="sources" style="width:100%">See all NASA sources</button><button class="btn ghost" data-act="reset" style="width:100%">Start a new mission</button></div></aside></main></div>`;
  }


  /* ---------------- Scene screens (phases 2 to 5) ----------------
   * The team's mockup is the background. Live panels sit where the painted ones are, so they are opaque.
   * The kid is painted in, so there is no avatar here: the speech bubble is text only, over the painted one.
   * Box = left, top, width, height in percent of the 1536 x 1024 mockup. */
  const SBUB = {
    f2: [16.4, 57.4, 16.6, 7.8], f3a: [17.6, 54.4, 14.4, 8.4], f4: [14.4, 49.8, 14.6, 11],
    f3b: [15, 52.6, 11.8, 9], f5a: [11.8, 36.4, 14, 13.8], f5b: [50, 13, 13, 12.8],
  };
  function sceneScreen(id, o) {
    const b = SBUB[id] && o.bubble ? SBUB[id] : null;
    return `<div class="screen scene-screen" data-sc="${id}">${hud()}${phasebar(o.bar)}
      <div class="scene-art" aria-hidden="true"></div>
      <div class="scene-over">${b ? `<div class="sbubble" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"><p>${esc(o.bubble)}</p></div>` : ''}</div>
      <main class="main scene-main ${o.left ? 'three' : ''}">${o.left ? `<div class="scene-left">${o.left}</div><div></div>` : '<div></div>'}
        <aside class="scene-aside">${o.aside}</aside></main>${o.extra || ''}${o.footer}</div>`;
  }
  const head = (kicker, title) => `<div class="kicker">${esc(kicker)}</div><h1 class="ptitle">${esc(title)}</h1>`;
  const issueList = (list) => list.length ? `<ul class="issues">${list.map(w => `<li class="${w.severity === 'block' ? 'bad' : 'warn'}">${w.severity === 'block' ? '⛔' : '⚠️'} ${esc(w.message)}</li>`).join('')}</ul>` : '';
  const fitLine = (r) => r.rocket ? (r.fitsRocket ? `<span class="verdict ok">Fits ${esc(r.rocket.title)}: ${kg(r.tli)} of ${fmt(r.rocket.capacity)}</span>` : `<span class="verdict bad">Too heavy for ${esc(r.rocket.title)} by ${kg(r.tli - r.rocket.capacity)}</span>`) : '';
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

  /* ---------------- Shared Play layer ---------------- */
  /* One Play panel for every phase. PLAY holds the run being shown; the result is animated, never recomputed. */
  const PLAY_MS = 4500;
  const PLAY_TITLE = { 1: 'Launch', 2: 'Life support test', 3: 'Flight to the Moon', 4: 'Radio test', 5: 'Powered descent' };
  const PLAY_INTRO = {
    1: 'Light the engines and see if your rocket can lift your spacecraft.',
    2: 'Fly the whole trip and watch your oxygen, food and water.',
    3: 'Fly the trip day by day and spend your delta-v.',
    4: 'Send a day of science home and see how much arrives.',
    5: 'Land on the Moon. Time is compressed: about 45 seconds of flight.',
  };
  const LEGS = ['Engine burn to leave Earth', 'Coasting', 'Course correction', 'Coasting', 'Course correction', 'Entering Moon orbit', 'Powered descent', 'Touchdown'];
  const STATIONS = ['Goldstone, USA', 'Madrid, Spain', 'Canberra, Australia'];
  let PLAY = null;   // { n, kind, route, sig, res, from, t0, p, phase: 'run' | 'decision' | 'done', decision }
  let playRaf = 0;
  const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  /** Fingerprint of the choices that matter up to phase n. A pass is valid only while it matches. */
  function sigOf(n) {
    return hash(JSON.stringify([S.missionType, S.question, S.measure, S.difficulty, S.design, S.rocket, n >= 2 ? S.crew : 0, n >= 3 ? S.flight : 0, n >= 4 ? S.comms : 0, n >= 5 ? S.site : 0]));
  }
  const fullSig = () => sigOf(5);
  const passedValid = (n) => S.passed[n] === sigOf(n === 'launch' ? 4 : n);
  const launched = () => passedValid('launch');
  const seedOf = (n) => (Number.isInteger(S.seeds[n]) ? S.seeds[n] : 7);
  const newSeed = () => 1 + Math.floor(Math.random() * 999999);
  const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const playFor = (n, kind) => (PLAY && PLAY.n === n && (PLAY.kind || '') === (kind || '') && PLAY.sig === fullSig() ? PLAY : null);
  function cancelPlay() { if (playRaf) cancelAnimationFrame(playRaf); playRaf = 0; PLAY = null; }

  function startPlay(n, opts) {
    opts = opts || {};
    if (playRaf) { cancelAnimationFrame(playRaf); playRaf = 0; }
    if (opts.newSeed || !Number.isInteger(S.seeds[n])) S.seeds[n] = newSeed();
    const key = opts.kind === 'launch' ? 'launch' : String(n);
    delete S.passed[key];
    const res = SIM.simulate(S, n, n === 5 ? { seed: S.seeds[n], interactive: true } : { seed: S.seeds[n] });
    save();
    PLAY = { n, kind: opts.kind || '', route: curRoute, sig: fullSig(), res, from: 0, t0: performance.now(), p: 0, phase: res.ready ? 'run' : 'blocked', decision: null };
    if (res.ready && reduceMotion()) PLAY.t0 -= PLAY_MS * 2;
    render.keepScroll = true; render();
    if (PLAY && PLAY.phase === 'run') playRaf = requestAnimationFrame(tick);
  }
  function decide(choice) {
    const P = playFor(5); if (!P || P.phase !== 'decision') return;
    const dt = P.res.decision.t;
    const res = SIM.simulate(S, 5, { seed: S.seeds[5], choice });
    PLAY = Object.assign({}, P, { res, decision: P.res.decision, choice, from: Math.min(0.98, dt / Math.max(1, res.time.total)), t0: performance.now(), phase: 'run' });
    PLAY.p = PLAY.from; if (reduceMotion()) PLAY.t0 -= PLAY_MS * 2;
    render.keepScroll = true; render();
    playRaf = requestAnimationFrame(tick);
  }
  function tick(now) {
    playRaf = 0;
    if (!PLAY || PLAY.phase !== 'run') return;
    if (PLAY.sig !== fullSig() || PLAY.route !== curRoute) { PLAY = null; return; }
    const span = Math.max(900, PLAY_MS * (1 - PLAY.from));
    PLAY.p = Math.min(1, PLAY.from + (1 - PLAY.from) * (now - PLAY.t0) / span);
    paintPlay();
    if (PLAY.p >= 1) finishPlay(); else playRaf = requestAnimationFrame(tick);
  }
  function finishPlay() {
    const P = PLAY, res = P.res; P.p = 1;
    if (res.outcome === 'pending') { P.phase = 'decision'; P.decision = res.decision; }
    else {
      P.phase = 'done';
      const key = P.kind === 'launch' ? 'launch' : String(P.n);
      if (res.ok) S.passed[key] = sigOf(P.kind === 'launch' ? 4 : P.n); else delete S.passed[key];
      if (P.n === 5 && P.kind !== 'launch') S.landing = { seed: res.seed, outcome: res.landing ? res.landing.outcome : 'abort' };
      save();
    }
    render.keepScroll = true; render();
  }
  function skipPlay() { if (PLAY && PLAY.phase === 'run') { PLAY.p = 1; if (playRaf) cancelAnimationFrame(playRaf); playRaf = 0; paintPlay(); finishPlay(); } }
  /** Used by ?demo= links: show a finished or paused run without animating. */
  function demoPlay(spec) {
    const n = spec.n; if (!Number.isInteger(S.seeds[n])) S.seeds[n] = 7;
    const kind = spec.kind || '';
    const sim = (o) => SIM.simulate(S, n, Object.assign({ seed: S.seeds[n] }, o));
    let res = n === 5 ? sim({ interactive: true }) : sim({});
    PLAY = { n, kind, route: (location.hash || '').slice(1), sig: fullSig(), res, from: 0, t0: 0, p: 1, phase: 'done', decision: null };
    if (res.outcome === 'pending') {
      PLAY.phase = 'decision'; PLAY.decision = res.decision;
      if (spec.mode === 'detour' || spec.mode === 'abort') {
        const id = spec.mode;
        PLAY = Object.assign(PLAY, { decision: res.decision, choice: id, res: sim({ choice: id }), phase: 'done' });
      }
    }
    if (PLAY.phase === 'done') {
      const r2 = PLAY.res, key = kind === 'launch' ? 'launch' : String(n);
      if (r2.ok) S.passed[key] = sigOf(kind === 'launch' ? 4 : n); else delete S.passed[key];
      if (n === 5) S.landing = { seed: r2.seed, outcome: r2.landing ? r2.landing.outcome : 'abort' };
    }
  }

  /** Frame at playback fraction p (numbers are interpolated between neighbours). */
  function frameAt(res, p) {
    const fr = res.frames; if (!fr.length) return {};
    const t = p * res.time.total;
    let i = 0; while (i + 1 < fr.length && fr[i + 1].t <= t) i++;
    const a = fr[i], b = fr[Math.min(i + 1, fr.length - 1)];
    if (a === b || b.t === a.t) return a;
    const k = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))), o = {};
    for (const key in a) o[key] = typeof a[key] === 'number' && typeof b[key] === 'number' && key !== 'leg' && key !== 'station' && key !== 'linkUp' ? a[key] + (b[key] - a[key]) * k : a[key];
    return o;
  }
  const BAR_HIDE = { 3: ['x', 'y', 'leg'], 4: ['linkUp', 'station'] };
  const barFields = (P) => P.res.fields.filter(f => !(BAR_HIDE[P.n] || []).includes(f.key));
  function gaugeMax(P, f) { return P.n === 5 && f.key === 'alt' ? SIM.PHASES[5].TUNING.startAlt : f.max; }
  function fieldText(f, v) {
    if (typeof v !== 'number') return '—';
    if (f.max <= 1 && !f.unit) return Math.round(v * 100) + '%';
    const a = Math.abs(v); return fmt(v, a < 10 ? 2 : a < 100 ? 1 : 0) + (f.unit ? ' ' + f.unit : '');
  }
  const EV_ICON = { info: '•', warn: '!', fail: '✕', success: '✓' };
  function eventsHtml(P, p) {
    const t = p * P.res.time.total + 1e-6;
    const list = P.res.events.filter(e => e.t <= t);
    return list.map(e => `<li class="ev ${e.kind}"><span>${EV_ICON[e.kind] || '•'}</span>${esc(e.text)}</li>`).join('');
  }
  function clockText(P, p) {
    const T = P.res.time, now = p * T.total;
    if (T.unit === 'day') return `Day ${Math.floor(now) + (p >= 1 ? 0 : 1)} of ${Math.round(T.total)}`;
    if (T.unit === 'h') return now >= 48 ? `${fmt(now / 24, 1)} of ${fmt(T.total / 24, 1)} days` : `${fmt(now, 0)} of ${fmt(T.total, 0)} hours`;
    return `${fmt(now, 0)} of ${fmt(T.total, 0)} s`;
  }
  function playBars(P, p) {
    const fr = frameAt(P.res, p);
    return barFields(P).map((f, i) => {
      const v = fr[f.key], mx = gaugeMax(P, f) || 1, w = typeof v === 'number' ? Math.max(0, Math.min(1, Math.abs(v) / mx)) * 100 : 0;
      return `<div class="pbar"><span class="lbl">${esc(f.label)}</span><div class="trk"><i id="pf-${i}" style="width:${w.toFixed(1)}%"></i></div><b id="pv-${i}">${esc(fieldText(f, v))}</b></div>`;
    }).join('');
  }
  function trajHtml(P, p) {
    const fr = frameAt(P.res, p), xs = P.res.fields.find(f => f.key === 'x'), ys = P.res.fields.find(f => f.key === 'y');
    const left = xs ? (fr.x || 0) / xs.max * 100 : 0, bottom = ys ? 10 + (fr.y || 0) / ys.max * 70 : 20;
    return `<div class="traj"><span class="e">Earth</span><span class="m">Moon</span><i id="traj-dot" style="left:${left.toFixed(1)}%;bottom:${bottom.toFixed(1)}%"></i></div><div class="gear" id="pleg">${esc(LEGS[Math.round(fr.leg || 0)] || '')}</div>`;
  }
  function stationText(P, p) {
    const fr = frameAt(P.res, p);
    return fr.linkUp ? `In contact with ${STATIONS[fr.station] || 'a station'}` : 'No link right now';
  }
  /** Repaint the moving parts by id, without rebuilding the page. */
  function paintPlay() {
    const P = PLAY; if (!P || !P.res || !P.res.ready) return;
    const p = P.p, fr = frameAt(P.res, p);
    barFields(P).forEach((f, i) => {
      const v = fr[f.key], mx = gaugeMax(P, f) || 1;
      const a = document.getElementById('pf-' + i), b = document.getElementById('pv-' + i);
      if (a && typeof v === 'number') a.style.width = (Math.max(0, Math.min(1, Math.abs(v) / mx)) * 100).toFixed(1) + '%';
      if (b) b.textContent = fieldText(f, v);
    });
    const ev = document.getElementById('play-events'); if (ev) { const h = eventsHtml(P, p); if (ev.dataset.h !== h) { ev.innerHTML = h; ev.dataset.h = h; ev.scrollTop = ev.scrollHeight; } }
    const ck = document.getElementById('play-clock'); if (ck) ck.textContent = clockText(P, p);
    if (P.n === 3) {
      const d = document.getElementById('traj-dot'), xs = P.res.fields.find(f => f.key === 'x'), ys = P.res.fields.find(f => f.key === 'y');
      if (d && xs && ys) { d.style.left = ((fr.x || 0) / xs.max * 100).toFixed(1) + '%'; d.style.bottom = (10 + (fr.y || 0) / ys.max * 70).toFixed(1) + '%'; }
      const lg = document.getElementById('pleg'); if (lg) lg.textContent = LEGS[Math.round(fr.leg || 0)] || '';
    }
    if (P.n === 4) {
      const st = document.getElementById('pstat'); if (st) st.textContent = stationText(P, p);
      STATIONS.forEach((_, i) => { const e = document.getElementById('stn-' + i); if (e) e.classList.toggle('on', !!fr.linkUp && fr.station === i); });
    }
    if (P.n === 5) {
      const m = document.getElementById('alt-mark'), v = document.getElementById('alt-val'), top = SIM.PHASES[5].TUNING.startAlt;
      if (m && typeof fr.alt === 'number') m.style.bottom = Math.max(0, Math.min(100, fr.alt / top * 100)).toFixed(1) + '%';
      if (v && typeof fr.alt === 'number') v.textContent = fmt(Math.max(0, fr.alt), 0) + ' m';
    }
  }
  const OUTCOME_TEXT = { success: 'Success', partial: 'Partly worked', fail: 'It did not work', pending: 'Paused' };
  function outcomeHtml(P, label) {
    const res = P.res, cls = res.ok ? (res.outcome === 'partial' ? 'warn' : 'ok') : 'bad';
    const sc = res.score ? `<div class="gear">${esc(res.score.label)}: ${esc(fmt(res.score.value, Math.abs(res.score.value) < 1 ? 3 : 1))} ${esc(res.score.unit || '')}</div>` : '';
    let title = OUTCOME_TEXT[res.outcome] || '';
    if (P.n === 5 && res.landing) title = res.ok ? (res.landing.outcome === 'clean' ? 'Clean landing' : 'Rough landing') : (res.landing.outcome === 'abort' ? 'Descent aborted' : 'Crashed');
    if (P.kind === 'launch') title = res.ok ? 'Liftoff! You are on your way' : 'The launch failed';
    const land = P.n === 5 && res.landing ? `<div class="gear">Touchdown speed ${fmt(res.landing.touchSpeed, 1)} m/s (safe up to 2.1). Hover needed ${fmt(res.landing.hoverNeeded, 1)} s, you had ${fmt(res.landing.hoverAvailable, 1)} s.</div>` : '';
    const fail = res.failure ? `<p><b>What happened:</b> ${esc(res.failure.cause)}</p><p><b>Try this:</b> ${esc(res.failure.fix)}</p>` : '';
    return `<div class="outcome ${cls}"><div class="stars" aria-label="${res.stars} of 3 stars">${stars(res.stars)}</div><div><b class="otitle">${esc(title)}</b>${sc}${land}</div></div>${fail}
      <div class="play-actions"><button class="btn" data-act="play" data-n="${P.n}" data-kind="${esc(P.kind)}">↻ Play again</button><button class="btn" data-act="seed" data-n="${P.n}" data-kind="${esc(P.kind)}">🎲 Try another seed</button><span class="gear">Seed ${esc(res.seed)}</span></div>`;
  }
  function mathPanel(P) {
    const m = P.res.math; if (!m) return '';
    const id = 'play' + P.n;
    return `${mathToggle(id, 'Show the math')}${S.showMath[id] ? mathBlock(m) + (m.src && D.SOURCES[m.src] ? `<p class="gear" style="margin-top:6px">${srcChip(m.src)}</p>` : '') : ''}`;
  }
  /** The shared Play panel. o.label overrides the button, o.blocked tells why Play is not offered yet. */
  function playPanel(n, o) {
    o = o || {}; const kind = o.kind || '', P = playFor(n, kind), title = o.title || PLAY_TITLE[n];
    const btn = (label, extra) => `<button class="btn primary" data-act="play" data-n="${n}" data-kind="${esc(kind)}" ${o.disabled ? 'disabled' : ''}>${label}</button>${extra || ''}`;
    let body;
    if (!P) {
      body = `<p class="gear">${esc(o.intro || PLAY_INTRO[n])}</p><div class="play-actions">${btn('▶ ' + (o.label || 'Play'))}${o.disabled && o.reason ? `<span class="gear">${esc(o.reason)}</span>` : ''}</div>${o.hint ? `<p class="gear">${esc(o.hint)}</p>` : ''}`;
    } else if (!P.res.ready) {
      body = `<ul class="issues">${P.res.blockers.map(b => `<li class="bad">⛔ ${esc(b.message)}</li>`).join('')}</ul><div class="play-actions">${btn('↻ Try again')}</div>`;
    } else {
      const run = P.phase === 'run';
      body = `<div class="play-clock"><span id="play-clock">${esc(clockText(P, P.p))}</span>${run ? '<button class="btn ghost" data-act="play-skip">Skip ⏭</button>' : ''}</div>
        ${n === 3 ? trajHtml(P, P.p) : ''}${n === 4 ? `<div class="gear" id="pstat">${esc(stationText(P, P.p))}</div>` : ''}
        <div class="play-bars">${playBars(P, P.p)}</div>
        <ul class="play-events" id="play-events" data-h="">${eventsHtml(P, P.p)}</ul>
        ${P.phase === 'done' ? outcomeHtml(P) + mathPanel(P) : ''}
        ${P.phase === 'decision' ? '<p class="gear">The lander is waiting for your decision.</p>' : ''}`;
    }
    return `<section class="panel play-panel"><h3>▶ ${esc(title)}</h3>${body}</section>`;
  }
  const playPassed = (n, kind) => { const P = playFor(n, kind); return !!(P && P.phase === 'done' && P.res.ok); };

  /* ---------------- Phase 2: crew & life support ---------------- */
  function screenF2() {
    const r = M.evaluate(S);
    const back = { to: 'f1done', label: 'Phase 1' };
    if (S.missionType !== 'crewed') {
      const aside = `<div class="panel">${head('Phase 2 · Crew and life support', 'No crew, no groceries')}
        <p class="sub-why">Robots do not breathe, eat or drink. Your lander skips this phase and keeps all that mass for science.</p>
        <p class="gear">A crew of 4 on a 10-day trip would need about ${kg(4 * 10 * (D.LIFE.perCrewDay.o2 + D.LIFE.perCrewDay.food + D.LIFE.perCrewDay.water))} of oxygen, food and water, before counting the astronauts, their suits and the fuel to carry it all.</p>
        <div style="margin-top:10px">${fact('bvadDaily')}</div></div>${spacecraftSummary(r)}`;
      return sceneScreen('f2', { bar: 2, bubble: 'No crew, no groceries!', aside, footer: footer(back, { act: 'f2-confirm', label: 'Continue', reason: '' }) });
    }
    const l = r.life, L = D.LIFE, pd = L.perCrewDay;
    const v = M.validatePhase(S, 2);
    const blockers = v.issues.filter(i => i.severity === 'block');
    const warns = v.issues.filter(i => i.severity === 'warn');
    const minD = M.minDays();
    const suitBtn = (s) => `<div role="button" tabindex="0" class="opt" data-act="suit" data-id="${s.id}" aria-pressed="${S.crew.suit === s.id}"><b>${esc(s.title)}</b>
      <span class="gear">${kg(s.mass)} each · ${s.evaHours} h walks · ${usd(s.cost)}${s.shadowOk ? ' · handles shadowed craters' : ''}</span></div>`;
    const aside = `<div class="panel life-panel">${head('Phase 2 · Crew and life support', 'Pack for your crew')}
      <div class="ctrl"><div class="ctrl-head"><span>Crew size</span>
        <div class="stepper"><button class="btn" data-act="crew-minus" aria-label="Fewer astronauts" ${l.size <= L.crewMin ? 'disabled' : ''}>−</button><b>${l.size}</b><button class="btn" data-act="crew-plus" aria-label="More astronauts" ${l.size >= L.crewMax ? 'disabled' : ''}>+</button></div></div>
        <p class="gear">${l.landingCrew} land on the Moon, ${l.orbitCrew} wait in orbit ${srcChip('artemisFaq')}</p></div>
      <div class="ctrl"><div class="ctrl-head"><label for="days">Mission days</label><b id="days-val">${l.days}</b></div>
        <input id="days" type="range" min="${minD}" max="${L.daysMax}" value="${l.days}" data-act="days" aria-describedby="days-help">
        <div class="range-marks"><span>${minD}</span><span class="mark-a2">Artemis II: nearly 10 days ${srcChip('artemis2', 'NASA ↗')}</span><span>${L.daysMax}</span></div>
        <p class="gear" id="days-help">At least ${minD}: about 3 days there ${srcChip('apollo11', 'NASA ↗')}, 3 on the surface ${srcChip('apollo17', 'NASA ↗')}, 3 back.</p></div>
      <div class="ctrl toggles">
        <div role="button" tabindex="0" class="toggle" data-act="reserve" aria-pressed="${!!l.reserve}">🧰 Safety reserve ${l.reserve ? 'On (+20%)' : 'Off'} ${srcChip('game')}</div>
        <div role="button" tabindex="0" class="toggle" data-act="recycler" aria-pressed="${l.recycler}">♻️ Water recycler ${l.recycler ? 'On' : 'Off'} ${srcChip('issWater')}</div></div>
      <div class="ctrl"><div class="ctrl-head"><span>Moonwalk suit</span></div><div class="opts">${L.suits.map(suitBtn).join('')}</div></div>
      <table class="life-table"><tbody>
        <tr><td>🫁 Oxygen</td><td>${kg(l.o2)}</td></tr>
        <tr><td>🍴 Dry food</td><td>${kg(l.food)}</td></tr>
        <tr><td>💧 Drinking water</td><td>${kg(l.water)}${l.recycler ? `<br><span class="gear">−${kg(l.waterSaved)} recycled</span>` : ''}</td></tr>
        <tr class="sep"><td>Supplies total</td><td><b>${kg(l.suppliesTotal)}</b></td></tr>
        <tr><td>Crew (${fmt(L.crewMass)} kg each)</td><td>${kg(l.crewMass)}</td></tr>
        <tr><td>Suits ×${l.landingCrew}</td><td>${S.crew.suit ? kg(l.suitsMass) : '—'}</td></tr>
      </tbody></table>
      <p class="gear" style="margin-top:6px;text-align:center">Source: NASA BVAD, Table 3-31 ${srcChip('bvad')}</p></div>
      <div class="panel"><p style="margin:0">${fitLine(r)}</p>${issueList(v.issues)}
        ${blockers.some(b => b.code === 'tooHeavy') ? `<p class="gear">Fewer days or astronauts, a lighter suit, or <button class="btn ghost" data-act="go" data-to="f1b">a bigger rocket</button>.</p>` : ''}</div>
      ${playPanel(2, { disabled: blockers.length > 0, reason: blockers.length ? blockers[0].message : '', hint: 'Pass this test to move on.' })}
      <div class="panel"><h3>🧮 How much does a day weigh?</h3>
        <p class="sub-why" style="margin:0">NASA plans about ${fmt(pd.o2 + pd.food + pd.water, 1)} kg of oxygen, food and water per astronaut per day. Multiply by crew and days.</p>
        ${mathToggle('life', 'Show the math')}${S.showMath.life ? mathBlock(M.lifeMath(S)) : ''}
        <div style="margin-top:10px">${fact(l.recycler ? 'waterRecovery' : 'bvadDaily')}</div></div>`;
    const reason = blockers.length ? blockers[0].message : !passedValid(2) ? 'Press Play and pass the test' : '';
    return sceneScreen('f2', { bar: 2, bubble: 'Every day adds mass.', aside, footer: footer(back, { act: 'f2-confirm', label: 'Confirm crew', reason }) });
  }

  function screenF2Done() {
    const r = M.evaluate(S), crewed = S.missionType === 'crewed', l = r.life;
    const items = crewed ? [
      ['Crew', true, `${l.size} astronauts, ${l.days} days`],
      ['Supplies', l.daysOk, `${kg(l.suppliesTotal)} packed`],
      ['Launch mass', r.fitsRocket !== false, `${kg(r.tli)} / ${fmt(r.rocket ? r.rocket.capacity : 0)}`],
      ['Budget', !r.overBudget, `${usd(r.totalCost)} / ${usd(r.budget)}`],
    ] : [['Crew', true, 'Robotic: no crew needed'], ['Launch mass', r.fitsRocket !== false, `${kg(r.tli)} / ${fmt(r.rocket ? r.rocket.capacity : 0)}`]];
    return `<div class="screen">${hud()}${phasebar(2)}<main class="main"><div>
      <div class="done-hero"><div class="kicker">Phase 2 complete · Crew quarters, Earth</div><h1>${crewed ? 'Crew ready! 🧑‍🚀' : 'No crew needed 🤖'}</h1><p class="lead" style="margin:8px auto">Bags packed. Next we plan every burn of the trip.</p></div>
      <div class="panel"><div class="kicker" style="margin-bottom:8px">Crew review: GO / NO GO</div><div class="gonogo">${items.map(([n, ok, val]) => `<div class="item"><span>${esc(n)}<br><span class="gear">${esc(val)}</span></span><span class="${ok ? 'go' : 'nogo'}">${ok ? 'GO' : 'NO GO'}</span></div>`).join('')}</div></div>
    </div><aside><div class="panel"><div class="kicker">Coming next</div><h3 style="margin-top:6px">Phase 3 · Flight plan &amp; delta-v</h3>
      <p class="gear">Choose your fuel reserve: it decides how long you can hover when you land in Phase 5.</p>
      <button class="btn primary" data-act="go" data-to="f3a" style="width:100%;margin-top:8px">Next: Phase 3 →</button></div>
      <div class="panel"><button class="btn" data-act="go" data-to="f2" style="width:100%">← Back to crew</button><div style="height:8px"></div><button class="btn ghost" data-act="sources" style="width:100%">See all NASA sources</button></div></aside></main></div>`;
  }

  /* ---------------- Phase 3A: flight plan ---------------- */
  const stripParen = (t) => String(t).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  function screenF3a() {
    const r = M.evaluate(S), P = M.flightPlan(S), v = M.validatePhase(S, 3), minM = M.minMargin(S);
    const rows = [`<div class="frow"><span class="num">1</span><span>Translunar injection <span class="chip">Rocket upper stage</span></span><b>${fmt(P.tli.dv)} m/s</b></div>`]
      .concat(P.burns.map((b, i) => `<div class="frow"><span class="num">${i + 2}</span><span>${esc(stripParen(b.label))}<br><span class="gear">${esc(b.vehicle)}</span></span><b>${fmt(b.dv)} m/s</b></div>`)).join('');
    const maxM = Math.max(...D.FLIGHT.marginOptions), scale = P.dvRequired * (1 + maxM);
    const marginBtn = (m) => `<button class="chipbtn" data-act="margin" data-id="${m}" aria-pressed="${r && S.flight.margin === m}" ${m < minM ? 'disabled title="Too small for this difficulty"' : ''}>${Math.round(m * 100)}%</button>`;
    const enough = v.ok;
    const aside = `<div class="panel">${head('Phase 3 · Flight plan', 'Plan your burns')}
      <div class="flist">${rows}</div>
      <div class="frow total"><span></span><span>Your spacecraft needs <b>${fmt(P.dvRequired)} m/s</b> plus margin</span><b>${fmt(P.dvPlanned)} m/s</b></div>
      <p class="gear">Source: NASA Constellation studies ${srcChip('cev')}</p></div>
      <div class="panel"><div class="ctrl-head"><span>Delta-v margin</span><b>${Math.round(S.flight.margin * 100)}%</b></div>
        <div class="margin-row" role="group" aria-label="Delta-v margin">${D.FLIGHT.marginOptions.map(marginBtn).join('')}</div>
        <p class="gear">Spare delta-v for mistakes. Your difficulty needs at least ${Math.round(minM * 100)}%. More margin means more fuel, so more launch mass.</p>
        <div class="dvbar"><div class="trk"><i style="width:${Math.min(100, P.dvPlanned / scale * 100).toFixed(1)}%"></i><u style="left:${(P.dvRequired / scale * 100).toFixed(1)}%"></u></div>
          <div class="gear"><span>Need ${fmt(P.dvRequired)}</span><span>Planned ${fmt(P.dvPlanned)} m/s</span></div></div>
        <p style="margin:8px 0 0"><span class="chip ${enough ? 'ok' : 'bad'}">${enough ? 'Enough margin' : 'Not enough margin'}</span> ${srcChip('game', 'Isp: game value')}</p>
        <p style="margin:8px 0 0">${fitLine(r)}</p>${issueList(v.issues)}</div>
      ${playPanel(3, { disabled: !v.ok, reason: !v.ok ? (v.issues.find(i => i.severity === 'block') || {}).message : '', hint: 'Pass this test to move on.' })}`;
    const reason = !v.ok ? v.issues.find(i => i.severity === 'block').message : !passedValid(3) ? 'Press Play and pass the flight test' : '';
    return sceneScreen('f3a', { bar: 3, bubble: S.missionType === 'crewed' ? 'I need fuel for the trip home.' : 'Every burn costs fuel.', aside, footer: footer({ to: 'f2done', label: 'Crew' }, { act: 'f3a-next', label: 'Choose a radio', reason }) });
  }

  /* ---------------- Phase 4: communications ---------------- */
  function screenF4() {
    const r = M.evaluate(S), C = M.commsPlan(S), v = M.validatePhase(S, 4), type = S.missionType;
    const cm = S.comms || {}, P = playFor(4);
    const linkCard = (k, i) => { const c = k[type];
      return `<div role="button" tabindex="0" class="opt numbered" data-act="link" data-id="${k.id}" aria-pressed="${cm.link === k.id}"><span class="num">${i + 1}</span><span><b>${esc(k.title)}</b><br><span class="gear">${esc(k.blurb)}</span><br><span class="gear">⚡ ${fmt(c.power)} W · ⚖️ ${kg(c.mass)} · 💰 ${usd(c.cost)}</span></span></div>`; };
    const dishCard = (d) => `<div role="button" tabindex="0" class="opt" data-act="dish" data-id="${d.id}" aria-pressed="${cm.dish === d.id}"><b>${esc(d.title)}</b><span class="gear">${esc(d.blurb)} 💰 ${usd(d.cost[type])}</span></div>`;
    const laser = C.link && C.link.optical;
    const stn = STATIONS.map((n, i) => `<li><i id="stn-${i}" class="dot ${P && P.res.ready && P.phase !== 'blocked' && frameAt(P.res, P.p).linkUp && frameAt(P.res, P.p).station === i ? 'on' : ''}"></i>${esc(n)}</li>`).join('');
    const left = `<div class="panel"><div class="kicker">NASA Deep Space Network</div><ul class="stations">${stn}</ul>
        <p class="gear" style="margin:6px 0 0">Three dish sites, one every 120 degrees, so one is always facing the Moon.</p></div>
      <div class="panel"><div class="kicker">Ping</div><p style="margin:4px 0 8px"><b>${C.roundTrip.toFixed(2)} s</b> round trip</p>
        <button class="btn" data-act="ping">Send ping</button></div>`;
    const aside = `<div class="panel">${head('Phase 4 · Communications', 'Choose a link')}
      <div class="opts">${D.COMMS.links.map(linkCard).join('')}</div>
      <div class="ctrl-head" style="margin-top:12px"><span>Ground antenna</span></div>
      <div class="opts">${D.COMMS.dishes.map(dishCard).join('')}</div>
      ${laser ? '<p class="gear">A laser does not use a radio dish, so the dish choice only has to be set.</p>' : ''}
      ${C.link ? `<table class="life-table"><tbody>
        <tr><td>Ping, round trip</td><td>${C.roundTrip.toFixed(2)} s</td></tr>
        <tr><td>One way: closest, average, farthest</td><td>${C.delay.min.toFixed(2)}, ${C.delay.avg.toFixed(2)}, ${C.delay.max.toFixed(2)} s</td></tr>
        <tr><td>Data rate</td><td>${fmt(C.rateMbps, 0)} Mbps</td></tr>
        <tr><td>Can send per day</td><td><b>${fmt(C.gbPerDay, 0)} Gb</b></td></tr>
        <tr><td>Your science makes per day</td><td>${fmt(C.needGbPerDay, 0)} Gb</td></tr></tbody></table>` : '<p class="gear">Pick a link to see the numbers.</p>'}
      ${C.bottleneck ? `<p class="verdict warn" style="margin:8px 0 0">Bottleneck: data will pile up on board.</p>` : ''}
      ${C.weatherRisk ? `<p class="verdict warn" style="margin:8px 0 0">Clouds over the ground station can block a laser.</p>` : ''}
      <p style="margin:8px 0 0">${fitLine(r)}</p>${issueList(v.issues.filter(i => i.severity === 'block'))}
      <p class="gear">${srcChip('dsn', 'NASA DSN ↗')} ${srcChip('game')}</p></div>
      ${playPanel(4, { disabled: !v.ok, reason: !v.ok ? (v.issues.find(i => i.severity === 'block') || {}).message : '', hint: 'Pass this test to move on.' })}
      <div class="panel">${mathToggle('comms', 'Show the math')}${S.showMath.comms ? mathBlock(M.commsMath(S)) : ''}</div>`;
    const reason = !v.ok ? v.issues.find(i => i.severity === 'block').message : !passedValid(4) ? 'Press Play and pass the radio test' : '';
    return sceneScreen('f4', { bar: 4, bubble: 'How will anyone know what I found?', left, aside, footer: footer({ to: 'f3a', label: 'Flight plan' }, { act: 'f4-next', label: 'To the launch pad', reason }) });
  }

  /* ---------------- Phase 3B: launch pad ---------------- */
  function launchRows() {
    const L = M.launchRows(S);
    const show = { goal: v => v || '—', spacecraft: v => v || 'No rocket', totalMass: v => v == null ? '—' : kg(v), deltaV: v => v == null ? '—' : fmt(v) + ' m/s',
      crew: v => v == null ? 'Robots only' : String(v), missionDays: v => v == null ? '—' : String(v), lifeSupport: v => v === 'ok' ? 'OK' : 'Not needed', comms: v => v || 'Not chosen' };
    return { G: L.G, rows: L.rows.map(x => [x.label, x.ok, show[x.key](x.value)]) };
  }
  function screenF3b() {
    const { G, rows } = launchRows(), warns = G.issues.filter(i => i.severity === 'warn');
    const L = launched(), P = playFor(1, 'launch');
    const aside = `<div class="panel">${head('Launch pad', 'Mission summary')}
      <div class="gorows">${rows.map(([n, ok, val]) => `<div class="grow"><span>${esc(n)}</span><span class="gval">${esc(val)}</span><span class="${ok ? 'go' : 'nogo'}">${ok ? 'GO' : 'NO GO'}</span></div>`).join('')}</div>
      <p class="allgo ${G.go ? 'ok' : 'bad'}">${G.go ? 'All systems GO' : 'Not ready: fix the NO GO items'}</p>
      ${G.go ? '' : issueList(G.issues.filter(i => i.severity === 'block'))}
      ${warns.length ? `<p class="gear" style="margin:6px 0 0">Heads up: ${warns.map(w => esc(w.message)).join(' ')}</p>` : ''}
      <p class="gear">Launch locks in phases 0 to 4.</p></div>
      ${playPanel(1, { kind: 'launch', title: 'Launch', label: 'Launch', disabled: !G.go, reason: 'Every item must be GO', intro: 'Light the engines and watch your rocket lift off.' })}`;
    const run = P && P.phase === 'run';
    const primary = L ? { act: 'go', label: 'Fly to the Moon' } : { act: 'launch', label: 'Launch' };
    const foot = L ? `<footer class="footer"><button class="btn ghost" data-act="howto">? Help</button><span class="spacer"></span><button class="btn primary" data-act="go" data-to="f5a">Fly to the Moon →</button></footer>`
      : footer({ to: 'f4', label: 'Comms' }, { act: 'launch', label: 'Launch', reason: !G.go ? 'Every item must be GO' : run ? 'Launching…' : '' });
    return sceneScreen('f3b', { bar: 5, bubble: "Let's go to the Moon.", aside, footer: foot });
  }

  /* ---------------- Phase 5A: landing site ---------------- */
  function screenF5a() {
    const r = M.evaluate(S), v = M.validatePhase(S, 5), robotic = S.missionType === 'robotic';
    const card = (site) => {
      const R = M.siteReport(S, site.id), pinned = S.site === site.id;
      const hz = ['', 'low', 'medium', 'high'][site.hazard];
      return `<div role="button" tabindex="0" class="opt numbered site" data-act="site" data-id="${site.id}" aria-pressed="${pinned}"><span class="num">${site.hazard}</span><span>
        <b>${esc(site.title)}</b><br><span class="gear">Risk: ${hz} · Earth in view: ${R.earthView === 'always' ? 'always' : 'on and off'}</span>
        <span class="verdict ${R.scienceMatch ? 'ok' : 'warn'}" style="display:block">${R.scienceMatch ? 'Good for your question' : 'Not the best for your question'}</span>
        <span class="chips" style="margin-top:6px"><span class="chip">LOLA · ${esc(site.lola)}</span><span class="chip">LROC · ${esc(site.lroc)}</span><span class="chip">Diviner · ${esc(site.diviner)}</span></span>
        <span class="gear" style="display:block;margin-top:4px">Hover needed about ${fmt(R.hoverTypical, 0)} s, you have ${fmt(R.hoverAvailable, 0)} s.${R.survivesNight ? '' : ` Your lander survives ${fmt(R.nightHours || 0)} h, the night lasts ${site.darkHours} h.`} ${robotic ? `${fmt(R.opsHours)} science hours.` : `${fmt(R.evaHours)} moonwalk hours.`}</span></span></div>`;
    };
    const warns = S.site ? v.issues.filter(i => i.severity === 'warn') : [];
    const aside = `<div class="panel">${head('Phase 5 · Landing site', 'Where should we land?')}
      <div class="opts">${D.SITES.map(card).join('')}</div>${issueList(warns)}
      <p class="gear">${srcChip('sampleScience', 'NASA samples ↗')} Data from LRO: LOLA maps slopes, LROC takes photos, Diviner measures temperature.</p></div>`;
    return sceneScreen('f5a', { bar: 6, bubble: 'Which site can answer our question?', aside, footer: footer({ to: 'f3b', label: 'Launch pad' }, { act: 'f5a-next', label: 'Choose this site', reason: S.site ? '' : 'Pick a landing site' }) });
  }

  /* ---------------- Phase 5B: powered descent ---------------- */
  function screenF5b() {
    const P = playFor(5), run = P && P.phase === 'run', dec = P && P.decision, sr = M.siteReport(S);
    const top = SIM.PHASES[5].TUNING.startAlt;
    const alt = P && P.res.ready ? frameAt(P.res, P.p).alt : top;
    const left = `<div class="panel altgauge"><span class="kicker">Altitude</span><div class="altbar"><i id="alt-mark" style="bottom:${Math.max(0, Math.min(100, (alt == null ? top : alt) / top * 100)).toFixed(1)}%"></i></div><b id="alt-val">${fmt(Math.max(0, alt == null ? top : alt), 0)} m</b></div>`;
    const marginTxt = dec ? fmt(dec.marginLeft) + ' m/s' : '—';
    const aside = `<div class="panel">${head('Phase 5 · Powered descent', 'Land on the Moon')}
      <table class="life-table"><tbody>
        <tr><td>Descent delta-v</td><td>${fmt(D.DV.descent.value)} m/s</td></tr>
        <tr><td>Margin left</td><td><b>${esc(marginTxt)}</b></td></tr>
        <tr><td>Gravity</td><td>${D.MOON.gravity} m/s²</td></tr>
        ${sr ? `<tr><td>Hover you have, terrain needs</td><td>${fmt(sr.hoverAvailable, 0)} s, about ${fmt(sr.hoverTypical, 0)} s</td></tr>` : ''}</tbody></table>
      <p style="margin:8px 0 0"><span class="chip">Time compressed</span> <a class="gear" href="demo/5b.html" target="_blank" rel="noopener">Watch the animated version</a></p></div>
      ${playPanel(5, { label: P ? 'Play' : 'Start the descent', hint: 'Land softly to move on. Rocks may come up on the way.', disabled: !S.site })}`;
    const decision = P && P.phase === 'decision' && dec ? `<div class="decision" role="alertdialog" aria-label="Decision">
      <div class="dtitle">⚠️ ${esc(dec.prompt)}</div><p class="gear" style="margin:0 0 8px">Margin left: ${fmt(dec.marginLeft)} m/s</p>
      <div class="dbtns">${dec.options.map(o => `<button class="btn ${o.id === 'detour' ? 'primary' : ''}" data-act="decide" data-id="${esc(o.id)}">${esc(o.label)}${o.dvCost ? ' · ' + fmt(o.dvCost) + ' m/s' : ''}</button>`).join('')}</div></div>` : '';
    const ok = playPassed(5) || (S.landing && S.landing.outcome !== 'abort' && passedValid(5));
    const reason = run ? 'Descending…' : P && P.phase === 'decision' ? 'Make your call' : !ok ? 'Land the ship to continue' : '';
    return sceneScreen('f5b', { bar: 6, bubble: 'Watch the fuel margin!', left, aside, extra: decision, footer: footer({ to: 'f5a', label: 'Landing site' }, { act: 'f5b-next', label: 'Touch down', reason }) });
  }

  function screenF5Done() {
    const r = M.evaluate(S), land = S.landing || { outcome: 'clean' }, P = playFor(5);
    const rough = land.outcome === 'rough';
    const stars5 = P && P.phase === 'done' && P.res.ok ? P.res.stars : null;
    return `<div class="screen">${hud()}${phasebar(6)}<main class="main"><div>
      <div class="done-hero"><div class="kicker">Phase 5 complete · Moon surface</div><h1>Landed. Phase 6 is next 🌕</h1>
        <p class="lead" style="margin:8px auto">${rough ? 'A rough touchdown, but the lander is in one piece.' : 'A clean touchdown at ' + esc(M.findSite(S.site).title) + '.'} ${stars5 != null ? `<span class="stars">${stars(stars5)}</span>` : ''}</p></div>
      <div class="panel"><div class="kicker" style="margin-bottom:8px">Landing review</div><div class="gonogo">
        <div class="item"><span>Site<br><span class="gear">${esc(M.findSite(S.site).title)}</span></span><span class="go">GO</span></div>
        <div class="item"><span>Touchdown<br><span class="gear">${rough ? 'Rough' : 'Clean'}</span></span><span class="${rough ? 'nogo' : 'go'}">${rough ? 'ROUGH' : 'GO'}</span></div></div>
        <p class="gear" style="margin-top:10px">Next: measure the Moon for real, and find out what it is made of. Phase 6 is coming soon.</p></div>
    </div><aside><div class="panel"><div class="kicker">Coming next</div><h3 style="margin-top:6px">Phase 6 · Science on the surface</h3>
      <button class="btn primary" disabled style="width:100%;margin-top:8px">Coming soon</button></div>
      <div class="panel"><button class="btn" data-act="go" data-to="f5b" style="width:100%">← Back to the descent</button><div style="height:8px"></div><button class="btn ghost" data-act="sources" style="width:100%">See all NASA sources</button><button class="btn ghost" data-act="reset" style="width:100%">Start a new mission</button></div></aside></main></div>`;
  }

  /* ---------------- router ---------------- */
  const ROUTES = { start: screenStart, intro: screenIntro, f0: screenF0, f1a: screenF1a, f1b: screenF1b, f1done: screenF1Done, f2: screenF2, f2done: screenF2Done, f3a: screenF3a, f4: screenF4, f3b: screenF3b, f5a: screenF5a, f5b: screenF5b, f5done: screenF5Done };
  /** Screens in play order. A screen opens only when everything before it is done. */
  const GATES = [['f2', () => S.phase1Done, 'f1a'], ['f2done', () => S.phase2Done, 'f2'], ['f3a', () => S.phase2Done, 'f2'], ['f4', () => passedValid(3), 'f3a'], ['f3b', () => passedValid(4), 'f4'],
    ['f5a', () => launched(), 'f3b'], ['f5b', () => launched() && !!S.site, 'f5a'], ['f5done', () => passedValid(5) && !!S.landing && S.landing.outcome !== 'abort', 'f5b']];
  const LOCKED_AFTER_LAUNCH = ['f0', 'f1a', 'f1b', 'f1done', 'f2', 'f2done', 'f3a', 'f4'];
  function resumeRoute() {
    if (!S.phase0Done) return 'f0'; if (!S.phase1Done) return 'f1a'; if (!S.phase2Done) return 'f2'; if (!passedValid(3)) return 'f3a'; if (!passedValid(4)) return 'f4';
    if (!launched()) return 'f3b'; if (!S.site) return 'f5a'; if (!passedValid(5)) return 'f5b'; return 'f5done';
  }
  function route() {
    let r = (location.hash || '#start').slice(1);
    if (!ROUTES[r]) r = 'start';
    if ((r === 'f1a' || r === 'f1b') && !S.phase0Done) r = 'f0';
    if (r === 'f1b' && (M.missingSubsystems(S).length || !M.payloadAnswers(S))) r = 'f1a';
    if (r === 'f1done' && !S.phase1Done) r = S.phase0Done ? 'f1a' : 'f0';
    if ((r === 'f2' || r === 'f2done') && !S.phase1Done) r = S.phase0Done ? 'f1a' : 'f0';
    if (r === 'f2done' && !S.phase2Done) r = 'f2';
    if (r === 'f2' && S.missionType === 'crewed' && !S.crew) { S.crew = M.defaultCrew(); save(); }
    if (launched() && LOCKED_AFTER_LAUNCH.includes(r)) r = 'f3b';
    for (let guard = 0; guard < 10; guard++) { const g = GATES.find(x => x[0] === r); if (g && !g[1]()) r = g[2]; else break; }
    return r;
  }
  function focusKey(el) { return el && el.dataset ? [el.dataset.act, el.dataset.id, el.dataset.sub, el.dataset.to].join('|') : null; }
  function render() {
    const r = route();
    if (('#' + r) !== (location.hash || '#start')) history.replaceState(null, '', location.pathname + location.search + '#' + r);
    const y = window.scrollY;
    const fk = focusKey(document.activeElement);
    curRoute = r;
    if (PLAY && PLAY.route !== r) cancelPlay();
    $app.innerHTML = ROUTES[r]();
    currentScene = D.SCENES[r] || null; applyScene();
    if (fk && render.keepScroll) {
      const match = [...$app.querySelectorAll('[data-act]')].find(n => focusKey(n) === fk);
      if (match) match.focus({ preventScroll: true });
    }
    document.title = 'Space Syntax — ' + ({ start: 'Is the Moon made of cheese?', intro: 'Intro', f0: 'Phase 0: Mission goal', f1a: 'Phase 1: Build', f1b: 'Phase 1: Rocket', f1done: 'Phase 1 complete', f2: 'Phase 2: Crew', f2done: 'Phase 2 complete', f3a: 'Phase 3: Flight plan', f4: 'Phase 4: Communications', f3b: 'Launch pad', f5a: 'Phase 5: Landing site', f5b: 'Phase 5: Powered descent', f5done: 'Landed' }[r]);
    if (render.keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    render.keepScroll = false;
  }
  function go(to) {
    if (('#' + to) === location.hash) render(); else location.hash = to;
  }
  /** Keep the design consistent after any change (stale rocket, broken Phase 1 approval). */
  function revalidate() {
    const r = M.evaluate(S); if (!r) { S.rocket = null; S.phase1Done = false; return; }
    const here = (location.hash || '').slice(1);
    if (['f2', 'f2done', 'f3a', 'f4', 'f3b', 'f5a', 'f5b', 'f5done'].includes(here)) { // later phases show "too heavy" themselves; never yank the player back
      if (S.phase2Done && S.missionType === 'crewed' && (!M.validatePhase(S, 2).ok || !passedValid(2)) && (here === 'f2' || here === 'f2done')) { S.phase2Done = false; toast('Crew plan changed: confirm it again.'); }
      return;
    }
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
      case 'crew-minus': update(() => { S.crew.size = Math.max(D.LIFE.crewMin, S.crew.size - 1); }); break;
      case 'crew-plus': update(() => { S.crew.size = Math.min(D.LIFE.crewMax, S.crew.size + 1); }); break;
      case 'reserve': update(() => { S.crew.reserve = S.crew.reserve ? 0 : 0.2; }); break;
      case 'recycler': update(() => { S.crew.recycler = !S.crew.recycler; }); break;
      case 'suit': update(() => { S.crew.suit = id; }); break;
      case 'f2-confirm': S.phase2Done = true; save(); toast(S.missionType === 'crewed' ? 'Crew plan locked ✓' : 'Phase 2 done ✓'); go('f2done'); break;
      case 'margin': { const m = Number(id); if (D.FLIGHT.marginOptions.includes(m) && m >= M.minMargin(S)) update(() => { S.flight.margin = m; }); break; }
      case 'link': case 'dish': {
        const list = act === 'link' ? D.COMMS.links : D.COMMS.dishes;
        if (list.some(x => x.id === id)) update(() => { S.comms = Object.assign({ link: null, dish: null }, S.comms); S.comms[act] = id; });
        break;
      }
      case 'site': if (D.SITES.some(x => x.id === id)) update(() => { S.site = id; S.landing = null; }); break;
      case 'ping': { const C = M.commsPlan(S); toast(`Ping: ${C.roundTrip.toFixed(2)} s round trip. Light needs ${C.delay.avg.toFixed(2)} s each way.`); break; }
      case 'play': case 'seed': {
        const n = Number(el.dataset.n), kind = el.dataset.kind === 'launch' ? 'launch' : '';
        if (![1, 2, 3, 4, 5].includes(n)) break;
        if (kind === 'launch' && !M.launchReadiness(S).go) { toast('Every item must be GO first.'); break; }
        if (n === 5 && !S.site) { toast('Pick a landing site first.'); break; }
        startPlay(n, { kind, newSeed: act === 'seed' });
        break;
      }
      case 'launch': if (M.launchReadiness(S).go) startPlay(1, { kind: 'launch' }); else toast('Every item must be GO first.'); break;
      case 'play-skip': skipPlay(); break;
      case 'decide': decide(id); break;
      case 'f3a-next': go('f4'); break;
      case 'f4-next': go('f3b'); break;
      case 'f5a-next': go('f5b'); break;
      case 'f5b-next': go('f5done'); break;
      case 'toggle-math': update(() => { S.showMath[id] = !S.showMath[id]; }); break;
      case 'toggle-mel': update(() => { S.showMel = !S.showMel; }); break;
      case 'src': {
        const k = el.dataset.key;
        if (k === 'game') modal(`<h2>Game value</h2><p>This number is tuned for gameplay and scaled from real missions. It is not a measured fact. Numbers marked with a NASA chip come straight from NASA sources.</p>`);
        else { const s = D.SOURCES[k]; if (!s) return; modal(`<h2>Source</h2><p><b>${esc(s.title)}</b></p><p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a></p><p class="gear">Opened and checked by the Space Syntax team on Nov 14, 2026.</p>`); }
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
    if (id === 'dv') return modal(`<h2>🚀 Delta-v</h2><p>Delta-v is how much your spacecraft can change its speed. Your plan, margin included, is <b>${fmt(r.dvPlanned)} m/s</b>.</p>`);
    if (id === 'days') return modal(`<h2>📅 Days</h2><p>Crews choose their days in Phase 2. For robots, this is how many days of science data the radio test sent home.</p>`);
    if (id === 'data') return modal(`<h2>📡 Data</h2><p>Science data that reached Earth. It stays at 0 until you launch.</p>`);
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
  document.addEventListener('input', (e) => {
    if (e.target.matches && e.target.matches('input[data-act="days"]')) { const lab = document.getElementById('days-val'); if (lab) lab.textContent = e.target.value; }
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches && e.target.matches('input[data-act="days"]')) {
      const v = Math.round(Number(e.target.value));
      if (Number.isFinite(v)) update(() => { S.crew.days = Math.max(M.minDays(), Math.min(D.LIFE.daysMax, v)); });
    }
  });
  window.addEventListener('hashchange', render);
  if (demoSpec) { demoSpec.pass.forEach(k => { S.passed[k] = sigOf(k === 'launch' ? 4 : k); }); if (demoSpec.play) demoPlay(demoSpec.play); }
  render();

})();
