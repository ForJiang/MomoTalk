/*!
 * ForJiang · MomoTalk 桌面版
 * Electron 主进程：内置静态服务器、窗口与菜单管理、语音/AI 代理、ForJiang 品牌
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */

const { app, BrowserWindow, Menu, dialog, screen, ipcMain, net } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WWW_ROOT = path.join(__dirname, 'www');
const VOICE_SRC = (() => {
  try { return fs.readFileSync(path.join(__dirname, 'voice-extension.js'), 'utf8'); } catch { return ''; }
})();
const AI_SRC = (() => {
  try { return fs.readFileSync(path.join(__dirname, 'ai-extension.js'), 'utf8'); } catch { return ''; }
})();
const FEATURES_SRC = (() => {
  try { return fs.readFileSync(path.join(__dirname, 'mmt-features.js'), 'utf8'); } catch { return ''; }
})();
const LOCALE_JS = (() => {
  try { return fs.readFileSync(path.join(__dirname, 'mmt-locale.js'), 'utf8'); } catch { return ''; }
})();
const SELF_TEST = process.argv.includes('--self-test');
const CLI_LOCALE = (process.argv.find((a) => a.startsWith('--locale=')) || '').split('=')[1];

const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja'];
let SHELL_LOCALE = 'zh-CN';
let servingPort = 43110; // 实际服务端口（图片 URL 用，须稳定）

// 本地服务随机令牌：所有页面资源走 /<token>/ 前缀，同机其它进程无法探测读取
const TOKEN = require('crypto').randomBytes(18).toString('base64url');
const BASE = '/' + TOKEN;

// 单实例锁：避免两个实例同时读写同一份聊天数据（自测模式豁免）
if (!SELF_TEST && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
}

// 桌面壳（菜单/对话框）四语文案
const SHELL = {
  'zh-CN': {
    about: '关于 MomoTalk', hide: '隐藏 MomoTalk', hideOthers: '隐藏其他', showAll: '全部显示',
    quit: '退出 MomoTalk', file: '文件', importData: '导入学生数据…', exportData: '导出学生数据',
    closeWin: '关闭窗口', edit: '编辑', undo: '撤销', redo: '重做', cut: '剪切', copy: '拷贝',
    paste: '粘贴', selectAll: '全选', view: '显示', reload: '重新加载', forceReload: '强制重新加载',
    devTools: '开发者工具', actualSize: '实际大小', zoomIn: '放大', zoomOut: '缩小', fullscreen: '全屏',
    window: '窗口', alwaysOnTop: '窗口置顶', minimize: '最小化', zoom: '缩放', data: '数据',
    clearData: '清空本地数据…', help: '帮助', github: 'ForJiang 主页（GitHub）',
    lang: '语言', confirmClear: '清空本地数据？',
    clearDetail: '将删除所有已添加学生与全部聊天记录，且无法恢复。', cancel: '取消', clear: '清空', ok: '好',
    exportImg: '匯出聊天長圖…', needChat: '請先開啟一個聊天再匯出', savedTo: '已儲存到',
    backup: '備份資料（選擇位置）', deployGuide: '新電腦部署指南', backupDone: '備份完成', ok: '好',
    exportImg: '导出聊天长图…', needChat: '请先打开一个聊天再导出', savedTo: '已保存到',
    backup: '备份数据（选择位置）', deployGuide: '新电脑部署指南', backupDone: '备份完成',
  },
  'zh-TW': {
    about: '關於 MomoTalk', hide: '隱藏 MomoTalk', hideOthers: '隱藏其他', showAll: '全部顯示',
    quit: '結束 MomoTalk', file: '檔案', importData: '匯入學生資料…', exportData: '匯出學生資料',
    closeWin: '關閉視窗', edit: '編輯', undo: '復原', redo: '重做', cut: '剪下', copy: '拷貝',
    paste: '貼上', selectAll: '全選', view: '顯示', reload: '重新載入', forceReload: '強制重新載入',
    devTools: '開發人員工具', actualSize: '實際大小', zoomIn: '放大', zoomOut: '縮小', fullscreen: '全螢幕',
    window: '視窗', alwaysOnTop: '視窗置頂', minimize: '縮到最小', zoom: '縮放', data: '資料',
    clearData: '清空本機資料…', help: '輔助說明', github: 'ForJiang 主页（GitHub）',
    lang: '語言', confirmClear: '清空本機資料？',
    clearDetail: '將刪除所有已新增學生與全部聊天紀錄，且無法復原。', cancel: '取消', clear: '清空',
  },
  en: {
    about: 'About MomoTalk', hide: 'Hide MomoTalk', hideOthers: 'Hide Others', showAll: 'Show All',
    quit: 'Quit MomoTalk', file: 'File', importData: 'Import Student Data…', exportData: 'Export Student Data',
    closeWin: 'Close Window', edit: 'Edit', undo: 'Undo', redo: 'Redo', cut: 'Cut', copy: 'Copy',
    paste: 'Paste', selectAll: 'Select All', view: 'View', reload: 'Reload', forceReload: 'Force Reload',
    devTools: 'Developer Tools', actualSize: 'Actual Size', zoomIn: 'Zoom In', zoomOut: 'Zoom Out',
    fullscreen: 'Full Screen', window: 'Window', alwaysOnTop: 'Always on Top', minimize: 'Minimize',
    zoom: 'Zoom', data: 'Data', clearData: 'Clear Local Data…', help: 'Help',
    github: 'ForJiang 主页（GitHub）', lang: 'Language',
    confirmClear: 'Clear local data?',
    clearDetail: 'All added students and chat history will be deleted permanently.',
    cancel: 'Cancel', clear: 'Clear', ok: 'OK',
    exportImg: 'Export Chat as Image…', needChat: 'Open a chat first to export', savedTo: 'Saved to',
    backup: 'Back Up Data (Choose Location)', deployGuide: 'Deployment Guide', backupDone: 'Backup complete',
  },
  ja: {
    about: 'MomoTalkについて', hide: 'MomoTalkを隠す', hideOthers: 'ほかを隠す', showAll: 'すべてを表示',
    quit: 'MomoTalkを終了', file: 'ファイル', importData: '生徒データをインポート…',
    exportData: '生徒データをエクスポート', closeWin: 'ウインドウを閉じる', edit: '編集',
    undo: '元に戻す', redo: 'やり直す', cut: 'カット', copy: 'コピー', paste: 'ペースト',
    selectAll: 'すべて選択', view: '表示', reload: '再読み込み', forceReload: '強制再読み込み',
    devTools: '開発者ツール', actualSize: '実際のサイズ', zoomIn: '拡大', zoomOut: '縮小',
    fullscreen: 'フルスクリーン', window: 'ウインドウ', alwaysOnTop: '常に手前に表示', minimize: 'しまう',
    zoom: '拡大縮小', data: 'データ', clearData: 'ローカルデータを消去…', help: 'ヘルプ',
    github: 'ForJiang 主页（GitHub）', lang: '言語',
    confirmClear: 'ローカルデータを消去しますか？',
    clearDetail: '追加した生徒とすべてのチャット履歴が削除され、元に戻せません。',
    cancel: 'キャンセル', clear: '消去', ok: 'OK',
    exportImg: 'チャットを長画像で書き出す…', needChat: '先にチャットを開いてください', savedTo: '保存先：',
    backup: 'データをバックアップ（保存先を選択）', deployGuide: '新PCセットアップガイド', backupDone: 'バックアップ完了',
  },
};
const LANG_NAMES = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English', ja: '日本語' };

const FJ_BRAND = {
  name: 'ForJiang',
  avatar: BASE + '/__fj/avatar.jpg',
  url: 'https://forjiang.github.io',
  version: 'ForJiang · v' + app.getVersion(),
  contact: {
    email: 'jianghaoda.1@outlook.com',
    site: 'https://forjiang.github.io',
    bilibili: 'https://b23.tv/edD6tm9',
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// 页面顶栏拖拽移动窗口 + 给 macOS 红绿灯让位
const FRAME_CSS = `
  .header, .chat-header, .more-header { -webkit-app-region: drag; }
  .header a, .header button, .chat-header .back-btn,
  .more-header .back-btn, #more-back-btn,
  #chat-header-avatar { -webkit-app-region: no-drag; }
  .header, .chat-header, .more-header { padding-left: 80px !important; }
`;

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const rawPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        // 用户发送的图片：/u/<文件名>（免令牌，URL 需跨重启稳定）
        if (rawPath.startsWith('/u/') && !rawPath.includes('..')) {
          const imgDir = path.join(app.getPath('userData'), 'images');
          fs.readFile(path.join(imgDir, path.basename(rawPath)), (err, data) => {
            if (err) { res.writeHead(404); res.end('Not Found'); return; }
            const ext = path.extname(rawPath).toLowerCase();
            const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
            res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
            res.end(data);
          });
          return;
        }
        if (!rawPath.startsWith(BASE + '/')) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        const urlPath = rawPath.slice(BASE.length) || '/';
        let filePath = path.normalize(path.join(WWW_ROOT, urlPath));
        if (!filePath.startsWith(WWW_ROOT + path.sep) && filePath !== WWW_ROOT) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'momotalk.html');
        }
        if (urlPath === '/docs/deploy-guide.pdf') {
        const pd = path.join(process.resourcesPath || path.join(__dirname, 'build', 'docs'), 'docs', 'MomoTalk-部署指南.pdf');
        const fp = fs.existsSync(pd) ? pd : path.join(__dirname, 'build', 'docs', 'MomoTalk-部署指南.pdf');
        if (fs.existsSync(fp)) { res.writeHead(200, { 'Content-Type': 'application/pdf' }); fs.createReadStream(fp).pipe(res); return; }
      }
      if (urlPath === '/voice/trump.pth') {
        const p = path.join(process.resourcesPath || path.join(__dirname, 'build', 'voice'), 'voice', 'trump.pth');
        const fp = fs.existsSync(p) ? p : path.join(__dirname, 'build', 'voice', 'trump.pth');
        if (fs.existsSync(fp)) { res.writeHead(200, { 'Content-Type': 'application/octet-stream' }); fs.createReadStream(fp).pipe(res); return; }
      }
      if (urlPath === '/__fj/avatar.jpg') {
          fs.readFile(path.join(__dirname, 'build', 'forjiang-avatar.jpg'), (err, data) => {
            if (err) { res.writeHead(404); res.end('Not Found'); return; }
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
          });
          return;
        }
        if (filePath.endsWith('momotalk.html') && fs.existsSync(filePath)) {
          // 注入当前语言：页面脚本执行前生效
          const html = fs.readFileSync(filePath, 'utf8').replace(
            '<meta charset="UTF-8">',
            `<meta charset="UTF-8"><script>window.__MMT_LOCALE=${JSON.stringify(SHELL_LOCALE)};window.__MMT_FJ=${JSON.stringify(FJ_BRAND)};</script><script>${LOCALE_JS}</script>`
          );
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(html);
          return;
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': type });
          res.end(data);
        });
      } catch {
        res.writeHead(500);
        res.end('Internal Error');
      }
    });
    // 固定端口（被占则递增）：localStorage 按源隔离，端口必须稳定，否则每次启动数据全丢
    let attempt = 0;
    const tryListen = () => {
      const fixedPort = 43110 + attempt++;
      if (attempt > 40) { reject(new Error('no free port')); return; }
      server.once('error', (e) => {
        if (e && e.code === 'EADDRINUSE') tryListen();
        else reject(e);
      });
      server.listen(fixedPort, '127.0.0.1', () => {
        server.removeAllListeners('error');
        servingPort = fixedPort;
        resolve(fixedPort);
      });
    };
    tryListen();
  });
}

function boundsFile() {
  return path.join(app.getPath('userData'), 'window-bounds.json');
}

function loadWindowBounds() {
  try {
    const b = JSON.parse(fs.readFileSync(boundsFile(), 'utf8'));
    if (!Number.isInteger(b.x) || !Number.isInteger(b.y) || !b.width || !b.height) return {};
    if (b.width > 2400 || b.height > 2400 || b.width < 200 || b.height < 300) return {}; // 异常尺寸兜底
    const onScreen = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return b.x + b.width > a.x + 40 && b.x < a.x + a.width - 40
        && b.y + b.height > a.y + 20 && b.y < a.y + a.height - 20;
    });
    return onScreen ? { x: b.x, y: b.y, width: b.width, height: b.height } : { width: b.width, height: b.height };
  } catch {
    return {};
  }
}

function createWindow(url) {
  const bounds = loadWindowBounds();
  const win = new BrowserWindow({
    width: bounds.width || 430,
    height: bounds.height || 880,
    x: bounds.x,
    y: bounds.y,
    minWidth: 360,
    minHeight: 600,
    title: 'MomoTalk',
    backgroundColor: '#fdf3f5',
    titleBarStyle: 'hiddenInset',
    // 页面触发的下载（导出学生数据等）弹系统保存框，让用户选位置
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadURL(url);

  // 页面触发的下载（导出学生数据等）弹系统保存框，让用户选择保存位置
  win.webContents.session.on('will-download', (_e, item) => {
    const dest = dialog.showSaveDialogSync(win, { defaultPath: item.getFilename() });
    if (dest) item.setSavePath(dest);
    else item.cancel(); // 用户取消 → 不落盘
  });

  win.webContents.on('dom-ready', async () => {
    await win.webContents.insertCSS(FRAME_CSS);
    if (VOICE_SRC) await win.webContents.executeJavaScript(VOICE_SRC);
    if (AI_SRC) await win.webContents.executeJavaScript(AI_SRC);
    if (FEATURES_SRC) await win.webContents.executeJavaScript(FEATURES_SRC);
    // 拖入 .json 文件直接走页面自身的导入管线
    await win.webContents.executeJavaScript(`
      (() => {
        if (window.__momotalkDropReady) return;
        window.__momotalkDropReady = true;
        const input = document.getElementById('file-import');
        if (!input) return;
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
          e.preventDefault();
          const file = [...((e.dataTransfer && e.dataTransfer.files) || [])]
            .find((f) => f.name.toLowerCase().endsWith('.json'));
          if (!file) return;
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
        });
      })()
    `);
  });

  win.on('close', () => {
    try { fs.writeFileSync(boundsFile(), JSON.stringify(win.getBounds())); } catch {}
  });
  return win;
}

function sendToPage(win, code) {
  if (win && !win.isDestroyed()) win.webContents.executeJavaScript(code).catch(() => {});
}

async function exportChatImage(win) {
  try {
    const info = await win.webContents.executeJavaScript(`(() => {
      const chat = document.getElementById('chat-page');
      if (!chat || !chat.classList.contains('slide-in')) return null;
      const c = document.getElementById('chat-content');
      return { h: Math.ceil(c.scrollHeight) + 150, w: window.innerWidth };
    })()`);
    if (!info) {
      dialog.showMessageBox(win, { type: 'info', message: SHELL[SHELL_LOCALE].needChat, buttons: [SHELL[SHELL_LOCALE].ok] });
      return;
    }
    const [w, h] = win.getSize();
    const H = Math.min(Math.max(info.h, 700), 8000);
    win.setResizable(true);
    win.setSize(info.w || w, H);
    await new Promise((r) => setTimeout(r, 450));
    const img = await win.webContents.capturePage();
    win.setSize(w, h);
    const png = img.toPNG();
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: 'MomoTalk-' + new Date().toISOString().slice(0, 10) + '.png',
      filters: [{ name: 'PNG', extensions: ['png'] }],
    });
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, png);
      dialog.showMessageBox(win, {
        type: 'info', message: SHELL[SHELL_LOCALE].savedTo,
        detail: filePath, buttons: [SHELL[SHELL_LOCALE].ok],
      });
    }
  } catch (e) {
    dialog.showMessageBox(win, { type: 'error', message: String(e.message || e), buttons: ['OK'] });
  }
}

async function backupAllData(win) {
  try {
    const data = await win.webContents.executeJavaScript('JSON.stringify(localStorage)');
    const dir = app.getPath('desktop');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(dir, 'MomoTalk-backup-' + stamp + '.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return; // 用户取消：不写入、不提示
    fs.writeFileSync(filePath, data);
    dialog.showMessageBox(win, {
      type: 'info', message: SHELL[SHELL_LOCALE].backupDone,
      detail: filePath, buttons: [SHELL[SHELL_LOCALE].ok],
    });
  } catch (e) {
    dialog.showMessageBox(win, { type: 'error', message: String(e.message || e), buttons: ['OK'] });
  }
}

function buildMenu(win) {
  const L = SHELL[SHELL_LOCALE] || SHELL['zh-CN'];
  const template = [
    {
      label: 'MomoTalk',
      submenu: [
        { role: 'about', label: L.about },
        { type: 'separator' },
        { role: 'hide', label: L.hide },
        { role: 'hideOthers', label: L.hideOthers },
        { role: 'unhide', label: L.showAll },
        { type: 'separator' },
        { role: 'quit', label: L.quit },
      ],
    },
    {
      label: L.file,
      submenu: [
        {
          label: L.importData,
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToPage(win, `document.getElementById('file-import').click()`),
        },
        {
          label: L.exportData,
          accelerator: 'CmdOrCtrl+E',
          click: () => sendToPage(win, `typeof exportData === 'function' && exportData()`),
        },
        { type: 'separator' },
        {
          label: L.exportImg,
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => exportChatImage(win),
        },
        {
          label: L.backup,
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => backupAllData(win),
        },
        {
          label: L.deployGuide,
          click: () => {
            let p = path.join(process.resourcesPath || '', 'docs', 'MomoTalk-部署指南.pdf');
            if (!fs.existsSync(p)) p = path.join(__dirname, 'build', 'docs', 'MomoTalk-部署指南.pdf');
            if (fs.existsSync(p)) require('electron').shell.openPath(p);
          },
        },
        { type: 'separator' },
        { role: 'close', label: L.closeWin },
      ],
    },
    {
      label: L.edit,
      submenu: [
        { role: 'undo', label: L.undo },
        { role: 'redo', label: L.redo },
        { type: 'separator' },
        { role: 'cut', label: L.cut },
        { role: 'copy', label: L.copy },
        { role: 'paste', label: L.paste },
        { role: 'selectAll', label: L.selectAll },
      ],
    },
    {
      label: L.view,
      submenu: [
        { role: 'reload', label: L.reload },
        { role: 'forceReload', label: L.forceReload },
        { type: 'separator' },
        { role: 'toggleDevTools', label: L.devTools },
        { type: 'separator' },
        { role: 'resetZoom', label: L.actualSize },
        { role: 'zoomIn', label: L.zoomIn },
        { role: 'zoomOut', label: L.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L.fullscreen },
      ],
    },
    {
      label: L.window,
      submenu: [
        {
          label: L.alwaysOnTop,
          accelerator: 'CmdOrCtrl+T',
          type: 'checkbox',
          checked: win.isAlwaysOnTop(),
          click: (item) => win.setAlwaysOnTop(item.checked, 'floating'),
        },
        { type: 'separator' },
        { role: 'minimize', label: L.minimize },
        { role: 'zoom', label: L.zoom },
      ],
    },
    {
      label: L.data,
      submenu: [
        {
          label: L.clearData,
          click: async () => {
            const { response } = await dialog.showMessageBox(win, {
              type: 'warning',
              message: L.confirmClear,
              detail: L.clearDetail,
              buttons: [L.cancel, L.clear],
              defaultId: 0,
              cancelId: 0,
            });
            if (response === 1) {
              sendToPage(win, `localStorage.clear(); location.reload()`);
            }
          },
        },
      ],
    },
    {
      label: L.help,
      role: 'help',
      submenu: [
        {
          label: L.github,
          click: () => require('electron').shell.openExternal('https://github.com/ForJiang'),
        },
      ],
    },
    {
      label: L.lang,
      submenu: SUPPORTED_LOCALES.map((loc) => ({
        label: LANG_NAMES[loc],
        type: 'radio',
        checked: loc === SHELL_LOCALE,
        click: () => switchLocale(loc),
      })),
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function shellLocaleFile() {
  return path.join(app.getPath('userData'), 'shell.json');
}

function loadShellLocale() {
  if (CLI_LOCALE && SUPPORTED_LOCALES.includes(CLI_LOCALE)) return CLI_LOCALE; // 自测用，不持久化
  try {
    const j = JSON.parse(fs.readFileSync(shellLocaleFile(), 'utf8'));
    if (SUPPORTED_LOCALES.includes(j.locale)) return j.locale;
  } catch {}
  return 'zh-CN';
}

function saveShellLocale() {
  try { fs.writeFileSync(shellLocaleFile(), JSON.stringify({ locale: SHELL_LOCALE })); } catch {}
}

function switchLocale(loc) {
  if (!SUPPORTED_LOCALES.includes(loc) || loc === SHELL_LOCALE) return;
  SHELL_LOCALE = loc;
  saveShellLocale();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      buildMenu(win);
      win.webContents.reload();
    }
  }
}

function startUnreadBadge(win) {
  const tick = async () => {
    try {
      if (!win || win.isDestroyed()) return;
      const unread = await win.webContents.executeJavaScript(`
        (() => {
          try {
            const arr = JSON.parse(localStorage.getItem('momotalk_my_students_v7') || '[]');
            return Array.isArray(arr) ? arr.reduce((n, s) => n + (s.unread || 0), 0) : 0;
          } catch { return 0; }
        })()
      `);
      app.setBadgeCount(Number(unread) || 0);
    } catch {}
  };
  setInterval(tick, 5000);
  win.webContents.on('did-finish-load', tick);
}

// 语音桥：主进程代理对本机 VoiceStudio 的请求（渲染进程 sandbox 无跨域限制地使用）
// 发送图片：渲染进程传 dataURL，解码存入 userData/images，返回稳定 URL
ipcMain.handle('mmt-images:save', (_e, dataUrl) => {
  try {
    const m = /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/.exec(String(dataUrl));
    if (!m) return null;
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const dir = path.join(app.getPath('userData'), 'images');
    fs.mkdirSync(dir, { recursive: true });
    const name = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext;
    fs.writeFileSync(path.join(dir, name), Buffer.from(m[2], 'base64'));
    return 'http://127.0.0.1:' + servingPort + '/u/' + name;
  } catch { return null; }
});

// 图源列表：用户发送过的图片（供 AI 回复引用，最新的在前）
ipcMain.handle('mmt-images:list', () => {
  try {
    const dir = path.join(app.getPath('userData'), 'images');
    return fs.readdirSync(dir)
      .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
      .filter((f) => {
        try {
          const p = path.join(dir, f);
          if (fs.statSync(p).size < 300) return false; // 1x1 测试图约 70~120B
          if (/\.png$/i.test(f)) {
            const buf = Buffer.alloc(24);
            const fd = fs.openSync(p, 'r');
            fs.readSync(fd, buf, 0, 24, 0);
            fs.closeSync(fd);
            if (buf.slice(12, 16).toString('ascii') === 'IHDR') {
              if (buf.readUInt32BE(16) < 16 || buf.readUInt32BE(20) < 16) return false; // 尺寸过小
            }
          }
          return true;
        } catch { return false; }
      })
      .map((f) => {
        let mtime = 0;
        try { mtime = fs.statSync(path.join(dir, f)).mtimeMs; } catch {}
        return { name: f, url: 'http://127.0.0.1:' + servingPort + '/u/' + f, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 12);
  } catch { return []; }
});

// 「更多 → 其它选项」：语言切换 / 窗口置顶 / 备份 / 清空（渲染进程经桥调用）
ipcMain.handle('mmt-shell:set-locale', (_e, loc) => { switchLocale(String(loc)); return true; });
ipcMain.handle('mmt-shell:deploy-guide', (e) => {
  const { shell } = require('electron');
  let p = path.join(process.resourcesPath || '', 'docs', 'MomoTalk-部署指南.pdf');
  if (!fs.existsSync(p)) p = path.join(__dirname, 'build', 'docs', 'MomoTalk-部署指南.pdf');
  if (fs.existsSync(p)) shell.openPath(p);
  return fs.existsSync(p);
});
ipcMain.handle('mmt-shell:is-always-on-top', (_e) => {
  const w = BrowserWindow.getAllWindows()[0];
  return w ? w.isAlwaysOnTop() : false;
});
ipcMain.handle('mmt-shell:set-always-on-top', (e, flag) => {
  const w = BrowserWindow.fromWebContents(e.sender) || BrowserWindow.getAllWindows()[0];
  if (w) { w.setAlwaysOnTop(!!flag, 'floating'); buildMenu(w); }
  return !!flag;
});
ipcMain.handle('mmt-data:backup', (e) => { backupAllData(BrowserWindow.fromWebContents(e.sender)); return true; });
ipcMain.handle('mmt-data:clear-all', async (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return false;
  const L = SHELL[SHELL_LOCALE] || SHELL['zh-CN'];
  const { response } = await dialog.showMessageBox(w, {
    type: 'warning', message: L.confirmClear, detail: L.clearDetail,
    buttons: [L.cancel, L.clear], defaultId: 0, cancelId: 0,
  });
  if (response === 1) sendToPage(w, `localStorage.clear(); location.reload()`);
  return true;
});

// 基础 TTS：macOS say 合成 + afconvert 转 WAV（RVC 引擎的底座音频，全程本地）
ipcMain.handle('mmt-tts:base', async (_e, { text, rate }) => {
  const { execFile } = require('child_process');
  const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, (e) => (e ? rej(e) : res())));
  try {
    const tmp = require('os').tmpdir();
    const aiff = path.join(tmp, 'mmt_tts_' + Date.now() + '.aiff');
    const wav = aiff.replace(/\.aiff$/, '.wav');
    const wpm = Math.round(180 * (Number(rate) || 1));
    await run('say', ['-o', aiff, '-r', String(wpm), String(text || '').slice(0, 500)]);
    await run('afconvert', ['-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', aiff, wav]);
    const b64 = fs.readFileSync(wav).toString('base64');
    fs.unlink(aiff, () => {});
    fs.unlink(wav, () => {});
    return { b64, mime: 'audio/wav' };
  } catch (e) {
    return null;
  }
});

// API Key 等敏感串用 OS 级密钥加密（safeStorage），避免明文落盘
const { safeStorage } = require('electron');
const safeAvail = async () => (safeStorage.isAsyncEncryptionAvailable
  ? await safeStorage.isAsyncEncryptionAvailable()
  : safeStorage.isEncryptionAvailable());
ipcMain.handle('mmt-safe:encrypt', async (_e, plain) => {
  try {
    if (!(await safeAvail())) return '';
    const buf = safeStorage.encryptStringAsync
      ? await safeStorage.encryptStringAsync(String(plain))
      : safeStorage.encryptString(String(plain));
    return buf.toString('base64');
  } catch { return ''; }
});
ipcMain.handle('mmt-safe:decrypt', async (_e, b64) => {
  try {
    if (!(await safeAvail())) return '';
    const out = safeStorage.decryptStringAsync
      ? await safeStorage.decryptStringAsync(Buffer.from(String(b64), 'base64'))
      : safeStorage.decryptString(Buffer.from(String(b64), 'base64'));
    if (typeof out === 'string') return out;
    if (out && out.result != null) return String(out.result); // Electron 45+: { shouldReEncrypt, result }
    return String(out);
  } catch { return ''; }
});

ipcMain.handle('mmt-voice:request', async (_e, { url, opts = {} }) => {
  try {
    const r = await net.fetch(url, {
      method: opts.method || 'GET',
      headers: opts.headers,
      body: opts.body,
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
    });
    const mime = r.headers.get('content-type') || '';
    if (/audio|octet-stream/.test(mime)) {
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, mime, b64: buf.toString('base64') };
    }
    return { status: r.status, mime, text: await r.text() };
  } catch (e) {
    return { status: 0, error: String(e.message || e) };
  }
});

app.setName('MomoTalk');
app.setAboutPanelOptions({
  applicationName: 'MomoTalk',
  applicationVersion: '1.1.0',
  version: '',
  copyright: 'ForJiang · MomoTalk 桌面版',
});

app.whenReady().then(async () => {
  SHELL_LOCALE = loadShellLocale();
  if (app.dock) {
    const iconPng = path.join(__dirname, 'build', 'icon_1024.png');
    if (fs.existsSync(iconPng)) app.dock.setIcon(iconPng);
  }
  const port = await startStaticServer();
  const win = createWindow(`http://127.0.0.1:${port}${BASE}/momotalk.html`);
  buildMenu(win);
  startUnreadBadge(win);

  if (SELF_TEST) {
    const fail = (msg) => { console.error('SELFTEST_FAIL ' + msg); app.exit(1); };
    const timer = setTimeout(() => fail('timeout'), 25000);
    win.webContents.on('did-fail-load', (_e, code, desc) => {
      clearTimeout(timer);
      fail(`did-fail-load ${code} ${desc}`);
    });
    win.webContents.on('did-finish-load', async () => {
      try {
        const result = await win.webContents.executeJavaScript(`
          (async () => {
            await new Promise((r) => setTimeout(r, 4000));
            const resp = await fetch('./resources/students.json');
            return {
              studentsStatus: resp.status,
              dropReady: window.__momotalkDropReady === true,
              voiceReady: window.__mmtVoiceLoaded === true && !!document.getElementById('mmtv-engine') && !!document.getElementById('more-students'),
              aiReady: window.__mmtAiLoaded === true && !!document.getElementById('mmta-url') && !!document.getElementById('general-entry'),
              importLabel: document.getElementById('btn-import') ? document.getElementById('btn-import').textContent : '',
              bodyText: document.body.innerText,
              bodyChars: document.body.innerText.length,
            };
          })()
        `);
        const img = await win.webContents.capturePage();
        fs.writeFileSync(path.join(require('os').tmpdir(), 'momotalk_selftest.png'), img.toPNG());
        // 更多页截图：验证 ForJiang 署名（开发者卡片/无赞赏入口/无原联系方式）
        await win.webContents.executeJavaScript(`
          (async () => {
            if (typeof switchToMore === 'function') switchToMore();
            await new Promise((r) => setTimeout(r, 800));
          })()
        `);
        const imgMain = await win.webContents.capturePage();
        fs.writeFileSync(path.join(require('os').tmpdir(), 'momotalk_selftest_more.png'), imgMain.toPNG());
        await win.webContents.executeJavaScript(`
          (async () => {
            if (typeof openMoreSection === 'function') openMoreSection('about');
            await new Promise((r) => setTimeout(r, 800));
          })()
        `);
        const img2 = await win.webContents.capturePage();
        fs.writeFileSync(path.join(require('os').tmpdir(), 'momotalk_selftest_about.png'), img2.toPNG());
        clearTimeout(timer);
        // 菜单结构断言：全部菜单项与快捷键绑定核对
        const menu = Menu.getApplicationMenu();
        const menuItems = [];
        menu.items.forEach((mi) => {
          if (mi.submenu) mi.submenu.items.forEach((si) => {
            menuItems.push([mi.label, si.label, si.accelerator ? String(si.accelerator) : '', si.type]);
          });
        });
        const has = (mLabel, iLabel, acc) => menuItems.some(([m, l, a]) =>
          m === mLabel && l === iLabel && (acc === undefined || (acc ? a !== '' : a === '')));
        const menuOK = has('文件', '导入学生数据…', true) && has('文件', '导出学生数据', true)
          && has('文件', '导出聊天长图…', true) && has('文件', '备份数据（选择位置）', true)
          && has('窗口', '窗口置顶', true)
          && menuItems.some(([m, l]) => m === '语言' && l === '简体中文')
          && menuItems.some(([m, l]) => m === '语言' && l === '日本語')
          && menuItems.filter(([m]) => m === '语言').length >= 4;
        const i18nMarkers = { 'zh-CN': '导入', 'zh-TW': '匯入', en: 'Import', ja: 'インポート' };
        const localeOk = (result.importLabel || '') === (i18nMarkers[SHELL_LOCALE] || '导入');
        const ok = result.studentsStatus === 200
          && result.dropReady
          && result.voiceReady
          && result.aiReady
          && localeOk
          && menuOK
          && !result.bodyText.includes('无法读取学生资料')
          && !result.bodyText.includes('无法读取配置文件');
        if (!ok) {
          fail('page not healthy ' + JSON.stringify({ ...result, menuItems }));
        } else {
          console.log('SELFTEST_OK ' + JSON.stringify({ ...result, menuOK, menuCount: menuItems.length }));
          app.exit(0);
        }
      } catch (err) {
        fail(String(err));
      }
    });
  }
});

// 语音服务兜底：仅在服务未运行且无实例时拉起（LaunchAgent 卸载/未登录时保证语音可用，pgrep 防竞态）
const VOICE_STUDIO_DIR = path.join(require('os').homedir(), '.zcode/workspace/default/voice-studio');
setTimeout(() => {
  try {
    const probe = net.fetch('http://127.0.0.1:8000/api/v1/health', { signal: AbortSignal.timeout(2500) });
    probe.then((r) => { if (r.ok) return; tryFallback(); }).catch(() => tryFallback());
  } catch { tryFallback(); }
  function tryFallback() {
    require('child_process').exec('pgrep -f services.main', (err, stdout) => {
      if (!err && String(stdout).trim()) return; // 已有实例（可能在加载中）
      try {
        const py = path.join(VOICE_STUDIO_DIR, '.venv/bin/python');
        if (fs.existsSync(py)) {
          require('child_process').spawn(py, ['-m', 'services.main'], {
            cwd: path.join(VOICE_STUDIO_DIR, 'src'), detached: true, stdio: 'ignore',
          }).unref();
          console.log('[voice] voice-studio 服务已拉起');
        }
      } catch {}
    });
  }
}, 2500);

// 启动后预热本地模型：把权重载入内存，首次对话免等待（聊天 + 视觉双模型共存）
if (!SELF_TEST) {
  setTimeout(async () => {
    try {
      const res = await net.fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen2.5:7b', prompt: ' ', stream: false, keep_alive: '30m', options: { num_predict: 1 } }),
      });
      console.log('[prewarm] local model ready (' + res.status + ')');
    } catch {}
    try {
      const res = await net.fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen2.5vl:3b', prompt: ' ', stream: false, keep_alive: '30m', options: { num_predict: 1 } }),
      });
      console.log('[prewarm] vision model ready (' + res.status + ')');
    } catch {}
  }, 4000);
}

app.on('window-all-closed', () => app.quit());
