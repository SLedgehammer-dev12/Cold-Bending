# Changelog

Tüm önemli değişiklikler bu dosyada izlenir. Sürüm biçimi `MAJOR.MINOR.PATCH`.

## [1.0.0] — 2026-10-12

İlk kararlı release. Tarayıcı uygulaması değişmeden korunur; masaüstü dağıtım eklenir.

### Eklenen
- Electron kabuğu (`electron/main.js`, `electron/preload.js`): `index.html` dosyasını
  `file://` ile açan, harici bağlantıları sistem tarayıcısına yönlendiren,
  `CmdOrCtrl+P` ile imalat kartı baskısını destekleyen masaüstü sarmalayıcı.
- `package.json` v1.0.0: `electron` + `electron-builder`, `dist:mac` / `dist:win` /
  `dist:all` betikleri, mac (dmg+zip, x64+arm64) ve win (nsis+portable, x64) hedefleri.
- `.github/workflows/release.yml`: `v*.*.*` etiketi veya manuel tetikleme ile
  macOS + Windows derlemesi, artifact yükleme ve GitHub Release yayınlama.
- `RELEASE_NOTES_v1.0.md`: v1.0 sürüm notları (TR).
- `build/` yer tutucu ikon/entitlement notları.

### Değişen
- `index.html` sürüm rozeti: `v2.4 - ASME Compliant` → `v1.0.0 - ASME Compliant`
  (release versiyonu tekilleştirildi).
- `.gitignore`: `node_modules/`, `dist/`, Electron önbellekleri eklendi.

### Korunan (regresyon yok)
- `app.js` hesap çekirdeği: thinning, ovality, springback, pulls, Method-2,
  ripple, seam-clock formülleri ve `updateUI()` → pulls → print → 2D → 3D zinciri.
- `prt*` / `matVal*` / `kpi*` ID bağlantıları, TR arayüz, dark/light tema, A4 baskı.
