/*!
 * ForJiang · MomoTalk 桌面版
 * 新功能扩展:社团表情包 + 聊天截图(Canvas 长图,基于上游 chat_screenshot.js)
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later License.
 */
(() => {
  const EMOJI_COUNT = 183;
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
  `;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));

  // 加载上游截图模块(同源资源,一次)
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

  // ── 表情包 ──
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
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
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

  // ── 聊天截图 ──
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
      '<div class="screenshot-loading" style="text-align:center;padding:20px 0;color:#888;">正在生成截图…</div>', []);
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
