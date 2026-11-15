/* Space Syntax — "press Play" layer. One entry point for every mini-mission simulator.
 *
 *   SS_SIM.simulate(state, phase, opts?) -> SimResult   (see js/sim/kit.js for the shape)
 *
 * Browser load order: data.js, model.js, sim/kit.js, sim/p1.js ... sim/p5.js, sim.js.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./model.js') : root.SS_MODEL;
  const K = isNode ? require('./sim/kit.js') : root.SS_SIMKIT;
  const load = (n) => {
    try { return isNode ? require(`./sim/p${n}.js`) : root[`SS_SIM_P${n}`] || null; } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; }
  };

  /* Phase 0 has no physics: the hypothesis card is the "simulation". */
  const P0 = {
    phase: 0, title: 'Mission goal',
    simulate(state) {
      const v = M.validatePhase(state, 0);
      if (!v.ok) return K.notReady(0, this.title, v.issues);
      return K.result({
        phase: 0, title: this.title, seed: 1, ok: true, time: { unit: 's', total: 0 },
        frames: [{ t: 0 }],
        events: [{ t: 0, kind: 'success', text: 'Hypothesis logged: "The Moon is made of cheese." Now go test it.' }],
        math: M.moonDensityMath(),
      });
    },
  };

  const PHASES = [P0, load(1), load(2), load(3), load(4), load(5)];

  function simulate(state, phase, opts) {
    const p = PHASES[phase];
    if (!p) throw new Error(`No simulator for phase ${phase}`);
    return p.simulate(state, opts || {});
  }
  function available() { return PHASES.map((p, i) => p ? i : null).filter(x => x !== null); }

  const SIM = { simulate, available, PHASES };
  if (isNode) module.exports = SIM;
  else root.SS_SIM = SIM;
})(typeof window !== 'undefined' ? window : globalThis);
