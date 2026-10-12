/**
 * ColdBend Pro v1.0.0 — Preload (güvenli köprü)
 * contextIsolation açık; DOM/hesap motoruna müdahale yok.
 * Sadece sürüm bilgisini salt-okunur olarak sunar.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('coldBendDesktop', {
  version: '1.0.0',
  platform: process.platform,
  isDesktop: true
});
