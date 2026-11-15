/* Space Syntax demo: Phase 5B "Powered descent".
 * TEMPLATE: shows how a static mockup becomes a live scene driven by the real backend (SS_SIM).
 * Layer 1 = canvas scene (drawn from frame data). Layer 2 = HTML overlay (live text, buttons).
 * Query options: ?at=descent | decision | landed jumps to that moment (used for screenshots).
 */
(function () {
  'use strict';
  // Teammate: drop transparent PNGs here (paths relative to this file). null = procedural placeholder.
  // lander: feet at bottom center. kid: drawn inside the window. rock/earth/ground: see draw functions.
  const SPRITES = { lander: null, kid: null, rock: null, earth: null, ground: null };

  const D = window.SS_DATA, M = window.SS_MODEL, SIM = window.SS_SIM;
  const $ = (id) => document.getElementById(id);
  const cv = $('scene'), ctx = cv.getContext('2d');
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const params = new URLSearchParams(location.search);
  const AT = params.get('at');
  const SPEED_PRE = 2, SPEED_POST = 4; // time compression: 1 s on screen = N s of simulated flight

  // ---------- sprites ----------
  const imgs = {};
  Object.keys(SPRITES).forEach((k) => {
    if (!SPRITES[k]) return;
    const im = new Image();
    im.onload = () => { imgs[k] = im; layersDirty = true; };
    im.src = SPRITES[k];
  });

  // ---------- backend ----------
  function buildState(margin, seed) {
    const s = M.newState();
    Object.assign(s, { question: 'made', measure: 'chem', missionType: 'robotic', rocket: 'medium', site: 'descartes', landing: { seed } });
    s.design = { structure: 'aluminum', shield: 'whipple', thermal: 'passive', power: 'solarBig', science: ['camera', 'spectrometer'] };
    s.flight = { margin };
    return s;
  }
  /** Interpolated frame at time t. Frames are sorted by t; the two runs have different frame spacing, so always seek by t. */
  function sample(frames, t) {
    let lo = 0, hi = frames.length - 1;
    if (t <= frames[0].t) return frames[0];
    if (t >= frames[hi].t) return frames[hi];
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (frames[m].t <= t) lo = m; else hi = m; }
    const a = frames[lo], b = frames[hi], k = (t - a.t) / (b.t - a.t || 1), o = {};
    for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k;
    return o;
  }

  // ---------- run state ----------
  let st; // { state, seed, pause, full, mode: 'pre'|'decision'|'post'|'done', simT, shake, tilt }
  let cur = null, parts = [], wallT = 0, last = 0, hidden = false;

  function start() {
    const seed = +$('seedSel').value, margin = +$('marginSel').value;
    const state = buildState(margin, seed);
    const pause = SIM.simulate(state, 5, { seed, interactive: true });
    if (!pause.decision) { $('ticker').hidden = false; $('ticker').textContent = pause.failure ? pause.failure.cause : 'Not ready'; return; }
    st = { state, seed, pause, full: null, mode: 'pre', simT: 0, shakeT: -9, tilt: 0 };
    parts = [];
    cur = pause.frames[0];
    ['decision', 'result'].forEach((i) => { $(i).hidden = true; });
    $('bubble').hidden = false;
    $('pMargin').textContent = pause.decision.marginLeft + ' m/s';
    $('pDv').textContent = D.DV.descent.value.toLocaleString('en-US') + ' m/s';
    $('pG').textContent = D.MOON.gravity + ' m/s²';
    buildHud(pause.fields);
    if (AT === 'descent') { st.simT = 5; }
    if (AT === 'decision' || AT === 'landed') { st.simT = pause.decision.t; }
    if (AT) prewarm();
    if (AT === 'landed') choose('detour');
  }
  function run() { return st.mode === 'post' || st.mode === 'done' ? st.full : st.pause; }

  function showDecision() {
    const d = st.pause.decision;
    st.mode = 'decision';
    $('dPrompt').textContent = d.prompt;
    const box = $('dOptions'); box.textContent = '';
    d.options.forEach((o) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = o.dvCost > 0 ? `${o.label} · ${o.dvCost} m/s` : o.label;
      b.addEventListener('click', () => choose(o.id));
      box.appendChild(b);
    });
    $('decision').hidden = false;
  }
  function choose(id) {
    $('decision').hidden = true;
    st.full = SIM.simulate(st.state, 5, { seed: st.seed, choice: id });
    st.mode = 'post';
    if (AT === 'landed') { st.simT = st.full.time.total; cur = sample(st.full.frames, st.simT); finish(); prewarm(1); }
  }
  function finish() {
    const r = st.full, last = r.events[r.events.length - 1];
    st.mode = 'done';
    const kind = r.outcome === 'success' ? 'good' : r.outcome === 'partial' ? 'mid' : 'bad';
    $('result').className = 'card glass ' + kind;
    $('rTitle').textContent = r.outcome === 'success' ? 'Contact light!' : r.outcome === 'partial' ? 'Hard landing' : 'Descent aborted';
    $('rStars').innerHTML = '';
    if (r.ok) for (let i = 0; i < 3; i++) { const s = document.createElement('span'); s.textContent = '★'; if (i >= r.stars) s.className = 'off'; $('rStars').appendChild(s); }
    $('rBody').textContent = r.failure ? r.failure.cause : last.text;
    $('rFix').hidden = !r.failure;
    $('rFix').textContent = r.failure ? 'Fix: ' + r.failure.fix : '';
    $('result').hidden = false;
    $('bubble').hidden = true;
    if (r.ok) { burst(1); if (r.outcome === 'partial') { st.shakeT = wallT; st.tilt = 0.07; } }
    setTicker(last.text, last.kind);
  }

  // ---------- HUD (labels come from result.fields) ----------
  let hudEls = {};
  function buildHud(fields) {
    const hud = $('hud'); hud.textContent = ''; hudEls = {};
    const F = (k) => fields.find((f) => f.key === k);
    const cell = (cls, label, key) => {
      const c = document.createElement('div'); c.className = 'cell ' + (cls || '');
      const s = document.createElement('span'); s.textContent = label;
      c.appendChild(s); hud.appendChild(c); hudEls[key] = c; return c;
    };
    const fuel = cell('fuel', F('fuel').label, 'fuel');
    fuel.insertAdjacentHTML('beforeend', '<div class="bar"><i></i></div><b></b>');
    ['vz', 'x', 'throttle', 'dv'].forEach((k) => { const c = cell('', F(k).label, k); c.appendChild(document.createElement('b')); });
    $('gaugeLabel').textContent = F('alt').label;
    hudEls.fields = fields;
  }
  function updateHud(f) {
    const U = {}; hudEls.fields.forEach((x) => { U[x.key] = x; });
    const set = (k, txt) => { hudEls[k].querySelector('b').textContent = txt; };
    set('fuel', Math.round(f.fuel) + '%');
    const bar = hudEls.fuel.querySelector('.bar'); bar.classList.toggle('low', f.fuel <= 20); // 20 = low fuel warning level of the backend
    bar.firstChild.style.width = clamp(f.fuel, 0, 100) + '%';
    set('vz', Math.abs(f.vz).toFixed(1) + ' ' + U.vz.unit);
    set('x', Math.round(f.x) + ' ' + U.x.unit);
    set('throttle', Math.round(f.throttle * 100) + '%');
    set('dv', Math.round(f.dv) + ' ' + U.dv.unit);
    const top = 300; // start altitude of the approach, so the gauge shows the whole descent
    $('gaugeMark').style.bottom = `calc(${clamp(f.alt / top, 0, 1) * 100}% - 4px)`;
    $('gaugeVal').textContent = Math.max(0, Math.round(f.alt)) + ' m';
  }
  function setTicker(text, kind) {
    const t = $('ticker'); t.hidden = !text; t.textContent = text || ''; t.className = 'glass pill ' + (kind || '');
  }

  // ---------- layout / static layers ----------
  let W = 0, H = 0, dpr = 1, U = 1, layersDirty = true, sky, ground;
  const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  function layer() { const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; U = H / 768;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    layersDirty = true;
  }
  const horizon = () => H * 0.7;
  const groundY = () => H * 0.75; // where the lander feet touch

  function buildSky() {
    let g;[sky, g] = layer();
    const gr = g.createLinearGradient(0, 0, 0, horizon());
    gr.addColorStop(0, '#0b0a24'); gr.addColorStop(0.6, '#1c1a46'); gr.addColorStop(1, '#2d2a63');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // Milky Way: a diagonal band of soft blobs and fine dust
    const r = rng(7); g.save(); g.translate(W * 0.1, H * 0.02); g.rotate(0.55);
    for (let i = 0; i < 70; i++) {
      const x = r() * W * 1.3, y = (r() - 0.5) * 90 * U + Math.sin(x / 260) * 30 * U, rad = (50 + r() * 110) * U;
      const b = g.createRadialGradient(x, y, 0, x, y, rad);
      b.addColorStop(0, 'rgba(170,130,230,.13)'); b.addColorStop(1, 'rgba(170,130,230,0)');
      g.fillStyle = b; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(230,215,255,${0.1 + r() * 0.4})`; g.fillRect(r() * W * 1.3, (r() - 0.5) * 140 * U + 0 * i, 1.2, 1.2); }
    g.restore();
    // Earth on the horizon
    const ex = W * 0.8, ey = horizon() - 52 * U, er = 42 * U;
    if (imgs.earth) g.drawImage(imgs.earth, ex - er, ey - er, er * 2, er * 2);
    else {
      g.save(); g.beginPath(); g.arc(ex, ey, er, 0, 7); g.clip();
      const o = g.createRadialGradient(ex - er * 0.4, ey - er * 0.4, er * 0.1, ex, ey, er);
      o.addColorStop(0, '#6fa8e8'); o.addColorStop(1, '#1b3a7a'); g.fillStyle = o; g.fillRect(ex - er, ey - er, er * 2, er * 2);
      g.fillStyle = 'rgba(120,170,90,.75)'; g.beginPath(); g.ellipse(ex - er * 0.2, ey - er * 0.1, er * 0.35, er * 0.5, 0.5, 0, 7); g.fill();
      g.beginPath(); g.ellipse(ex + er * 0.5, ey + er * 0.35, er * 0.2, er * 0.3, -0.3, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(ex + (i - 2) * er * 0.4, ey + (i % 2 ? 1 : -1) * er * 0.3, er * 0.35, er * 0.07, 0.2, 0, 7); g.fill(); }
      const sh = g.createRadialGradient(ex + er * 0.5, ey + er * 0.4, er * 0.4, ex + er * 0.5, ey + er * 0.4, er * 1.3);
      sh.addColorStop(0, 'rgba(8,6,30,0)'); sh.addColorStop(1, 'rgba(8,6,30,.6)'); g.fillStyle = sh; g.fillRect(ex - er, ey - er, er * 2, er * 2);
      g.restore();
      const glow = g.createRadialGradient(ex, ey, er, ex, ey, er * 1.5);
      glow.addColorStop(0, 'rgba(120,170,255,.25)'); glow.addColorStop(1, 'rgba(120,170,255,0)'); g.fillStyle = glow; g.fillRect(ex - er * 2, ey - er * 2, er * 4, er * 4);
    }
  }
  function rock(g, x, y, s, r) {
    if (imgs.rock) { g.drawImage(imgs.rock, x - s, y - s * 1.1, s * 2, s * 1.4); return; }
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI; pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.3), y + Math.sin(a) * s * (0.6 + r() * 0.3)]); }
    g.fillStyle = 'rgba(10,8,30,.35)'; g.beginPath(); g.ellipse(x + s * 0.2, y, s * 1.1, s * 0.2, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x - s, y); pts.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(x + s, y); g.closePath();
    const f = g.createLinearGradient(x - s, y - s, x + s, y); f.addColorStop(0, '#a9a6c9'); f.addColorStop(1, '#4e4b73');
    g.fillStyle = f; g.fill(); g.strokeStyle = 'rgba(20,16,50,.5)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[3][0], pts[3][1]); g.lineTo(x, y - s * 0.2); g.fill();
  }
  function crater(g, x, y, w) {
    const h = w * 0.22;
    g.fillStyle = 'rgba(30,26,66,.55)'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(200,196,235,.35)'; g.lineWidth = Math.max(1, w * 0.06); g.beginPath(); g.ellipse(x, y - h * 0.05, w, h, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.strokeStyle = 'rgba(15,12,40,.4)'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0.1, Math.PI - 0.1); g.stroke();
  }
  function buildGround() {
    let g;[ground, g] = layer();
    const hy = horizon(), r = rng(21);
    // far ridge, mid plain, near plain: three layers, lighter and softer in the distance
    const ridge = (base, amp, col, seed) => {
      const rr = rng(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x / (170 * U) + seed)) * (0.7 + rr() * 0.3));
      g.lineTo(W, H); g.fill();
    };
    ridge(hy + 6 * U, 26 * U, '#403c75', 3);
    ridge(hy + 22 * U, 12 * U, '#4c4880', 5);
    const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, '#59558e'); gr.addColorStop(0.5, '#4a4678'); gr.addColorStop(1, '#2e2b57');
    g.fillStyle = gr; g.fillRect(0, hy + 30 * U, W, H);
    if (imgs.ground) { g.drawImage(imgs.ground, 0, hy, W, H - hy); }
    for (let i = 0; i < 90; i++) { // grainy texture
      const y = hy + 30 * U + r() * (H - hy), d = (y - hy) / (H - hy);
      g.fillStyle = r() > 0.5 ? 'rgba(220,215,255,.07)' : 'rgba(10,8,30,.1)'; g.fillRect(r() * W, y, (4 + r() * 18) * d * U, (1 + r() * 3) * d * U);
    }
    for (let i = 0; i < 26; i++) { const d = Math.pow(r(), 1.6); crater(g, r() * W, hy + 40 * U + d * (H - hy - 40 * U), (10 + d * 90) * U * (0.5 + r())); }
    for (let i = 0; i < 40; i++) { const d = Math.pow(r(), 1.4); rock(g, r() * W, hy + 36 * U + d * (H - hy - 36 * U), (2 + d * 14) * U * (0.5 + r()), r); }
    // landing zone rocks (the "rocks ahead") and big foreground boulders like the mockup
    [[0.3, 0.8, 20], [0.62, 0.78, 15], [0.7, 0.86, 24], [0.5, 0.8, 18]].forEach((b) => rock(g, W * b[0], H * b[1], b[2] * U, r));
    rock(g, W * 0.12, H * 0.93, 70 * U, r); rock(g, W * 0.06, H * 0.82, 38 * U, r);
  }

  // ---------- stars ----------
  const stars = (() => { const r = rng(99), a = []; for (let i = 0; i < 260; i++) a.push({ x: r(), y: r() * 0.72, z: 0.2 + r() * 0.8, p: r() * 7, s: 0.6 + r() * 2 }); return a; })();
  function drawStars(t, camX) {
    stars.forEach((s) => {
      const a = (0.35 + 0.65 * s.z) * (0.65 + 0.35 * Math.sin(t * s.s + s.p));
      ctx.fillStyle = `rgba(235,230,255,${a})`;
      const x = (((s.x * W - camX * s.z * 0.06) % W) + W) % W;
      ctx.fillRect(x, s.y * H, s.z * 1.8 + 0.4, s.z * 1.8 + 0.4);
    });
  }

  // ---------- lander ----------
  function drawLander(x, y, throttle, f) {
    const s = 1.3 * U, hdr = imgs.lander;
    ctx.save(); ctx.translate(x, y); ctx.rotate(st.tilt * Math.min(1, Math.max(0, 1 - f.alt / 5))); ctx.scale(s, s);
    // flame first (behind the body): length follows throttle
    if (throttle > 0.02) {
      const len = (24 + throttle * 150) * (0.92 + 0.08 * Math.sin(wallT * 60)), w = 22 + throttle * 16;
      const g = ctx.createLinearGradient(0, -38, 0, -38 + len);
      g.addColorStop(0, 'rgba(255,248,230,.95)'); g.addColorStop(0.25, 'rgba(210,190,255,.6)'); g.addColorStop(1, 'rgba(150,120,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-16, -38); ctx.lineTo(-w * 0.9, -38 + len); ctx.lineTo(w * 0.9, -38 + len); ctx.lineTo(16, -38); ctx.closePath(); ctx.fill();
    }
    if (hdr) { ctx.drawImage(hdr, -95, -200, 190, 200); if (imgs.kid) ctx.drawImage(imgs.kid, -22, -134, 44, 44); ctx.restore(); return; }
    // legs
    ctx.strokeStyle = '#7d7a99'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    [[-40, -55, -82, -4], [40, -55, 82, -4]].forEach((l) => { ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke(); });
    ctx.lineWidth = 5; ctx.strokeStyle = '#6a6788';
    [[-22, -52, -42, -6], [22, -52, 42, -6]].forEach((l) => { ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke(); });
    ctx.fillStyle = '#9a97b8'; [-82, 82, -42, 42].forEach((px) => ctx.fillRect(px - 13, -6, 26, 6));
    // nozzle
    ctx.fillStyle = '#4a4768'; ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(-20, -36); ctx.lineTo(20, -36); ctx.lineTo(14, -50); ctx.fill();
    // body
    const b = ctx.createLinearGradient(-70, -150, 70, -50); b.addColorStop(0, '#c4c1dc'); b.addColorStop(0.6, '#8f8cac'); b.addColorStop(1, '#615e84');
    ctx.fillStyle = b; ctx.beginPath(); ctx.moveTo(-46, -50); ctx.lineTo(-70, -100); ctx.lineTo(-52, -140); ctx.lineTo(-30, -152); ctx.lineTo(30, -152); ctx.lineTo(52, -140); ctx.lineTo(70, -100); ctx.lineTo(46, -50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,26,60,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-60, -76); ctx.lineTo(60, -76); ctx.moveTo(-64, -118); ctx.lineTo(64, -118); ctx.stroke();
    ctx.fillStyle = 'rgba(40,36,70,.55)'; for (let i = -5; i <= 5; i++) { ctx.fillRect(i * 11 - 1, -73, 2.4, 2.4); ctx.fillRect(i * 11 - 1, -115, 2.4, 2.4); }
    ctx.fillStyle = '#b9e28c'; ctx.shadowColor = '#b9e28c'; ctx.shadowBlur = 8;
    [[-62, -98], [50, -100], [-40, -66], [30, -66]].forEach((p) => ctx.fillRect(p[0], p[1], 12, 7));
    ctx.beginPath(); ctx.moveTo(0, -152); ctx.lineTo(0, -186); ctx.strokeStyle = '#8f8cac'; ctx.stroke(); ctx.beginPath(); ctx.arc(0, -189, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    // window with a placeholder silhouette of the kid
    ctx.save(); ctx.beginPath(); ctx.arc(0, -108, 27, 0, 7); ctx.fillStyle = '#4b4868'; ctx.fill(); ctx.beginPath(); ctx.arc(0, -108, 22, 0, 7); ctx.clip();
    const w = ctx.createRadialGradient(0, -100, 2, 0, -108, 24); w.addColorStop(0, '#ffe2b0'); w.addColorStop(1, '#6b4f7a'); ctx.fillStyle = w; ctx.fillRect(-24, -134, 48, 48);
    if (imgs.kid) ctx.drawImage(imgs.kid, -22, -130, 44, 44);
    else {
      ctx.fillStyle = '#3a2a3e'; ctx.beginPath(); ctx.arc(0, -112, 11, 0, 7); ctx.fill(); // head
      ctx.beginPath(); ctx.ellipse(0, -88, 17, 14, 0, 0, 7); ctx.fill(); // shoulders
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(-8, -118, 6, 3.4, 4.7); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -108, 22, 3.6, 4.6); ctx.stroke();
    ctx.restore();
  }

  // ---------- dust ----------
  function emit(x, n, power) {
    for (let i = 0; i < n && parts.length < 450; i++) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      parts.push({ x: x + (Math.random() - 0.5) * 30 * U, y: groundY() + (Math.random() - 0.3) * 8 * U, vx: dir * (30 + Math.random() * 130) * power * U, vy: -(5 + Math.random() * 35) * power * U, r: (6 + Math.random() * 10) * U, life: 0, max: 1.4 + Math.random() * 1.6 });
    }
  }
  function burst(power) { if (cur) emit(landerX(cur), 140, 2.2 * power); }
  function stepParts(dt) {
    parts.forEach((p) => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 1.4 * dt; p.vy *= 1 - 1.2 * dt; p.r += 14 * U * dt; });
    parts = parts.filter((p) => p.life < p.max);
  }
  function drawParts() {
    parts.forEach((p) => {
      const a = 0.32 * (1 - p.life / p.max), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(190,180,225,${a})`); g.addColorStop(1, 'rgba(190,180,225,0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
  }
  /** Run the dust sim a bit so jump-to screenshots (and a fresh landing) already have dust in the air. */
  function prewarm(power) {
    const f = cur = sample(run().frames, st.simT);
    for (let i = 0; i < (power ? 30 : 90); i++) { if (!power) emitFromFrame(f, 1 / 60); stepParts(1 / 60); }
  }
  function emitFromFrame(f, dt) {
    const near = clamp(1 - altPx(f.alt) / (280 * U), 0, 1); // closer to the ground = more dust
    if (f.throttle > 0.05 && near > 0) emit(landerX(f), Math.round(dt * 260 * f.throttle * near * near + Math.random()), 0.8 + near);
  }

  // ---------- mapping frame fields to screen ----------
  const altPx = (alt) => Math.sqrt(Math.max(0, alt) / 300) * H * 0.34; // sqrt scale keeps the last metres visible
  const landerX = (f) => W * 0.42 + (f.x - 60) * W * 0.0022 + 60 * W * 0.0022 * 0.2;

  function drawScene() {
    if (layersDirty) { buildSky(); buildGround(); layersDirty = false; }
    const f = cur, x = landerX(f), y = groundY() - altPx(f.alt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sh = clamp(1 - (wallT - st.shakeT) / 0.9, 0, 1) * 12 * U;
    ctx.save(); if (sh) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    ctx.drawImage(sky, 0, 0, W, H); drawStars(wallT, x - W * 0.42);
    ctx.drawImage(ground, 0, 0, W, H);
    // engine glow on the ground
    const near = clamp(1 - altPx(f.alt) / (230 * U), 0, 1) * f.throttle;
    if (near > 0.02) { const g = ctx.createRadialGradient(x, groundY(), 0, x, groundY(), 190 * U); g.addColorStop(0, `rgba(215,200,255,${0.4 * near})`); g.addColorStop(1, 'rgba(215,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 190 * U, groundY() - 80 * U, 380 * U, 160 * U); }
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, groundY() + 4 * U, 90 * U, 10 * U, 0, 0, 7); ctx.fillStyle = `rgba(8,6,28,${0.4 * clamp(1 - altPx(f.alt) / (H * 0.6), 0.1, 1)})`; ctx.fill(); ctx.restore();
    drawLander(x, y, f.throttle, f);
    drawParts();
    ctx.restore();
    // speech bubble follows the lander
    const b = $('bubble'); if (!b.hidden) b.style.transform = `translate(${Math.round(x + 70 * U)}px, ${Math.round(clamp(y - 270 * U, 90, H - 200))}px)`;
  }

  // ---------- main loop ----------
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
    if (hidden || !st) return;
    wallT += dt;
    if (st.mode === 'pre' || st.mode === 'post') {
      st.simT += dt * (st.mode === 'pre' ? SPEED_PRE : SPEED_POST);
      const R = run(), end = st.mode === 'pre' ? st.pause.decision.t : st.full.time.total;
      if (st.simT >= end) { st.simT = end; if (st.mode === 'pre') showDecision(); else finish(); }
      cur = sample(R.frames, st.simT);
      emitFromFrame(cur, dt);
      const ev = R.events.filter((e) => e.t <= st.simT).pop();
      if (st.mode !== 'done' && ev && !(st.mode === 'pre' && ev.t >= st.pause.decision.t)) setTicker(ev.text, ev.kind);
    } else if (st.mode === 'decision') { cur = sample(st.pause.frames, st.pause.decision.t); emitFromFrame(cur, dt); }
    else if (st.mode === 'done') { cur = sample(st.full.frames, st.full.time.total); }
    stepParts(dt);
    updateHud(cur);
    drawScene();
  }

  // ---------- init ----------
  for (let i = 1; i <= 6; i++) { const o = document.createElement('option'); o.value = i; o.textContent = i; $('seedSel').appendChild(o); }
  [0, 0.05, 0.1, 0.2].forEach((m) => { const o = document.createElement('option'); o.value = m; o.textContent = Math.round(m * 100) + '%'; if (m === 0.1) o.selected = true; $('marginSel').appendChild(o); });
  $('again').addEventListener('click', start);
  $('seedSel').addEventListener('change', start);
  $('marginSel').addEventListener('change', start);
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; last = performance.now(); });
  window.addEventListener('resize', resize);
  resize(); start(); requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
})();
