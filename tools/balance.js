// Prints launch mass / cost for representative designs. Run: node tools/balance.js
const M = require('../js/model.js'); const D = require('../js/data.js');
const scen = [
 ['robotic one-way lean', {missionType:'robotic',measure:'chem',question:'made',difficulty:'engineer',design:{structure:'composite',shield:'stuffed',thermal:'passive',power:'solarSmall',science:['spectrometer']}}],
 ['robotic one-way typical', {missionType:'robotic',measure:'chem',question:'made',difficulty:'engineer',design:{structure:'aluminum',shield:'whipple',thermal:'passive',power:'solarBig',science:['camera','spectrometer']}}],
 ['robotic one-way heavy', {missionType:'robotic',measure:'chem',question:'water',difficulty:'engineer',design:{structure:'aluminum',shield:'solid',thermal:'active',power:'rps',science:['camera','spectrometer','neutron']}}],
 ['robotic sample return typical', {missionType:'robotic',measure:'sample',question:'age',difficulty:'engineer',design:{structure:'aluminum',shield:'whipple',thermal:'passive',power:'solarBig',science:['camera','sampler']}}],
 ['crewed lean', {missionType:'crewed',measure:'sample',question:'made',difficulty:'engineer',design:{structure:'composite',shield:'stuffed',thermal:'passive',power:'crewSolar',science:['sampler']}}],
 ['crewed typical', {missionType:'crewed',measure:'sample',question:'made',difficulty:'engineer',design:{structure:'aluminum',shield:'whipple',thermal:'passive',power:'crewSolarBat',science:['camera','spectrometer','sampler']}}],
 ['crewed heavy', {missionType:'crewed',measure:'sample',question:'made',difficulty:'engineer',design:{structure:'aluminum',shield:'solid',thermal:'active',power:'fuelCells',science:['camera','spectrometer','neutron','sampler']}}],
];
console.log('factors', Object.fromEntries(Object.entries(M.F).map(([k,v])=>[k,v.toFixed(3)])));
for (const [n,s] of scen){ const r=M.evaluate(s); const fits=D.ROCKETS[s.missionType].filter(k=>k.capacity>=r.tli).map(k=>k.id+'($'+k.cost+')');
 console.log(n.padEnd(32),'dry',r.dry.toFixed(0).padStart(6),'TLI',r.tli.toFixed(0).padStart(6),'x'+r.fuelMultiplier.toFixed(2),'cost',r.cost.toFixed(0),'pwr',r.powerNeed+'/'+r.powerGen,'fits:',fits.join(' ')||'NONE', 'budgetEng', D.BUDGET[s.missionType].engineer);}
