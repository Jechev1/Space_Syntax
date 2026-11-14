// Static checks run in CI: JS syntax, no private files, no inline handlers, CSP present.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let failed = 0;
const fail = (msg) => { console.error('✗ ' + msg); failed++; };
const ok = (msg) => console.log('✓ ' + msg);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (['node_modules', '.git'].includes(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const files = walk(root);

// 1. syntax of every browser script
for (const f of files.filter(f => f.includes(path.join('js', '')) && f.endsWith('.js'))) {
  try { new Function(fs.readFileSync(f, 'utf8')); } catch (e) { fail(`syntax error in ${path.relative(root, f)}: ${e.message}`); }
}
ok('JS syntax');

// 2. private/team files must never be published
const banned = files.filter(f => /\.(docx?|pdf|env|pem|key)$/i.test(f) || /(^|[\/])\.env/.test(f));
const tracked = (() => { try { return require('child_process').execSync('git ls-files', { cwd: root }).toString().split('\n'); } catch { return null; } })();
const bannedTracked = tracked ? banned.filter(f => tracked.includes(path.relative(root, f).split(path.sep).join('/'))) : banned;
if (bannedTracked.length) fail('private files would be published: ' + bannedTracked.map(f => path.relative(root, f)).join(', '));
else ok('no private files tracked');

// 3. no inline event handlers or eval (CSP: script-src 'self')
for (const f of files.filter(f => /\.(js|html)$/.test(f) && !f.includes('tools') && !f.includes('tests'))) {
  const src = fs.readFileSync(f, 'utf8');
  if (/\son(click|error|load|mouseover|submit)\s*=\s*["']/i.test(src)) fail(`inline event handler in ${path.relative(root, f)}`);
  if (/\beval\s*\(|new Function\s*\(/.test(src)) fail(`eval/new Function in ${path.relative(root, f)}`);
}
ok('no inline handlers / eval');

// 4. CSP meta present and strict
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/http-equiv="Content-Security-Policy"/.test(html)) fail('index.html has no CSP');
else if (/script-src[^;]*unsafe/.test(html)) fail('CSP allows unsafe scripts');
else ok('CSP present, no unsafe scripts');

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
