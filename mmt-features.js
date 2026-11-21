/*!
 * ForJiang · MomoTalk 桌面版
 * 新功能扩展:社团表情包 + 聊天截图(Canvas 长图,基于上游 chat_screenshot.js)+ Demo 模式
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later License.
 */
(() => {
  const EMOJI_COUNT = 183;
  const toast = (msg, ok) => {
    document.querySelectorAll('.mmt-voice-toast, .mmt-ai-toast, .mmt-img-toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'mmt-voice-toast';
    el.style.background = ok ? 'rgba(47,158,95,.95)' : 'rgba(217,83,79,.95)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  };
  const CSS = `
    #mmt-emoji-btn{width:38px;height:38px;border-radius:12px;cursor:pointer;
      background:#fdf0f3;border:1px solid #f3d9e0;color:#e56d84;display:flex;align-items:center;justify-content:center;
      flex:none;transition:filter .15s,background .15s;padding:0;margin-bottom:1px;align-self:flex-end;}
    #mmt-emoji-btn:hover{background:#fbe3e9;}
    #mmt-emoji-btn:active{filter:brightness(.95);}
    #mmt-emoji-btn svg{width:19px;height:19px;}
    #mmt-emoji-panel{position:absolute;left:12px;bottom:64px;width:300px;max-height:280px;overflow-y:auto;
      background:#fff;border:1px solid #f3d9e0;border-radius:14px;box-shadow:0 8px 24px rgba(90,40,60,.16);
      padding:10px;z-index:500;display:none;}
    #mmt-emoji-panel.open{display:block;}
    #mmt-emoji-panel .emoji-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}
    #mmt-emoji-panel .emoji-cell{border:none;background:transparent;cursor:pointer;padding:2px;border-radius:8px;}
    #mmt-emoji-panel .emoji-cell:hover{background:#fdf0f3;}
    #mmt-emoji-panel .emoji-cell img{width:100%;display:block;}
    #mmt-screenshot-btn{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:30px;height:30px;
      border-radius:9px;border:none;background:rgba(255,255,255,.22);color:#fff;cursor:pointer;
      display:flex;align-items:center;justify-content:center;padding:0;}
    #mmt-screenshot-btn:hover{background:rgba(255,255,255,.34);}
    #mmt-screenshot-btn svg{width:16px;height:16px;display:block;}
    .mmt-shot-preview{max-width:100%;max-height:52vh;display:block;margin:0 auto;border-radius:10px;
      border:1px solid #eee0e5;}
    #mmt-deploy-overlay{position:fixed;inset:0;background:rgba(43,34,48,.55);z-index:9000;
      display:flex;align-items:center;justify-content:center;padding:18px;}
    #mmt-deploy-overlay .dg-win{background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:100%;
      display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(40,20,30,.3);}
    #mmt-deploy-overlay .dg-head{display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;background:#e56d84;color:#fff;font-weight:600;font-size:15px;}
    #mmt-deploy-overlay .dg-close{border:none;background:rgba(255,255,255,.25);color:#fff;width:26px;height:26px;
      border-radius:8px;cursor:pointer;font-size:13px;}
    #mmt-deploy-overlay .dg-body{flex:1;overflow-y:auto;padding:14px 16px;background:#fff;}
    #mmt-deploy-overlay .dg-h{font-weight:600;color:#e56d84;font-size:13.5px;margin:12px 0 5px;}
    #mmt-deploy-overlay .dg-p{font-size:12.5px;line-height:1.75;color:#3a3040;margin:4px 0;}
    #mmt-deploy-overlay .dg-row{display:grid;grid-template-columns:auto 1fr;border-left:3px solid #f0a4b4;
      background:#fdf4f6;border-radius:8px;padding:7px 10px;margin:6px 0;gap:2px 12px;}
    #mmt-deploy-overlay .dg-row.alt{background:#fbf9fa;border-left-color:#d9c3cb;}
    #mmt-deploy-overlay .dg-c1{font-weight:600;color:#c94f66;font-size:12px;grid-column:1;}
    #mmt-deploy-overlay .dg-c2{font-size:12px;color:#3a3040;grid-column:2;grid-row:1;}
    #mmt-deploy-overlay .dg-c3{font-size:11px;color:#8a7a83;grid-column:2;grid-row:2;}
    #mmt-deploy-overlay .dg-tip{text-align:center;color:#8a7a83;font-size:11px;margin-top:14px;}
    #mmt-deploy-overlay .dg-foot{display:flex;gap:10px;padding:10px 16px;border-top:1px solid #f0e3e8;background:#fdf8fa;}
    #mmt-deploy-overlay .dg-foot button{flex:1;padding:9px 0;border-radius:10px;border:1px solid #f0c9d4;
      font-size:13px;cursor:pointer;background:#fdf0f3;color:#e56d84;font-weight:600;}
    #mmt-deploy-overlay .dg-foot button:hover{filter:brightness(.97);}
  `;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));

  function ensureScreenshotModule() {
    if (window.ChatScreenshot) return;
    const sc = document.createElement('script');
    sc.src = './resources/chat_screenshot.js';
    document.head.appendChild(sc);
  }

  function absUrl(rel) {
    try { return new URL(rel, location.href).href; } catch { return rel; }
  }

  function state() { return window.__mmtChatState && window.__mmtChatState(); }

  function buildEmojiUI() {
    const area = document.querySelector('.chat-input-area');
    if (!area || document.getElementById('mmt-emoji-btn')) return;
    const imgBtn = document.getElementById('mmt-img-btn');
    const btn = document.createElement('button');
    btn.id = 'mmt-emoji-btn';
    btn.title = '社团表情';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5 9.5c-2.9 0-5.36-1.93-6.14-4.57h12.28C17.36 17.57 14.9 19.5 12 19.5z"/></svg>';
    const panel = document.createElement('div');
    panel.id = 'mmt-emoji-panel';
    panel.innerHTML = '<div class="emoji-grid">' +
      Array.from({ length: EMOJI_COUNT }, (_, i) =>
        `<button class="emoji-cell" type="button" data-emoji="${i}"><img loading="lazy" src="./resources/emoji/${i}.png"></button>`
      ).join('') + '</div>';
    btn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('open'); });
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
      const cell = e.target.closest('.emoji-cell');
      if (!cell) return;
      const n = Number(cell.dataset.emoji);
      if (!Number.isFinite(n) || n < 0 || n >= EMOJI_COUNT) return;
      const input = document.getElementById('chat-input');
      input.value = absUrl('./resources/emoji/' + n + '.png');
      panel.classList.remove('open');
      window.sendMessage();
    });
    document.addEventListener('click', () => panel.classList.remove('open'));
    if (imgBtn) area.insertBefore(btn, imgBtn);
    else area.appendChild(btn);
    area.appendChild(panel);
  }

  function buildBoxes() {
    const st = state();
    if (!st || !st.history.length) return [];
    const boxes = [];
    let cur = null;
    st.history.forEach((m) => {
      const role = m.role === 'sensei' ? 'sensei' : 'student';
      if (!cur || cur.role !== role) { cur = { role: role, items: [] }; boxes.push(cur); }
      const t = String(m.text || '');
      if (/^(https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?|data:image\/)/i.test(t)) cur.items.push({ type: 'image', src: t });
      else cur.items.push({ type: 'text', text: t });
    });
    return boxes;
  }

  function takeScreenshot() {
    const st = state();
    if (!st || !st.id) return;
    const boxes = buildBoxes();
    if (!boxes.length) {
      window.showModal('聊天截图', '<div style="text-align:center;color:#888;font-size:14px;">还没有聊天内容可以截图</div>', []);
      return;
    }
    if (!window.ChatScreenshot || typeof window.ChatScreenshot.generate !== 'function') {
      ensureScreenshotModule();
      setTimeout(takeScreenshot, 400);
      return;
    }
    const avatarEl = document.getElementById('chat-header-avatar');
    const avatar = (avatarEl && avatarEl.src && avatarEl.src.startsWith('http')) ? avatarEl.src : '';
    window.showModal('聊天截图',
      '<div style="text-align:center;padding:20px 0;color:#888;">正在生成截图…</div>', []);
    window.ChatScreenshot.generate({
      boxes: boxes,
      student: { name: st.nameCn || st.name || '', avatar: avatar },
      width: Math.max(300, Math.min(460, window.innerWidth - 40)),
      dpr: 2,
      imageProxy: 'https://wsrv.nl/?url={url}',
      texts: { reply: '回复', story: '好感故事', imageFail: '图片加载失败' },
    }).then((res) => {
      const dataUrl = res.canvas.toDataURL('image/png');
      const body = '<img class="mmt-shot-preview" src="' + dataUrl + '">';
      window.showModal('聊天截图', body, [
        { text: '关闭', class: 'cancel', onClick: () => window.closeModal() },
        { text: '保存 PNG', class: 'danger', onClick: () => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'MomoTalk-截图-' + Date.now() + '.png';
          document.body.appendChild(a); a.click(); a.remove();
          window.closeModal();
        } },
      ]);
    }).catch((e) => {
      window.showModal('聊天截图', '<div style="color:#c0392b;font-size:13px;text-align:center;">截图失败:' +
        String(e && e.message || e).slice(0, 80) + '</div>', []);
    });
  }

  function buildScreenshotUI() {
    const header = document.querySelector('.chat-header');
    if (!header || document.getElementById('mmt-screenshot-btn')) return;
    const trash = document.getElementById('mmt-clear-chat');
    const btn = document.createElement('button');
    btn.id = 'mmt-screenshot-btn';
    btn.title = '聊天截图(长图)';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 14v4h-4v2h4v4h2v-4h4v-2h-4v-4h-2zM4 20h9v-2H4v2zM19 2v2h-2v-2h2zm2 0h4v2h-4V2zM19 6v2h-2V6h2zm2 0h4v2h-4V6zM19 10v2h-2v-2h2zm2 0h4v2h-4v-2z"/></svg>';
    btn.addEventListener('click', takeScreenshot);
    if (trash) header.insertBefore(btn, trash);
    else header.appendChild(btn);
  }

  // ── 新电脑部署指南:软件内预览浮层(不依赖第三方查看器) ──
  function showDeployGuide() {
    let ov = document.getElementById('mmt-deploy-overlay');
    if (ov) { ov.style.display = 'flex'; return; }
    ov = document.createElement('div');
    ov.id = 'mmt-deploy-overlay';
    ov.innerHTML = `
      <div class="dg-win">
        <div class="dg-head"><span>新电脑部署指南</span><button class="dg-close">✕</button></div>
        <div class="dg-body">
          <div class="dg-h">一分钟总览</div>
          <div class="dg-p">MomoTalk 的全部智能功能(聊天回复、图片识别、克隆语音)都依赖本机服务:Ollama(聊天与视觉模型)与 voice-studio(语音合成)。在新电脑上把它们部署好,再安装 MomoTalk 本体即可开箱即用。</div>
          <div class="dg-row"><div class="dg-c1">A 迁移包(推荐)</div><div class="dg-c2">旧电脑生成迁移包(约 25GB,含 voice-studio 全套与模型),新电脑一键部署</div><div class="dg-c3">有旧电脑、想完全一致</div></div>
          <div class="dg-row alt"><div class="dg-c1">B 全新下载</div><div class="dg-c2">一键脚本自动安装 Ollama、下载模型、部署语音服务(需网络)</div><div class="dg-c3">没有旧电脑或想全新安装</div></div>
          <div class="dg-h">方式 A:迁移包(推荐)</div>
          <div class="dg-p">1. 在旧电脑:双击 make-migration-pack.command,自动打包 voice-studio 全套(含 GPT-SoVITS/RVC 模型)、Ollama 模型与安装包。</div>
          <div class="dg-p">2. 把整个 setup 文件夹拷到新电脑(U 盘/移动硬盘)。</div>
          <div class="dg-p">3. 在新电脑:双击 setup-momotalk.command,自动完成服务部署与模型安装。</div>
          <div class="dg-p">4. 双击 MomoTalk 安装包,拖入 Applications,打开即用。</div>
          <div class="dg-h">方式 B:全新下载</div>
          <div class="dg-p">1. 双击 setup-momotalk.command:自动安装 Ollama(GitHub 加速)、从 ModelScope 下载聊天模型 qwen2.5:7b 与视觉模型 qwen2.5vl:3b、部署 voice-studio 并配置运行环境(首次约 10 分钟)。</div>
          <div class="dg-p">2. 自动安装语音服务开机自启,并做三项就绪校验(聊天/视觉/语音)。</div>
          <div class="dg-p">3. 安装 MomoTalk,打开即用。</div>
          <div class="dg-h">日常使用</div>
          <div class="dg-p">聊天:发消息 AI 自动回复;点学生头像重新生成;发图 AI 会先看图再回复。</div>
          <div class="dg-p">语音:点消息旁的小喇叭,学生的克隆音色读出来;语音设置里可切 RVC 变声引擎。</div>
          <div class="dg-p">语言:简/繁/EN/日 四语切换,学生名字同步官方译名。</div>
          <div class="dg-p">备份:菜单 文件 → 备份数据(⌘⇧B),自选保存位置;换电脑导入备份即可。</div>
          <div class="dg-h">常见问题</div>
          <div class="dg-row"><div class="dg-c1">首句语音等待很久</div><div class="dg-c2">语音服务冷启动加载模型,30–60 秒属正常</div></div>
          <div class="dg-row alt"><div class="dg-c1">AI 首次回复慢</div><div class="dg-c2">聊天模型按需加载,约 10–20 秒</div></div>
          <div class="dg-row"><div class="dg-c1">图片识别无反应</div><div class="dg-c2">视觉模型按需加载,发图后稍等片刻</div></div>
          <div class="dg-row alt"><div class="dg-c1">想换 AI 模型</div><div class="dg-c2">通用设置 → 模型下拉选择,或接云端 API</div></div>
          <div class="dg-row"><div class="dg-c1">语音没有声音</div><div class="dg-c2">语音设置 → 检测服务;确认开机后语音服务已就绪(约 1 分钟)</div></div>
          <div class="dg-tip">所有数据只存在本机 · ForJiang © 2026</div>
        </div>
        <div class="dg-foot"><button class="dg-pdf">下载 PDF 版</button><button class="dg-ok">我知道了</button></div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.dg-close').onclick = () => { ov.style.display = 'none'; };
    ov.querySelector('.dg-ok').onclick = () => { ov.style.display = 'none'; };
    ov.querySelector('.dg-pdf').onclick = () => {
      const a = document.createElement('a');
      a.href = '/docs/deploy-guide.pdf';
      a.download = 'MomoTalk-部署指南.pdf';
      document.body.appendChild(a); a.click(); a.remove();
    };
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.style.display = 'none'; });
  }

  // ── Demo 模式:预置演示对话回放(无需 AI) ──
  let demoPlaying = false;
  const DEMO_SCRIPT = [
    { role: 'sensei', text: '星野，在吗？' },
    { role: 'student', text: '哎——在呐。大叔我刚睡醒~' },
    { role: 'sensei', demoImage: true },
    { role: 'student', emoji: 3 },
    { role: 'student', text: '周五的约会别忘了哦！老师说好的~' },
    { role: 'sensei', text: '忘不了！布丁我带双份。' },
    { role: 'student', text: '哎——布丁呐！那就说定了，拉钩~' },
    { role: 'sensei', text: '拉钩。' },
    { role: 'student', text: '嘿嘿，那周五见啦，老师~' },
  ];

  function demoImage() {
    const c = document.createElement('canvas'); c.width = 320; c.height = 160;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 320, 160);
    x.fillStyle = '#1a6'; x.font = 'bold 52px sans-serif'; x.fillText('小菊公园', 40, 95);
    return c.toDataURL('image/png');
  }

  async function startDemo() {
    if (demoPlaying) return;
    demoPlaying = true;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      if (typeof switchToList === 'function') switchToList();
      await wait(300);
      if (!document.querySelector('.contact-item')) throw new Error('no student');
      document.querySelector('.contact-item').click();
      await wait(700);
      const st = state();
      if (!st) throw new Error('no chat state');
      const aiEnabled = window.mmtAi ? window.mmtAi.settings.enabled : false;
      const autoRead = window.mmtVoice ? window.mmtVoice.settings.auto : false;
      if (window.mmtAi) window.mmtAi.settings.enabled = false;
      if (window.mmtVoice) window.mmtVoice.settings.auto = false;
      toast('Demo 播放中…', true);
      const say = (m) => {
        if (m.role === 'sensei') {
          const input = document.getElementById('chat-input');
          input.value = m.demoImage ? demoImage() : m.text;
          window.sendMessage();
        } else if (m.emoji != null) {
          st.pushStudent(absUrl('./resources/emoji/' + m.emoji + '.png'));
        } else {
          st.pushStudent(m.text);
        }
        if (typeof renderChat === 'function') renderChat();
      };
      for (const m of DEMO_SCRIPT) {
        say(m);
        await wait(m.role === 'sensei' ? 850 : 780);
      }
      toast('Demo 播放完毕（可用垃圾桶清空）', true);
      if (window.mmtAi) window.mmtAi.settings.enabled = aiEnabled;
      if (window.mmtVoice) window.mmtVoice.settings.auto = autoRead;
    } catch (e) {
      toast('Demo 失败: ' + String(e && e.message || e).slice(0, 60), false);
      if (window.mmtAi) window.mmtAi.settings.enabled = true;
    } finally {
      setTimeout(() => { demoPlaying = false; }, 1200);
    }
  }

  window.mmtFeatures = { startDemo: () => startDemo(), showDeployGuide: () => showDeployGuide() };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureScreenshotModule);
  else ensureScreenshotModule();
  let tries = 0;
  const timer = setInterval(() => {
    const area = document.querySelector('.chat-input-area');
    const header = document.querySelector('.chat-header');
    if (area && header) {
      ensureScreenshotModule();
      buildEmojiUI();
      buildScreenshotUI();
      clearInterval(timer);
    } else if (++tries > 40) clearInterval(timer);
  }, 500);
})();
