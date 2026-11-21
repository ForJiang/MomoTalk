/*!
 * ForJiang · MomoTalk 桌面版
 * 注入补丁：四语词典、T() 接管、页面状态桥、ForJiang 品牌接管
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */

// MomoTalk 多语言补丁 —— 由服务器注入到 <head>，在页面脚本之前定义语言，
// DOMContentLoaded 后接管 window.T 并重跑 fillStaticTexts()，原网页文件不做任何修改。
(() => {
  const LOCALES = {
    'zh-CN': { studentsTitle: '语音设置', studentsPlaceholder: '语音设置' },
    'zh-TW': {
      imageLoadFail: '圖片載入失敗', imgErrorTitle: '圖片載入失敗', imgErrorRes: '錯誤資源：',
      imgErrorReasons: '可能的原因：伺服器檔案不存在、路徑設定錯誤、跨域限制或圖片損壞。',
      imgErrorOk: '知道了', docTitleSuffix: '自訂聊天', importBtn: '匯入', exportBtn: '匯出',
      navMessages: '訊息', navMore: '更多', moreTitle: '更多', loadingLibrary: '正在讀取學生資料…',
      developerTag: '開發者', donateEntry: '贊助 · Buy me a coffee', aboutTitle: '關於',
      generalTitle: '一般設定', studentsTitle: '語音設定', appInfoTitle: '應用資訊', versionLabel: '版本',
      contactTitle: '聯絡我們', qqLabel: 'QQ 交流群', wechatLabel: '企業微信', emailLabel: '信箱',
      wechatTap: '點擊訪問 ›', studentsPlaceholder: '語音設定', tutorialEntry: '教學',
      tutorialSubtitle: '點擊文字介紹跳轉影片', generalVideoTitle: '影片設定',
      generalDefaultSiteLabel: '預設跳轉影片網站',
      generalDefaultSiteHint: '點擊教學裡的文字介紹時優先開啟該網站；若該影片沒有這個網站的連結，會自動改用另一個。',
      searchPlaceholder: '搜尋已新增的學生或形態...', chatPlaceholder: '輸入訊息或圖片連結...',
      sendBtn: '傳送', developerLink: '開發者主頁', creditsTitle: '銘謝 & 開發團隊',
      privacyNote: '本站所有資料不收集、不上傳，儲存在本地，請做好備份或開啟自動備份，避免遺失',
      closeBtn: '關閉', donateNoImage: '未設定贊助圖片', siteXiaohongshu: '小紅書', siteChannels: '影片號',
      tutorialLoading: '正在讀取教學…', tutorialErrorTitle: '無法讀取教學內容',
      tutorialErrorHint: '請確認 resources/video.json 存在且可存取。', tutorialReload: '重新讀取',
      tutorialEmpty: '暫無教學內容', tutorialEmptyHint: '在 resources/video.json 中填入影片後重新整理即可顯示',
      tutorialLinkMissing: '暫無連結', tutorialTitle: '教學', loadErrorTitle: '無法讀取學生資料',
      loadErrorHint: '請確認 resources/students.json 與 HTML 位於同一目錄。', reloadBtn: '重新讀取',
      emptySearch: '沒有找到符合的學生形態', emptyMyStudents: '還沒有新增學生',
      emptyHint: '點擊下方 + 從學生庫中選擇', imagePlaceholder: '[圖片]', mePrefix: '[我]',
      skinPreview: '暫無訊息', startChat: '開始與 {name} 聊天吧',
      manageSubtitle: '{name} · 共 {count} 條訊息', unreadPlaceholder: '未讀數量（僅列表顯示）',
      manageTitle: '管理會話', manageCancel: '取消', manageClear: '清空紀錄', manageRemove: '移出列表',
      manageSave: '儲存', notReadyTitle: '提示', notReadyBody: '學生資料尚未載入完成。', notReadyOk: '知道了',
      pickerPlaceholder: '搜尋學生姓名或形態…', pickerTitle: '選擇學生形態', pickerDone: '完成',
      pickerEmpty: '沒有符合的學生形態', pickerAdded: '已新增', pickerAdd: '＋ 新增',
      pickerMore: '還有 {n} 個形態未顯示，請輸入關鍵字搜尋', chatEmpty: '與 {name} 的聊天從這裡開始',
      senseiName: 'Sensei', roleSensei: '老師', roleStudent: '學生', editRoleLine: '身份：{role}',
      editTitle: '編輯訊息', editCancel: '取消', editDelete: '刪除', editSave: '儲存',
      storageFullTitle: '本地儲存已滿',
      storageFullBody: '瀏覽器本地儲存空間不足，最新訊息可能沒有儲存成功。建議先點右上角「匯出」備份資料，再清理不再需要的會話。',
      importUnknown: '無法識別的檔案格式', importLibNotReady: '學生資料尚未載入完成',
      importDoneTitle: '匯入結果', importFailTitle: '匯入失敗', configFailTitle: '無法讀取設定檔',
      configFailHint: '請確認 resources/running_datas.json 存在且可存取。'
    },
    en: {
      imageLoadFail: 'Failed to load image', imgErrorTitle: 'Image failed to load', imgErrorRes: 'Problem resource:',
      imgErrorReasons: 'Possible causes: file missing on the server, wrong path, cross-origin restrictions, or a corrupted image.',
      imgErrorOk: 'OK', docTitleSuffix: 'Custom Chat', importBtn: 'Import', exportBtn: 'Export',
      navMessages: 'Chats', navMore: 'More', moreTitle: 'More', loadingLibrary: 'Loading student data…',
      developerTag: 'Developer', donateEntry: 'Support · Buy me a coffee', aboutTitle: 'About',
      generalTitle: 'General', studentsTitle: 'Voice', appInfoTitle: 'App Info', versionLabel: 'Version',
      contactTitle: 'Contact Us', qqLabel: 'QQ Group', wechatLabel: 'WeChat Work', emailLabel: 'Email',
      wechatTap: 'Open ›', studentsPlaceholder: 'Student settings (in development)', tutorialEntry: 'Tutorials',
      tutorialSubtitle: 'Tap a title to open the video', generalVideoTitle: 'Video Settings',
      generalDefaultSiteLabel: 'Preferred video site',
      generalDefaultSiteHint: 'Used when tapping a tutorial title; falls back to the other site if the video has no link for it.',
      searchPlaceholder: 'Search added students or forms...', chatPlaceholder: 'Type a message or image URL...',
      sendBtn: 'Send', developerLink: "Developer's page", creditsTitle: 'Credits & Team',
      privacyNote: 'Nothing is collected or uploaded — everything stays on this device. Back up regularly so you never lose your chats.',
      closeBtn: 'Close', donateNoImage: 'No donation image configured', siteXiaohongshu: 'Xiaohongshu',
      siteChannels: 'Channels', tutorialLoading: 'Loading tutorials…', tutorialErrorTitle: 'Failed to load tutorials',
      tutorialErrorHint: 'Make sure resources/video.json exists and is reachable.', tutorialReload: 'Retry',
      tutorialEmpty: 'No tutorials yet', tutorialEmptyHint: 'Add videos to resources/video.json and refresh to show them',
      tutorialLinkMissing: 'No link yet', tutorialTitle: 'Tutorials', loadErrorTitle: 'Failed to load student data',
      loadErrorHint: 'Make sure resources/students.json sits next to the HTML.', reloadBtn: 'Retry',
      emptySearch: 'No matching student forms', emptyMyStudents: 'No students added yet',
      emptyHint: 'Tap + below to pick from the student library', imagePlaceholder: '[Image]', mePrefix: '[Me]',
      skinPreview: 'No messages yet', startChat: 'Start chatting with {name}',
      manageSubtitle: '{name} · {count} messages', unreadPlaceholder: 'Unread count (list only)',
      manageTitle: 'Manage Chat', manageCancel: 'Cancel', manageClear: 'Clear History', manageRemove: 'Remove',
      manageSave: 'Save', notReadyTitle: 'Notice', notReadyBody: "Student data hasn't finished loading.",
      notReadyOk: 'OK', pickerPlaceholder: 'Search students or forms…', pickerTitle: 'Pick a Student Form',
      pickerDone: 'Done', pickerEmpty: 'No matching student forms', pickerAdded: 'Added', pickerAdd: '＋ Add',
      pickerMore: '{n} more forms hidden — type a keyword to search',
      chatEmpty: 'This is the beginning of your chat with {name}', senseiName: 'Sensei',
      roleSensei: 'Sensei', roleStudent: 'Student', editRoleLine: 'Role: {role}', editTitle: 'Edit Message',
      editCancel: 'Cancel', editDelete: 'Delete', editSave: 'Save', storageFullTitle: 'Storage Full',
      storageFullBody: 'Local storage is full; the latest messages may not have been saved. Use Export in the top-right corner to back up, then remove old chats.',
      importUnknown: 'Unrecognized file format', importLibNotReady: "Student data hasn't finished loading",
      importDoneTitle: 'Import Result', importFailTitle: 'Import Failed', configFailTitle: 'Failed to load config',
      configFailHint: 'Make sure resources/running_datas.json exists and is reachable.'
    },
    ja: {
      imageLoadFail: '画像の読み込みに失敗しました', imgErrorTitle: '画像の読み込みに失敗しました',
      imgErrorRes: '問題のリソース:',
      imgErrorReasons: '考えられる原因：サーバーにファイルが存在しない、パスの設定ミス、クロスオリジン制限、画像の破損など。',
      imgErrorOk: 'OK', docTitleSuffix: 'カスタムチャット', importBtn: 'インポート', exportBtn: 'エクスポート',
      navMessages: 'チャット', navMore: 'その他', moreTitle: 'その他', loadingLibrary: '生徒データを読み込み中…',
      developerTag: '開発者', donateEntry: '支援 · Buy me a coffee', aboutTitle: 'このアプリについて',
      generalTitle: '一般設定', studentsTitle: '音声設定', appInfoTitle: 'アプリ情報', versionLabel: 'バージョン',
      contactTitle: 'お問い合わせ', qqLabel: 'QQグループ', wechatLabel: 'WeChat Work', emailLabel: 'メール',
      wechatTap: '開く ›', studentsPlaceholder: '生徒設定（開発中）', tutorialEntry: 'チュートリアル',
      tutorialSubtitle: 'タイトルをタップして動画へ', generalVideoTitle: '動画設定',
      generalDefaultSiteLabel: '優先動画サイト',
      generalDefaultSiteHint: 'チュートリアルのタイトルをタップしたときに優先的に開くサイトです。その動画にこのサイトのリンクがない場合は、自動的にもう一方を使います。',
      searchPlaceholder: '追加した生徒や形態を検索...', chatPlaceholder: 'メッセージまたは画像URLを入力...',
      sendBtn: '送信', developerLink: '開発者ページ', creditsTitle: 'クレジット & 開発チーム',
      privacyNote: '当サイトはデータを収集・アップロードしません。すべて端末内に保存されます。バックアップを取って大切なチャットを守りましょう。',
      closeBtn: '閉じる', donateNoImage: '支援画像が未設定です', siteXiaohongshu: '小紅書（RED）',
      siteChannels: 'チャンネル', tutorialLoading: 'チュートリアルを読み込み中…',
      tutorialErrorTitle: 'チュートリアルを読み込めませんでした',
      tutorialErrorHint: 'resources/video.json が存在しアクセス可能か確認してください。', tutorialReload: '再読み込み',
      tutorialEmpty: 'チュートリアルはまだありません',
      tutorialEmptyHint: 'resources/video.json に動画を追加して更新すると表示されます', tutorialLinkMissing: 'リンクなし',
      tutorialTitle: 'チュートリアル', loadErrorTitle: '生徒データを読み込めませんでした',
      loadErrorHint: 'resources/students.json が HTML と同じ場所にあるか確認してください。', reloadBtn: '再読み込み',
      emptySearch: '該当する生徒形態が見つかりません', emptyMyStudents: 'まだ生徒が追加されていません',
      emptyHint: '下の + をタップして生徒ライブラリから選択', imagePlaceholder: '[画像]', mePrefix: '[自分]',
      skinPreview: 'メッセージはまだありません', startChat: '{name} とのチャットを始めましょう',
      manageSubtitle: '{name} · 全 {count} 件', unreadPlaceholder: '未読数（リスト表示のみ）',
      manageTitle: 'チャットを管理', manageCancel: 'キャンセル', manageClear: '履歴を消去',
      manageRemove: 'リストから削除', manageSave: '保存', notReadyTitle: 'お知らせ',
      notReadyBody: '生徒データの読み込みが完了していません。', notReadyOk: 'OK',
      pickerPlaceholder: '生徒名や形態を検索…', pickerTitle: '生徒形態を選択', pickerDone: '完了',
      pickerEmpty: '該当する生徒形態がありません', pickerAdded: '追加済み', pickerAdd: '＋ 追加',
      pickerMore: '残り {n} 件の形態があります。キーワードで検索してください',
      chatEmpty: '{name} とのチャットはここから始まります', senseiName: 'Sensei',
      roleSensei: '先生', roleStudent: '生徒', editRoleLine: '身分：{role}', editTitle: 'メッセージを編集',
      editCancel: 'キャンセル', editDelete: '削除', editSave: '保存', storageFullTitle: 'ローカル保存領域がいっぱいです',
      storageFullBody: 'ブラウザのローカル保存領域が不足しています。最新のメッセージが保存されていない可能性があります。右上の「エクスポート」でバックアップしてから、不要なチャットを整理してください。',
      importUnknown: '認識できないファイル形式です', importLibNotReady: '生徒データの読み込みが完了していません',
      importDoneTitle: 'インポート結果', importFailTitle: 'インポートに失敗しました',
      configFailTitle: '設定ファイルを読み込めませんでした',
      configFailHint: 'resources/running_datas.json が存在しアクセス可能か確認してください。'
    }
  };

  // ── 布局调整：添加学生入口从底部导航移入「更多」页顶部 ──
  const ADD_LABELS = {
    'zh-CN': { add: '添加学生', imp: '导入学生数据', exp: '导出学生数据' },
    'zh-TW': { add: '新增學生', imp: '匯入學生資料', exp: '匯出學生資料' },
    en: { add: 'Add Student', imp: 'Import Student Data', exp: 'Export Student Data' },
    ja: { add: '生徒を追加', imp: '生徒データをインポート', exp: '生徒データをエクスポート' },
  };
  const addLabel = (ADD_LABELS[window.__MMT_LOCALE] || ADD_LABELS['zh-CN']).add;
  const impLabel = (ADD_LABELS[window.__MMT_LOCALE] || ADD_LABELS['zh-CN']).imp;
  const expLabel = (ADD_LABELS[window.__MMT_LOCALE] || ADD_LABELS['zh-CN']).exp;

  function moveAddEntry() {
    const navAdd = document.querySelector('.nav-add');
    if (navAdd) navAdd.style.setProperty('display', 'none');
    const main = document.getElementById('more-main');
    if (main && !document.getElementById('more-add-entry')) {
      const list = document.createElement('div');
      list.className = 'more-list';
      list.innerHTML = `
        <div class="more-list-item" id="more-add-entry" onclick="openStudentPicker()">
          <span class="mmt-ico mmt-ico-box" style="color:#e56d84;background:#e56d84;"><svg viewBox="0 0 24 24" style="fill:#fff;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></span>
          <span style="color:#e56d84;font-weight:600;">${addLabel}</span>
          <span class="more-arrow">›</span>
        </div>
        <div class="more-list-item" id="more-import-entry" onclick="document.getElementById('file-import').click()">
          <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></span>
          <span>${impLabel}</span><span class="more-arrow">›</span>
        </div>
        <div class="more-list-item" id="more-export-entry" onclick="typeof exportData === 'function' && exportData()">
          <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg></span>
          <span>${expLabel}</span><span class="more-arrow">›</span>
        </div>`;
      main.insertBefore(list, main.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', moveAddEntry);
  else moveAddEntry();
  // 历史图片路径迁移（相对 → 绝对，修复旧版图片不显示）
  const migrateImgs = () => {
    try {
      if (window.__mmtChatState && window.__mmtChatState().normalizeImages(location.origin)) {
        if (typeof renderContactList === 'function') renderContactList();
      }
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', migrateImgs);
  else migrateImgs();
  let miTries = 0;
  const miTimer = setInterval(() => { migrateImgs(); if (++miTries > 12) clearInterval(miTimer); }, 700);
  let aTries = 0;
  const aTimer = setInterval(() => {
    moveAddEntry();
    if (document.getElementById('more-add-entry') || ++aTries > 10) clearInterval(aTimer);
  }, 500);

  // ── 「其它选项」分组：语言切换 / 窗口置顶 / 备份 / 清空本地数据 ──
  const OPT_LABELS = {
    'zh-CN': { group: '其它选项', lang: '语言', aot: '窗口置顶', backup: '备份全部数据（选择位置）', clear: '清空本地数据', guide: '新电脑部署指南', demo: 'Demo 模式（演示对话）' },
    'zh-TW': { group: '其它選項', lang: '語言', aot: '視窗置頂', backup: '備份全部資料（選擇位置）', clear: '清空本機資料', guide: '新電腦部署指南', demo: 'Demo 模式（演示對話）' },
    en: { group: 'Other Options', lang: 'Language', aot: 'Always on Top', backup: 'Back Up All Data (Choose Location)', clear: 'Clear Local Data', guide: 'Deployment Guide', demo: 'Demo Mode (Sample Chat)' },
    ja: { group: 'その他の設定', lang: '言語', aot: '常に手前に表示', backup: '全データをバックアップ（保存先を選択）', clear: 'ローカルデータを消去', guide: '新PCセットアップガイド', demo: 'デモモード（会話再生）' },
  };
  const OL = OPT_LABELS[window.__MMT_LOCALE] || OPT_LABELS['zh-CN'];
  function buildMoreOptions() {
    const main = document.getElementById('more-main');
    if (!main || document.getElementById('mmt-more-options')) return;
    const list = document.createElement('div');
    list.className = 'more-list';
    list.id = 'mmt-more-options';
    list.innerHTML = `
      <div class="more-list-item" id="opt-lang-item">
        <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg></span>
        <span>${OL.lang}</span>
        <div class="segmented" id="opt-lang-switch">
          <button type="button" class="seg-btn" data-loc="zh-CN">简</button>
          <button type="button" class="seg-btn" data-loc="zh-TW">繁</button>
          <button type="button" class="seg-btn" data-loc="en">EN</button>
          <button type="button" class="seg-btn" data-loc="ja">日</button>
        </div>
      </div>
      <div class="more-list-item" id="opt-aot-item">
        <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H18v-2c-1.66 0-3-1.34-3-3z"/></svg></span>
        <span>${OL.aot}</span>
        <input type="checkbox" id="opt-aot-toggle">
      </div>
      <div class="more-list-item" id="opt-demo-item" style="cursor:pointer;">
        <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        <span id="opt-demo-label">Demo 模式（演示对话）</span>
        <span class="more-arrow">›</span>
      </div>
      <div class="more-list-item" id="opt-guide-item" style="cursor:pointer;">
        <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M19 2H6c-1.2 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V8h10v2z"/></svg></span>
        <span id="opt-guide-label">新电脑部署指南</span>
        <span class="more-arrow">›</span>
      </div>
      <div class="more-list-item" id="opt-backup-item" style="cursor:pointer;">
        <span class="mmt-ico mmt-ico-box"><svg viewBox="0 0 24 24"><path d="M17 1H7c-1.1 0-2 .9-2 2v18l7-3 7 3V3c0-1.1-.9-2-2-2z"/></svg></span>
        <span>${OL.backup}</span><span class="more-arrow">›</span>
      </div>
      <div class="more-list-item" id="opt-clear-item" style="cursor:pointer;">
        <span class="mmt-ico mmt-ico-box" style="background:rgba(217,83,79,.12);color:#d9534f;"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></span>
        <span style="color:#d9534f;">${OL.clear}</span><span class="more-arrow" style="color:#d9534f;">›</span>
      </div>`;
    main.appendChild(list);

    // 语言高亮 + 点击切换（主进程会重载窗口以应用新语言）
    const markLang = () => {
      const cur = window.__MMT_LOCALE || 'zh-CN';
      list.querySelectorAll('#opt-lang-switch .seg-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.loc === cur);
      });
    };
    markLang();
    list.querySelectorAll('#opt-lang-switch .seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.dataset.loc === (window.__MMT_LOCALE || 'zh-CN')) return;
        window.mmtShell.setLocale(b.dataset.loc); // 主进程重载窗口应用
      });
    });

    // 置顶开关（读取当前状态，切换经主进程；整行可点）
    const aot = list.querySelector('#opt-aot-toggle');
    window.mmtShell.isAlwaysOnTop().then((v) => { aot.checked = !!v; }).catch(() => {});
    aot.addEventListener('change', () => { window.mmtShell.setAlwaysOnTop(aot.checked); });
    const aotRow = list.querySelector('#opt-aot-item');
    if (aotRow) {
      aotRow.style.cursor = 'pointer';
      aotRow.addEventListener('click', (e) => { if (e.target === aot) return; aot.checked = !aot.checked; aot.dispatchEvent(new Event('change')); });
    }

    // 备份 / 清空
    list.querySelector('#opt-backup-item').addEventListener('click', () => window.mmtShell.backupAll());
    const demoItem = list.querySelector('#opt-demo-item');
    if (demoItem) demoItem.addEventListener('click', () => window.mmtFeatures && window.mmtFeatures.startDemo && window.mmtFeatures.startDemo());
    const dl = OL.demo; if (dl) { const el = document.getElementById('opt-demo-label'); if (el) el.textContent = dl; }
    const guideItem = list.querySelector('#opt-guide-item');
    if (guideItem) guideItem.addEventListener('click', () => window.mmtShell.openDeployGuide && window.mmtShell.openDeployGuide());
    const gl = OL.guide; if (gl) { const el = document.getElementById('opt-guide-label'); if (el) el.textContent = gl; }
    list.querySelector('#opt-clear-item').addEventListener('click', () => window.mmtShell.clearAll());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildMoreOptions);
  else buildMoreOptions();
  let oTries = 0;
  const oTimer = setInterval(() => {
    buildMoreOptions();
    if (document.getElementById('mmt-more-options') || ++oTries > 10) clearInterval(oTimer);
  }, 500);

  // ── 更多页入口图标（Apple 列表风格）──
  const ICO = {
    'tutorial-entry': '<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    'about-entry': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
    'general-entry': '<svg viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zM13 21v-2h8v-2h-8v-2h-2v6h2zM21 11v-2h-8v2h8zM15 3h-2v2H3v2h10v2h2V3zM21 21v-2h-6v2h6zM21 13v-2h-2v2h2zM13 9v2h2V9h-2zM3 13h2v-2H3v2z"/></svg>',
    'students-entry': '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
  };
  function addEntryIcons() {
    for (const [id, svg] of Object.entries(ICO)) {
      const span = document.getElementById(id);
      const item = span ? span.closest('.more-list-item') : null;
      if (item && !item.querySelector('.mmt-ico')) {
        item.insertAdjacentHTML('afterbegin', '<span class="mmt-ico mmt-ico-box">' + svg + '</span>');
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addEntryIcons);
  else addEntryIcons();
  let iTry2 = 0;
  const iTimer2 = setInterval(() => { addEntryIcons(); if (++iTry2 > 10) clearInterval(iTimer2); }, 500);

  // ── 开发者卡片移入「关于」面板顶部 ──
  function moveDevCard() {
    const av = document.getElementById('developer-avatar');
    const card = av ? av.closest('.more-dev-card') : null;
    const about = document.getElementById('more-about');
    if (!card || !about || card.parentElement === about) return;
    about.insertBefore(card, about.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', moveDevCard);
  else moveDevCard();
  let dTries = 0;
  const dTimer = setInterval(() => { moveDevCard(); if (++dTries > 10) clearInterval(dTimer); }, 500);

  // ── 清理视频功能残留：教程提示、通用设置入口与面板、指南里的 video.json 步骤 ──
  function removeVideoUi() {
    document.getElementById('tutorial-hint')?.remove();
    document.getElementById('general-video-title')?.closest('.about-card')?.remove();
    document.querySelectorAll('#mmt-tutorial-guide .g-step').forEach((el) => {
      if (el.textContent.includes('video.json')) el.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeVideoUi);
  else removeVideoUi();

  // ── 移除聊天框旁的身份切换按钮（老师/学生），发信固定以老师身份 ──
  function removeRoleSwitch() {
    document.getElementById('role-switch')?.remove();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeRoleSwitch);
  else removeRoleSwitch();
  let rsTries = 0;
  const rsTimer = setInterval(() => {
    removeRoleSwitch();
    if (!document.getElementById('role-switch') || ++rsTries > 20) clearInterval(rsTimer);
  }, 500);

  // ── 聊天页：顶栏「清空聊天记录」按钮（确认弹窗复用页面 showModal）──
  const CC_LABELS = {
    'zh-CN': { title: '清空聊天记录', confirm: '确定清空与「{name}」的全部聊天记录？此操作无法恢复。', clear: '清空', cancel: '取消' },
    'zh-TW': { title: '清空聊天紀錄', confirm: '確定清空與「{name}」的全部聊天紀錄？此操作無法恢復。', clear: '清空', cancel: '取消' },
    en: { title: 'Clear Chat History', confirm: 'Clear the entire chat with "{name}"? This cannot be undone.', clear: 'Clear', cancel: 'Cancel' },
    ja: { title: 'チャット履歴を消去', confirm: '「{name}」とのチャット履歴をすべて消去しますか？元に戻せません。', clear: '消去', cancel: 'キャンセル' },
  };
  function buildClearChat() {
    const header = document.querySelector('.chat-header');
    if (!header || document.getElementById('mmt-clear-chat')) return;
    const L = CC_LABELS[window.__MMT_LOCALE] || CC_LABELS['zh-CN'];
    const btn = document.createElement('button');
    btn.id = 'mmt-clear-chat';
    btn.title = L.title;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="display:block"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    btn.addEventListener('click', () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (!st || st.id == null) return;
      const esc = (typeof escapeHtml === 'function') ? escapeHtml(st.name) : st.name;
      window.showModal(L.title,
        `<div style="font-size:13px;color:#666;line-height:1.8;text-align:center;">${L.confirm.replace('{name}', esc)}</div>`,
        [
          { text: L.cancel, class: 'cancel', onClick: () => window.closeModal() },
          { text: L.clear, class: 'danger', onClick: () => { window.closeModal(); const s = window.__mmtChatState(); if (s) s.clearChat(); } },
        ]);
    });
    header.appendChild(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildClearChat);
  else buildClearChat();
  let cTries = 0;
  const cTimer = setInterval(() => { buildClearChat(); if (document.getElementById('mmt-clear-chat') || ++cTries > 10) clearInterval(cTimer); }, 500);

  // ── 聊天页：发送本地图片（按钮选择 / 粘贴 / 拖拽 → 存盘 → 图片消息）──
  function buildImageSend() {
    if (document.getElementById('mmt-img-btn')) return;
    const area = document.querySelector('.chat-input-area');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    if (!area || !input || !sendBtn) return;

    const sendImage = async (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const url = await window.mmtImages.save(reader.result);
          if (!url) {
            document.querySelectorAll('.mmt-img-toast').forEach((t) => t.remove());
            const t = document.createElement('div');
            t.className = 'mmt-img-toast';
            t.textContent = (window.__MMT_LOCALE === 'en') ? 'Unsupported image format' : '图片格式不支持或保存失败';
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
            return;
          }
          input.value = url;
          window.sendMessage();
        } catch {}
      };
      reader.readAsDataURL(file);
    };

    const btn = document.createElement('button');
    btn.id = 'mmt-img-btn';
    btn.title = (window.__MMT_LOCALE === 'en') ? 'Send image' : '发送图片';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="display:block"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
    btn.addEventListener('click', () => document.getElementById('mmt-img-file').click());
    area.insertBefore(btn, input); // 图片按钮放输入框左侧

    const fileInput = document.createElement('input');
    fileInput.id = 'mmt-img-file';
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', () => { sendImage(fileInput.files[0]); fileInput.value = ''; });
    area.appendChild(fileInput);

    input.addEventListener('paste', (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) { e.preventDefault(); sendImage(f); }
    });

    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) sendImage(f);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildImageSend);
  else buildImageSend();
  let iTries = 0;
  const iTimer = setInterval(() => { buildImageSend(); if (document.getElementById('mmt-img-btn') || ++iTries > 10) clearInterval(iTimer); }, 500);

  // ── 发送防连点：同一内容 400ms 内不重复入队 ──
  (function () {
    const install = () => {
      if (typeof window.sendMessage !== 'function' || window.sendMessage.__mmtGuard) return;
      const orig = window.sendMessage;
      window.sendMessage = function () {
        const i = document.getElementById('chat-input');
        const t = (i && i.value ? i.value : '').trim();
        const now = Date.now();
        if (t && now - (window.__mmtLastSend || 0) < 400 && window.__mmtLastText === t) return; // 忽略连点
        window.__mmtLastSend = now;
        window.__mmtLastText = t;
        return orig.apply(this, arguments);
      };
      const g = window.sendMessage;
      g.__mmtGuard = true;
      if (orig.__mmtAiHooked) g.__mmtAiHooked = true; // 透传钩子标志，避免被二次包装
    };
    install();
    let gTries = 0;
    const gTimer = setInterval(() => { install(); if (window.sendMessage && window.sendMessage.__mmtGuard || ++gTries > 20) clearInterval(gTimer); }, 400);
  })();

  // ── 教程：向「教程」分区注入图文使用指南（内容为桌面版实际功能）──
  function buildTutorialGuide() {
    const anchor = document.getElementById('tutorial-list');
    if (!anchor || document.getElementById('mmt-tutorial-guide')) return;
    const css = document.createElement('style');
    css.textContent = `
      #mmt-tutorial-guide{margin-bottom:14px;}
      #mmt-tutorial-guide .g-card{background:#fff;border-radius:14px;padding:14px 15px;
        box-shadow:0 2px 10px rgba(90,40,60,.06);margin-bottom:12px;}
      #mmt-tutorial-guide .g-title{font-size:13.5px;font-weight:700;color:#2b2230;
        display:flex;align-items:center;gap:6px;margin-bottom:9px;}
      #mmt-tutorial-guide .g-step{display:flex;gap:9px;margin:7px 0;font-size:12.5px;
        line-height:1.7;color:#4a4150;}
      #mmt-tutorial-guide .g-num{flex:none;width:18px;height:18px;border-radius:50%;
        background:#fdf0f3;color:#e56d84;font-size:11px;font-weight:700;
        display:flex;align-items:center;justify-content:center;margin-top:2px;}
      #mmt-tutorial-guide .g-tip{font-size:11.5px;color:#8d8394;line-height:1.7;margin-top:8px;
        padding:7px 10px;background:#fdf0f3;border-radius:8px;}
      #mmt-tutorial-guide kbd{background:#f6eff1;border:1px solid #eadbe0;border-bottom-width:2px;
        border-radius:5px;padding:0 5px;font-size:11px;font-family:inherit;color:#5a5060;}
      #mmt-tutorial-guide ~ #tutorial-empty{display:none !important;}
      #mmt-tutorial-guide + #tutorial-list{margin-top:2px;}
      .bottom-nav .nav-add{display:none !important;}
      .header-tools{display:none !important;}
      #mmt-more-options .segmented{display:flex;gap:4px;}
      #mmt-more-options .seg-btn{border:1px solid #eee0e5;background:#fff;color:#8d8394;
        border-radius:8px;padding:4px 10px;font-size:11.5px;cursor:pointer;transition:all .15s;}
      #mmt-more-options .seg-btn.active{background:#e56d84;border-color:#e56d84;color:#fff;}
      #mmt-more-options .more-list-item{display:flex;align-items:center;gap:10px;}
      #mmt-more-options .more-list-item > span:nth-child(2){margin-right:auto;}
      /* ── 按钮交互层：光标/悬停/按压/焦点 ── */
      .more-list-item, .contact-item, .picker-item, .role-switch,
      .back-btn, .more-back-btn, .nav-item, .nav-add,
      .dev-link, .more-link, .setting-row .seg-btn { cursor: pointer; }
      .contact-item, .picker-item { transition: background .15s ease, transform .1s ease; }
      .contact-item:hover, .picker-item:hover { background: rgba(240, 138, 156, .08); }
      .contact-item:active, .picker-item:active { background: rgba(240, 138, 156, .15); transform: scale(.995); }
      .picker-item.added { opacity: .55; }
      .role-switch:hover, .role-switch:active { filter: brightness(1.06); }
      .role-switch, .back-btn, .more-back-btn, .nav-item, .nav-add { transition: transform .12s ease, background .15s ease, color .2s ease; }
      .nav-item:hover, .nav-add:hover { transform: translateY(-2px); }
      .nav-item:active, .nav-add:active { transform: scale(.92); }
      .back-btn:active, .more-back-btn:active { transform: scale(.92); }
      button:focus-visible, .more-list-item:focus-visible, .contact-item:focus-visible,
      .picker-item:focus-visible, [role="button"]:focus-visible, .role-switch:focus-visible {
        outline: 2px solid rgba(240, 138, 156, .7); outline-offset: 2px; }
      /* ── 流畅动效层：切换/弹窗/悬停/滚动条 ── */
      @keyframes mmtIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes mmtPop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:none}}
      /* 页面与分区切换：淡入上滑（display 翻转时自动播放） */
      #more-page.active{animation:mmtIn .24s ease;}
      .more-panel.active{animation:mmtIn .2s ease;}
      /* 弹窗：遮罩淡入 + 内容上浮 */
      .modal-overlay.active{animation:mmtIn .18s ease;}
      .modal-overlay.active .modal-content{animation:mmtPop .2s ease;}
      /* 列表行悬停/按压反馈 */
      .more-list-item{transition:background .15s ease;}
      .more-list-item:hover{background:rgba(240,138,156,.07);}
      .more-list-item:active{background:rgba(240,138,156,.13);}
      /* 卡片悬停微升 */
      .about-card{transition:box-shadow .2s ease;}
      .about-card:hover{box-shadow:0 4px 16px rgba(90,40,60,.08);}
      /* ── 宽窗口布局优化：设置分区两栏化 + 顶栏按钮对齐内容列 ── */
      @media (min-width: 1080px) {
        #more-general.active, #more-students.active {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 14px;
          align-items: start;
          padding-bottom: 8px;
        }
        #more-general.active > .about-card:first-child,
        #more-students.active > .about-card:first-child,
        #more-general.active > .about-card.card-2col {
          grid-column: 1 / -1;
        }
        #more-general.active > .about-card,
        #more-students.active > .about-card {
          margin-bottom: 12px;
        }
      }
      #mmt-clear-chat{ right: max(14px, calc(50% - 366px)) !important; }
      /* 按钮按压反馈 */
      .mini:active,.send-btn:active{transform:scale(.97);}
      .mini,.send-btn{transition:transform .12s ease,filter .15s ease;}
      /* 返回箭头悬停 */
      .more-back-btn,#more-back-btn{border-radius:50%;transition:background .15s ease;}
      .more-back-btn:hover,#more-back-btn:hover{background:rgba(255,255,255,.22);}
      /* 控件强调色统一为品牌粉 */
      input[type=range]{accent-color:#e56d84;}
      /* 细滚动条 */
      ::-webkit-scrollbar{width:8px;height:8px;}
      ::-webkit-scrollbar-thumb{background:rgba(229,109,132,.3);border-radius:4px;}
      ::-webkit-scrollbar-thumb:hover{background:rgba(229,109,132,.5);}
      ::-webkit-scrollbar-track{background:transparent;}
      /* iOS 风格滑动开关：应用内所有 checkbox 统一 */
      input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:44px;height:26px;
        border-radius:13px;background:#e2d8de;border:1px solid #d0c3ca;position:relative;cursor:pointer;
        transition:background .2s;flex:none;margin:0;vertical-align:middle;}
      input[type="checkbox"]::before{content:'';position:absolute;left:2px;top:2px;width:20px;height:20px;
        border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s;}
      input[type="checkbox"]:checked{background:#e56d84;}
      input[type="checkbox"]:checked::before{transform:translateX(18px);}
      /* 更多页列表行：图标 + 文字 + 箭头 */
      #more-main .more-list-item, #more-about .about-card .more-list-item{display:flex;align-items:center;gap:10px;}
      .more-list-item .more-arrow{margin-left:auto;color:#c9a3ad;flex:none;}
      .mmt-ico{width:21px;height:21px;flex:none;color:#e56d84;display:flex;align-items:center;justify-content:center;}
      .mmt-ico svg{width:19px;height:19px;fill:currentColor;display:block;}
      .mmt-ico-box{width:30px;height:30px;border-radius:8px;background:rgba(240,138,156,.14);
        display:flex;align-items:center;justify-content:center;flex:none;}
      #privacy-note{display:none !important;}
      #mmt-img-btn{width:38px;height:38px;border-radius:12px;cursor:pointer;
        background:#fdf0f3;border:1px solid #f3d9e0;color:#e56d84;display:flex;align-items:center;justify-content:center;
        flex:none;transition:filter .15s,background .15s;padding:0;margin-bottom:1px;align-self:flex-end;}
      #mmt-img-btn:hover{background:#fbe3e9;}
      #mmt-img-btn:active{filter:brightness(.95);}
      #mmt-img-btn svg{width:19px;height:19px;}
      body.mmt-dragging{outline:2px dashed #f0a4b4;outline-offset:-4px;}
      .mmt-img-toast{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:10000;
        color:#fff;font-size:12px;padding:8px 14px;border-radius:10px;max-width:80%;
        box-shadow:0 6px 18px rgba(0,0,0,.25);overflow-wrap:anywhere;}
      .chat-header{position:relative;}
      #mmt-clear-chat{position:absolute;right:14px;top:50%;transform:translateY(-50%);
        width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.22);
        color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;
        transition:background .15s;-webkit-app-region:no-drag;}
      #mmt-clear-chat:hover{background:rgba(255,255,255,.4);}
      #mmt-tutorial-guide ~ #tutorial-empty{display:none !important;}
      #mmt-tutorial-guide ~ .tutorial-hint{display:none;}
    `;
    document.head.appendChild(css);

    const guide = document.createElement('div');
    guide.id = 'mmt-tutorial-guide';
    guide.innerHTML = `
      <div class="g-card">
        <div class="g-title">快速上手</div>
        <div class="g-step"><span class="g-num">1</span><span>进入 <b>更多 → ＋ 添加学生</b> 打开学生库，搜索并选择学生形态，点"添加"后按"完成"。</span></div>
        <div class="g-step"><span class="g-num">2</span><span>在"消息"列表点学生进入对话，输入后按回车或点"发送"。<b>发送图片</b>：点输入框左侧的图片按钮，或直接<b>把图片拖进窗口</b>、<b>粘贴截图</b>。</span></div>
        <div class="g-step"><span class="g-num">3</span><span><b>点击任意气泡</b>可编辑或删除这条消息；<b>长按联系人</b>（或右键）可设置未读数、清空记录、移出列表。</span></div>
        <div class="g-step"><span class="g-num">4</span><span>聊天页右上角的<b>垃圾桶按钮</b>可一键清空当前对话（需确认）；切换语言（简/繁/EN/日）时学生名字会自动变成对应官方译名。</span></div>
      </div>
      <div class="g-card">
        <div class="g-title">AI 自动回复</div>
        <div class="g-step"><span class="g-num">1</span><span>进入 <b>更多 → 通用设置 → 连接</b>。本机已内置 Ollama（模型 qwen2.5:7b），<b>开箱即用、无需联网</b>；也可以换成 DeepSeek / OpenAI 等云端服务，或直接用下拉框选择本地已安装的模型。</span></div>
        <div class="g-step"><span class="g-num">2</span><span>勾选 <b>启用 AI 自动回复</b>。之后你每发一条消息，学生会自动回信；点一下聊天中<b>角色的头像</b>，可让她重新生成一条回复。</span></div>
        <div class="g-step"><span class="g-num">3</span><span><b>原作人设</b>：30 余位核心学生内置了贴合原作的性格与口癖（星野的大叔腔、白子的沉默、未花的"诶嘿嘿☆"……），自动匹配无需配置；"当前学生人设"卡还可为 TA 单独定制。</span></div>
        <div class="g-step"><span class="g-num">4</span><span><b>图片识别</b>：发送图片后 AI 会先"看图"再回复（首次需加载视觉模型，约 30–60 秒）。发过的图片也会出现在学生的回复选项里（提示词可用 [图:编号] 引导）。</span></div>
        <div class="g-step"><span class="g-num">5</span><span><b>长期记忆</b>：AI 会自动总结更早的对话并长期记住（重启后依然记得）；可在"当前学生人设"卡查看记忆状态或一键清除。</span></div>
        <div class="g-tip">API Key 保存在本机并经系统钥匙串加密，不会明文落盘。</div>
      </div>
      <div class="g-card">
        <div class="g-title">语音朗读</div>
        <div class="g-step"><span class="g-num">1</span><span>每条消息旁有朗读小按钮，点一下朗读；在 <b>更多 → 语音设置</b> 里可开启"自动朗读新消息"。语速支持 0.5–2 倍调节，"试听"可快速预览。</span></div>
        <div class="g-step"><span class="g-num">2</span><span>四种引擎：<b>系统 TTS</b>（默认，每位学生自动分配不同音色与音高）、<b>VoiceStudio</b>（内置语音服务开机自启，自动为每位学生创建角色，真实克隆音色）、<b>GPT-SoVITS</b>（填服务地址 + 按学生配参考音频）、<b>RVC 变声</b>（内置音色模型自动导入，底座自适应）。</span></div>
        <div class="g-step"><span class="g-num">3</span><span><b>学生音色</b>：可在 语音设置 → 学生音色 里为每位学生手动指定音色；RVC 引擎下还能为每位学生分配不同的 RVC 模型。</span></div>
        <div class="g-step"><span class="g-num">4</span><span><b>开箱即用</b>：语音服务开机自动运行；刚启动时语音需要约 30–60 秒加载模型，之后就是稳定克隆音。</span></div>
      </div>
      <div class="g-card">
        <div class="g-title">导出与备份</div>
        <div class="g-step"><span class="g-num">1</span><span><b>聊天长图</b>：打开一个聊天，菜单栏 文件 → 导出聊天长图（<kbd>⌘⇧E</kbd>），整段对话自动拼成一张 PNG。</span></div>
        <div class="g-step"><span class="g-num">2</span><span><b>一键备份</b>：菜单 文件 → 备份数据（<kbd>⌘⇧B</kbd>），或 更多 → 其它选项 → 备份全部数据（选择位置）——可自选保存位置。</span></div>
        <div class="g-step"><span class="g-num">3</span><span><b>恢复</b>：更多 → 导入学生数据 选择备份文件，或直接把 .json <b>拖进窗口</b>。</span></div>
        <div class="g-tip">所有数据只存在本机；换电脑把备份文件带过去导入即可。</div>
      </div>
      <div class="g-card">
        <div class="g-title">更多</div>
        <div class="g-step"><span class="g-num">•</span><span><b>其它选项</b>：语言切换（简/繁/EN/日，学生名字同步官方译名）、窗口置顶、备份、清空本地数据，都在 更多 → 其它选项。</span></div>
        <div class="g-step"><span class="g-num">•</span><span>菜单栏提供全部功能与快捷键：<kbd>⌘T</kbd> 置顶、<kbd>⌘⇧E</kbd> 聊天长图、<kbd>⌘⇧B</kbd> 备份。</span></div>
      </div>`;
    const hint = document.getElementById('tutorial-hint');
    (hint && hint.parentElement ? hint.parentElement : anchor.parentElement).insertBefore(guide, anchor);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildTutorialGuide);
  else buildTutorialGuide();
  let gTries = 0;
  const gTimer = setInterval(() => {
    buildTutorialGuide();
    if (document.getElementById('mmt-tutorial-guide') || ++gTries > 10) clearInterval(gTimer);
  }, 500);

  // ── 页面状态桥：供语音/AI 扩展读写会话（顶层 let 绑定仅同页脚本可见）──
  window.__mmtChatState = function () {
    try {
      const sid = currentStudentId;
      const stu = sid != null ? libraryById[sid] : null;
      const mapMsg = (m) => ({
        role: m.role,
        text: (typeof isImageUrl === 'function' && isImageUrl(String(m.text || ''))) ? '[图片]' : String(m.text || ''),
      });
      return {
        id: sid,
        name: stu ? stu.displayName : '',
        nameCn: stu ? cnNameOf(stu) : '',
        role: currentRole,
        count: (chats[sid] || []).length,
        older: (from, to) => (chats[sid] || []).slice(from, to).map(mapMsg),
        history: (chats[sid] || []).slice(-40).map((m) => Object.assign(mapMsg(m), {
          rawUrl: (typeof isImageUrl === 'function' && isImageUrl(String(m.text || ''))) ? String(m.text || '') : '',
        })),
        pushStudent(text) {
          chats[sid] = chats[sid] || [];
          chats[sid].push({ role: 'student', text: text, time: now() });
          saveChats();
          renderChat();
        },
        normalizeImages(origin) {
          let changed = false;
          for (const k of Object.keys(chats)) {
            for (const m of chats[k]) {
              if (typeof m.text === 'string' && /^(u\/|\/u\/).+\.(png|jpe?g|gif|webp)$/i.test(m.text)) {
                m.text = origin + '/' + m.text.replace(/^\//, '');
                changed = true;
              }
            }
          }
          if (changed) {
            saveChats();
            renderContactList();
            if (currentStudentId) renderChat();
          }
          return changed;
        },
        clearChat() {
          delete chats[sid];
          const entry = myStudents.find((s) => s.id === sid);
          if (entry) entry.unread = 0; // 记录清空了，未读角标一并清零
          saveMyStudents();
          saveChats();
          renderContactList();
          renderChat();
        },
      };
    } catch (e) { return null; }
  };

  // 学生名单（供语音设置的学生音色分配使用）
  // ── 多语言学生名：按当前语言重写全库 displayName，并提供稳定中文名（nameCn）供人设/语音匹配 ──
  function cnNameOf(stu) {
    try {
      const f = (stu.familyName && (stu.familyName.cn || stu.familyName.nm)) || '';
      const g = (stu.givenName && (stu.givenName.cn || stu.givenName.nm)) || '';
      return (f + g).trim();
    } catch { return ''; }
  }
  function applyLocaleNames() {
    const loc = window.__MMT_LOCALE || 'zh-CN';
    if (loc === 'zh-CN') return 0;
    const F = { 'zh-TW': ['tw', 'cn', 'nm'], 'ja': ['jp', 'nm'], 'en': ['en', 'nm'] }[loc] || ['cn', 'nm'];
    const nmOf = (o) => { for (const f of F) { const v = String((o && o[f]) || '').trim(); if (v) return v; } return ''; };
    let n = 0;
    for (const id in libraryById) {
      const s = libraryById[id];
      const fam = nmOf(s.familyName || {}), giv = nmOf(s.givenName || {});
      if (!fam && !giv) continue;
      const full = (typeof buildDisplayName === 'function' && buildDisplayName(fam, giv)) || (fam + giv) || '';
      if (!full) continue;
      const mm = String(s.displayName || '').match(/^([^（]*)(（[^）]*）)?(（#\d+）)?$/);
      const suffix = mm ? ((mm[2] || '') + (mm[3] || '')) : '';
      const nn = full + suffix;
      if (nn !== s.displayName) { s.displayName = nn; s.shortName = giv || full; n++; }
    }
    return n;
  }
  const nameTimer = setInterval(() => {
    const ready = (typeof libraryReady !== 'undefined') ? libraryReady : false;
    if (ready && typeof renderContactList === 'function') {
      try { if (applyLocaleNames() > 0 || (window.__MMT_LOCALE || 'zh-CN') !== 'zh-CN') renderContactList(); } catch {}
      clearInterval(nameTimer);
    }
  }, 400);

  window.__mmtStudentList = function () {
    try {
      return myStudents.map((s) => ({
        id: s.id,
        name: (libraryById[s.id] || {}).displayName || ('#' + s.id),
        nameCn: cnNameOf(libraryById[s.id] || {}),
      }));
    } catch { return []; }
  };

  const locale = window.__MMT_LOCALE || 'zh-CN';
  try { localStorage.setItem('mmt_locale', locale); } catch {}

  // ── ForJiang 品牌署名：接管开发者信息展示，移除原开发者相关内容 ──
  const CONTACT_LABELS = {
    'zh-CN': { bili: 'B站', biliValue: 'b23.tv/edD6tm9', site: '个人网站' },
    'zh-TW': { bili: 'B站', biliValue: 'b23.tv/edD6tm9', site: '個人網站' },
    en: { bili: 'Bilibili', biliValue: 'b23.tv/edD6tm9', site: 'Website' },
    ja: { bili: 'ビリビリ', biliValue: 'b23.tv/edD6tm9', site: 'ウェブサイト' },
  };
  const FJ = window.__MMT_FJ || {};
  function applyBrand() {
    if (!FJ.name) return;
    const nameEl = document.getElementById('developer-name');
    if (nameEl) nameEl.textContent = FJ.name;
    const av = document.getElementById('developer-avatar');
    if (av && FJ.avatar) { av.src = FJ.avatar; av.style.display = ''; }
    // 开发者主页链接移除:与"联系我们 → 个人网站"重复
    const link = document.getElementById('developer-link');
    if (link) link.style.setProperty('display', 'none');
    const ver = document.getElementById('about-version');
    if (ver && FJ.version) ver.textContent = FJ.version;
    // 致谢与赞赏入口保持移除
    const credits = document.getElementById('credits-card');
    if (credits) credits.style.setProperty('display', 'none');
    const donate = document.getElementById('donate-entry');
    if (donate && donate.closest('.more-list-item')) donate.closest('.more-list-item').style.setProperty('display', 'none');

    // 联系方式：填充 ForJiang 的（B站 / 个人网站 / 邮箱）
    const C = FJ.contact;
    const ct = document.getElementById('contact-title');
    if (ct) ct.style.setProperty('display', C ? '' : 'none');
    const CL = CONTACT_LABELS[locale] || CONTACT_LABELS['zh-CN'];
    const qqRow = document.getElementById('contact-qq');
    if (qqRow) {
      const row = qqRow.closest('.about-row');
      if (row) {
        if (C && C.bilibili) {
          row.style.setProperty('display', '');
          row.style.cursor = 'pointer';
          row.onclick = () => window.open(C.bilibili, '_blank', 'noopener,noreferrer');
          const lbl = document.getElementById('qq-label');
          if (lbl) lbl.textContent = CL.bili;
          qqRow.textContent = CL.biliValue;
        } else if (row) row.style.setProperty('display', 'none');
      }
    }
    const wx = document.getElementById('contact-wechat');
    if (wx) {
      if (C && C.site) {
        wx.href = C.site;
        wx.style.setProperty('display', '');
        const lbl = document.getElementById('wechat-label');
        if (lbl) lbl.textContent = CL.site;
        const val = wx.querySelector('.about-value');
        if (val) val.textContent = C.site.replace(/^https?:\/\//, '');
      } else wx.style.setProperty('display', 'none');
    }
    const em = document.getElementById('contact-email');
    if (em) {
      if (C && C.email) {
        em.href = 'mailto:' + C.email;
        em.style.setProperty('display', '');
        const val = document.getElementById('contact-email-value');
        if (val) val.textContent = C.email;
      } else em.style.setProperty('display', 'none');
    }
  }
  function wrapFill(name) {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      const r = orig.apply(this, arguments);
      try { applyBrand(); } catch {}
      return r;
    };
  }
  function initBrand() {
    ['fillDeveloperInfo', 'fillAboutInfo', 'fillStaticTexts'].forEach(wrapFill);
    try { applyBrand(); } catch {}
    let n = 0;
    const t = setInterval(() => {
      try { applyBrand(); } catch {}
      if (++n >= 20) clearInterval(t);
    }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBrand);
  else initBrand();

  if (!LOCALES[locale]) {
    window.__mmtI18nReady = true;
    return;
  }

  const DICT = LOCALES[locale];
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.T !== 'function') return;
    const origT = window.T;
    window.T = (key, vars, fallback) => {
      const mine = DICT[key];
      if (mine == null) return origT(key, vars, fallback);
      if (vars) {
        return String(mine).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
      }
      return mine;
    };
    try {
      if (typeof fillStaticTexts === 'function') fillStaticTexts();
      if (typeof renderContactList === 'function') renderContactList();
      if (typeof fillAboutInfo === 'function') fillAboutInfo();
    } catch {}
    document.title = 'MomoTalk - ' + window.T('docTitleSuffix', null, '');
    window.__mmtI18nReady = true;
  });
})();
