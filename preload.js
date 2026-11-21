/*!
 * ForJiang · MomoTalk 桌面版
 * 渲染进程安全桥：主进程代理请求与 safeStorage 加密
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */

// 语音桥：渲染进程（sandbox）→ 主进程 net.fetch，绕过 CORS 访问本机 VoiceStudio 服务
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mmtVoiceBridge', {
  request: (url, opts) => ipcRenderer.invoke('mmt-voice:request', { url, opts }),
});

contextBridge.exposeInMainWorld('mmtShell', {
  setLocale: (loc) => ipcRenderer.invoke('mmt-shell:set-locale', loc),
  isAlwaysOnTop: () => ipcRenderer.invoke('mmt-shell:is-always-on-top'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('mmt-shell:set-always-on-top', flag),
  backupAll: () => ipcRenderer.invoke('mmt-data:backup'),
  clearAll: () => ipcRenderer.invoke('mmt-data:clear-all'),
  openDeployGuide: () => ipcRenderer.invoke('mmt-shell:deploy-guide'),
});

contextBridge.exposeInMainWorld('mmtImages', {
  save: (dataUrl) => ipcRenderer.invoke('mmt-images:save', dataUrl),
  list: () => ipcRenderer.invoke('mmt-images:list'),
});

contextBridge.exposeInMainWorld('mmtTTSBase', {
  // 系统语音合成出 WAV（RVC 引擎的基础音频）
  synth: (text, rate) => ipcRenderer.invoke('mmt-tts:base', { text, rate }),
});

contextBridge.exposeInMainWorld('mmtSafe', {
  encrypt: (plain) => ipcRenderer.invoke('mmt-safe:encrypt', plain),
  decrypt: (b64) => ipcRenderer.invoke('mmt-safe:decrypt', b64),
});
