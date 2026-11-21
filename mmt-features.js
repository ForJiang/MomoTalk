/*!
 * ForJiang · MomoTalk 桌面版
 * 桌面特性扩展:页头居中 + 部署指南浮层 + 体验模式(上游 v8 编辑/播放功能) + 瓷贴栏追加
 * (社团表情/本地图片/回复框/好感故事/旁白/播放/截图均由上游 v8 原生提供)
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later License.
 */
(() => {
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
  // 列表页页头标题居中(.header-logo 自带 margin-right:auto 会压过 justify-content,需一并覆盖);
  // 聊天页页头上游 v8 已原生居中,不动(其播放/截图按钮为流内元素)
  const HC = document.createElement('style');
  HC.textContent = `
    .header { justify-content: center; }
    .header .header-logo { margin-left: auto !important; margin-right: auto !important; }
  `;
  document.head.appendChild(HC);

  // 旧令牌绝对 URL 清洗:令牌持久化之前的启动会话随机生成前缀,
  // 历史消息里的表情/图片链接(/<旧token>/resources/…)重启后 404;
  // 统一改写为当前前缀(localStorage 与已载入内存的 chats 各修一份,v8 items 结构)
  function fixEmojiUrls() {
    try {
      const cur = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
      const re = /https?:\/\/127\.0\.0\.1:\d+\/[A-Za-z0-9_-]+\/(resources\/(?:emoji\/\d+\.png|[^"'\s)]*\.(?:png|jpe?g|gif|webp)))/g;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        if (v && v.indexOf('127.0.0.1:') !== -1 && v.indexOf('/resources/') !== -1) {
          const nv = v.replace(re, cur + '$1');
          if (nv !== v) { try { localStorage.setItem(k, nv); } catch {} }
        }
      }
      if (typeof chats !== 'undefined' && chats && typeof chats === 'object') {
        Object.values(chats).forEach((arr) => {
          if (!Array.isArray(arr)) return;
          arr.forEach((b) => {
            if (!b || !Array.isArray(b.items)) return;
            b.items.forEach((it) => {
              ['src', 'text'].forEach((f) => {
                if (typeof it[f] === 'string' && it[f].indexOf('127.0.0.1:') !== -1) {
                  it[f] = it[f].replace(re, cur + '$1');
                }
              });
            });
          });
        });
      }
    } catch {}
  }
  fixEmojiUrls();
  setTimeout(fixEmojiUrls, 800);

  function state() { return window.__mmtChatState && window.__mmtChatState(); }

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
          <div class="dg-h">Windows 用户</div>
          <div class="dg-p">使用 setup-momotalk.bat(部署)与 make-migration-pack.bat(迁移包),流程同上;语音服务写入注册表开机自启。Windows 版为首次适配版本,遇到问题欢迎反馈。</div>
          <div class="dg-h">方式 B:全新下载</div>
          <div class="dg-p">1. 双击 setup-momotalk.command:自动安装 Ollama(GitHub 加速)、从 ModelScope 下载聊天模型 qwen2.5:7b 与视觉模型 qwen2.5vl:3b、部署 voice-studio 并配置运行环境(首次约 10 分钟)。</div>
          <div class="dg-p">2. 自动安装语音服务开机自启,并做三项就绪校验(聊天/视觉/语音)。</div>
          <div class="dg-p">3. 安装 MomoTalk,打开即用。</div>
          <div class="dg-h">日常使用</div>
          <div class="dg-p">聊天:发消息 AI 自动回复;点学生头像重新生成;发图 AI 会先看图再回复。</div>
          <div class="dg-p">语音:点消息旁的小喇叭,学生的克隆音色读出来;语音设置里可切 RVC 变声引擎。</div>
          <div class="dg-p">创作:聊天页顶部「播放」可把聊天记录做成动画回放;更多面板可发回复框、好感故事、旁白;开启体验模式可手动扮演师生双方。</div>
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

  // ── 上游瓷贴栏追加:清空聊天 + 部署指南(表情/图片/回复框/好感故事/旁白为上游原生) ──
  const TILE_LABELS = {
    'zh-CN': { clear: '清空聊天', guide: '部署指南' },
    'zh-TW': { clear: '清空聊天', guide: '部署指南' },
    en: { clear: 'Clear Chat', guide: 'Setup Guide' },
    ja: { clear: '履歴消去', guide: 'セットアップ' },
  };
  const TL = TILE_LABELS[window.__MMT_LOCALE] || TILE_LABELS['zh-CN'];
  function buildFeatureTiles() {
    const tiles = document.getElementById('more-tiles');
    if (!tiles || document.getElementById('mmt-tile-clear')) return;
    const mk = (id, label, svg) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'more-tile';
      b.id = id;
      b.title = label;
      b.innerHTML = `<span class="more-tile-icon">${svg}</span><span class="more-tile-label">${label}</span>`;
      return b;
    };
    const clearBtn = mk('mmt-tile-clear', TL.clear,
      '<svg viewBox="0 0 24 24" fill="none" stroke="#7a8aa0" stroke-width="1.7"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/></svg>');
    clearBtn.addEventListener('click', () => {
      const trig = document.getElementById('mmt-clear-chat');
      if (trig) { trig.click(); return; }
      const st = state();
      if (st && st.id != null && window.showModal) {
        window.showModal(TL.clear, '<div style="font-size:13px;color:#666;">' + TL.clear + '?', []);
        st.clearChat();
        window.closeModal();
      }
    });
    const guideBtn = mk('mmt-tile-guide', TL.guide,
      '<svg viewBox="0 0 24 24" fill="none" stroke="#7a8aa0" stroke-width="1.7"><path d="M12 6.5c-1.6-1.3-3.8-2-6-2v13c2.2 0 4.4.7 6 2 1.6-1.3 3.8-2 6-2v-13c-2.2 0-4.4.7-6 2z"/><path d="M12 6.5v13"/></svg>');
    guideBtn.addEventListener('click', () => showDeployGuide());
    tiles.appendChild(clearBtn);
    tiles.appendChild(guideBtn);
  }

  // ── 体验模式(开关):上游网页版编辑体验——手动扮演师生双方 + 回复框/旁白/播放 ──
  // 示例学生未花:开启时若无则添加;关闭时保留学生与聊天(避免误删用户在体验中写的内容)
  const DEMO_LS = 'mmt_demo_mode_v1';
  const DEMO_STUDENT_CN = '圣园未花';
  async function setDemoMode(on) {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      if (on) {
        if (window.mmtAi) { window.mmtAi._demoAiPrev = window.mmtAi.settings.enabled; window.mmtAi.settings.enabled = false; }
        if (window.mmtVoice) { window.mmtVoice._demoAutoPrev = window.mmtVoice.settings.auto; window.mmtVoice.settings.auto = false; }
        if (typeof switchToList === 'function') switchToList();
        await wait(200);
        // 已有未花(用户自己加过)直接打开其聊天,不重建、不删用户数据(v8 displayName 带空格,匹配先去空格)
        const existing = [...document.querySelectorAll('.contact-item')].find((it) => (it.textContent || '').replace(/\s+/g, '').includes(DEMO_STUDENT_CN));
        if (!existing) {
          if (typeof switchToMore === 'function') switchToMore();
          await wait(200);
          if (typeof openStudentPicker === 'function') openStudentPicker();
          await wait(500);
          const target = [...document.querySelectorAll('.picker-item')].find((el) => {
            const n = (el.querySelector('.picker-name') || {}).textContent || '';
            return n.replace(/\s+/g, '') === DEMO_STUDENT_CN && !el.classList.contains('added');
          });
          if (!target) throw new Error('demo student not available');
          target.click();
          await wait(300);
          [...document.querySelectorAll('.modal-actions .modal-btn, .modal-overlay button')].forEach((b) => { if (/完成|添加|确定/.test(b.textContent)) b.click(); });
          await wait(400);
        }
        if (typeof switchToList === 'function') switchToList();
        await wait(200);
        // 打开未花聊天:点击后必须等到 currentStudentId 生效(否则种子会写进 chats[null])
        for (let attempt = 0; attempt < 5; attempt++) {
          const items = document.querySelectorAll('.contact-item');
          for (const it of items) { if ((it.textContent || '').replace(/\s+/g, '').includes(DEMO_STUDENT_CN)) { it.click(); break; } }
          await wait(600);
          const s1 = window.__mmtChatState && window.__mmtChatState();
          if (s1 && s1.id != null) break;
        }
        const st = window.__mmtChatState && window.__mmtChatState();
        if (!st || st.id == null) throw new Error('no chat');
        if (st.count === 0) {
          // 示例对话:静态种子(含回复框示例),无 AI、无自动回放
          const uid = (p) => p + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
          const t0 = Date.now();
          const mkItem = (o) => Object.assign({ id: uid('i') }, o);
          const mkBox = (role, items, dt) => ({ id: uid('b'), role, time: t0 + dt, items });
          const seed = [
            mkBox('sensei', [mkItem({ type: 'text', text: '未花，今天也超级可爱呢。' })], 0),
            mkBox('student', [mkItem({ type: 'text', text: '诶嘿嘿☆ 那是当然的！不愧是未花大人！' })], 800),
            mkBox('sensei', [mkItem({ type: 'reply', title: '回复', options: ['周末一起去逛街吧。', '下次再说吧。'] })], 1600),
            mkBox('student', [mkItem({ type: 'text', text: '锵锵～☆ 已经决定和老师逛街了！输入框直接打字，或点上方「播放」看动画哦～' })], 2400),
          ];
          chats[st.id] = seed;
          saveChats();
          if (typeof renderChat === 'function') renderChat();
        }
        // 显示身份切换徽章(体验模式核心:手动扮演双方)
        const rs = document.getElementById('role-switch');
        if (rs) rs.style.removeProperty('display');
        toast('体验模式已开启：可手动扮演师生双方、发回复框/旁白、播放动画（无 AI）', true);
      } else {
        if (typeof switchToList === 'function') switchToList();
        await wait(200);
        if (window.mmtAi) window.mmtAi.settings.enabled = window.mmtAi._demoAiPrev !== undefined ? window.mmtAi._demoAiPrev : true;
        if (window.mmtVoice) window.mmtVoice.settings.auto = window.mmtVoice._demoAutoPrev !== undefined ? window.mmtVoice._demoAutoPrev : false;
        const rs = document.getElementById('role-switch');
        if (rs) rs.style.setProperty('display', 'none');
        toast('已退出体验模式（示例学生与聊天记录已保留，可长按联系人删除）', true);
      }
      try { localStorage.setItem(DEMO_LS, on ? '1' : '0'); } catch {}
    } catch (e) {
      toast('体验模式切换失败: ' + String(e && e.message || e).slice(0, 60), false);
      try { localStorage.setItem(DEMO_LS, '0'); } catch {}
    }
  }
  window.mmtFeatures = { showDeployGuide: () => showDeployGuide(), setDemoMode: (on) => setDemoMode(on), isDemoOn: () => { try { return localStorage.getItem(DEMO_LS) === '1'; } catch { return false; } } };

  // 启动时:体验模式若处于开启状态(上次会话),恢复身份徽章显示;并追加瓷贴
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
  function bootstrap() {
    try {
      if ((localStorage.getItem(DEMO_LS) === '1')) {
        const rs = document.getElementById('role-switch');
        if (rs) rs.style.removeProperty('display');
      }
    } catch {}
    let tries = 0;
    const timer = setInterval(() => {
      const tiles = document.getElementById('more-tiles');
      if (tiles) { buildFeatureTiles(); clearInterval(timer); }
      else if (++tries > 40) clearInterval(timer);
    }, 500);
  }
})();
