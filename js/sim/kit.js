/* Space Syntax — simulation kit. Shared helpers for the "press Play" layer (no DOM).
 *
 * Every phase simulator returns a SimResult. The frontend only animates it.
 *
 * SimResult = {
 *   phase: number, title: string, ready: true, seed: number,
 *   ok: boolean,                         // passed the mini-mission
 *   outcome: 'success' | 'partial' | 'fail' | 'pending', // 'pending' only with a decision (run paused, ok false, stars 0, failure null)
 *   stars: 0..3,                         // 0 when ok is false
 *   time: { unit: 's'|'min'|'h'|'day', total: number },
 *   fields: [{ key, label, unit, max }], // what each frame carries, so bars and gauges can be drawn generically
 *   frames: [{ t, ...numbers }],         // ordered by t, at most MAX_FRAMES, first t = 0, last t = time.total
 *   events: [{ t, kind: 'info'|'warn'|'fail'|'success', text }], // ordered by t, short English for teens
 *   failure: null | { t, code, cause, fix },  // where it broke, why, and one hint to fix it
 *   score: { label, value, unit, thresholds: [one, two, three], higherIsBetter },
 *   math: null | { title, steps: [{ eq, num }], src },
 *   decision?: { t, code, prompt, marginLeft, options: [{ id, label, dvCost }] }, // optional, only on a paused ('pending') run
 *   summary?: { [name]: number },        // optional, a flat object of named numbers, phase specific (Phase 3: pool, dvUsed, tcmUsed, marginLeft, marginLeftFrac)
 * }
 * When the phase cannot run yet: { phase, title, ready: false, blockers: [{ code, message, phase }] }.
 */
(function (root) {
  'use strict';
  const MAX_FRAMES = 200;

  /** Stars from a score and three ascending (or descending) thresholds. 0 if the run failed. */
  function starsFor(ok, value, thresholds, higherIsBetter = true) {
    if (!ok) return 0;
    const pass = (th) => higherIsBetter ? value >= th : value <= th;
    return 1 + (pass(thresholds[1]) ? 1 : 0) + (pass(thresholds[2]) ? 1 : 0);
  }

  /** Uniform time grid from 0 to total with at most n+1 points. */
  function grid(total, n) {
    const steps = Math.max(1, Math.min(MAX_FRAMES - 1, Math.round(n)));
    return Array.from({ length: steps + 1 }, (_, i) => total * i / steps);
  }

  /** Keep at most MAX_FRAMES frames, always keeping the first and last. */
  function thin(frames) {
    if (frames.length <= MAX_FRAMES) return frames;
    const out = [], step = (frames.length - 1) / (MAX_FRAMES - 1);
    for (let i = 0; i < MAX_FRAMES; i++) out.push(frames[Math.round(i * step)]);
    return out;
  }

  const round = (x, d = 3) => { const k = 10 ** d; return Math.round(x * k) / k; };

  function notReady(phase, title, issues) {
    return { phase, title, ready: false, blockers: (issues || []).filter(i => i.severity === 'block') };
  }

  /** Assemble and normalise a SimResult. */
  function result(r) {
    const frames = thin(r.frames || []).map(f => {
      const o = {}; for (const k in f) o[k] = typeof f[k] === 'number' ? round(f[k]) : f[k]; return o;
    });
    const events = (r.events || []).slice().sort((a, b) => a.t - b.t);
    const score = r.score || null;
    const ok = !!r.ok;
    const stars = score ? starsFor(ok, score.value, score.thresholds, score.higherIsBetter !== false) : (ok ? 1 : 0);
    return {
      phase: r.phase, title: r.title, ready: true, seed: r.seed >>> 0,
      ok, outcome: r.outcome || (ok ? 'success' : 'fail'), stars,
      time: r.time, fields: r.fields || [], frames, events,
      failure: ok ? null : (r.failure || null), score, math: r.math || null,
      ...(r.decision ? { decision: r.decision } : {}),
      ...(r.summary ? { summary: r.summary } : {}),
    };
  }

  /** Seed for a phase: explicit opts.seed, else a stored one, else 1. */
  function seedOf(opts, fallback) {
    if (opts && Number.isInteger(opts.seed)) return opts.seed >>> 0;
    return Number.isInteger(fallback) ? fallback >>> 0 : 1;
  }

  const KIT = { MAX_FRAMES, starsFor, grid, thin, round, notReady, result, seedOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = KIT;
  else root.SS_SIMKIT = KIT;
})(typeof window !== 'undefined' ? window : globalThis);
