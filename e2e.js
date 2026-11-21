/*!
 * ForJiang · MomoTalk 桌面版
 * 端到端验证脚本：mock LLM 闭环、语音/AI 面板检查
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */

// One-off end-to-end check: picker -> add student -> open chat -> more page.
const { app, BrowserWindow, ipcMain, net, safeStorage } = require('electron');

const safeAvail = async () => (safeStorage.isAsyncEncryptionAvailable
  ? await safeStorage.isAsyncEncryptionAvailable()
  : safeStorage.isEncryptionAvailable());
const IMG_DIR = require('path').join(require('os').tmpdir(), 'mmt_e2e_images');
require('fs').mkdirSync(IMG_DIR, { recursive: true });
let e2ePort = 0;
ipcMain.handle('mmt-images:list', () => {
  try {
    return fs.readdirSync(IMG_DIR)
      .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
      .map((f) => {
        let mtime = 0;
        try { mtime = fs.statSync(path.join(IMG_DIR, f)).mtimeMs; } catch {}
        return { name: f, url: 'http://127.0.0.1:' + e2ePort + '/u/' + f, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 12);
  } catch { return []; }
});
ipcMain.handle('mmt-shell:is-always-on-top', () => {
  const w = BrowserWindow.getAllWindows()[0];
  return w ? w.isAlwaysOnTop() : false;
});
ipcMain.handle('mmt-shell:set-always-on-top', (e, flag) => {
  const w = BrowserWindow.fromWebContents(e.sender) || BrowserWindow.getAllWindows()[0];
  if (w) w.setAlwaysOnTop(!!flag, 'floating');
  return !!flag;
});

ipcMain.handle('mmt-images:save', (_e, dataUrl) => {
  try {
    const m = /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/.exec(String(dataUrl));
    if (!m) return null;
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const name = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.' + ext;
    fs.writeFileSync(path.join(IMG_DIR, name), Buffer.from(m[2], 'base64'));
    return 'http://127.0.0.1:' + e2ePort + '/u/' + name;
  } catch { return null; }
});

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

// 与 main.js 相同的代理处理器：AI/语音请求经主进程转发
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
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const WWW_ROOT = path.join(__dirname, 'www');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      let filePath = path.normalize(path.join(WWW_ROOT, urlPath));
      if (!filePath.startsWith(WWW_ROOT + path.sep) && filePath !== WWW_ROOT) { res.writeHead(403); res.end(); return; }
      if (urlPath.startsWith('/u/') && !urlPath.includes('..')) {
        const p = path.join(IMG_DIR, path.basename(urlPath));
        if (fs.existsSync(p)) { res.writeHead(200, { 'Content-Type': 'image/png' }); fs.createReadStream(p).pipe(res); return; }
      }
      if (urlPath === '/__fj/avatar.jpg') {
        const p = path.join(__dirname, 'build', 'forjiang-avatar.jpg');
        if (fs.existsSync(p)) { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); fs.createReadStream(p).pipe(res); return; }
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => { e2ePort = server.address().port; resolve(server); });
  });
}

// 本地 mock OpenAI 兼容服务：验证 AI 自动回信闭环
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.url.includes('/chat/completions')) {
      let sys = '';
      try { sys = JSON.parse(body).messages[0].content || ''; } catch {}
      const reply = sys.includes('发送图片')
        ? '给你看张有趣的图\n[图:1]'
        : 'MOCK:' + sys.slice(0, 90);
      res.end(JSON.stringify({ choices: [{ message: { content: reply } }] }));
    } else {
      res.end(JSON.stringify({ data: [{ id: 'mock-1' }, { id: 'mock-2' }] }));
    }
  });
});
mock.listen(18765, '127.0.0.1');

const tmp = os.tmpdir();
const fail = (msg) => { console.error('E2E_FAIL ' + msg); app.exit(1); };

app.whenReady().then(async () => {
  const server = await startStaticServer();
  const port = server.address().port;
  const win = new BrowserWindow({
    width: 430, height: 880, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.js') },
  });
  const localeSrc = fs.readFileSync(path.join(__dirname, 'mmt-locale.js'), 'utf8');
  const voiceSrc = fs.readFileSync(path.join(__dirname, 'voice-extension.js'), 'utf8');
  const aiSrc = fs.readFileSync(path.join(__dirname, 'ai-extension.js'), 'utf8');
  win.webContents.on('dom-ready', async () => {
    const fj = { name: 'ForJiang', avatar: '/__fj/avatar.jpg', url: 'https://forjiang.github.io',
      version: 'ForJiang · v-test',
      contact: { email: 'jianghaoda.1@outlook.com', site: 'https://forjiang.github.io', bilibili: 'https://b23.tv/edD6tm9' } };
    for (const s of [`window.__MMT_FJ = ${JSON.stringify(fj)};`, localeSrc, voiceSrc, aiSrc]) {
      if (s) { try { await win.webContents.executeJavaScript(s); } catch {} }
    }
  });
  const timer = setTimeout(() => fail('timeout'), 300000);
  win.webContents.on('did-fail-load', (_e, c, d) => { clearTimeout(timer); fail(c + ' ' + d); });
  win.webContents.on('did-finish-load', async () => {
    try {
      const shot = async (name) => {
        const img = await win.webContents.capturePage();
        fs.writeFileSync(path.join(tmp, name), img.toPNG());
      };
      console.error('MARK initial-wait'); await win.webContents.executeJavaScript(`new Promise((r) => setTimeout(r, 2000))`);
      const voiceBtn = await win.webContents.executeJavaScript(`window.__mmtVoiceLoaded === true && !!document.getElementById('mmtv-engine')`);

      console.error('MARK r1-add-student'); const r1 = await win.webContents.executeJavaScript(`
        (async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          if (typeof switchToMore === 'function') switchToMore();
          await wait(400);
          document.getElementById('more-add-entry').click();
          await wait(600);
          const first = document.querySelector('.picker-item:not(.added)');
          if (!first) return { added: false };
          const name = first.querySelector('.picker-name').textContent;
          first.click();
          await wait(400);
          document.querySelector('.modal-actions button, .modal-overlay .modal-actions button, .picker-done, [class*="done"]')?.click();
          document.querySelector('.modal-overlay')?.click();
          await wait(400);
          return { added: true, name };
        })()
      `);
      await shot('momotalk_e2e_list.png');

      console.error('MARK r2-chat-voice'); const r2 = await win.webContents.executeJavaScript(`
        (async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          const item = document.querySelector('.contact-item');
          if (!item) return { opened: false };
          item.click();
          await wait(800);
          // 发送一条消息，验证语音朗读按钮注入
          const input = document.getElementById('chat-input');
          input.value = '语音功能测试消息，你好呀！';
          Object.assign(window.mmtAi.settings, {
            enabled: true, baseUrl: 'http://127.0.0.1:18765/v1', model: 'mock-chat',
            visOn: false, // e2e 无视觉模型，关闭看图（视觉闭环由真机实测覆盖）
          });
          const st = window.__mmtChatState();
          localStorage.setItem('mmt_ai_persona_v1', JSON.stringify({ [st.id]: 'PERSONA-MARKER. You are a mock student.' }));
          // 等 7B 预热完成（主进程启动 4 秒后触发，5.2GB 载入 GPU 需要十几秒）
          for (let w = 0; w < 50; w++) {
            try {
              const res = await window.mmtVoiceBridge.request('http://127.0.0.1:11434/api/ps', { method: 'GET', timeoutMs: 3000 });
              if (res.text && res.text.includes('7b')) break;
              if (w % 5 === 0) console.log('WARMUP iter ' + w + ' text=' + String(res.text).slice(0, 80));
            } catch {}
            await wait(1000);
          }
          const diag = { sendType: typeof sendMessage, sendSrc: String(sendMessage).slice(0, 60), stId: (window.__mmtChatState() || {}).id || null, curBefore: null };
          try { diag.curBefore = 'n/a-internal'; } catch {}
          diag.inputBefore = document.getElementById('chat-input').value.slice(0, 20);
          try { sendMessage(); diag.sendErr = ''; } catch (e) { diag.sendErr = String(e && e.message || e).slice(0, 80); }
          diag.histAfter = (window.__mmtChatState() || { history: [] }).history.length;
          diag.lastAfter = ((window.__mmtChatState() || { history: [] }).history.slice(-1)[0] || {}).role || 'none';
          try { diag.chats99 = Object.keys(window.__mmtChatState ? {} : {}); } catch {}
          diag.hasChatFn = typeof window.sendMessage;
          window.__r2diag = diag;
          let aiReply = null;
          let sayBtns = 0;
          for (let i = 0; i < 60; i++) {
            await wait(500);
            const rows = [...document.querySelectorAll('.msg-box.student .msg-bubble')];
            const hit = rows.find((b) => b.textContent.includes('MOCK:PERSONA-MARKER') || b.textContent.includes('给你看张有趣的图'));
            if (hit && aiReply === null) aiReply = hit.textContent.trim();
            sayBtns = document.querySelectorAll('.mmt-say').length;
            if (aiReply && sayBtns >= 1) break;
          }
          return {
            diag: window.__r2diag,
            opened: document.getElementById('chat-page').style.display !== 'none',
            name: document.getElementById('chat-header-name').textContent,
            sayBtns,
            aiReply,
            toast: document.querySelector('.mmt-ai-toast') ? document.querySelector('.mmt-ai-toast').textContent : '',
            msgs: window.__mmtChatState() ? window.__mmtChatState().history.map(m => m.role + ':' + m.text.slice(0, 22)) : [],
          };
        })()
      `);
      await shot('momotalk_e2e_chat.png');

      console.error('MARK r3-more-page'); const r3 = await win.webContents.executeJavaScript(`
        (async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          if (typeof closeChat === 'function') closeChat();
          await wait(300);
          if (typeof switchToMore === 'function') switchToMore();
          await wait(500);
          const moreVisible = document.getElementById('more-page').classList.contains('active') ||
                              document.getElementById('more-page').style.display !== 'none';
          const hasEntries = !!document.getElementById('students-entry') && !!document.getElementById('general-entry');
          return { moreVisible, hasEntries };
        })()
      `);
      await shot('momotalk_e2e_more.png');

      console.error('MARK r4-voice-panel'); const r4 = await win.webContents.executeJavaScript(`
        (async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          openMoreSection('students');
          await wait(500);
          const voiceOpen = document.getElementById('more-students').classList.contains('active') && !!document.getElementById('mmtv-engine');
          return { voicePanelOpen: voiceOpen };
        })()
      `);
      if (r4.voicePanelOpen) await shot('momotalk_e2e_students.png');
      console.error('MARK vm-voicemap'); const vm = await win.webContents.executeJavaScript(`(async () => {
        await new Promise((r) => setTimeout(r, 400));
        return {
          rows: document.querySelectorAll('#mmtv-voicemap .vmap-row').length,
          v1: window.mmtVoice.voiceFor('小明'),
          v2: window.mmtVoice.voiceFor('小花'),
        };
      })()`);
      console.error('MARK aiOpen'); const aiOpen = await win.webContents.executeJavaScript(`(async () => {
        openMoreSection('general');
        await new Promise((r) => setTimeout(r, 500));
        return document.getElementById('more-general').classList.contains('active') && !!document.getElementById('mmta-url');
      })()`);
      console.error('MARK imgReply');
         const imgReply = await win.webContents.executeJavaScript(`(async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        Object.assign(window.mmtAi.settings, { enabled: true, baseUrl: 'http://127.0.0.1:18765/v1', model: 'mock-chat', visOn: false });
        const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        const url = await window.mmtImages.save('data:image/png;base64,' + b64);
        if (!url) return { ok: false, why: 'seed save failed' };
        switchToList(); await wait(300);
        const it = document.querySelector('.contact-item'); if (!it) return { ok: false, why: 'no contact' };
        it.click(); await wait(500);
        const n0 = document.querySelectorAll('.msg-box').length;
        const i = document.getElementById('chat-input'); i.value = '发张图给我看看';
        window.sendMessage();
        let img = null, txt = null;
        for (let k = 0; k < 30; k++) {
          await wait(500);
          img = document.querySelector('.msg-image[src="' + url + '"]');
          const bubbles = [...document.querySelectorAll('.msg-box.student .msg-bubble')].filter(b => !b.classList.contains('mmt-typing'));
          txt = bubbles.some(b => b.textContent.includes('给你看张有趣的图'));
          if (img && txt) break;
        }
        const detail = {
          msgs: window.__mmtChatState().history.map(m => m.role + ':' + m.text.slice(0, 24)),
          toast: document.querySelector('.mmt-ai-toast') ? document.querySelector('.mmt-ai-toast').textContent : '',
          imgCount: document.querySelectorAll('.msg-image').length,
          listRaw: await window.mmtImages.list(),
          enabledNow: window.mmtAi.settings.enabled,
        };
        return { ok: !!img && txt, imgRendered: !!img, textPart: txt, detail };
      })()`);
      const avatarGen = await win.webContents.executeJavaScript(`(async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        switchToList(); await wait(300);
        const it = document.querySelector('.contact-item'); if (!it) return { ok: false, why: 'no contact' };
        it.click(); await wait(600);
        // v8:AI 回复可能与最后一个学生 box 合并(box 数不变),用扁平消息数判定
        const st0 = window.__mmtChatState(); const n0 = st0 ? st0.count : 0;
        document.getElementById('chat-header-avatar').click();
        let replied = null;
        for (let i = 0; i < 30; i++) {
          await wait(500);
          const st1 = window.__mmtChatState();
          if (st1 && st1.count > n0) {
            const hist = st1.history;
            replied = (hist[hist.length-1] || {}).text ? hist[hist.length-1].text.trim().slice(0, 40) : 'added';
            break;
          }
        }
        return { ok: !!replied, reply: replied };
      })()`);
      if (aiOpen) await shot('momotalk_e2e_ai.png');

      const r5 = await win.webContents.executeJavaScript(`
        (async () => {
          const enc = await window.mmtSafe.encrypt('secret-test-123');
          const dec = enc ? await window.mmtSafe.decrypt(enc) : '';
          return { hasEnc: !!enc, roundtrip: dec === 'secret-test-123' };
        })()
      `);
      clearTimeout(timer);
      const ok = voiceBtn && r1.added && r2.opened && r2.sayBtns >= 1 && r3.moreVisible && r2.aiReply;
      const okAll = ok && r3.hasEntries && r4.voicePanelOpen && aiOpen && r5.hasEnc && r5.roundtrip && vm.rows >= 1 && avatarGen.ok === true && imgReply.ok === true;
      if (okAll) { console.log('E2E_OK ' + JSON.stringify({ entries: r3, voice: r4, aiPanel: aiOpen, safe: r5, voiceMap: vm, avatarGen, imgReply })); app.exit(0); }
      else fail(JSON.stringify({ voiceBtn, add: r1, chat: r2, more: r3, voicePanel: r4, aiPanel: aiOpen, safe: r5, vm, avatarGen, imgReply }));
    } catch (err) { clearTimeout(timer); fail(String(err)); }
  });
  win.loadURL(`http://127.0.0.1:${port}/index.html`);
});

app.on('window-all-closed', () => app.exit(0));
