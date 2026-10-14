/**
 * ColdBend Pro v2.6.3 — Preload (güvenli köprü)
 * contextIsolation açık; DOM/hesap motoruna müdahale yok.
 * Sadece sürüm bilgisini salt-okunur olarak sunar.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('coldBendDesktop', {
  version: '2.6.3',
  platform: process.platform,
  isDesktop: true
});
