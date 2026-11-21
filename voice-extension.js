/*!
 * ForJiang · MomoTalk 桌面版
 * 语音扩展：气泡朗读、自动朗读、设置分区（更多页）、VoiceStudio 接入
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */
(() => {
  if (window.__mmtVoiceLoaded) return;
  window.__mmtVoiceLoaded = true;

  const LS_KEY = 'mmt_voice_settings_v1';
  const DEFAULTS = {
    auto: false, engine: 'system', vsUrl: 'http://127.0.0.1:8000', vsChar: '', sysVoice: '', rate: 1,
    gsUrl: 'http://127.0.0.1:9880', gsRef: '', gsPrompt: '',
    rvcUrl: 'http://127.0.0.1:7865', rvcModel: '', rvcKey: 0, rvcIndex: 0.75, rvcOn: false,
  };
  let S = { ...DEFAULTS };
  try { S = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_KEY) || '{}')) }; } catch {}
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch {} };

  // 语音设置多语言（跟随桌面壳语言，window.__MMT_LOCALE 由服务器注入）
  const VLOCALES = {
    'zh-TW': {
      entry: '語音設置', mapTitle: '學生音色', mapAuto: '自動分配', mapHint: '每位學生自動分配不同音色與音高；也可在此為 TA 手動指定。',
      gptEngine: 'GPT-SoVITS', rvcEngine: 'RVC 變聲', gsCard: 'GPT-SoVITS 參考音頻', rvcCard: 'RVC 變聲後處理',
      gsUrl: '服務位址', gsRef: '參考音頻', gsPrompt: '提示文本', rvcModel: '模型名', rvcKey: '變調（半音）', rvcIndex: '特徵比例', rvcOn: '啟用 RVC 變聲後處理',
      gptHint: '需啟動 GPT-SoVITS 的 api_v2 服務（預設埠 9880）；按學生配置參考音頻實現不同音色。', rvcHint: '支援 rvc-sound-clone 橋（server/bridge.py，預設埠 7865）或官方 RVC WebUI api.py。未配置 GPT-SoVITS 時自動用系統 TTS 作底座。', gptFail: 'GPT-SoVITS 失敗：', rvcFail: 'RVC 轉換失敗，播放原聲', gsNoRef: '未配置參考音頻路徑', readTip: '朗讀這條訊息', heading: '語音朗讀',
      auto: '自動朗讀新訊息（僅學生）', engine: '引擎', vsEngine: 'VoiceStudio（角色音色）',
      server: '服務位址', character: '角色', autoMatch: '自動按發送者匹配', sysVoice: '系統音色',
      defaultCn: '預設中文音色', rate: '語速', test: '試聽', check: '檢測服務', stop: '停止', vsOk: 'VoiceStudio 已連線 · {n} 個角色', vsFail: '未偵測到 VoiceStudio，已自動回退系統 TTS',
      bridgeOk: 'RVC 橋已連線 · {n} 個音色', bridgeFail: '未偵測到 RVC 橋（rvc-sound-clone server/bridge.py）', gsOk: 'GPT-SoVITS 服務可達', gsFail: '未偵測到 GPT-SoVITS 服務', baseFail: '系統底座合成失敗', rvcCustom: '手動輸入模型名…', vsWaiting: '語音服務啟動中，首次需載入模型（約 30–60 秒）…', vsFail2: 'VoiceStudio 合成失敗：', mapAutoRvc: '自動分配模型', gsGptW: 'GPT 權重', gsSovitsW: 'SoVITS 權重',
      hint: 'VoiceStudio 未啟動時自動回退系統 TTS。可在專案目錄啟動 VoiceStudio 獲得角色音色。',
    },
    en: {
      entry: 'Voice', mapTitle: 'Student Voices', mapAuto: 'Auto-assign', mapHint: 'Each student gets a distinct voice and pitch automatically; assign manually here if you prefer.',
      gptEngine: 'GPT-SoVITS', rvcEngine: 'RVC Voice Conversion', gsCard: 'GPT-SoVITS Reference Audio', rvcCard: 'RVC Post-processing',
      gsUrl: 'Server URL', gsRef: 'Ref audio', gsPrompt: 'Prompt text', rvcModel: 'Model name', rvcKey: 'Pitch (semitones)', rvcIndex: 'Feature ratio', rvcOn: 'Enable RVC post-processing',
      gptHint: 'Requires the GPT-SoVITS api_v2 service (default port 9880); configure per-student reference audio for different voices.', rvcHint: "Works with the rvc-sound-clone bridge (server/bridge.py, default port 7865) or the official RVC WebUI api.py. Falls back to system TTS base when GPT-SoVITS isn't configured.", gptFail: 'GPT-SoVITS failed: ', rvcFail: 'RVC conversion failed, playing original', gsNoRef: 'Reference audio path not set', readTip: 'Read this message aloud', heading: 'Voice',
      auto: 'Auto-read new messages (students only)', engine: 'Engine', vsEngine: 'VoiceStudio (character voices)',
      server: 'Server URL', character: 'Character', autoMatch: 'Auto-match by sender', sysVoice: 'System voice',
      defaultCn: 'Default Chinese voice', rate: 'Rate', test: 'Test', check: 'Check server', stop: 'Stop', vsOk: 'VoiceStudio connected · {n} characters', vsFail: 'VoiceStudio not found — falling back to system TTS',
      bridgeOk: 'RVC bridge connected · {n} voices', bridgeFail: 'RVC bridge not found (rvc-sound-clone server/bridge.py)', gsOk: 'GPT-SoVITS reachable', gsFail: 'GPT-SoVITS not found', baseFail: 'System base synthesis failed', rvcCustom: 'Enter model name manually…', vsWaiting: 'Voice service starting — first run loads models (30–60 s)…', vsFail2: 'VoiceStudio synthesis failed: ', mapAutoRvc: 'Auto-assign models', gsGptW: 'GPT weights', gsSovitsW: 'SoVITS weights',
      hint: "Falls back to system TTS when VoiceStudio isn't running. Start VoiceStudio from its project folder for character voices.",
    },
    ja: {
      entry: '音声', mapTitle: '生徒の音色', mapAuto: '自動割り当て', mapHint: '生徒ごとに異なる音色とピッチを自動割り当て。ここで手動指定もできます。',
      gptEngine: 'GPT-SoVITS', rvcEngine: 'RVC ボイスチェンジャー', gsCard: 'GPT-SoVITS 参照音声', rvcCard: 'RVC 後処理',
      gsUrl: 'サーバーアドレス', gsRef: '参照音声', gsPrompt: 'プロンプトテキスト', rvcModel: 'モデル名', rvcKey: 'ピッチ（半音）', rvcIndex: '特徴比率', rvcOn: 'RVC 後処理を有効化',
      gptHint: 'GPT-SoVITS の api_v2 サービス（既定ポート 9880）が必要です。生徒ごとに参照音声を設定して音色を変えます。', rvcHint: 'rvc-sound-clone ブリッジ（server/bridge.py、既定ポート 7865）または公式 RVC WebUI api.py に対応。GPT-SoVITS 未設定時はシステム TTS を基底に使用します。', gptFail: 'GPT-SoVITS 失敗：', rvcFail: 'RVC 変換失敗、原音声で再生', gsNoRef: '参照音声パス未設定', readTip: 'このメッセージを読み上げる', heading: '音声読み上げ',
      auto: '新着メッセージを自動読み上げ（生徒のみ）', engine: 'エンジン', vsEngine: 'VoiceStudio（キャラ音声）',
      server: 'サーバーアドレス', character: 'キャラクター', autoMatch: '送信者に自動マッチ', sysVoice: 'システム音声',
      defaultCn: 'デフォルトの中国語音声', rate: '速度', test: 'テスト', check: 'サーバー確認', stop: '停止', vsOk: 'VoiceStudio 接続済み · {n} キャラクター', vsFail: 'VoiceStudio 未検出 — システム TTS に自動フォールバック',
      bridgeOk: 'RVC ブリッジ接続済み · {n} 音色', bridgeFail: 'RVC ブリッジ未検出（rvc-sound-clone server/bridge.py）', gsOk: 'GPT-SoVITS 到達可能', gsFail: 'GPT-SoVITS 未検出', baseFail: 'システム基底音声の合成に失敗', rvcCustom: 'モデル名を手動入力…', vsWaiting: '音声サービス起動中…（初回はモデル読込 30–60 秒）', vsFail2: 'VoiceStudio 合成失敗：', mapAutoRvc: 'モデルを自動割当', gsGptW: 'GPT 重み', gsSovitsW: 'SoVITS 重み',
      hint: 'VoiceStudio が起動していない場合はシステムTTSに自動フォールバックします。キャラ音声にはプロジェクトフォルダから起動してください。',
    },
  };
  const VL = VLOCALES[window.__MMT_LOCALE] || {};
  const v = (key, fallback) => VL[key] || fallback;

  function nameCnOf(name) {
    try {
      const list = (typeof window.__mmtStudentList === 'function') ? window.__mmtStudentList() : [];
      const hit = list.find((s) => s.name === name);
      if (hit && hit.nameCn) return hit.nameCn;
    } catch {}
    return name;
  }
  let voiceExtRefreshVoiceMap = null;
  let rvcModelsCache = null, rvcModelsAt = 0; // RVC 服务端模型列表（30s 缓存），顶层供 rvcModelFor 使用
  async function fetchRvcModels() {
    if (rvcModelsCache && Date.now() - rvcModelsAt < 30000) return rvcModelsCache;
    const base = S.rvcUrl.replace(/\/+$/, '');
    const pick = (arr) => arr.map((m) => (typeof m === 'string' ? m : (m && (m.name || m.id))) || '').filter(Boolean);
    try {
      const r = await window.mmtVoiceBridge.request(base + '/api/health', { method: 'GET', timeoutMs: 4000 });
      if (r.status >= 200 && r.status < 300 && r.text) {
        const d = JSON.parse(r.text);
        if (d && Array.isArray(d.models) && d.models.length) { rvcModelsCache = pick(d.models); rvcModelsAt = Date.now(); return rvcModelsCache; }
      }
    } catch {}
    try {
      const r = await window.mmtVoiceBridge.request(base + '/pld_id_get', { method: 'POST', timeoutMs: 4000, headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (r.status >= 200 && r.status < 300 && r.text) {
        const d = JSON.parse(r.text);
        const arr = Array.isArray(d) ? d : (d && d.models);
        if (Array.isArray(arr) && arr.length) { rvcModelsCache = pick(arr); rvcModelsAt = Date.now(); return rvcModelsCache; }
      }
    } catch {}
    return null;
  }
  let voiceExtSyncEngineUI = null;
  let voiceExtRefreshGsMap = null;
  let vsOnline = null;
  let characters = null;
  let currentAudio = null;
  let speakingEl = null;

  // ── VoiceStudio 探测（经主进程代理，无 CORS 问题）──────────────
  async function checkVS(force) {
    if (!force && vsOnline !== null) return vsOnline;
    const url = S.vsUrl.replace(/\/+$/, '') + '/api/v1/characters';
    try {
      const r = await window.mmtVoiceBridge.request(url, { method: 'GET', timeoutMs: 1500 });
      if (r.status >= 200 && r.status < 300 && r.text) {
        const d = JSON.parse(r.text);
        characters = Array.isArray(d) ? d : (d.characters || d.data || []);
        vsOnline = characters.length >= 0;
      } else vsOnline = false;
    } catch { vsOnline = false; }
    return vsOnline;
  }

  function charId(c) { return c.id ?? c.char_id ?? c.name; }
  function charName(c) { return c.name ?? c.nickname ?? String(charId(c)); }

  function pickVoiceFor(name) {
    if (!characters || !characters.length) return S.vsChar || '';
    const norm = (s) => (s || '').replace(/\s/g, '').replace(/[（(].*?[)）]/g, '');
    const n = norm(name);
    const hit = characters.find((c) => {
      const cn = norm(charName(c));
      return cn && (cn === n || n.includes(cn) || cn.includes(n));
    });
    if (hit) return String(charId(hit));
    return S.vsChar || String(charId(characters[0]));
  }

  // ── 播放控制 ──────────────────────────────────────────────
  function stopAll() {
    try { speechSynthesis.cancel(); } catch {}
    if (currentAudio) { try { currentAudio.pause(); } catch {} currentAudio = null; }
    if (speakingEl) { speakingEl.classList.remove('mmt-speaking'); speakingEl = null; }
  }

  function clearGlow() {
    if (speakingEl) { speakingEl.classList.remove('mmt-speaking'); speakingEl = null; }
  }

  // 学生音色映射（按名字），手动指定优先，否则按名字稳定散列自动分配
  const VMAP_KEY = 'mmt_voice_map_v1';
  const GSMAP_KEY = 'mmt_gptsovits_map_v1';
  function loadGsMap() {
    try { return JSON.parse(localStorage.getItem(GSMAP_KEY) || '{}'); } catch { return {}; }
  }
  function saveGsMap(map) {
    try { localStorage.setItem(GSMAP_KEY, JSON.stringify(map)); } catch {}
  }
  function loadVoiceMap() {
    try { return JSON.parse(localStorage.getItem(VMAP_KEY) || '{}'); } catch { return {}; }
  }
  function saveVoiceMap(map) {
    try { localStorage.setItem(VMAP_KEY, JSON.stringify(map)); } catch {}
  }
  function nameHash(name) {
    let h = 0;
    for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return h;
  }
  function resolveVoice(name) {
    const zh = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('zh'));
    if (!zh.length) return null;
    const explicit = loadVoiceMap()[nameCnOf(name)];
    if (explicit) {
      const hit = zh.find((v) => v.voiceURI === explicit);
      if (hit) return { voice: hit, pitch: 1 };
    }
    const h = nameHash(name);
    return { voice: zh[h % zh.length], pitch: 0.9 + ((h >> 8) % 5) * 0.08 };
  }

  async function playB64(b64, mime, rate) {
    const blob = new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: mime || 'audio/wav' });
    const a = new Audio(URL.createObjectURL(blob));
    a.playbackRate = Number(rate) || 1;
    currentAudio = a;
    a.onended = clearGlow;
    a.onerror = clearGlow;
    await a.play();
  }

  // 角色自动创建：say 合成参考音频 → 上传 voice-studio（开箱即用，无需手动建角色）
  async function ensureCharacter(name) {
    if (!S.vsUrl || !name) return false;
    try {
      const text = `你好，我是${name}。很高兴见到你，老师，以后请多多关照。`;
      const sys = await window.mmtTTSBase.synth(text, 1);
      if (!sys || !sys.b64) return false;
      const bin = Uint8Array.from(atob(sys.b64), (c) => c.charCodeAt(0));
      const boundary = '----mmtc' + Date.now();
      const enc = new TextEncoder();
      const pre = enc.encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\n${name}\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="prompt_text"\r\n\r\n${text}\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nMomoTalk 学生\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="ref_audio"; filename="ref.wav"\r\nContent-Type: audio/wav\r\n\r\n`
      );
      const post = enc.encode(`\r\n--${boundary}--\r\n`);
      const body = new Uint8Array(pre.length + bin.length + post.length);
      body.set(pre, 0); body.set(bin, pre.length); body.set(post, pre.length + bin.length);
      const r = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/api/v1/characters', {
        method: 'POST', timeoutMs: 30000,
        headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary },
        body,
      });
      if (r.status < 200 || r.status >= 300) toast('建角色失败: ' + r.status + ' ' + String(r.text || '').slice(0, 90), false);
      return r.status >= 200 && r.status < 300;
    } catch { return false; }
  }

  // RVC 音色模型自动导入：随包内置 trump.pth（应用内部静态路由 /voice/trump.pth）
  async function autoImportRvcModel() {
    try {
      if (localStorage.getItem('mmt_rvc_imported')) return true;
      const r = await fetch('/voice/trump.pth');
      if (!r.ok) return false;
      const buf = new Uint8Array(await r.arrayBuffer());
      const boundary = '----mmti' + Date.now();
      const enc = new TextEncoder();
      const pre = enc.encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\ntrump\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="model"; filename="trump.pth"\r\nContent-Type: application/octet-stream\r\n\r\n`
      );
      const post = enc.encode(`\r\n--${boundary}--\r\n`);
      const body = new Uint8Array(pre.length + buf.length + post.length);
      body.set(pre, 0); body.set(buf, pre.length); body.set(post, pre.length + buf.length);
      const rr = await window.mmtVoiceBridge.request((S.vsUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '') + '/api/v1/rvc/import', {
        method: 'POST', timeoutMs: 60000,
        headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary },
        body,
      });
      if (rr.status >= 200 && rr.status < 300) { try { localStorage.setItem('mmt_rvc_imported', '1'); } catch {} return true; }
      return false;
    } catch { return false; }
  }

  // GPT-SoVITS api_v2 /tts：按学生参考音频零样本合成
  async function gptsovitsTTS(text, name) {
    const gsMap = loadGsMap();
    const cfg = gsMap[nameCnOf(name)] || gsMap[String(name || '')] || {};
    const ref = cfg.ref || S.gsRef;
    if (!ref) throw new Error(v('gsNoRef', '未配置参考音频路径'));
    const r = await window.mmtVoiceBridge.request(S.gsUrl.replace(/\/+$/, '') + '/tts', {
      method: 'POST',
      timeoutMs: 60000,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: String(text || '').slice(0, 1000),
        text_lang: 'zh',
        ref_audio_path: ref,
        prompt_text: cfg.prompt || S.gsPrompt || '',
        prompt_lang: 'zh',
        speed_factor: Number(S.rate) || 1,
        media_type: 'wav',
        streaming_mode: false,
      }),
    });
    if (r.status < 200 || r.status >= 300 || !r.b64) {
      throw new Error('HTTP ' + r.status + ' ' + String(r.error || r.text || '').slice(0, 120));
    }
    return { b64: r.b64, mime: r.mime || 'audio/wav' };
  }

  // RVC：优先 rvc-sound-clone 桥接协议（/api/convert，含 protect/rms/filter 全参数），
  // 无该端点（404）时回落官方 RVC WebUI tools/api.py 的 gradio /run/predict
  function rvcModelFor(name) {
    if (!rvcModelsCache || Date.now() - rvcModelsAt > 30000) fetchRvcModels().catch(() => {}); // 过期后台刷新，本次用旧值
    const mapped = loadVoiceMap()[String(name || '')];
    if (mapped && String(mapped).startsWith('rvc:')) return String(mapped).slice(4);
    const list = rvcModelsCache || [];
    if (list.length) return list[nameHash(name) % list.length]; // 自动分配：按名字稳定散列
    return S.rvcModel || '';
  }

  async function rvcConvert(wavB64, modelName) {
    // 协议 1: voice-studio multipart (/api/v1/rvc/convert)；协议 2: rvc-sound-clone 桥 JSON；协议 3: 官方 gradio
    try {
      if (S.vsUrl) {
        const bin = Uint8Array.from(atob(wavB64), (c) => c.charCodeAt(0));
        const attempt = async (indexRate) => {
          const boundary = '----mmt' + Date.now() + Math.floor(Math.random() * 1e6);
          const enc = new TextEncoder();
          const pre = enc.encode(
            `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${modelName || S.rvcModel || ''}\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="pitch_shift"\r\n\r\n${Number(S.rvcKey) || 0}\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="index_rate"\r\n\r\n${indexRate}\r\n` +
            `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="in.wav"\r\nContent-Type: audio/wav\r\n\r\n`
          );
          const post = enc.encode(`\r\n--${boundary}--\r\n`);
          const body = new Uint8Array(pre.length + bin.length + post.length);
          body.set(pre, 0); body.set(bin, pre.length); body.set(post, pre.length + bin.length);
          return await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/api/v1/rvc/convert', {
            method: 'POST',
            timeoutMs: 120000,
            headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary },
            body,
          });
        };
        let rv = await attempt(Number(S.rvcIndex) || 0.75);
        if (!(rv.status >= 200 && rv.status < 300 && rv.b64) && !(rv.text && rv.text.includes('faiss'))) {
          // 模型缺失/未指定 → 自动导入随包模型后重试
          if (await autoImportRvcModel()) {
            if (!S.rvcModel) { S.rvcModel = 'trump'; save(); if (rvcModel) rvcModel.value = 'trump'; }
            rv = await attempt(Number(S.rvcIndex) || 0.75);
          }
        }
        if (!(rv.status >= 200 && rv.status < 300 && rv.b64) && rv.text && rv.text.includes('faiss')) {
          rv = await attempt(0); // 索引与 faiss 版本不兼容 → 降级 index_rate=0（检索索引只影响相似度微调）
        }
        if (rv.status >= 200 && rv.status < 300 && rv.b64) return rv.b64;
      }
    } catch {}
    try {
      const rb = await window.mmtVoiceBridge.request(S.rvcUrl.replace(/\/+$/, '') + '/api/convert', {
        method: 'POST',
        timeoutMs: 60000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: wavB64,
          sample_rate: 16000,
          model: (modelName || S.rvcModel) ? { name: modelName || S.rvcModel } : null,
          out_sample_rate: 0,
          params: {
            f0up_key: Number(S.rvcKey) || 0,
            index_rate: Number(S.rvcIndex) || 0.75,
            protect: 0.33,
            rms_mix_rate: 0.25,
            filter_radius: 3,
          },
        }),
      });
      if (rb.status >= 200 && rb.status < 300 && rb.text) {
        const d = JSON.parse(rb.text);
        if (d && d.audio) return String(d.audio).replace(/^data:audio\/[^;]+;base64,/, '');
      }
    } catch {}
    const r = await window.mmtVoiceBridge.request(S.rvcUrl.replace(/\/+$/, '') + '/run/predict', {
      method: 'POST',
      timeoutMs: 60000,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          'data:audio/wav;base64,' + wavB64,
          Number(S.rvcKey) || 0,
          modelName || S.rvcModel || '',
          Number(S.rvcIndex) || 0.75,
        ],
      }),
    });
    if (r.b64) return r.b64;
    if (r.text) {
      const t = r.text.trim();
      if (t.startsWith('{')) {
        const d = JSON.parse(t);
        const cand = d.audio || d.outputAudioBase64 || d.result || (Array.isArray(d.data) ? d.data[0] : null);
        if (cand) return String(cand).replace(/^data:audio\/[^;]+;base64,/, '');
      }
      throw new Error('RVC 响应无音频：' + t.slice(0, 100));
    }
    throw new Error('RVC 无响应');
  }

  function toast(msg, ok) {
    document.querySelectorAll('.mmt-voice-toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'mmt-voice-toast';
    el.style.background = ok ? 'rgba(47,158,95,.95)' : 'rgba(217,83,79,.95)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function sysSpeak(text, name) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = Number(S.rate) || 1;
      const resolved = resolveVoice(name);
      if (resolved && resolved.voice) u.voice = resolved.voice;
      u.pitch = resolved ? resolved.pitch : 1;
      u.onend = clearGlow;
      u.onerror = clearGlow;
      speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  }

  async function speak(text, name, el) {
    text = (text || '').trim();
    if (!text) return;
    stopAll();
    if (el) { el.classList.add('mmt-speaking'); speakingEl = el; }

    if (S.engine === 'vs') {
      let online = await checkVS();
      if (!online) {
        // 服务冷启动中（首次加载 GPT-SoVITS 权重约 30–60 秒）：等待就绪而不是静默回退
        toast(v('vsWaiting', '语音服务启动中，首次需加载模型（约 30–60 秒）…'), true);
        for (let i = 0; i < 60; i++) {
          await wait(1000);
          online = await checkVS(true);
          if (online) break;
        }
        document.querySelectorAll('.mmt-voice-toast').forEach((t) => t.remove());
      }
      if (online) {
        try {
          let r = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/v1/audio/speech', {
            method: 'POST',
            timeoutMs: 150000, // GPT-SoVITS 本地合成首句可达 40s+
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'tts-1', voice: pickVoiceFor(nameCnOf(name)), input: text, response_format: 'wav' }),
          });
          if (r.status === 404 && !window.__mmtCharTried?.[name]) { // 角色缺失 → 自动创建后重试
            try { window.__mmtCharTried = window.__mmtCharTried || {}; window.__mmtCharTried[name] = true; } catch {}
            if (await ensureCharacter(nameCnOf(pickVoiceFor(name)))) {
              r = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/v1/audio/speech', {
                method: 'POST',
                timeoutMs: 150000,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'tts-1', voice: pickVoiceFor(nameCnOf(name)), input: text, response_format: 'wav' }),
              });
            }
          }
          if (r.status >= 200 && r.status < 300 && r.b64) {
            const blob = new Blob([Uint8Array.from(atob(r.b64), (c) => c.charCodeAt(0))], { type: r.mime || 'audio/wav' });
            const a = new Audio(URL.createObjectURL(blob));
            a.playbackRate = Number(S.rate) || 1;
            currentAudio = a;
            a.onended = clearGlow;
            a.onerror = clearGlow;
            await a.play();
            return;
          }
          if (r.status !== 404) toast(v('vsFail2', 'VoiceStudio 合成失败：HTTP ') + r.status, false);
        } catch (e) {
          toast(v('vsFail2', 'VoiceStudio 合成失败：') + String(e && e.message || e).slice(0, 80), false);
        }
      }
    }
    if (S.engine === 'gptsovits') {
      try {
        const base = await gptsovitsTTS(text, name);
        await playB64(base.b64, base.mime, Number(S.rate) || 1);
        return;
      } catch (e) {
        toast(v('gptFail', 'GPT-SoVITS 失败：') + String(e.message || e).slice(0, 100), false);
      }
      sysSpeak(text, name);
      return;
    }
    if (S.engine === 'rvc') {
      // 底座自适应：配置了 GPT-SoVITS 参考音频就用 GS，否则系统 TTS 合成底座，再过 RVC 桥变声
      const gsMap = loadGsMap();
      const cfg = gsMap[String(name || '')] || {};
      const hasGs = !!(cfg.ref || S.gsRef);
      let b64 = null, mime = 'audio/wav';
      if (hasGs) {
        try {
          const g = await gptsovitsTTS(text, name);
          b64 = g.b64; mime = g.mime;
        } catch (e) {
          toast(v('gptFail', 'GPT-SoVITS 失败：') + String(e.message || e).slice(0, 80) + ' → 系统底座', false);
        }
      }
      if (!b64 && S.vsUrl) {
        // voice-studio 的 GPT-SoVITS 角色克隆音作底座（角色名与学生名匹配时）
        for (let i = 0; i < 45; i++) {
          const ok = await (async () => { try { const h = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/api/v1/health', { method: 'GET', timeoutMs: 1500 }); return h.status >= 200 && h.status < 300; } catch { return false; } })();
          if (ok) break;
          if (i === 0) toast(v('vsWaiting', '语音服务启动中，首次需加载模型（约 30–60 秒）…'), true);
          await wait(1000);
        }
        document.querySelectorAll('.mmt-voice-toast').forEach((t) => t.remove());
        try {
          const r = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/v1/audio/speech', {
            method: 'POST',
            timeoutMs: 150000,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'tts-1', voice: pickVoiceFor(nameCnOf(name)), input: text, response_format: 'wav' }),
          });
          if (r.status === 404 && !(window.__mmtCharTried || {})[name] && await ensureCharacter(nameCnOf(pickVoiceFor(name)))) {
            r = await window.mmtVoiceBridge.request(S.vsUrl.replace(/\/+$/, '') + '/v1/audio/speech', {
              method: 'POST', timeoutMs: 150000,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'tts-1', voice: pickVoiceFor(nameCnOf(name)), input: text, response_format: 'wav' }),
            });
          }
          if (r.status >= 200 && r.status < 300 && r.b64) { b64 = r.b64; mime = r.mime || 'audio/wav'; }
        } catch {}
      }
      if (!b64) {
        const sys = await window.mmtTTSBase.synth(String(text || '').slice(0, 500), 1);
        if (!sys || !sys.b64) { toast(v('baseFail', '系统底座合成失败'), false); sysSpeak(text, name); return; }
        b64 = sys.b64; mime = sys.mime || 'audio/wav';
      }
      if (S.rvcOn) {
        try { b64 = await rvcConvert(b64, rvcModelFor(name)); mime = 'audio/wav'; }
        catch { toast(v('rvcFail', 'RVC 转换失败，播放原声'), false); }
      }
      await playB64(b64, mime, Number(S.rate) || 1);
      return;
    }
    sysSpeak(text, name);
  }

  // ── 气泡朗读按钮 + 自动朗读 ──────────────────────────────
  const seen = new WeakSet();

  function decorate() {
    const boxes = [...document.querySelectorAll('.msg-box')];
    const unseen = boxes.filter((r) => !seen.has(r));
    const bulk = unseen.length > 1; // 整段重渲染视为历史消息，不自动读
    boxes.forEach((box) => {
      const fresh = !seen.has(box);
      seen.add(box);
      const name = box.querySelector('.box-name') ? box.querySelector('.box-name').textContent : '';
      // 朗读按钮只挂学生气泡:老师(自己)说的话不需要声音
      const isStudent = box.classList.contains('student');
      if (isStudent) {
        box.querySelectorAll('.msg-item > .msg-bubble').forEach((bubble) => {
          const item = bubble.parentElement;
          const text = bubble.textContent;
          if (text && text.trim() && !item.querySelector('.mmt-say')) {
            const btn = document.createElement('button');
            btn.className = 'mmt-say';
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" style="display:block"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>';
            btn.title = v('readTip', '朗读这条消息');
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              speak(text, name, bubble);
            });
            item.appendChild(btn);
          }
        });
      }

      // 自动朗读：仅单条新增学生 box 的最后一个文本气泡
      if (fresh && !bulk && S.auto && isStudent) {
        const bubbles = [...box.querySelectorAll('.msg-item > .msg-bubble')];
        const bubble = bubbles[bubbles.length - 1];
        const text = bubble ? bubble.textContent : '';
        if (text && text.trim()) speak(text, name, bubble);
      }
    });
  }
  // 事件驱动 + rAF 合帧：密集 DOM 变化时每帧最多跑一次
  let vtScheduled = false;
  new MutationObserver(() => {
    if (vtScheduled) return;
    vtScheduled = true;
    requestAnimationFrame(() => {
      vtScheduled = false;
      try {
        decorate();
        // 学生音色表跟随名单变化自动刷新
        if (typeof voiceExtRefreshVoiceMap === 'function') {
          const box = document.getElementById('mmtv-voicemap');
          if (box) {
            const n = ((window.__mmtStudentList && window.__mmtStudentList()) || []).length;
            if (n !== box.querySelectorAll('.vmap-row').length) voiceExtRefreshVoiceMap();
          }
        }
      } catch {}
    });
  }).observe(document.body, { childList: true, subtree: true });
  decorate();

  // ── 设置分区：注入到「更多」页（more-voice），替代悬浮窗 ──
  function buildUI() {
    const css = document.createElement('style');
    css.textContent = `
      .mmt-say{border:none;background:rgba(240,138,156,.12);color:#e56d84;border-radius:6px;
        font-size:11px;padding:1px 5px;margin-left:6px;cursor:pointer;vertical-align:middle;}
      .mmt-say:hover{background:rgba(240,138,156,.28);}
      .msg-bubble.mmt-speaking{box-shadow:0 0 0 3px rgba(240,138,156,.55)!important;}
      #more-students.active{animation:mmtFade .18s ease;}
      @keyframes mmtFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      #more-students .about-card{padding:16px 16px 14px;}
      #more-voice .about-section-title{margin-bottom:4px;}
      #more-students .vrow{display:grid;grid-template-columns:70px 1fr;gap:12px;align-items:center;
        margin:12px 0;color:#5a5060;font-size:12.5px;}
      #more-students .vrow.vfull{grid-template-columns:1fr;display:flex;align-items:center;gap:8px;}
      #more-voice .vval{justify-self:end;font-size:11px;color:#8d8394;font-variant-numeric:tabular-nums;}
      #more-students select,#more-students input[type=text],#more-students input[type=number]{width:100%;border:1px solid #eee0e5;
        border-radius:8px;padding:6px 9px;font-size:12.5px;min-width:0;box-sizing:border-box;
        background:#fff;color:#2b2230;outline:none;}
      #more-students select:focus,#more-students input[type=text]:focus,#more-students input[type=number]:focus{border-color:#f0a4b4;}
      #more-students input[type=number]{-moz-appearance:textfield;appearance:textfield;}
      #more-students input[type=number]::-webkit-inner-spin-button,
      #more-students input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
      #more-students input[type=range]{width:100%;}
      #more-students .row2{display:flex;gap:8px;align-items:center;margin-top:14px;}
      #more-students .row2 .mini{flex:1;text-align:center;padding:7px 0;}
      #more-students .mini{border:1px solid #eee0e5;background:#fdf0f3;color:#e56d84;
        border-radius:9px;padding:6px 12px;cursor:pointer;font-size:12px;white-space:nowrap;
        transition:filter .15s;}
      #more-students .mini:hover{filter:brightness(.97);}
      #more-students .dot{width:8px;height:8px;border-radius:50%;background:#ccc;flex:none;}
      #more-students .dot.on{background:#2f9e5f;}
      #more-students .dot.off{background:#d9534f;}
      #more-students .hint{color:#a99fae;font-size:11px;line-height:1.6;margin-top:12px;
        padding-top:10px;border-top:1px dashed #f0e4e8;}
      #more-students .vmap-row{display:flex;gap:8px;align-items:center;margin:7px 0;}
      #more-students .vmap-name{flex:none;width:96px;overflow:hidden;text-overflow:ellipsis;
        white-space:nowrap;font-size:12px;color:#2b2230;}
      #more-students .vmap-row select{flex:1;}
      #more-students .vmap-empty{font-size:11.5px;color:#a99fae;line-height:1.6;}
      #more-students .gs-row{display:grid;grid-template-columns:96px 1fr 1fr;gap:6px;
        align-items:center;margin:7px 0;}
      #more-students .gs-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        font-size:12px;color:#2b2230;}
      #more-students .gs-row input{width:100%;min-width:0;box-sizing:border-box;}
      .mmt-voice-toast{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:10000;
        color:#fff;font-size:12px;padding:8px 14px;border-radius:10px;max-width:80%;
        box-shadow:0 6px 18px rgba(0,0,0,.25);overflow-wrap:anywhere;}
      @media (min-width:768px){
        #more-students .vrow{grid-template-columns:118px 1fr;}
      }
    `;
    document.head.appendChild(css);

    // 语音设置注入「语音设置」面板（替代原开发中占位）
    const stPanel = document.getElementById('more-students');
    if (stPanel) {
      document.getElementById('students-placeholder')?.remove();
      stPanel.innerHTML = `
        <div class="about-card">
          <div class="about-section-title">${v('heading', '语音朗读')}</div>
          <div class="vrow vfull">
            <input type="checkbox" id="mmtv-auto"> ${v('auto', '自动朗读新消息（仅学生）')}</div>
          <div class="vrow"><span>${v('engine', '引擎')}</span><select id="mmtv-engine">
            <option value="system">${v('sysTts', '系统 TTS')}</option>
            <option value="vs">${v('vsEngine', 'VoiceStudio（角色音色）')}</option>
            <option value="gptsovits">GPT-SoVITS</option>
            <option value="rvc">RVC 变声（GPT-SoVITS 底座）</option></select></div>
          <div class="vrow" id="mmtv-vs-url-row"><span>${v('server', '服务地址')}</span>
            <span style="display:flex;align-items:center;gap:8px;">
              <span class="dot" id="mmtv-dot"></span>
              <input type="text" id="mmtv-url" placeholder="http://127.0.0.1:8000"></span></div>
          <div class="vrow" id="mmtv-vs-char-row"><span>${v('character', '角色')}</span><select id="mmtv-char">
            <option value="">${v('autoMatch', '自动按发送者匹配')}</option></select></div>
          <div class="vrow"><span>${v('sysVoice', '系统音色')}</span><select id="mmtv-sysvoice">
            <option value="">${v('defaultCn', '默认中文音色')}</option></select></div>
          <div class="vrow"><span>${v('rate', '语速')}</span>
            <span style="display:flex;align-items:center;gap:10px;">
              <input type="range" id="mmtv-rate" min="0.5" max="2" step="0.1">
              <span class="vval" id="mmtv-rate-v"></span></span></div>
          <div class="row2">
            <button class="mini" id="mmtv-test">${v('test', '试听')}</button>
            <button class="mini" id="mmtv-check">${v('check', '检测服务')}</button>
            <button class="mini" id="mmtv-stop">${v('stop', '停止')}</button>
          </div>
          <div class="hint">${v('hint', 'VoiceStudio 未启动时自动回退系统 TTS。可在项目目录启动 VoiceStudio 获得角色音色。')}</div>
        </div>
        <div class="about-card" id="mmtv-voicemap-card">
          <div class="about-section-title">${v('mapTitle', '学生音色')}</div>
          <div id="mmtv-voicemap"></div>
          <div class="hint" style="border-top:none;padding-top:2px;margin-top:8px;">${v('mapHint', '每位学生自动分配不同音色与音高；也可在此为 TA 手动指定。')}</div>
        </div>
        <div class="about-card" id="mmtv-gs-card">
          <div class="about-section-title">${v('gsCard', 'GPT-SoVITS 参考音频')}</div>
          <div class="vrow"><span>${v('gsUrl', '服务地址')}</span>
            <input type="text" id="mmtv-gs-url" placeholder="http://127.0.0.1:9880"></div>
          <div class="vrow"><span>${v('gsRef', '参考音频')}</span>
            <input type="text" id="mmtv-gs-ref" placeholder="/path/to/ref.wav（3~10 秒干净人声）"></div>
          <div class="vrow"><span>${v('gsPrompt', '提示文本')}</span>
            <input type="text" id="mmtv-gs-prompt" placeholder="参考音频里说的话"></div>
          <div id="mmtv-gs-map"></div>
          <div class="vrow"><span>${v('gsGptW', 'GPT 权重')}</span>
            <input type="text" id="mmtv-gs-gptw" placeholder="/path/to/gpt.ckpt"></div>
          <div class="vrow"><span>${v('gsSovitsW', 'SoVITS 权重')}</span>
            <input type="text" id="mmtv-gs-sovitw" placeholder="/path/to/sovits.pth"></div>
          <div class="hint">${v('gptHint', '需启动 GPT-SoVITS 的 api_v2 服务（默认端口 9880）；按学生配置参考音频实现不同音色。')}</div>
        </div>
        <div class="about-card" id="mmt-rvc-card">
          <div class="about-section-title">${v('rvcCard', 'RVC 变声后处理')}</div>
          <div class="vrow"><span>${v('gsUrl', '服务地址')}</span>
            <input type="text" id="mmtv-rvc-url" placeholder="http://127.0.0.1:7865"></div>
          <div class="vrow"><span>${v('rvcModel', '模型名')}</span>
            <div style="display:flex;gap:6px;min-width:0;">
              <input type="text" id="mmtv-rvc-model" placeholder="xxx.pth" style="flex:1;min-width:0;">
              <select id="mmtv-rvc-model-sel" class="mmta-sel mmt-hide" style="flex:1;min-width:0;"></select>
            </div></div>
          <div class="vrow"><span>${v('rvcKey', '变调（半音）')}</span>
            <input type="number" id="mmtv-rvc-key" min="-24" max="24" step="1"></div>
          <div class="vrow"><span>${v('rvcIndex', '特征比例')}</span>
            <input type="number" id="mmtv-rvc-index" min="0" max="1" step="0.05"></div>
          <div class="vrow vfull"><input type="checkbox" id="mmtv-rvc-on"> ${v('rvcOn', '启用 RVC 变声后处理')}</div>
          <div class="hint">${v('rvcHint', '支持 rvc-sound-clone 桥或官方 RVC WebUI api.py（端口 7865）。未配置 GPT-SoVITS 时自动用系统 TTS 作底座。')}</div>
        </div>`;
    }

    const $ = (id) => document.getElementById(id);
    const auto = $('mmtv-auto'), engine = $('mmtv-engine'), url = $('mmtv-url'),
      charSel = $('mmtv-char'), sysSel = $('mmtv-sysvoice'), rate = $('mmtv-rate'),
      rateV = $('mmtv-rate-v'), dot = $('mmtv-dot');

    auto.checked = S.auto; engine.value = S.engine; url.value = S.vsUrl; rate.value = S.rate;
    rateV.textContent = Number(S.rate).toFixed(1) + 'x';
    const gsUrl = $('mmtv-gs-url'), gsRef = $('mmtv-gs-ref'), gsPrompt = $('mmtv-gs-prompt'),
      rvcUrl = $('mmtv-rvc-url'), rvcModel = $('mmtv-rvc-model'), rvcKey = $('mmtv-rvc-key'),
      rvcIndex = $('mmtv-rvc-index'), rvcOn = $('mmtv-rvc-on');
    gsUrl.value = S.gsUrl; gsRef.value = S.gsRef; gsPrompt.value = S.gsPrompt;
    rvcUrl.value = S.rvcUrl; rvcModel.value = S.rvcModel; rvcKey.value = S.rvcKey;
    rvcIndex.value = S.rvcIndex; rvcOn.checked = !!S.rvcOn;
    gsUrl.onchange = () => { S.gsUrl = gsUrl.value.trim() || DEFAULTS.gsUrl; save(); };
    gsRef.onchange = () => { S.gsRef = gsRef.value.trim(); save(); };
    gsPrompt.onchange = () => { S.gsPrompt = gsPrompt.value; save(); };
    rvcUrl.onchange = () => { S.rvcUrl = rvcUrl.value.trim() || DEFAULTS.rvcUrl; save(); };
    rvcModel.onchange = () => { S.rvcModel = rvcModel.value.trim(); save(); };
    const gsGptW = $('mmtv-gs-gptw'), gsSovitsW = $('mmtv-gs-sovitw');
    if (gsGptW) { gsGptW.value = S.gsGptW || ''; gsGptW.onchange = () => { S.gsGptW = gsGptW.value.trim(); save(); }; }
    if (gsSovitsW) { gsSovitsW.value = S.gsSovitsW || ''; gsSovitsW.onchange = () => { S.gsSovitsW = gsSovitsW.value.trim(); save(); }; }

    // RVC 模型：从服务端拉列表直接选（桥 /api/health，官方 WebUI /pld_id_get），手输兜底
    const rvcSel = $('mmtv-rvc-model-sel');
    const RVC_CUSTOM = '__rvcustom__';
    function fillRvcSel(list) {
      if (!rvcSel || !rvcModel) return;
      const cur = S.rvcModel || '';
      if (!list || !list.length || (cur && !list.includes(cur))) {
        rvcSel.classList.add('mmt-hide'); rvcModel.classList.remove('mmt-hide');
        if (cur) rvcModel.value = cur;
        return;
      }
      rvcSel.innerHTML = list.map((m) => `<option value="${m}"${m === cur ? ' selected' : ''}>${m}</option>`).join('')
        + `<option value="${RVC_CUSTOM}">${v('rvcCustom', '手动输入模型名…')}</option>`;
      if (!cur) rvcSel.value = list[0];
      rvcModel.classList.add('mmt-hide'); rvcSel.classList.remove('mmt-hide');
    }
    const refreshRvcModels = () => { if (S.engine === 'rvc') fetchRvcModels().then(fillRvcSel).catch(() => {}); };
    if (rvcSel) rvcSel.onchange = () => {
      if (rvcSel.value === RVC_CUSTOM) { rvcSel.classList.add('mmt-hide'); rvcModel.classList.remove('mmt-hide'); rvcModel.focus(); return; }
      rvcModel.value = rvcSel.value; rvcModel.dispatchEvent(new Event('change'));
    };
    if (engine) engine.addEventListener('change', refreshRvcModels);
    refreshRvcModels();
    if (typeof voiceExtRefreshVoiceMap === 'function') voiceExtRefreshVoiceMap();
    rvcKey.onchange = () => { S.rvcKey = Number(rvcKey.value) || 0; save(); };
    rvcIndex.onchange = () => { S.rvcIndex = Number(rvcIndex.value); save(); };
    rvcOn.onchange = () => { S.rvcOn = rvcOn.checked; save(); };
    const syncEngineUI = () => {
      const e = S.engine;
      const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
      show($('mmtv-vs-url-row'), e === 'vs');
      show($('mmtv-vs-char-row'), e === 'vs');
      show($('mmtv-voicemap-card'), e === 'system');
      show($('mmtv-gs-card'), e === 'gptsovits' || e === 'rvc');
      show($('mmt-rvc-card'), e === 'rvc');
      if (typeof renderGsMap === 'function') renderGsMap();
    };
    voiceExtSyncEngineUI = syncEngineUI;

    const refreshChars = () => {
      charSel.innerHTML = `<option value="">${v('autoMatch', '自动按发送者匹配')}</option>`;
      (characters || []).forEach((c) => {
        const o = document.createElement('option');
        o.value = String(charId(c)); o.textContent = charName(c);
        charSel.appendChild(o);
      });
      charSel.value = S.vsChar || '';
    };
    const refreshDot = () => {
      dot.className = 'dot ' + (vsOnline === true ? 'on' : vsOnline === false ? 'off' : '');
      refreshChars();
    };

    speechSynthesis.onvoiceschanged = () => {
      sysSel.innerHTML = `<option value="">${v('defaultCn', '默认中文音色')}</option>`;
      speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('zh'))
        .forEach((voice) => {
          const o = document.createElement('option');
          o.value = voice.voiceURI; o.textContent = voice.name;
          sysSel.appendChild(o);
        });
      sysSel.value = S.sysVoice || '';
      if (typeof voiceExtRefreshVoiceMap === 'function') voiceExtRefreshVoiceMap();
    };
    speechSynthesis.getVoices();

    auto.onchange = () => { S.auto = auto.checked; save(); };
    const autoRow = auto.closest('.arow');
    if (autoRow) autoRow.addEventListener('click', (e) => { if (e.target === auto) return; auto.checked = !auto.checked; auto.dispatchEvent(new Event('change')); });
    engine.onchange = () => { S.engine = engine.value; save(); if (typeof syncEngineUI === 'function') syncEngineUI(); };
    url.onchange = () => { S.vsUrl = url.value.trim() || DEFAULTS.vsUrl; vsOnline = null; save(); refreshDot(); };
    charSel.onchange = () => { S.vsChar = charSel.value; save(); };
    sysSel.onchange = () => { S.sysVoice = sysSel.value; save(); };
    rate.oninput = () => { S.rate = Number(rate.value); rateV.textContent = S.rate.toFixed(1) + 'x'; save(); };

    const renderVoiceMap = () => {
      const box = $('mmtv-voicemap');
      if (!box) return;
      const students = (window.__mmtStudentList && window.__mmtStudentList()) || [];
      const zh = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('zh'));
      const map = loadVoiceMap();
      box.innerHTML = '';
      if (!students.length) { box.innerHTML = ''; return; }
      for (const st of students) {
        const row = document.createElement('div');
        row.className = 'vmap-row';
        const name = document.createElement('span');
        name.className = 'vmap-name';
        name.textContent = st.name;
        name.title = st.nameCn || st.name;
        const sel = document.createElement('select');
        const optAuto = document.createElement('option');
        optAuto.value = '';
        const rvcMode = S.engine === 'rvc';
        optAuto.textContent = rvcMode ? v('mapAutoRvc', '自动分配模型') : v('mapAuto', '自动分配');
        sel.appendChild(optAuto);
        if (rvcMode) {
          (rvcModelsCache || []).forEach((m) => {
            const o = document.createElement('option');
            o.value = 'rvc:' + m; o.textContent = m;
            sel.appendChild(o);
          });
          if (!rvcModelsCache || Date.now() - rvcModelsAt > 30000) fetchRvcModels().then((list) => { if (list && list.length) renderVoiceMap(); }).catch(() => {});
        } else {
          zh.forEach((vo) => {
            const o = document.createElement('option');
            o.value = vo.voiceURI; o.textContent = vo.name;
            sel.appendChild(o);
          });
        }
        const curMapped = map[st.name] || '';
        sel.value = rvcMode && curMapped && !curMapped.startsWith('rvc:') ? '' : curMapped;
        sel.onchange = () => {
          const m = loadVoiceMap();
          const key = st.nameCn || st.name;
          if (sel.value) m[key] = sel.value;
          else delete m[key];
          saveVoiceMap(m);
        };
        row.append(name, sel);
        box.appendChild(row);
      }
    };
    voiceExtRefreshVoiceMap = renderVoiceMap;
    const renderGsMap = () => {
      const box = $('mmtv-gs-map');
      if (!box) return;
      const students = (window.__mmtStudentList && window.__mmtStudentList()) || [];
      const gsMap = loadGsMap();
      box.innerHTML = '';
      if (!students.length) { box.innerHTML = '<div class="vmap-empty">添加学生后可为 TA 配置参考音频。</div>'; return; }
      for (const st of students) {
        const cfg = gsMap[st.nameCn || st.name] || { ref: '', prompt: '' };
        const row = document.createElement('div');
        row.className = 'gs-row';
        const name = document.createElement('span');
        name.className = 'gs-name';
        name.textContent = st.name;
        name.title = st.name;
        const ref = document.createElement('input');
        ref.type = 'text'; ref.placeholder = '参考音频路径';
        ref.value = cfg.ref || '';
        ref.onchange = () => { const m = loadGsMap(); const key = st.nameCn || st.name; m[key] = Object.assign(m[key] || {}, { ref: ref.value.trim() }); if (!m[key].ref && !m[key].prompt) delete m[key]; saveGsMap(m); };
        const prompt = document.createElement('input');
        prompt.type = 'text'; prompt.placeholder = '提示文本';
        prompt.value = cfg.prompt || '';
        prompt.onchange = () => { const m = loadGsMap(); m[st.name] = Object.assign(m[st.name] || {}, { prompt: prompt.value }); if (!m[st.name].ref && !m[st.name].prompt) delete m[st.name]; saveGsMap(m); };
        row.append(name, ref, prompt);
        box.appendChild(row);
      }
    };
    voiceExtRefreshGsMap = renderGsMap;
    syncEngineUI();
    // 挂载钩子（必须在 buildUI 作用域内，才能访问内部函数）
    if (window.mmtVoice) {
      window.mmtVoice.syncEngineUI = () => syncEngineUI();
      window.mmtVoice.renderGsMap = () => renderGsMap();
      window.mmtVoice.renderVoiceMap = () => renderVoiceMap();
    }

    $('mmtv-check').onclick = async () => {
      if (S.engine === 'rvc') {
        try {
          const r = await window.mmtVoiceBridge.request(S.rvcUrl.replace(/\/+$/, '') + '/api/health', { method: 'GET', timeoutMs: 4000 });
          const d = r.status >= 200 && r.status < 300 && r.text ? JSON.parse(r.text) : null;
          const n = d && Array.isArray(d.models) ? d.models.length : 0;
          if (d && d.ok) { toast(v('bridgeOk', 'RVC 桥已连接 · {n} 个音色').replace('{n}', String(n)), true); refreshDot(); return; }
        } catch {}
        toast(v('bridgeFail', '未检测到 RVC 桥（rvc-sound-clone server/bridge.py）'), false);
        refreshDot();
        return;
      }
      if (S.engine === 'gptsovits') {
        try {
          const r = await window.mmtVoiceBridge.request(S.gsUrl.replace(/\/+$/, ''), { method: 'GET', timeoutMs: 4000 });
          if (r.status > 0) { toast(v('gsOk', 'GPT-SoVITS 服务可达'), true); refreshDot(); return; }
        } catch {}
        toast(v('gsFail', '未检测到 GPT-SoVITS 服务'), false);
        refreshDot();
        return;
      }
      const ok = await checkVS(true);
      refreshDot();
      toast(ok ? v('vsOk', 'VoiceStudio 已连接 · {n} 个角色').replace('{n}', String(characters.length)) : v('vsFail', '未检测到 VoiceStudio，已自动回退系统 TTS'), ok);
    };
    $('mmtv-stop').onclick = () => stopAll();
    $('mmtv-test').onclick = () => speak('你好，老师！我是 MomoTalk 语音助手。', '测试', null);

    // 接入页面的分区导航：补标题 + 打开时刷新状态
    let tries = 0;
    const patchNav = () => {
      if (typeof window.openMoreSection !== 'function' || window.openMoreSection.__mmtVoiceNav) return;
      const orig = window.openMoreSection;
      window.openMoreSection = function (name) {
        orig.apply(this, arguments);
        if (name === 'students') {
          refreshDot();
          if (typeof voiceExtRefreshVoiceMap === 'function') voiceExtRefreshVoiceMap();
          if (typeof voiceExtRefreshGsMap === 'function') voiceExtRefreshGsMap();
          if (typeof voiceExtSyncEngineUI === 'function') voiceExtSyncEngineUI();
        }
      };
      window.openMoreSection.__mmtVoiceNav = true;
    };
    patchNav();
    const navTimer = setInterval(() => { patchNav(); if (++tries > 10) clearInterval(navTimer); }, 500);

    checkVS().then(refreshDot);
  }

  buildUI();

  window.mmtVoice = {
    speak, stopAll, checkVS, settings: S,
    voiceFor: (name) => { const r = resolveVoice(name); return r && r.voice ? r.voice.name : ''; },
    syncEngineUI: () => voiceExtSyncEngineUI && voiceExtSyncEngineUI(),
    renderGsMap: () => voiceExtRefreshGsMap && voiceExtRefreshGsMap(),
    renderVoiceMap: () => voiceExtRefreshVoiceMap && voiceExtRefreshVoiceMap(),
  };
})();
