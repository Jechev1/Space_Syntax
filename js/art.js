/* Space Syntax - inline SVG art. Sets window.SS_ART. No dependencies. */
(function () {
  'use strict';

  var C = {
    line: 'var(--line,#2A3550)', text: 'var(--text,#E8ECF5)', primary: 'var(--primary,#3D7BFF)',
    cheese: 'var(--cheese,#FFC845)', ok: 'var(--ok,#2BB673)', danger: 'var(--danger,#E5484D)',
    panel: 'var(--panel,#141B2E)', muted: 'var(--muted,#9AA6C0)'
  };
  var FONT = 'font-family="system-ui,-apple-system,Segoe UI,sans-serif"';
  var SUBS = ['structure', 'shield', 'thermal', 'power', 'science'];
  var INSTR = ['camera', 'spectrometer', 'neutron', 'sampler'];

  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }

  // Highlight/dim rules live in css/style.css (no inline <style>, so a strict Content-Security-Policy works).
  var STYLE = '';

  /* group wrapper with highlight / dim behaviour */
  function grp(id, active, inner) {
    var cls = '';
    if (active) cls = (id === active) ? ' class="hl"' : ' class="dim"';
    if (id === active) inner = '<g class="gl">' + inner + '</g><g class="mn">' + inner + '</g>';
    return '<g data-sub="' + id + '"' + cls + '>' + inner + '</g>';
  }

  /* ---------- Milo ---------- */
  function milo(mood) {
    mood = pick(mood, ['happy', 'thinking', 'wow'], 'happy');
    var eyes, mouth, brows = '', extra = '', hands;
    var ink = '#2a1d17';
    var glove = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#cfd8ec" stroke="' + C.line + '" stroke-width="1.5"/>'; };
    if (mood === 'happy') {
      eyes = '<ellipse cx="40" cy="46" rx="2.8" ry="3.3" fill="' + ink + '"/><ellipse cx="56" cy="46" rx="2.8" ry="3.3" fill="' + ink + '"/>' +
        '<circle cx="41" cy="45" r="1" fill="#fff"/><circle cx="57" cy="45" r="1" fill="#fff"/>';
      mouth = '<path d="M40 54 Q48 64 56 54 Z" fill="#7a2b2b" stroke="' + ink + '" stroke-width="1.4" stroke-linejoin="round"/>';
      hands = glove(21, 86) + glove(75, 86);
    } else if (mood === 'thinking') {
      eyes = '<ellipse cx="41" cy="45" rx="2.8" ry="3.3" fill="' + ink + '"/><ellipse cx="57" cy="45" rx="2.8" ry="3.3" fill="' + ink + '"/>' +
        '<circle cx="42.2" cy="43.8" r="1" fill="#fff"/><circle cx="58.2" cy="43.8" r="1" fill="#fff"/>';
      brows = '<path d="M35 38 L44 36" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/><path d="M53 37 Q58 33 63 36" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>';
      mouth = '<path d="M43 58 Q49 55 54 58" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>';
      extra = '<circle cx="82" cy="22" r="2" fill="' + C.text + '" opacity=".8"/><circle cx="87" cy="14" r="3" fill="' + C.text + '" opacity=".8"/><circle cx="90" cy="5" r="4" fill="' + C.text + '" opacity=".8"/>';
      hands = glove(21, 86) + glove(62, 80);
    } else {
      eyes = '<circle cx="40" cy="46" r="5" fill="#fff" stroke="' + ink + '" stroke-width="1.6"/><circle cx="56" cy="46" r="5" fill="#fff" stroke="' + ink + '" stroke-width="1.6"/>' +
        '<circle cx="40" cy="46" r="2.4" fill="' + ink + '"/><circle cx="56" cy="46" r="2.4" fill="' + ink + '"/>';
      brows = '<path d="M34 37 Q40 33 45 36" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/><path d="M51 36 Q56 33 62 37" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>';
      mouth = '<ellipse cx="48" cy="59" rx="4.2" ry="5.2" fill="#7a2b2b" stroke="' + ink + '" stroke-width="1.5"/>';
      extra = '<path d="M86 10 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="' + C.cheese + '"/><path d="M9 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="' + C.cheese + '"/>';
      hands = glove(13, 70) + glove(83, 70);
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Milo the astronaut kid looks ' + mood + '">' +
      '<path d="M18 96 Q18 71 48 71 Q78 71 78 96 Z" fill="#e9eefb" stroke="' + C.line + '" stroke-width="2"/>' +
      '<ellipse cx="48" cy="75" rx="21" ry="5" fill="#aeb9d4" stroke="' + C.line + '" stroke-width="1.5"/>' +
      '<circle cx="48" cy="45" r="25" fill="#f2c9a0"/>' +
      '<path d="M24 42 Q26 20 48 20 Q70 20 72 42 Q62 31 48 33 Q34 31 24 42Z" fill="#4a3226"/>' +
      '<circle cx="33" cy="54" r="3.4" fill="#ff9a8a" opacity=".55"/><circle cx="63" cy="54" r="3.4" fill="#ff9a8a" opacity=".55"/>' +
      brows + eyes + mouth +
      '<circle cx="48" cy="45" r="33" fill="#7fb0ff" fill-opacity=".16" stroke="#dbe3f5" stroke-width="4.5"/>' +
      '<path d="M25 34 Q30 20 45 14" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="48" cy="87" r="8" fill="#1b2440" stroke="' + C.primary + '" stroke-width="1.5"/>' +
      '<path d="M41.5 91 L54.5 91 L54.5 82.5 Z" fill="' + C.cheese + '" stroke="#b8860b" stroke-width=".8" stroke-linejoin="round"/>' +
      '<circle cx="51" cy="88.5" r="1" fill="#b8860b"/><circle cx="47.5" cy="90" r=".8" fill="#b8860b"/>' +
      hands + extra + '</svg>';
  }

  /* ---------- Moon ---------- */
  function moon(size) {
    size = Math.max(16, Math.min(2000, num(size, 400)));
    var cr = [[130, 130, 46], [250, 110, 30], [290, 230, 52], [160, 270, 34], [90, 230, 20], [215, 195, 18], [320, 140, 16], [210, 320, 22]];
    var s = '', i;
    for (i = 0; i < cr.length; i++) {
      s += '<circle cx="' + cr[i][0] + '" cy="' + cr[i][1] + '" r="' + cr[i][2] + '" fill="#8d94a6"/>' +
        '<circle cx="' + (cr[i][0] + 3) + '" cy="' + (cr[i][1] + 3) + '" r="' + (cr[i][2] - 4) + '" fill="#9aa1b3"/>' +
        '<circle cx="' + cr[i][0] + '" cy="' + cr[i][1] + '" r="' + cr[i][2] + '" fill="none" stroke="#c9cfdd" stroke-width="2" stroke-opacity=".6"/>';
    }
    var holes = [[110, 195, 14], [270, 175, 10], [230, 285, 12], [185, 100, 9], [335, 215, 8]], h = '';
    for (i = 0; i < holes.length; i++) {
      h += '<circle cx="' + holes[i][0] + '" cy="' + holes[i][1] + '" r="' + holes[i][2] + '" fill="#7a5a10" fill-opacity=".55" stroke="' + C.cheese + '" stroke-width="2"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="' + size + '" height="' + size + '" role="img" aria-label="The Moon, with playful cheese holes showing what Milo believes">' +
      '<defs><radialGradient id="ssMoonG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e4e8f2"/><stop offset=".6" stop-color="#b9bfd0"/><stop offset="1" stop-color="#8189a0"/></radialGradient>' +
      '<clipPath id="ssMoonC"><circle cx="200" cy="200" r="170"/></clipPath></defs>' +
      '<circle cx="200" cy="200" r="190" fill="none" stroke="' + C.cheese + '" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round" opacity=".7"/>' +
      '<circle cx="200" cy="200" r="170" fill="url(#ssMoonG)"/>' +
      '<g clip-path="url(#ssMoonC)">' + s +
      '<circle cx="200" cy="200" r="170" fill="' + C.cheese + '" fill-opacity=".16"/>' + h + '</g>' +
      '<circle cx="200" cy="200" r="170" fill="none" stroke="' + C.line + '" stroke-width="3"/>' +
      '<rect x="262" y="34" width="110" height="40" rx="12" fill="' + C.panel + '" stroke="' + C.cheese + '" stroke-width="2"/>' +
      '<path d="M290 74 l-6 14 l18 -14z" fill="' + C.panel + '" stroke="' + C.cheese + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="286" y="71" width="14" height="5" fill="' + C.panel + '"/>' +
      '<text x="317" y="60" text-anchor="middle" ' + FONT + ' font-size="18" font-weight="700" fill="' + C.cheese + '">belief?</text></svg>';
  }

  /* ---------- Ship helpers ---------- */
  function structFill(d) {
    return d.structure === 'composite'
      ? { f: '#3b4252', s: '#6b7488', l: '#2a303d' }
      : { f: '#b9c1d0', s: '#e6ebf4', l: '#98a1b3' };
  }

  function icon(id, x, y) {
    var g = '<circle r="10" fill="' + C.panel + '" stroke="' + C.text + '" stroke-width="1.4"/>';
    var t = ' fill="none" stroke="' + C.text + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
    if (id === 'camera') g += '<rect x="-5.5" y="-3" width="11" height="8" rx="1.5"' + t + '/><circle cx="0" cy="1" r="2.2"' + t + '/><rect x="-2.5" y="-5.2" width="5" height="2.2"' + t + '/>';
    else if (id === 'spectrometer') g += '<path d="M-4.5 4 L0 -5 L4.5 4Z"' + t + '/><path d="M-9 0 L-2 0.5" stroke="' + C.text + '" stroke-width="1.2"/><path d="M4 -1 L9 -4" stroke="#ff6b6b" stroke-width="1.2"/><path d="M4.5 1 L9.5 1" stroke="#ffd166" stroke-width="1.2"/><path d="M4 3 L9 6" stroke="#4da3ff" stroke-width="1.2"/>';
    else if (id === 'neutron') g += '<circle r="1.8" fill="' + C.text + '"/><ellipse rx="6.5" ry="2.6"' + t + '/><ellipse rx="6.5" ry="2.6" transform="rotate(60)"' + t + '/><ellipse rx="6.5" ry="2.6" transform="rotate(120)"' + t + '/>';
    else if (id === 'sampler') g += '<path d="M-6 5 L-1 -3 L4 -3"' + t + '/><path d="M4 -3 Q8 -3 7 1 L2 1 Z"' + t + '/>';
    return '<g transform="translate(' + x + ' ' + y + ')">' + g + '</g>';
  }

  function sciIcons(list, x0, y, gap) {
    var out = '', i, n = 0;
    for (i = 0; i < INSTR.length; i++) {
      if (list.indexOf(INSTR[i]) >= 0) { out += icon(INSTR[i], x0 + n * gap, y); n++; }
    }
    return out;
  }

  /* offset shield outline around a rect */
  function shieldRect(type, x, y, w, h, r) {
    var o = function (off, extra) {
      return '<rect x="' + (x - off) + '" y="' + (y - off) + '" width="' + (w + 2 * off) + '" height="' + (h + 2 * off) + '" rx="' + (r + off) + '" fill="none" ' + extra + '/>';
    };
    var dash = 'stroke="' + C.muted + '" stroke-width="1.6" stroke-dasharray="7 4"';
    if (type === 'solid') return o(6, 'stroke="' + C.muted + '" stroke-width="5"');
    if (type === 'whipple') return o(11, dash);
    if (type === 'stuffed') return o(7, dash) + o(13, dash);
    return '';
  }

  function foil(x, y, w, h, rx) {
    var z = '', i, k = Math.max(3, Math.round(w / 12));
    for (i = 1; i < k; i++) z += 'M' + (x + i * w / k) + ' ' + y + ' l3 ' + (h / 2) + ' l-3 ' + (h / 2) + ' ';
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="#d4a017" fill-opacity=".6" stroke="#f2c94c" stroke-width="1"/>' +
      '<path d="' + z + '" fill="none" stroke="#fff3b0" stroke-opacity=".6" stroke-width="1"/>';
  }

  function arrow(x1, y1, x2, y2, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), hx = 5, p = Math.PI / 6;
    return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + ' M' + x2 + ' ' + y2 + ' l' + (-hx * Math.cos(a - p)).toFixed(1) + ' ' + (-hx * Math.sin(a - p)).toFixed(1) +
      ' M' + x2 + ' ' + y2 + ' l' + (-hx * Math.cos(a + p)).toFixed(1) + ' ' + (-hx * Math.sin(a + p)).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linecap="round"/>';
  }

  /* radiator fins along a vertical edge at x, sticking out by dir (-1 left, 1 right) */
  function fins(x, y, h, dir) {
    var s = '', n = 3, i, gap = h / n, yy;
    for (i = 0; i < n; i++) {
      yy = y + i * gap + 3;
      s += '<rect x="' + (dir < 0 ? x - 16 : x) + '" y="' + yy + '" width="16" height="' + (gap - 6) + '" fill="#cfd6e6" stroke="' + C.muted + '" stroke-width="1"/>';
    }
    var ax = x + dir * 8;
    return s + arrow(ax - 5, y - 4, ax - 5, y - 18, '#ff5a5f') + arrow(ax + 5, y - 18, ax + 5, y - 4, '#4da3ff');
  }

  /* radiator fins on top of a horizontal edge */
  function finsTop(x, y, w) {
    var s = '', i;
    for (i = 0; i < 3; i++) s += '<rect x="' + (x + 6 + i * (w / 3)) + '" y="' + (y - 16) + '" width="' + (w / 3 - 12) + '" height="16" fill="#cfd6e6" stroke="' + C.muted + '" stroke-width="1"/>';
    return s + arrow(x + w - 10, y - 20, x + w - 10, y - 32, '#ff5a5f') + arrow(x + w - 22, y - 32, x + w - 22, y - 20, '#4da3ff');
  }

  function panelArr(x, y, w, h, cols, rows) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#23469c" stroke="#8fb0ff" stroke-width="1.5"/>', i;
    for (i = 1; i < cols; i++) s += '<line x1="' + (x + i * w / cols) + '" y1="' + y + '" x2="' + (x + i * w / cols) + '" y2="' + (y + h) + '" stroke="#8fb0ff" stroke-opacity=".7"/>';
    for (i = 1; i < rows; i++) s += '<line x1="' + x + '" y1="' + (y + i * h / rows) + '" x2="' + (x + w) + '" y2="' + (y + i * h / rows) + '" stroke="#8fb0ff" stroke-opacity=".7"/>';
    return s;
  }

  function rpsUnit(x, y) {
    var s = '<rect x="' + x + '" y="' + y + '" width="20" height="30" rx="3" fill="#6b7280" stroke="' + C.text + '" stroke-width="1.2"/>', i;
    for (i = 0; i < 4; i++) s += '<rect x="' + (x - 5) + '" y="' + (y + 3 + i * 6.5) + '" width="30" height="3" fill="#9aa1b3" stroke="' + C.line + '" stroke-width=".6"/>';
    return s + '<text x="' + (x + 10) + '" y="' + (y + 43) + '" text-anchor="middle" ' + FONT + ' font-size="11" font-weight="700" fill="' + C.text + '">RPS</text>';
  }

  function tanks(x, y, label, ly) {
    return '<rect x="' + x + '" y="' + y + '" width="16" height="30" rx="8" fill="#9fb8d9" stroke="' + C.text + '" stroke-width="1.2"/>' +
      '<rect x="' + (x + 20) + '" y="' + y + '" width="16" height="30" rx="8" fill="#e8eef9" stroke="' + C.text + '" stroke-width="1.2"/>' +
      '<text x="' + (x + 18) + '" y="' + ly + '" text-anchor="middle" ' + FONT + ' font-size="11" font-weight="700" fill="' + C.text + '">' + label + '</text>';
  }

  function battery(x, y) {
    return '<rect x="' + x + '" y="' + y + '" width="30" height="15" rx="2" fill="' + C.panel + '" stroke="' + C.text + '" stroke-width="1.4"/>' +
      '<rect x="' + (x + 30) + '" y="' + (y + 4) + '" width="3" height="7" fill="' + C.text + '"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="6" height="9" fill="' + C.ok + '"/><rect x="' + (x + 12) + '" y="' + (y + 3) + '" width="6" height="9" fill="' + C.ok + '"/><rect x="' + (x + 21) + '" y="' + (y + 3) + '" width="6" height="9" fill="' + C.ok + '"/>';
  }

  /* ---------- Ship ---------- */
  function ship(type, design, activeSub) {
    type = pick(type, ['robotic', 'crewed'], null);
    design = design || {};
    var d = {
      structure: pick(design.structure, ['aluminum', 'composite'], null),
      shield: pick(design.shield, ['solid', 'whipple', 'stuffed'], null),
      thermal: pick(design.thermal, ['passive', 'active'], null),
      power: pick(design.power, ['solarSmall', 'solarBig', 'rps', 'crewSolar', 'crewSolarBat', 'fuelCells'], null),
      science: []
    };
    var i, sc = Array.isArray(design.science) ? design.science : [];
    for (i = 0; i < sc.length; i++) if (INSTR.indexOf(sc[i]) >= 0 && d.science.indexOf(sc[i]) < 0) d.science.push(sc[i]);
    var active = pick(activeSub, SUBS, null);
    var sf = structFill(d), st = 'fill="' + sf.f + '" stroke="' + sf.s + '" stroke-width="2"';
    var head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="';
    var stars = '<g fill="' + C.text + '" opacity=".35"><circle cx="40" cy="40" r="1.5"/><circle cx="590" cy="60" r="1.5"/><circle cx="560" cy="130" r="1"/><circle cx="90" cy="120" r="1"/><circle cx="610" cy="250" r="1.2"/><circle cx="30" cy="230" r="1.2"/></g>';

    if (!type) {
      return head + 'Placeholder outline of a spacecraft. Pick a mission type in Phase 0.">' + STYLE + stars +
        '<g fill="none" stroke="' + C.line + '" stroke-width="2.5" stroke-dasharray="8 6" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="270" y="150" width="100" height="75" rx="8"/><path d="M278 225 L232 296 M362 225 L408 296 M292 225 L268 296 M348 225 L372 296"/>' +
        '<path d="M320 150 L320 118 M296 112 Q320 138 344 112 Z"/><rect x="400" y="130" width="90" height="55"/><path d="M370 160 L400 160"/></g>' +
        '<line x1="150" y1="298" x2="490" y2="298" stroke="' + C.line + '" stroke-width="2"/>' +
        '<text x="320" y="335" text-anchor="middle" ' + FONT + ' font-size="16" fill="' + C.muted + '">Pick a mission type in Phase 0</text></svg>';
    }

    var G, structure, shield, thermal, power, science;

    if (type === 'robotic') {
      G = '<path d="M130 316 Q220 308 320 314 Q430 320 520 312" fill="none" stroke="' + C.line + '" stroke-width="3" stroke-linecap="round"/>';
      var legs = '';
      var back = [[292, 250, 268, 313], [348, 250, 372, 313]], front = [[278, 250, 232, 314], [362, 250, 408, 314]];
      for (i = 0; i < 2; i++) legs += '<line x1="' + back[i][0] + '" y1="' + back[i][1] + '" x2="' + back[i][2] + '" y2="' + back[i][3] + '" stroke="' + sf.l + '" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="' + back[i][2] + '" cy="' + (back[i][3] + 1) + '" rx="8" ry="2.5" fill="' + sf.l + '"/>';
      for (i = 0; i < 2; i++) legs += '<line x1="' + front[i][0] + '" y1="' + front[i][1] + '" x2="' + front[i][2] + '" y2="' + front[i][3] + '" stroke="' + sf.s + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line x1="' + (front[i][0] + (i ? -14 : 14)) + '" y1="250" x2="' + (front[i][0] + (i ? 20 : -20)) + '" y2="' + (front[i][3] - 28) + '" stroke="' + sf.s + '" stroke-width="2"/>' +
        '<ellipse cx="' + front[i][2] + '" cy="' + (front[i][3] + 1) + '" rx="11" ry="3" fill="' + sf.s + '"/>';
      structure = legs + '<rect x="270" y="180" width="100" height="70" rx="6" ' + st + '/>' +
        '<path d="M270 215 H370 M320 180 V250" stroke="' + sf.l + '" stroke-width="1.5" fill="none"/>' +
        '<line x1="296" y1="180" x2="296" y2="150" stroke="' + sf.s + '" stroke-width="3"/>' +
        '<path d="M276 132 Q296 160 316 132 Z" fill="' + sf.f + '" stroke="' + sf.s + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<line x1="296" y1="150" x2="296" y2="128" stroke="' + sf.s + '" stroke-width="1.5"/><circle cx="296" cy="127" r="2.5" fill="' + sf.s + '"/>';
      shield = shieldRect(d.shield, 270, 180, 100, 70, 6);
      thermal = d.thermal === 'passive' ? foil(270, 180, 100, 70, 6) : d.thermal === 'active' ? fins(270, 192, 54, -1) : '';
      science = sciIcons(d.science, 285, 232, 23);
      power = '';
      if (d.power) {
        power = '<line x1="370" y1="205" x2="402" y2="205" stroke="' + sf.s + '" stroke-width="3"/><line x1="452" y1="202" x2="452" y2="262" stroke="' + sf.s + '" stroke-width="3"/>' +
          panelArr(402, 140, 100, 62, 5, 3);
        if (d.power === 'rps') power += rpsUnit(340, 124);
      }
    } else {
      G = '<path d="M370 316 Q450 308 520 314 Q580 318 610 312" fill="none" stroke="' + C.line + '" stroke-width="3" stroke-linecap="round"/>';
      structure =
        '<polygon points="42,160 105,128 105,192" ' + st + ' stroke-linejoin="round"/><circle cx="82" cy="160" r="5" fill="' + C.panel + '" stroke="' + sf.s + '" stroke-width="1.5"/>' +
        '<rect x="105" y="126" width="110" height="68" rx="4" ' + st + '/><path d="M105 160 H215" stroke="' + sf.l + '" stroke-width="1.5"/>' +
        '<polygon points="215,148 240,134 240,186 215,172" fill="' + sf.l + '" stroke="' + sf.s + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<line x1="418" y1="285" x2="384" y2="314" stroke="' + sf.s + '" stroke-width="4" stroke-linecap="round"/><line x1="532" y1="285" x2="566" y2="314" stroke="' + sf.s + '" stroke-width="4" stroke-linecap="round"/>' +
        '<line x1="440" y1="285" x2="428" y2="314" stroke="' + sf.l + '" stroke-width="3" stroke-linecap="round"/><line x1="510" y1="285" x2="522" y2="314" stroke="' + sf.l + '" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="382" cy="315" rx="11" ry="3" fill="' + sf.s + '"/><ellipse cx="568" cy="315" rx="11" ry="3" fill="' + sf.s + '"/>' +
        '<rect x="410" y="240" width="130" height="46" rx="4" ' + st + '/>' +
        '<polygon points="435,240 447,188 503,188 515,240" ' + st + ' stroke-linejoin="round"/><circle cx="475" cy="212" r="8" fill="' + C.panel + '" stroke="' + sf.s + '" stroke-width="1.5"/>' +
        '<polygon points="450,286 460,300 490,300 500,286" fill="' + sf.l + '" stroke="' + sf.s + '" stroke-width="1.5"/>';
      shield = shieldRect(d.shield, 105, 126, 110, 68, 4);
      thermal = d.thermal === 'passive' ? foil(105, 126, 110, 68, 4) + foil(410, 240, 130, 46, 4) :
        d.thermal === 'active' ? finsTop(105, 126, 110) + fins(410, 246, 36, -1) : '';
      science = sciIcons(d.science, 432, 263, 25);
      power = '';
      if (d.power === 'crewSolar' || d.power === 'crewSolarBat') {
        power = '<line x1="160" y1="126" x2="160" y2="112" stroke="' + sf.s + '" stroke-width="3"/><line x1="160" y1="194" x2="160" y2="208" stroke="' + sf.s + '" stroke-width="3"/>' +
          panelArr(112, 56, 96, 56, 4, 2) + panelArr(112, 208, 96, 56, 4, 2);
        if (d.power === 'crewSolarBat') power += battery(145, 168);
      } else if (d.power === 'fuelCells') {
        power = tanks(142, 134, 'fuel cells', 216);
      } else if (d.power === 'rps') {
        power = rpsUnit(560, 250);
      } else if (d.power) {
        power = panelArr(112, 56, 96, 56, 4, 2) + panelArr(112, 208, 96, 56, 4, 2);
      }
    }

    var body = G + grp('structure', active, structure) + grp('thermal', active, thermal) +
      grp('science', active, science) + grp('power', active, power) + grp('shield', active, shield);
    var extra;
    if (type === 'crewed') {
      extra = '<path d="M242 160 H475 V184" fill="none" stroke="' + C.cheese + '" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"/>' +
        '<path d="M470 176 L475 184 L480 176" fill="none" stroke="' + C.cheese + '" stroke-width="2" stroke-linecap="round"/>' +
        '<text x="345" y="150" text-anchor="middle" ' + FONT + ' font-size="14" fill="' + C.cheese + '">docks in lunar orbit</text>' +
        '<text x="140" y="292" text-anchor="middle" ' + FONT + ' font-size="13" fill="' + C.muted + '">Orbiter</text>' +
        '<text x="475" y="343" text-anchor="middle" ' + FONT + ' font-size="13" fill="' + C.muted + '">Lander</text>';
    } else {
      extra = '<text x="320" y="343" text-anchor="middle" ' + FONT + ' font-size="13" fill="' + C.muted + '">Robotic lander</text>';
    }
    return head + (type === 'crewed' ? 'Crewed mission schematic: orbiter and lander that dock in lunar orbit' : 'Robotic lander schematic') +
      (active ? '. Highlighting ' + active : '') + '">' + STYLE + stars + body + extra + '</svg>';
  }

  /* ---------- Rocket ---------- */
  var ROCKETS = {
    small:  { kind: 'com', cw: 22, ch: 150, nose: 36, boost: 0, col: '#dfe6f5' },
    medium: { kind: 'com', cw: 30, ch: 190, nose: 42, boost: 2, bw: 9, bh: 90, col: '#cfd8ec' },
    heavy:  { kind: 'com', cw: 36, ch: 205, nose: 44, boost: 2, bw: 15, bh: 135, col: '#e8edf8' },
    sls1:   { kind: 'sls', cw: 32, ch: 200, up: 22, uh: 36, bh: 170 },
    sls1b:  { kind: 'sls', cw: 32, ch: 200, up: 30, uh: 52, bh: 170 },
    sls2:   { kind: 'sls', cw: 32, ch: 200, up: 32, uh: 58, bh: 182 }
  };

  function rocket(id, fillRatio, fits) {
    id = pick(id, Object.keys(ROCKETS), 'small');
    var r = ROCKETS[id], cx = 46, gy = 300, s = '';
    var ratio = Math.max(0, Math.min(1.15, num(fillRatio, 0)));
    fits = !!fits;
    var gTop = 20, gH = gy - gTop, capY = gy - gH / 1.15, fh = ratio / 1.15 * gH, col = fits ? C.ok : C.danger;
    var cl = cx - r.cw / 2, cr = cx + r.cw / 2, ctop = gy - r.ch;

    if (r.kind === 'com') {
      if (r.boost) {
        [cl - r.bw, cr].forEach(function (bx) {
          s += '<rect x="' + bx + '" y="' + (gy - r.bh) + '" width="' + r.bw + '" height="' + r.bh + '" fill="#f3f6fc" stroke="' + C.line + '" stroke-width="1.5"/>' +
            '<path d="M' + bx + ' ' + (gy - r.bh) + ' Q' + (bx + r.bw / 2) + ' ' + (gy - r.bh - 16) + ' ' + (bx + r.bw) + ' ' + (gy - r.bh) + 'Z" fill="#9aa6c0" stroke="' + C.line + '" stroke-width="1.5"/>';
        });
      }
      s += '<path d="M' + cl + ' ' + gy + ' L' + (cl - 12) + ' ' + gy + ' L' + cl + ' ' + (gy - 38) + 'Z M' + cr + ' ' + gy + ' L' + (cr + 12) + ' ' + gy + ' L' + cr + ' ' + (gy - 38) + 'Z" fill="' + C.primary + '" stroke="' + C.line + '" stroke-width="1.5"/>' +
        '<rect x="' + cl + '" y="' + ctop + '" width="' + r.cw + '" height="' + r.ch + '" fill="' + r.col + '" stroke="' + C.line + '" stroke-width="2"/>' +
        '<path d="M' + cl + ' ' + ctop + ' Q' + cx + ' ' + (ctop - r.nose * 1.5) + ' ' + cr + ' ' + ctop + 'Z" fill="#f4f7fd" stroke="' + C.line + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<rect x="' + cl + '" y="' + (ctop + 30) + '" width="' + r.cw + '" height="6" fill="' + C.primary + '"/>' +
        '<circle cx="' + cx + '" cy="' + (ctop + 55) + '" r="4" fill="#fff" stroke="' + C.line + '" stroke-width="1.5"/>';
    } else {
      var bw = 13, by = gy - r.bh, ux = cx - r.up / 2, utop = ctop - r.uh;
      [cl - bw - 1, cr + 1].forEach(function (bx) {
        s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + r.bh + '" fill="#f6f8fc" stroke="' + C.line + '" stroke-width="1.5"/>' +
          '<path d="M' + bx + ' ' + by + ' Q' + (bx + bw / 2) + ' ' + (by - 22) + ' ' + (bx + bw) + ' ' + by + 'Z" fill="#f6f8fc" stroke="' + C.line + '" stroke-width="1.5"/>' +
          '<rect x="' + bx + '" y="' + (by + 30) + '" width="' + bw + '" height="5" fill="#cfd6e6"/>';
      });
      s += '<rect x="' + cl + '" y="' + ctop + '" width="' + r.cw + '" height="' + r.ch + '" fill="#e07b39" stroke="#8a4519" stroke-width="2"/>' +
        '<path d="M' + (cl + 8) + ' ' + ctop + ' V' + gy + ' M' + (cr - 8) + ' ' + ctop + ' V' + gy + '" stroke="#f0a36b" stroke-opacity=".6" stroke-width="2" fill="none"/>' +
        '<rect x="' + ux + '" y="' + utop + '" width="' + r.up + '" height="' + r.uh + '" fill="#e9edf5" stroke="' + C.line + '" stroke-width="2"/>' +
        '<path d="M' + (cx - 8) + ' ' + utop + ' L' + (cx - 4) + ' ' + (utop - 18) + ' L' + (cx + 4) + ' ' + (utop - 18) + ' L' + (cx + 8) + ' ' + utop + 'Z" fill="#f6f8fc" stroke="' + C.line + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<line x1="' + cx + '" y1="' + (utop - 18) + '" x2="' + cx + '" y2="' + (utop - 34) + '" stroke="' + C.muted + '" stroke-width="2"/>';
    }
    s += '<path d="M' + (cx - 10) + ' ' + gy + ' l-3 8 h26 l-3 -8Z" fill="#6b7280" stroke="' + C.line + '" stroke-width="1"/>' +
      '<rect x="6" y="' + (gy + 8) + '" width="82" height="4" rx="2" fill="' + C.line + '"/>';

    var gx = 100, gw = 10;
    var gauge = '<rect x="' + gx + '" y="' + gTop + '" width="' + gw + '" height="' + gH + '" rx="3" fill="' + C.panel + '" stroke="' + C.line + '" stroke-width="1.5"/>' +
      '<rect x="' + gx + '" y="' + (gy - fh).toFixed(1) + '" width="' + gw + '" height="' + fh.toFixed(1) + '" rx="3" fill="' + col + '"/>' +
      '<line x1="' + (gx - 5) + '" y1="' + capY.toFixed(1) + '" x2="' + (gx + gw + 5) + '" y2="' + capY.toFixed(1) + '" stroke="' + C.text + '" stroke-width="1.6" stroke-dasharray="3 2"/>' +
      '<text x="' + (gx + gw + 6) + '" y="' + (capY - 3).toFixed(1) + '" text-anchor="end" ' + FONT + ' font-size="8" font-weight="700" fill="' + C.text + '">100%</text>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 320" role="img" aria-label="Launch vehicle ' + id + ', payload ' +
      Math.round(num(fillRatio, 0) * 100) + '% of capacity, ' + (fits ? 'fits' : 'too heavy') + '">' + s + gauge + '</svg>';
  }

  window.SS_ART = { milo: milo, moon: moon, ship: ship, rocket: rocket };
})();
