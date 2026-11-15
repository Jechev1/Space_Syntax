/* Space Syntax: Phase 4 simulator, "Mission timeline".
 *
 * A data buffer is filled by the science (and crew video) and drained by the radio or laser link, but only
 * while a ground station can see the Moon (Deep Space Network for radio, optical ground stations for the laser). The three DSN complexes (Goldstone, Madrid, Canberra)
 * sit about 120 degrees apart, so as Earth turns one after another takes over. Each station gets one pass a
 * day, and the three passes together last the link's contactHours, so the average rate matches commsPlan.
 * Also modelled: the 41 minute blackout behind the Moon at lunar orbit insertion, and for the laser a
 * seeded cloud that blocks a pass. When the buffer is full, new data is lost.
 *
 * Mission length: crewed uses the Phase 2 crew days (M.lifeSupport). Robotic uses transit days plus the
 * site's daylight (M.daylightHours) plus a final
 * downlink day. Science data is made only while at the Moon: after the outbound transit, and for crew until
 * the return transit starts. Day is 24 h, a simplification of the real 24 h 50 min Moon day.
 *
 * Score: percent of generated data that reached Earth.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const D = isNode ? require('../data.js') : root.SS_DATA;
  const M = isNode ? require('../model.js') : root.SS_MODEL;
  const K = isNode ? require('./kit.js') : root.SS_SIMKIT;

  const TUNING = {
    bufferGb: D.SURFACE.bufferGb, // same 150 / 300 Gb store as Phase 6
    failBelow: 0.6,                          // game value: under 60% delivered the mission fails
    successLostFrac: 0.001,                  // game value: loses less than 0.1% counts as no loss
    cloudChance: 0.3,                        // game value: chance a laser pass is blocked
    tailHoursRobotic: 24,                    // game value: one extra day to send what is left
    stepHours: 1 / 12,                       // game value: simulation step, 5 minutes
    warnFill: 0.8,                           // game value: buffer warning level
    thresholds: [60, 90, 99],                // game values: percent delivered for 1, 2, 3 stars
    maxFrames: 180,
    // real: DSN complex longitudes, degrees east (dsn)
    stations: [
      { name: 'Goldstone', lon: -116.9 },
      { name: 'Madrid', lon: -4.25 },
      { name: 'Canberra', lon: 148.98 },
    ],
  };

  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  const keepNotReady = ['noQuestion', 'noMeasure', 'noMissionType', 'noMission', 'noLink', 'noDish'];
  function blockersFor(state) {
        const out = M.validatePhase(state, 0).issues.filter(i => i.severity === 'block');
    out.push(...M.validatePhase(state, 4).issues.filter(i => i.severity === 'block' && keepNotReady.includes(i.code)));
    if (state.missionType === 'crewed' && !M.lifeSupport(state)) out.push({ code: 'noCrew', severity: 'block', message: 'Choose your crew in Phase 2 first', phase: 2 });
    return out;
  }

  /** Cheapest option that would carry the daily data, as a short hint. */
  function fixFor(state, need) {
    const tries = [];
    for (const l of D.COMMS.links) for (const d of D.COMMS.dishes) tries.push({ l, d });
    for (const { l, d } of tries) {
      const s = Object.assign({}, state, { comms: { link: l.id, dish: d.id } });
      const p = M.commsPlan(s);
      if (p.gbPerDay >= need) return `Use ${l.title}${d.id === state.comms.dish ? '' : ' with the ' + d.diameter + ' m antenna'}, which sends ${fmt(p.gbPerDay)} Gb a day.`;
    }
    return 'Remove an instrument, or pick the fastest link with the 70 m antenna.';
  }

  function simulate(state, opts) {
    const title = 'Mission timeline';
    const blockers = blockersFor(state);
    if (blockers.length) return K.notReady(4, title, blockers);
    const seed = K.seedOf(opts, 1);
    const rand = M.rng(seed ^ 0x4d1);
    const plan = M.commsPlan(state);
    const optical = !!(plan.link && plan.link.optical);
    const stName = (i) => optical ? 'the optical ground station' : TUNING.stations[i].name;
    const crewed = state.missionType === 'crewed';
    const transitH = D.LIFE.transitDays * 24;

    // mission length and the window when science makes data
    let winStart = transitH, winEnd, total;
    if (crewed) {
      const life = M.lifeSupport(state);
      total = life.days * 24;
      winEnd = Math.max(winStart + 24, total - transitH);
      total = Math.max(total, winEnd);
    } else {
      winEnd = winStart + M.daylightHours(state);
      total = winEnd + TUNING.tailHoursRobotic;
    }
    const genPerH = plan.needGbPerDay / 24;
    const gbPerH = plan.rateMbps * 3.6;
    const maxBuf = TUNING.bufferGb[crewed ? 'crewed' : 'robotic'];
    const passH = plan.contactHours / 3, loiH = transitH;

    // station pass centres and seeded clouds
    const lon0 = rand() * 360; // game value: where the Moon is over Earth at hour 0
    const centres = TUNING.stations.map(s => (((lon0 - s.lon) / 15) % 24 + 24) % 24);
    const days = Math.ceil(total / 24) + 1;
    const cloud = [];
    for (let d = 0; d < days; d++) for (let i = 0; i < 3; i++) cloud.push(plan.weatherRisk && rand() < TUNING.cloudChance);
    const blackoutEnd = loiH + D.COMMS.blackoutMin / 60;
    const stationAt = (t) => {
      for (let i = 0; i < 3; i++) {
        const dd = ((t - centres[i] + 12) % 24 + 24) % 24 - 12;
        if (Math.abs(dd) < passH / 2) return i;
      }
      return -1;
    };

    const dt = TUNING.stepHours;
    const steps = Math.ceil(total / dt);
    const stride = Math.max(1, Math.ceil(steps / TUNING.maxFrames));
    const frames = [], events = [];
    let buf = 0, gen = 0, del = 0, lost = 0, firstLoss = null, warned = false, lastBlocked = -1, lastSt = -2;
    const record = (t, up, st) => frames.push({ t, generated: gen, delivered: del, buffer: buf, lost, linkUp: up ? 1 : 0, station: st });
    let blackoutSeen = false;
    for (let k = 0; k <= steps; k++) {
      const t0 = Math.min(total, k * dt), tm = Math.min(total, t0 + dt / 2);
      let up = false, st = -1;
      if (k > 0) {
        const tPrev = Math.min(total, (k - 1) * dt), span = t0 - tPrev, mid = tPrev + span / 2;
        const make = mid >= winStart && mid < winEnd ? genPerH * span : 0;
        gen += make; buf += make;
        st = stationAt(mid);
        const inBlackout = mid >= loiH && mid < blackoutEnd;
        const cloudy = st >= 0 && cloud[Math.floor(mid / 24) * 3 + st];
        up = st >= 0 && !inBlackout && !cloudy;
        if (inBlackout && !blackoutSeen) { blackoutSeen = true; events.push({ t: tPrev, kind: 'warn', text: `Behind the Moon: no contact for ${D.COMMS.blackoutMin} minutes, like Artemis II. The buffer keeps filling.` }); }
        if (cloudy && lastBlocked !== Math.floor(mid / 24) * 3 + st) {
          lastBlocked = Math.floor(mid / 24) * 3 + st;
          events.push({ t: tPrev, kind: 'warn', text: `Clouds over the optical ground station block the laser. This pass is lost.` });
        }
        if (st >= 0 && st !== lastSt && !inBlackout && !cloudy && events.filter(e => e.text.startsWith('Link up')).length < 3) {
          events.push({ t: tPrev, kind: 'info', text: `Link up with ${stName(st)}. Sending at ${fmt(plan.rateMbps, 0)} Mbps.` });
        }
        lastSt = st;
        if (up) { const d = Math.min(buf, gbPerH * span); buf -= d; del += d; }
        if (buf > maxBuf) {
          const over = buf - maxBuf; buf = maxBuf; lost += over;
          if (firstLoss === null) { firstLoss = tPrev; events.push({ t: tPrev, kind: 'fail', text: `Storage full at ${fmt(maxBuf)} Gb. New data is being thrown away.` }); }
        } else if (!warned && buf > maxBuf * TUNING.warnFill) {
          warned = true; events.push({ t: tPrev, kind: 'warn', text: `Buffer is ${Math.round(TUNING.warnFill * 100)}% full. Data comes in faster than you can send it.` });
        }
      }
      if (k % stride === 0 || k === steps) record(t0, up, st);
    }
    frames[0].t = 0;
    frames[frames.length - 1].t = total;

    const delay = plan.delay.avg;
    events.unshift({ t: 0, kind: 'info', text: `Radio and laser travel at light speed. One way to the Moon takes ${delay.toFixed(2)} s on average, so a chat has a ${plan.roundTrip.toFixed(1)} s pause.` });
    events.unshift({ t: 0, kind: 'info', text: optical ? 'The laser talks to optical ground stations. Clouds can block them, so it passes when the sky is clear.' : 'Three Deep Space Network sites (California, Spain, Australia) take turns as Earth spins.' });

    const verdicts = M.validatePhase(state, 4).issues.filter(i => i.severity === 'block' && !keepNotReady.includes(i.code));
    const frac = gen > 1e-9 ? del / gen : 1;
    const lostFrac = gen > 1e-9 ? lost / gen : 0;
    const ok = frac >= TUNING.failBelow && !verdicts.length;
    let outcome = 'success';
    if (!ok) outcome = 'fail'; else if (lostFrac > TUNING.successLostFrac || frac < 0.99) outcome = 'partial';
    let failure = null;
    if (verdicts.length) {
      const v = verdicts[0];
      const fix = v.code === 'tooHeavy' ? 'Pick a lighter link or a bigger rocket.' : v.code === 'noPower' ? 'Add power in Phase 1 or pick a lower-power link.' : v.code === 'overBudget' ? 'Pick a cheaper link or antenna.' : 'Fix this in Phase 1 or 4.';
      failure = { t: total, code: v.code, cause: v.message + '.', fix };
    } else if (!ok) {
      failure = {
        t: firstLoss === null ? total : firstLoss, code: 'dataLost',
        cause: `Only ${Math.round(frac * 100)}% of your data reached Earth. Your instruments make ${fmt(plan.needGbPerDay)} Gb a day but the link sends ${fmt(plan.gbPerDay)} Gb, so the buffer filled up.`,
        fix: fixFor(state, plan.needGbPerDay),
      };
    }
    if (verdicts.length) for (const v of verdicts) events.push({ t: total, kind: 'fail', text: v.message + '.' });
    else if (!ok) events.push({ t: total, kind: 'fail', text: `Mission data lost: only ${Math.round(frac * 100)}% delivered.` });
    else if (outcome === 'partial') events.push({ t: total, kind: 'warn', text: `${Math.round(frac * 100)}% of the data got home. Some was lost or is still onboard.` });
    else events.push({ t: total, kind: 'success', text: 'All science data delivered to Earth.' });

    const cm = M.commsMath(state);
    const math = {
      title: cm.title,
      steps: cm.steps.concat([
        { eq: 'daily volume', num: `${fmt(plan.rateMbps, 1)} Mbps x ${fmt(plan.contactHours, 1)} h x 3.6 = ${fmt(plan.gbPerDay, 1)} Gb per day` },
        { eq: 'passes = 3 stations x contact / 3', num: `3 passes a day of ${fmt(passH, 1)} h each = ${fmt(plan.contactHours, 1)} h of contact` },
        { eq: 'buffer = made - sent', num: `${fmt(gen)} Gb made - ${fmt(del)} Gb sent - ${fmt(lost)} Gb lost = ${fmt(buf)} Gb onboard` },
      ]),
      src: 'dsn',
    };

    return K.result({
      phase: 4, title, seed, ok, outcome, time: { unit: 'h', total },
      fields: [
        { key: 'generated', label: 'Data made', unit: 'Gb', max: Math.max(1, K.round(gen, 1)) },
        { key: 'delivered', label: 'Data sent to Earth', unit: 'Gb', max: Math.max(1, K.round(gen, 1)) },
        { key: 'buffer', label: 'Onboard buffer', unit: 'Gb', max: maxBuf },
        { key: 'lost', label: 'Data lost', unit: 'Gb', max: Math.max(1, K.round(gen, 1)) },
        { key: 'linkUp', label: 'Link up', unit: '', max: 1 },
        { key: 'station', label: 'Station pass (0, 1, 2 take turns, -1 none)', unit: '', max: 2 },
      ],
      frames, events, failure,
      score: { label: 'Data delivered', value: K.round(frac * 100, 1), unit: '%', thresholds: TUNING.thresholds, higherIsBetter: true },
      math,
    });
  }

  const P = { phase: 4, title: 'Mission timeline', simulate, TUNING };
  if (isNode) module.exports = P; else root.SS_SIM_P4 = P;
})(typeof window !== 'undefined' ? window : globalThis);
