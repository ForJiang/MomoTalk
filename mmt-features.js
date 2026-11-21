/*!
 * ForJiang · MomoTalk 桌面版
 * 桌面特性扩展:页头居中 + 部署指南浮层 + Demo 模式(上游 v8 编辑/播放功能) + 瓷贴栏追加
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
          <div class="dg-p">创作:聊天页顶部「播放」可把聊天记录做成动画回放;更多面板可发回复框、好感故事、旁白;开启 Demo 模式可手动扮演师生双方。</div>
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

  // ── 更多按钮:图标改为向下箭头,菜单向下展开(微信式);展开时箭头旋转 180° ──
  function buildArrowMoreBtn() {
    const b = document.getElementById('btn-more');
    if (!b || b.dataset.mmtArrow) return;
    b.dataset.mmtArrow = '1';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8.8l6.5 6.4 6.5-6.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    // 包装 toggleMorePanel:面板开合时同步箭头方向
    if (typeof window.toggleMorePanel === 'function' && !window.toggleMorePanel.__mmtArrow) {
      const orig = window.toggleMorePanel;
      window.toggleMorePanel = function () {
        const r = orig.apply(this, arguments);
        const p = document.getElementById('more-panel');
        b.classList.toggle('open', !!(p && p.classList.contains('open')));
        return r;
      };
      window.toggleMorePanel.__mmtArrow = true;
    }
    const arrowCss = document.createElement('style');
    arrowCss.textContent = `
      #btn-more svg{transition:transform .2s ease;}
      #btn-more.open svg{transform:rotate(180deg);}
      #btn-more{color:#6b7686;}
      /* 聊天头右上按钮:去文字只留图标(图标+文字挤在 25px 高按钮里视觉重叠;播放状态由进度条提示) */
      .chat-tool-btn span{display:none !important;}
      .chat-tool-btn{width:38px;justify-content:center;padding:6px 0;gap:0;}
      /* 截图按钮相机线框化(上游为白色实心剪影) */
      #btn-screenshot svg path{fill:none !important;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round;}
    `;
    document.head.appendChild(arrowCss);
  }

  // ── 我的头像(老师侧):更多页"更换我的头像"入口;设置后老师消息气泡右侧显示头像 ──
  const MYAV_KEY = 'mmt_sensei_avatar_v1';
  const MYAV_LABELS = {
    'zh-CN': { title: '更换我的头像', pick: '选择图片', clear: '清除头像', done: '完成', none: '未设置（老师消息不显示头像）', saved: '我的头像已更新', cleared: '已清除我的头像', fail: '头像保存失败' },
    'zh-TW': { title: '更換我的頭像', pick: '選擇圖片', clear: '清除頭像', done: '完成', none: '未設定（老師訊息不顯示頭像）', saved: '我的頭像已更新', cleared: '已清除我的頭像', fail: '頭像儲存失敗' },
    en: { title: 'Change My Avatar', pick: 'Choose Image', clear: 'Remove Avatar', done: 'Done', none: 'Not set (Sensei messages show no avatar)', saved: 'My avatar updated', cleared: 'My avatar removed', fail: 'Failed to save avatar' },
    ja: { title: '自分のアイコン変更', pick: '画像を選択', clear: 'アイコン削除', done: '完了', none: '未設定（先生のメッセージに表示されません）', saved: 'アイコンを更新しました', cleared: 'アイコンを削除しました', fail: 'アイコンの保存に失敗しました' },
  };
  function myAvatarLabels() { return MYAV_LABELS[window.__MMT_LOCALE] || MYAV_LABELS['zh-CN']; }
  function myAvatarGet() { try { return localStorage.getItem(MYAV_KEY) || ''; } catch { return ''; } }
  // 头像显隐开关:更多页「显示我的头像」控制(默认显示)
  const MYAV_SHOW_LS = 'mmt_sensei_avatar_show_v1';
  function myAvatarShow() { try { return localStorage.getItem(MYAV_SHOW_LS) !== '0'; } catch { return true; } }
  function setMyAvatarShow(visible) {
    try { localStorage.setItem(MYAV_SHOW_LS, visible ? '1' : '0'); } catch {}
    decorateSenseiAvatars();
  }
  function decorateSenseiAvatars() {
    const av = myAvatarGet();
    const show = myAvatarShow();
    document.querySelectorAll('.msg-box.sensei').forEach((box) => {
      let img = box.querySelector('.mmt-sensei-avatar');
      if (!av || !show) { if (img) img.remove(); return; }
      if (!img) {
        img = document.createElement('img');
        img.className = 'mmt-sensei-avatar';
        img.alt = '';
        box.insertBefore(img, box.firstChild); // row-reverse:首位即视觉最右(气泡外缘)
      }
      if (img.getAttribute('src') !== av) img.src = av;
    });
  }
  function applyMyAvatar(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) { try { localStorage.removeItem(MYAV_KEY); } catch {} resolve(''); return; }
      // 压缩到 256px 再存,避免 localStorage 膨胀(复用上游 compressImage)
      if (typeof window.compressImage === 'function') {
        window.compressImage(dataUrl, 256, 0.85).then((small) => { try { localStorage.setItem(MYAV_KEY, small); } catch {} resolve(small); }).catch(() => { try { localStorage.setItem(MYAV_KEY, dataUrl); } catch {} resolve(dataUrl); });
      } else { try { localStorage.setItem(MYAV_KEY, dataUrl); } catch {} resolve(dataUrl); }
    });
  }
  function openMyAvatarModal() {
    const L = myAvatarLabels();
    const cur = myAvatarGet();
    const ov = document.createElement('div');
    ov.id = 'mmt-myavatar-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(43,34,48,.55);z-index:9001;display:flex;align-items:center;justify-content:center;padding:18px;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:16px;width:100%;max-width:360px;overflow:hidden;box-shadow:0 18px 50px rgba(40,20,30,.3);">
        <div style="padding:12px 16px;background:#e56d84;color:#fff;font-weight:600;font-size:15px;">${L.title}</div>
        <div style="padding:18px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <img class="mmt-myav-preview" src="${cur}" alt="" style="width:72px;height:72px;border-radius:16px;object-fit:cover;background:#f4f6f9;${cur ? '' : 'display:none;'}">
          <div class="mmt-myav-none" style="font-size:12px;color:#8a7a83;${cur ? 'display:none;' : ''}">${L.none}</div>
          <div style="display:flex;gap:10px;width:100%;">
            <button class="mmt-myav-pick" style="flex:1;padding:9px 0;border-radius:10px;border:1px solid #f0c9d4;background:#fdf0f3;color:#e56d84;font-weight:600;font-size:13px;cursor:pointer;">${L.pick}</button>
            <button class="mmt-myav-clear" style="flex:1;padding:9px 0;border-radius:10px;border:1px solid #f0c9d4;background:#fff;color:#d9534f;font-size:13px;cursor:pointer;${cur ? '' : 'display:none;'}">${L.clear}</button>
          </div>
        </div>
        <div style="padding:10px 16px 14px;"><button class="mmt-myav-done" style="width:100%;padding:9px 0;border-radius:10px;border:none;background:#e56d84;color:#fff;font-weight:600;font-size:13px;cursor:pointer;">${L.done}</button></div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('.mmt-myav-done').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.mmt-myav-pick').onclick = () => {
      const fi = document.createElement('input');
      fi.type = 'file';
      fi.accept = 'image/*';
      fi.style.display = 'none';
      document.body.appendChild(fi);
      fi.onchange = () => {
        const file = fi.files && fi.files[0];
        fi.remove();
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const small = await applyMyAvatar(String(reader.result));
          if (!small) { toast(L.fail, false); return; }
          const pv = ov.querySelector('.mmt-myav-preview');
          pv.src = small; pv.style.display = '';
          ov.querySelector('.mmt-myav-none').style.display = 'none';
          ov.querySelector('.mmt-myav-clear').style.display = '';
          decorateSenseiAvatars();
          toast(L.saved, true);
        };
        reader.readAsDataURL(file);
      };
      fi.click();
    };
    ov.querySelector('.mmt-myav-clear').onclick = async () => {
      await applyMyAvatar('');
      ov.querySelector('.mmt-myav-preview').style.display = 'none';
      ov.querySelector('.mmt-myav-none').style.display = '';
      ov.querySelector('.mmt-myav-clear').style.display = 'none';
      decorateSenseiAvatars();
      toast(L.cleared, true);
    };
  }
  // 老师消息头像渲染:任何 .msg-box.sensei 出现(主渲染/播放动画/编辑刷新)都补头像
  let myavScheduled = false;
  new MutationObserver(() => {
    if (myavScheduled) return;
    myavScheduled = true;
    requestAnimationFrame(() => { myavScheduled = false; try { decorateSenseiAvatars(); } catch {} });
  }).observe(document.body, { childList: true, subtree: true });
  const myavCss = document.createElement('style');
  myavCss.textContent = `
    .mmt-sensei-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;align-self:flex-end;background:#dfe7ef;border:1px solid rgba(0,0,0,.04);}
  `;
  document.head.appendChild(myavCss);

  // ── Demo 模式(开关):上游网页版编辑体验——手动扮演师生双方 + 回复框/旁白/播放 ──
  // 切换全程静默(不跳页面、不弹选择器):后台加示例学生与种子对话,只切徽章显隐
  // 示例学生未花:开启时若无则添加;关闭时保留学生与聊天(避免误删用户在体验中写的内容)
  const DEMO_LS = 'mmt_demo_mode_v1';
  const DEMO_STUDENT_CN = '圣园未花';
  function demoStudentId() {
    try {
      return Object.keys(libraryById).find((id) => {
        const n = String((libraryById[id] || {}).displayName || '').replace(/\s+/g, '');
        return n === DEMO_STUDENT_CN;
      }) || null;
    } catch { return null; }
  }
  function setDemoMode(on) {
    try {
      if (on) {
        if (window.mmtAi) { window.mmtAi._demoAiPrev = window.mmtAi.settings.enabled; window.mmtAi.settings.enabled = false; }
        if (window.mmtVoice) { window.mmtVoice._demoAutoPrev = window.mmtVoice.settings.auto; window.mmtVoice.settings.auto = false; }
        // 后台添加示例学生(不打开选择器、不切页面);已有则复用(v8 displayName 带空格,匹配先去空格)
        const sid = demoStudentId();
        if (!sid) throw new Error('demo student not in library');
        let entry = myStudents.find((s) => Number(s.studentId) === Number(sid));
        if (!entry && typeof addStudentToMyList === 'function') {
          const chatId = addStudentToMyList(Number(sid));
          entry = myStudents.find((s) => String(s.id) === String(chatId));
        }
        if (!entry) throw new Error('demo student add failed');
        const chatId = entry.id;
        if (typeof renderContactList === 'function') renderContactList();
        // 种子对话(含回复框示例):仅在该学生还没有聊天记录时写入
        if (!chats[chatId] || chats[chatId].length === 0) {
          const uid = (p) => p + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
          const t0 = Date.now();
          const mkItem = (o) => Object.assign({ id: uid('i') }, o);
          const mkBox = (role, items, dt) => ({ id: uid('b'), role, time: t0 + dt, items });
          chats[chatId] = [
            mkBox('sensei', [mkItem({ type: 'text', text: '未花，今天也超级可爱呢。' })], 0),
            mkBox('student', [mkItem({ type: 'text', text: '诶嘿嘿☆ 那是当然的！不愧是未花大人！' })], 800),
            mkBox('sensei', [mkItem({ type: 'reply', title: '回复', options: ['周末一起去逛街吧。', '下次再说吧。'] })], 1600),
            mkBox('student', [mkItem({ type: 'text', text: '锵锵～☆ 已经决定和老师逛街了！输入框直接打字，或点上方「播放」看动画哦～' })], 2400),
          ];
          saveChats();
        }
        // 当前若恰好开着该学生的聊天,刷新渲染;否则不动当前页面
        const st = window.__mmtChatState && window.__mmtChatState();
        if (st && String(st.id) === String(chatId) && typeof renderChat === 'function') renderChat();
        // 显示身份切换徽章(Demo 模式核心:手动扮演双方)
        const rs = document.getElementById('role-switch');
        if (rs) rs.style.removeProperty('display');
        toast('Demo 模式已开启（无 AI，可手动扮演师生双方，支持回复框/旁白/播放）', true);
      } else {
        if (window.mmtAi) window.mmtAi.settings.enabled = window.mmtAi._demoAiPrev !== undefined ? window.mmtAi._demoAiPrev : true;
        if (window.mmtVoice) window.mmtVoice.settings.auto = window.mmtVoice._demoAutoPrev !== undefined ? window.mmtVoice._demoAutoPrev : false;
        const rs = document.getElementById('role-switch');
        if (rs) rs.style.setProperty('display', 'none');
        toast('已退出 Demo 模式（示例学生与聊天记录已保留，可长按联系人删除）', true);
      }
      try { localStorage.setItem(DEMO_LS, on ? '1' : '0'); } catch {}
    } catch (e) {
      toast('Demo 模式切换失败: ' + String(e && e.message || e).slice(0, 60), false);
      try { localStorage.setItem(DEMO_LS, '0'); } catch {}
    }
  }
  window.mmtFeatures = { showDeployGuide: () => showDeployGuide(), setDemoMode: (on) => setDemoMode(on), changeMyAvatar: () => openMyAvatarModal(), setMyAvatarShow: (v) => setMyAvatarShow(v), myAvatarShow: () => myAvatarShow(), isDemoOn: () => { try { return localStorage.getItem(DEMO_LS) === '1'; } catch { return false; } } };

  // 启动时:Demo 模式若处于开启状态(上次会话),恢复身份徽章显示;并追加瓷贴
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
      buildArrowMoreBtn();
      if (tiles) { buildFeatureTiles(); clearInterval(timer); }
      else if (++tries > 40) clearInterval(timer);
    }, 500);
  }
})();
