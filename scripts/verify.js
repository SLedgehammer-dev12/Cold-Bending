/**
 * ColdBend Pro — regresyon kilidi (sıfır bağımlılık).
 * AGENTS.md invaryantlarını korur:
 *  1. Çekirdek ASME formül imzaları app.js içinde değişmeden durmalı
 *  2. app.js'in getElementById ile aradığı her id index.html'de olmalı
 *  3. Sürüm birliği: rozet = APP_VERSION = package.json = preload
 * Hata durumunda exit(1) ile CI'ı durdurur.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let failures = 0;
const fail = (msg) => { failures += 1; console.error('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

const appJs = read('app.js');
const html = read('index.html');
const preload = read('electron/preload.js');
const pkg = JSON.parse(read('package.json'));

// 1. Çekirdek formül imzaları (boşluklara duyarsız karşılaştırma)
console.log('[1/3] Çekirdek formül imzaları:');
const norm = (s) => s.replace(/\s+/g, '');
const formulas = [
  ['incelme', 't_nom*(D/(2*R_mm+D))'],
  ['kalınlaşma', 't_nom*(D/(2*R_mm-D))'],
  ['geri-yaylanma', '(3.5*S_mpa*r_bend_m)/(E_modulus*odM)*0.055'],
  ['ovallik-mandrel', '*0.32'],
  ['fiber-gerilme', 'E_MOD*epsMax'],
];
for (const [name, sig] of formulas) {
  if (norm(appJs).includes(norm(sig))) ok(name);
  else fail(`formül imzası bulunamadı: ${name} (${sig})`);
}

// 2. ID bağlantıları
console.log('[2/3] ID bağlantıları (app.js → index.html):');
const htmlIds = new Set([...html.matchAll(/id="([a-zA-Z0-9_]+)"/g)].map((m) => m[1]));
const jsIds = [...new Set([...appJs.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]))];
const missing = jsIds.filter((id) => !htmlIds.has(id));
if (missing.length === 0) ok(`${jsIds.length}/${jsIds.length} id eşleşti`);
else missing.forEach((id) => fail(`index.html'de yok: ${id}`));

// 3. Sürüm birliği
console.log('[3/3] Sürüm birliği:');
const badge = (/version-tag">([^<]+)/.exec(html) || [])[1];
const badgeVer = badge ? badge.split(' ')[0] : null;
const appVer = (/const APP_VERSION = '([\d.]+)'/.exec(appJs) || [])[1];
const preVer = (/version: '([\d.]+)'/.exec(preload) || [])[1];
const pkgVer = pkg.version;
if (badgeVer === 'v' + pkgVer) ok(`rozet ${badgeVer}`);
else fail(`rozet (${badgeVer}) ≠ package.json (v${pkgVer})`);
if (appVer === pkgVer) ok(`APP_VERSION ${appVer}`);
else fail(`APP_VERSION (${appVer}) ≠ package.json (${pkgVer})`);
if (preVer === pkgVer) ok(`preload ${preVer}`);
else fail(`preload (${preVer}) ≠ package.json (${pkgVer})`);

console.log(failures === 0 ? '\nTÜM KİLİTLER GEÇTİ' : `\n${failures} KİLİT BAŞARISIZ`);
process.exit(failures === 0 ? 0 : 1);
