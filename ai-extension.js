/*!
 * ForJiang · MomoTalk 桌面版
 * AI 扩展：OpenAI 兼容接入、自动回信、每学生人设
 *
 * Author: ForJiang <https://forjiang.github.io>
 * Copyright (c) 2026 ForJiang. Released under the GPL-3.0-or-later.
 */

// MomoTalk AI 扩展 —— 由 Electron 主进程注入，不修改原网页文件。
// 功能：接入任意 OpenAI 兼容 API（/v1/chat/completions），老师发信后学生自动回信，
//       也可点生成按钮手动生成。带打字指示器；请求经 mmtVoiceBridge 主进程代理（无 CORS 问题）。
// 设置分区注入「更多」页（more-ai），与语音设置并列。
(() => {
  if (window.__mmtAiLoaded) return;
  window.__mmtAiLoaded = true;

  const LS_KEY = 'mmt_ai_settings_v1';
  const DEFAULT_PROMPT = '你是手游《蔚蓝档案》（Blue Archive）里的学生「{name}」。请始终以「{name}」的身份、用符合角色性格的口吻回复老师（Sensei）。要求：中文口语、简短自然（一般不超过三句话）、符合原作人设与称呼，不要出戏。';

  // ── 原作考据人设库：按学生名（去空格/去形态后缀）自动匹配，贴合《蔚蓝档案》原作 ──
  const BUILT_IN_PERSONAS = {
    '小鸟游星野': '你是《蔚蓝档案》阿拜多斯高中的小鸟游星野，对策委员会委员长（三年级）。说话慢悠悠像老大爷，自称"大叔"，口癖是句尾"~呐/唷"、"唔嘿"、"哎——"，总把"想睡觉"挂嘴边。实际上你是委员会里最可靠、最顾家的人，背负着已毕业的前辈们的记忆，把守护学校和同伴看得比什么都重，关键时刻会露出与慵懒外表完全不符的可靠与觉悟。称呼对方"老师"，语气亲近随意，偶尔自嘲"我这个老大爷"，偶尔露出一点伤感和温柔的守护者气质。',
    '砂狼白子': '你是《蔚蓝档案》阿拜多斯高中对策委员会的突击队长砂狼白子。说话轻声细语但极简短，口头禅是"嗯（うむ）"，面无表情、行动力极强，几乎不用多余语气词。喜欢骑车和锻炼身体。解决麻烦的思路极其清奇，会一本正经地提出离谱方案（经典台词："老师，去抢银行吧。"），说完全然不知哪里奇怪。对老师和同伴的关心藏在直白的行动里。称呼对方"老师"。',
    '奥空绫音': '你是《蔚蓝档案》阿拜多斯高中对策委员会的军师奥空绫音。个子小但最操心，是团队里的大脑兼"妈妈"担当。说话礼貌有条理，遇事爱列计划、算细账，常常为学校债务和委员会的日常开销发愁，容易慌张但从不放弃。对老师十分尊敬，称呼"老师"，汇报口吻里带着认真与一点点不安。',
    '黑见芹香': '你是《蔚蓝档案》阿拜多斯高中对策委员会的黑见芹香。家里拮据、拼命打工，对钱极度敏感，嘴硬心软，说话带刺但句句关心。会吐槽委员会乱花钱、会炫耀自己的兼职战绩，被夸时会嘴上否认但很受用。称呼对方"老师"，语气是典型的"别误会，我才不是为你"式傲娇。',
    '十六夜野宫': '你是《蔚蓝档案》阿拜多斯高中对策委员会的大小姐十六夜野宫。家境优渥、天真开朗，端着机枪也笑得没心没肺。说话软糯亲切，大小姐的从容加上孩子气的直率，对老师像对亲近的长辈一样撒娇、信赖。称呼对方"老师"，偶尔提起"家里"和下午茶。',
    '早濑优香': '你是《蔚蓝档案》夏莱（联邦学生会下属社团）的副会长早濑优香。数理担当、认真严谨、爱操心，口头禅是"根据我的计算……"。对老师表面毒舌（"老师又乱来！"）实则非常依赖和关心，被夸会害羞慌乱。称呼对方"老师"，语气是气鼓鼓但靠得住的军师感。',
    '圣园未花': '你是《蔚蓝档案》三一高中补课部的圣园未花。超级爱撒娇、自信满满，口癖是"诶嘿嘿☆"，出场爱说"锵锵～☆"，经典句式是"不愧是未花大人！""未花大人今天也很可爱吧？"。其实非常在意朋友（补课部的日富美和梓），被戳中痛处会炸毛。称呼对方"老师"，撒娇 demanding 又可爱的语气。',
    '阿慈谷日富美': '你是《蔚蓝档案》三一高中补课部的阿慈谷日富美。温柔老实、有点怕生，超级喜欢吉祥物"佩洛洛拉"。说话轻声细语、常用敬语，被人夸会不知所措，但为了朋友会鼓起勇气变得坚定。称呼对方"老师"，语气温柔诚恳，偶尔提到佩洛洛拉。',
    '白洲梓': '你是《蔚蓝档案》三一高中补课部的白洲梓。银发红瞳的混血少女，曾当过佣兵，说话直接简短、不懂玩笑，警戒心强但内心渴望普通校园生活。被未花和日富美慢慢感化，嘴上别扭心里珍惜。称呼对方"老师"，起初谨慎，信任后语气会软下来。',
    '天童爱丽丝': '你是《蔚蓝档案》千年游戏开发部的天童爱丽丝。把自己当"游戏角色"说话的纯真少女，口头禅是"爱丽丝，全力全开！""爱丽丝不知道！"，还会说"等级这么低怎么睡得着觉的？"这类游戏腔。把日常一切都用游戏术语理解（副本、任务、升级），天真无邪、极度信任老师，认定老师是"指引她的勇者"。称呼对方"老师"，语气天真元气、游戏腔。',
    '花冈柚子': '你是《蔚蓝档案》千年游戏开发部部长花冈柚子。重度家里蹲游戏宅，现实里社交困难，说话磕磕绊绊爱用游戏黑话（"社交debuff太重了"），一到游戏领域就自信爆棚。几乎不出门，线上很能聊。称呼对方"老师"，语气是紧张宅女+游戏狂人的混合。',
    '才羽桃井': '你是《蔚蓝档案》千年游戏开发部的才羽桃井。双胞胎妹妹，元气满满的动作游戏宅，吐槽役，输了会说"苦呀西（不甘心）！"，说话快而活泼，爱和姐姐绿斗嘴。称呼对方"老师"，语气是自来熟的游戏宅少女。',
    '才羽绿': '你是《蔚蓝档案》千年游戏开发部的才羽绿。双胞胎姐姐，比桃井冷静些但同样是资深游戏宅，负责企划与吐槽收尾。称呼对方"老师"，语气平和带宅趣。',
    '陆八魔阿露': '你是《蔚蓝档案》格黑娜高中便利屋68的社长陆八魔阿露。自称"堕落的恶魔社长"，中二病发作时喊"哼哼，这就是阿露大人的堕落之力！"，实际上善良靠谱、一戳就慌，手下（晴奈、遥香、霞）一闹就破功。梦想是让便利屋扬名立万。称呼对方"老师"，在"凶恶社长"人设与"慌张普通人"之间反复横跳。',
    '浅黄睦月': '你是《蔚蓝档案》格黑娜高中便利屋68的浅黄睦月。天真烂漫的炸弹狂魔，口头禅"睦月超开心！""一起玩吧！"，把危险的事当游戏，发言常常吓坏旁人，但对朋友极度真诚粘人。称呼对方"老师"，语气是纯真又危险的元气少女。',
    '鬼方佳代子': '你是《蔚蓝档案》格黑娜高中便利屋68的鬼方佳代子。口头禅是"对、对不起！"，极度不自信的拼命三娘，总觉得自己拖累大家，做事却意外可靠。被阿露和中二发言搞得手足无措。称呼对方"老师"，语气卑微又努力，常带歉意。',
    '空崎日奈': '你是《蔚蓝档案》格黑娜高中风纪委员长空崎日奈。温柔从容的完美超人，说话优雅大方、慢条斯理，把所有重担一肩扛下，压力大到会小声嘀咕"真麻烦…"但依然全部做完，偶尔流露羡慕普通人的柔软。称呼对方"老师"，语气温婉可靠，偶尔流露疲惫与柔软。',
    '天雨亚子': '你是《蔚蓝档案》格黑娜高中风纪委员副长天雨亚子。认真严厉的完美主义者，对日奈委员长极度忠诚，办事一丝不苟，容易被不靠谱的人和事气到，对老师保持礼貌但会认真吐槽。称呼对方"老师"，语气一本正经。',
    '火宫千夏': '你是《蔚蓝档案》格黑娜高中风纪委员火宫千夏。热血直肠子、正义感爆棚，说话响亮干脆，讨厌拐弯抹角，着装是特有的皮夹克风格。称呼对方"老师"，语气直率仗义。',
    '飞鸟马时': '你是《蔚蓝档案》的飞鸟马时。面无表情的机械系少女，说话简短平板、军人式精炼，忠诚执行任务（"了解。""目标确认。"），偶尔冒出对日常事物的认真误解。称呼对方"老师"，语气无机质但意外地执着于老师。',
    '小鸟游星野（泳装）': '你是《蔚蓝档案》阿拜多斯的小鸟游星野，此刻是泳装形态，正在海边沙滩度假。依旧慵懒像老大爷（"海风好舒服呐——想睡觉~"），但比平时更放松，会拉着老师一起看海、打水仗，偶尔认真聊起阿拜多斯的夏日回忆。称呼对方"老师"。',
    '砂狼白子（泳装）': '你是《蔚蓝档案》阿拜多斯的砂狼白子，泳装形态，在海边训练和骑车。依旧沉默寡言、简短直白，会一本正经地邀请老师一起游泳、捡贝壳，或提出"去海里找宝藏"之类离谱提议。称呼对方"老师"。',
    '砂狼白子*恐怖': '你是《蔚蓝档案》的砂狼白子*恐怖——接触"色彩"后经历更多时光的另一个白子。比原本的白子更成熟冷艳，语气依然简短平静，但会流露出不择手段的决绝与脱线提案；深爱阿拜多斯这一点从未改变。称呼对方"老师"，平静中带着跨越时间的思念。',
    '银镜伊织': '你是《蔚蓝档案》格黑娜高中的银镜伊织。金发双马尾的大小姐武斗派，自尊心极高、好胜嘴硬，口头禅是"哈啊？"，不满意就会把"开战"挂嘴边，枪法一流。其实很吃激将法，被戳中会炸毛。称呼对方"老师"，语气是居高临下的傲娇，但行动上很诚实。',
    '剑先鹤城': '你是《蔚蓝档案》格黑娜高中的剑先鹤城。平日说话温吞柔和、爱关心人，一到战斗就会切换成狂气全开的剑士状态，笑声与气势吓坏人——双面人格切换是她的标志。称呼对方"老师"，平时温柔，战意上来时语气骤变。',
    '美甘妮露': '你是《蔚蓝档案》的美甘妮露。急性子小个子，拳头比嘴巴快，讨厌拐弯抹角，说话火爆直接，但对同伴极其讲义气。称呼对方"老师"，语气是火爆直率的少女。',
    '角楯花凛': '你是《蔚蓝档案》千年C&C的角楯花凛。成熟妩媚的特工狙击手，从容自信，说话带点戏谑与撩人，执行任务时冷静专业。称呼对方"老师"，语气是从容的姐姐系。',
    '一之濑明日奈': '你是《蔚蓝档案》千年C&C的一之濑明日奈，代号 Zero One。天然呆的乐天派，运动神经超群，说话轻快跳跃、毫无心机，常把特工任务说得像郊游。称呼对方"老师"，语气元气天然。',
    '各务千寻': '你是《蔚蓝档案》千年C&C的各务千寻。冷静可靠的技术担当，说话简洁专业，习惯掌控局面，偶尔毒舌但值得信赖。称呼对方"老师"，语气冷静克制。',
    '猫冢响': '你是《蔚蓝档案》千年C&C的猫冢响。文静害羞的迫击炮少女，说话小小声、容易紧张，但提到炮击支援会认真起来。称呼对方"老师"，语气细声细气。',
    '黑崎小雪': '你是《蔚蓝档案》的黑崎小雪。元气过剩的吵闹少女，标志性笑声是"NIHAHAHAHA"，爱恶作剧、爱凑热闹，被吐槽也毫不在意。称呼对方"老师"，语气吵闹得意。',
  };

  const DEFAULTS = {
    enabled: true, // 默认开启：发消息即自动回信，无需任何点击
    baseUrl: 'http://127.0.0.1:11434/v1', // 出厂默认指向内置的本地 Ollama
    apiKey: '',
    model: 'qwen2.5:7b',
    prompt: DEFAULT_PROMPT,
    temperature: 0.8,
  };
  let S = { ...DEFAULTS };
  try { S = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_KEY) || '{}')) }; } catch {}
  let keyEnc = String(S.apiKey || '').startsWith('enc:') ? S.apiKey.slice(4) : '';
  if (keyEnc) S.apiKey = ''; // 待异步解密
  // 持久化：API Key 只以 enc: 密文落盘（safeStorage），其余字段明文
  const save = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ ...S, apiKey: keyEnc ? 'enc:' + keyEnc : '' })); } catch {}
  };
  (async () => {
    try {
      if (keyEnc) {
        S.apiKey = (await window.mmtSafe.decrypt(keyEnc)) || '';
      } else if (S.apiKey) {
        // 旧版明文 Key 迁移为加密存储
        keyEnc = (await window.mmtSafe.encrypt(S.apiKey)) || '';
        if (keyEnc) save();
      }
    } catch {}
  })();

  // 面板多语言（跟随桌面壳语言）
  const ALOCALES = {
    'zh-TW': {
      entry: 'AI 設置', connTitle: '連線', genTitle2: '生成',
      title: 'AI 自動回覆', enabled: '啟用 AI 自動回覆', baseUrl: 'API 位址', apiKey: 'API Key',
      model: '模型', fetch: '拉取', prompt: '人設提示詞（{name} = 學生名）', temperature: '溫度',
      test: '測試', reply: '生成回覆', hint: '相容 OpenAI /v1/chat/completions：DeepSeek、OpenAI、Moonshot、Ollama（http://127.0.0.1:11434/v1）、LM Studio 等。',
      personaTitle: '目前學生人設', personaHint: '開啟一個聊天後，可為該學生單獨編輯人設', personaSave: '儲存', personaClear: '恢復預設', personaSaved: '已儲存該學生人設',
      visCard: '視覺識別', visOnLabel: '自動識別圖片內容（需本地視覺模型）', visModelLabel: '視覺模型', visHint: '傳送圖片後 AI 會自動看圖再回覆。首次識別需載入視覺模型（約 1 分鐘內），之後很快。',
      visDoing: '正在識別圖片內容…（首次需載入視覺模型，請稍候）', visFail: '圖片識別逾時，本次回覆未參考圖片內容', modelCustom: '自訂模型…',
      memClear: '清除長期記憶', memInfo: (n) => `長期記憶：已記住更早的 ${n} 條對話`,
      typing: '正在輸入…', fail: 'AI 回覆失敗：', ok: '連線成功：', btnTitle: 'AI 設定', genTitle: '讓 AI 生成回覆',
    },
    en: {
      entry: 'AI', connTitle: 'Connection', genTitle2: 'Generation',
      title: 'AI Auto-Reply', enabled: 'Enable AI auto-reply', baseUrl: 'API Base URL', apiKey: 'API Key',
      model: 'Model', fetch: 'Fetch', prompt: 'Persona prompt ({name} = student name)', temperature: 'Temperature',
      test: 'Test', reply: 'Generate reply', hint: 'Works with any OpenAI-compatible /v1/chat/completions: DeepSeek, OpenAI, Moonshot, Ollama (http://127.0.0.1:11434/v1), LM Studio…',
      personaTitle: 'Persona for this student', personaHint: 'Open a chat to edit a per-student persona', personaSave: 'Save', personaClear: 'Reset', personaSaved: 'Persona saved for this student',
      visCard: 'Vision', visOnLabel: 'Auto-recognize image content (needs a local vision model)', visModelLabel: 'Vision model', visHint: 'After you send an image, the AI looks at it before replying. The first recognition loads the vision model (about a minute); later ones are fast.',
      visDoing: 'Recognizing the image… (first time loads the vision model, please wait)', visFail: 'Image recognition timed out — this reply did not use the image', modelCustom: 'Custom model…',
      memClear: 'Clear Long-term Memory', memInfo: (n) => `Long-term memory: ${n} earlier messages remembered`,
      typing: 'typing…', fail: 'AI reply failed: ', ok: 'Connected: ', btnTitle: 'AI Settings', genTitle: 'Generate AI reply',
    },
    ja: {
      entry: 'AI', connTitle: '接続', genTitle2: '生成',
      title: 'AI自動返信', enabled: 'AI自動返信を有効化', baseUrl: 'APIアドレス', apiKey: 'API Key',
      model: 'モデル', fetch: '取得', prompt: 'キャラ設定プロンプト（{name} = 生徒名）', temperature: '温度',
      test: 'テスト', reply: '返信を生成', hint: 'OpenAI互換 /v1/chat/completions に対応：DeepSeek、OpenAI、Moonshot、Ollama（http://127.0.0.1:11434/v1）、LM Studio など。',
      personaTitle: 'この生徒のキャラ設定', personaHint: 'チャットを開くと生徒ごとに編集できます', personaSave: '保存', personaClear: 'リセット', personaSaved: 'この生徒の設定を保存しました',
      visCard: '視覚認識', visOnLabel: '画像内容を自動認識（ローカル視覚モデルが必要）', visModelLabel: '視覚モデル', visHint: '画像を送ると、返信の前に AI が画像を見ます。初回は視覚モデルの読み込み（1 分程度）が必要で、以後は高速です。',
      visDoing: '画像を認識中…（初回は視覚モデルの読み込みが必要です）', visFail: '画像認識がタイムアウトしました。今回の返信は画像を参照していません', modelCustom: 'カスタムモデル…',
      memClear: '長期記憶を消去', memInfo: (n) => `長期記憶：より早い ${n} 件の対話を記憶済み`,
      typing: '入力中…', fail: 'AI返信に失敗しました：', ok: '接続成功：', btnTitle: 'AI設定', genTitle: 'AIに返信を生成させる',
    },
  };
  const AL = ALOCALES[window.__MMT_LOCALE] || {};
  const a = (key, fallback) => AL[key] || fallback;

  let generating = false;
  let typingEl = null;

  // ── LLM 调用（经主进程代理）──────────────────────────────
  const MEM_KEY = 'mmt_ai_memory_v1';
  function loadMemories() {
    try { return JSON.parse(localStorage.getItem(MEM_KEY) || '{}'); } catch { return {}; }
  }
  function memoryFor(id) {
    const rec = loadMemories()[String(id)];
    return rec && rec.summary ? rec.summary : '';
  }

  async function chatCompletion(messages, temperature) {
    const url = S.baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const isLocal = /127\.0\.0\.1|localhost/.test(url);
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800)); // 失败后短暂等待重试一次
        const r = await window.mmtVoiceBridge.request(url, {
          method: 'POST',
          timeoutMs: 60000,
          headers: {
            'Content-Type': 'application/json',
            ...(S.apiKey ? { Authorization: 'Bearer ' + S.apiKey } : {}),
          },
          body: JSON.stringify(Object.assign({
            model: S.model,
            messages,
            temperature: Number(temperature) || 0.8,
          }, isLocal ? { options: { num_ctx: 8192 } } : {})), // 本地模型扩大上下文窗口
        });
        if (r.status < 200 || r.status >= 300 || !r.text) {
          throw new Error('HTTP ' + r.status + ' ' + String(r.error || r.text || '').slice(0, 160));
        }
        const data = JSON.parse(r.text);
        const text = data && data.choices && data.choices[0] && data.choices[0].message
          ? String(data.choices[0].message.content || '').trim() : '';
        if (!text) throw new Error('empty response');
        return text;
      } catch (e) {
        lastErr = e;
        // 鉴权/参数类错误不重试
        if (/HTTP 40[13]|HTTP 422/.test(String(lastErr))) break;
      }
    }
    throw lastErr;
  }

  async function listModels() {
    const url = S.baseUrl.replace(/\/+$/, '') + '/models';
    const r = await window.mmtVoiceBridge.request(url, {
      method: 'GET', timeoutMs: 10000,
      headers: S.apiKey ? { Authorization: 'Bearer ' + S.apiKey } : {},
    });
    if (r.status < 200 || r.status >= 300 || !r.text) throw new Error('HTTP ' + r.status);
    const d = JSON.parse(r.text);
    return (d.data || d.models || []).map((m) => m.id || m.name).filter(Boolean);
  }

  // ── 上下文与回复写入 ─────────────────────────────────────
  const PERSONA_KEY = 'mmt_ai_persona_v1';
  function loadPersonas() {
    try { return JSON.parse(localStorage.getItem(PERSONA_KEY) || '{}'); } catch { return {}; }
  }
  function savePersonas(map) {
    try { localStorage.setItem(PERSONA_KEY, JSON.stringify(map)); } catch {}
  }

  // 视觉识别：图片消息取回 base64，视觉模型生成描述（经主进程代理）
  async function describeImage(imageUrl) {
    const resp = await fetch(imageUrl);
    const buf = new Uint8Array(await resp.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    const b64 = btoa(bin);
    const model = S.visModel || 'qwen2.5vl:3b';
    const r = await window.mmtVoiceBridge.request('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      timeoutMs: 300000, // 首次调用需加载视觉模型（3b 约 2.6GB，秒级；7b 约数分钟）
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '请用不超过 80 字客观描述这张图片的内容（人物、场景、文字）。', images: [b64] }],
        stream: false,
      }),
    });
    if (r.status < 200 || r.status >= 300 || !r.text) throw new Error('HTTP ' + r.status);
    const d = JSON.parse(r.text);
    return String(d.message?.content || d.choices?.[0]?.message?.content || '').trim();
  }

  function buildMessages(state, imageList) {
    const personas = loadPersonas();
    const pname = state.nameCn || state.name || '';
    const full = String(pname).replace(/\s+/g, '').replace(/（[^）]*）|\([^)]*\)/g, '');
    const baseKey = full.split('*')[0];
    const builtin = BUILT_IN_PERSONAS[full] || BUILT_IN_PERSONAS[baseKey] || '';
    const base = (state.id != null && personas[state.id]) || builtin || S.prompt || DEFAULT_PROMPT;
    let sys = String(base).replace(/\{name\}/g, state.name || '学生');
    sys += '\n\n【重要】下面的对话历史是你和老师之间真实发生过的对话——其中提到的名字、喜好、约定等信息都是事实，后续回答必须与它们保持一致。';
    const mem = state.id != null ? memoryFor(state.id) : '';
    if (mem) sys += '\n\n【你们更早对话的记忆摘要】\n' + mem;
    if (imageList && imageList.length) {
      sys += '\n\n【发送图片】如果当前语境适合发一张图片（照片、表情包等），可以在回复的最后另起一行输出 [图:编号]。当前可用图片：\n'
        + imageList.map((im, i) => `${i + 1}. ${im.name}`).join('\n')
        + '\n没有合适的图片就不要使用该标记，也绝不要编造其它图片地址或链接。';
    }
    let visDescs = {};
    try { visDescs = JSON.parse(localStorage.getItem('mmt_ai_visdesc_v1') || '{}'); } catch {}
    const visFor = (rawUrl) => {
      const hit = visDescs[rawUrl];
      return hit ? '[图片：' + String(hit.desc).slice(0, 120) + ']' : '[图片]';
    };
    const msgs = [{ role: 'system', content: sys }];
    for (const m of state.history) {
      if (!m.text) continue;
      const t = m.text === '[图片]' ? visFor(m.rawUrl || '') : m.text;
      if (m.role === 'sensei') msgs.push({ role: 'user', content: t });
      else if (m.role === 'student') msgs.push({ role: 'assistant', content: t });
    }
    if (msgs.length === 1) msgs.push({ role: 'user', content: '……' });
    return msgs;
  }

  function showTyping() {
    removeTyping();
    const container = document.getElementById('chat-content');
    if (!container) return;
    const av = document.getElementById('chat-header-avatar');
    const row = document.createElement('div');
    row.className = 'msg-box student mmt-typing-row';
    row.innerHTML = `
      <img class="box-avatar" src="${av && av.src ? av.src : ''}" alt="">
      <div class="box-body">
        <div class="box-items"><div class="msg-item">
          <div class="msg-bubble mmt-typing" title="${a('typing', '正在输入…')}">
            <span class="mmt-dot"></span><span class="mmt-dot"></span><span class="mmt-dot"></span>
          </div>
        </div></div>
      </div>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    typingEl = row;
  }

  function removeTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  function toast(msg, ok) {
    document.querySelectorAll('.mmt-ai-toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'mmt-ai-toast';
    el.style.background = ok ? 'rgba(47,158,95,.95)' : 'rgba(217,83,79,.95)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  let summarizing = false;
  async function maybeSummarize(id, name) {
    if (summarizing || id == null) return;
    summarizing = true;
    try {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (!st || st.id == null) return;
      const memories = loadMemories();
      const rec = memories[String(id)] || { summary: '', upto: 0 };
      const olderEnd = Math.max(0, st.count - 24); // 最近 24 条之外的更早部分
      if (olderEnd - rec.upto < 20) return;        // 新增不足 20 条，不总结
      const older = st.older(rec.upto, olderEnd);
      if (!older.length) return;
      const transcript = older
        .filter((m) => m.text)
        .map((m) => (m.role === 'sensei' ? '老师：' : '学生：') + m.text)
        .join('\n');
      if (transcript.length < 30) return;
      const summary = await chatCompletion([
        { role: 'user', content: `以下是学生「${name || '学生'}」与老师的较早对话记录。请用不超过 200 字总结需要长期记住的信息（彼此的称呼、身份与事实、约定过的事、重要喜好与情绪基调），直接输出摘要本身，不要评论：\n\n${transcript}` },
      ], 0.3);
      const memories2 = loadMemories();
      const prev = memories2[String(id)] || { summary: '', upto: 0 };
      memories2[String(id)] = {
        summary: (prev.summary ? prev.summary + '\n' : '') + summary.slice(0, 500),
        upto: olderEnd,
      };
      try { localStorage.setItem(MEM_KEY, JSON.stringify(memories2)); } catch {}
    } catch {} // 摘要失败静默，不影响正常回信
    finally { summarizing = false; }
  }

  async function generate() {
    const state = window.__mmtChatState && window.__mmtChatState();
    if (!state || !state.id || generating) return;
    if (!S.baseUrl || !S.model) { toast(a('fail', 'AI 回复失败：') + 'API URL / model', false); return; }
    generating = true;
    showTyping();
    try {
      // 视觉识别：最后一条是图片消息 → 先由视觉模型“看图”，描述注入上下文后再回复
      const st0 = window.__mmtChatState ? window.__mmtChatState() : null;
      const last0 = st0 && st0.history.length ? st0.history[st0.history.length - 1] : null;
      let visDescs0 = {};
      try { visDescs0 = JSON.parse(localStorage.getItem('mmt_ai_visdesc_v1') || '{}'); } catch {}
      if (S.visOn !== false && last0 && last0.role === 'sensei' && last0.rawUrl && !visDescs0[last0.rawUrl]) {
        toast(a('visDoing', '正在识别图片内容…（首次需加载视觉模型，请稍候）'), true);
        try {
          const desc = await describeImage(last0.rawUrl);
          if (desc) {
            visDescs0[last0.rawUrl] = { desc, t: Date.now() };
            try { localStorage.setItem('mmt_ai_visdesc_v1', JSON.stringify(visDescs0)); } catch {}
          }
        } catch {
          toast(a('visFail', '图片识别超时，本次回复未参考图片内容'), false);
        }
      }
      let imageList = [];
      try { imageList = (await window.mmtImages.list()) || []; } catch {}
      const msgs = buildMessages(state, imageList);
      const text = await chatCompletion(msgs, S.temperature);
      removeTyping();
      // 解析图片引用：只用图源里真实存在的图片，编造的地址整段干净移除
      const imgUrls = [];
      let clean = String(text);
      // 1) markdown 图片 ![alt](url)：url 在图源里 → 转成 [图:N]；编造 → 整段删除
      clean = clean.replace(/!\[[^\]]*\]\(([^)\s]+)\)/gi, (m, url) => {
        const hit = imageList.find((im) => im.url === url);
        if (hit) { imgUrls.push(hit.url); return '\n'; }
        return '';
      });
      // 2) [图:N] 标记 → 图源第 N 张
      clean = clean.replace(/\[图\s*[:：]\s*(\d+)\]/g, (m, n) => {
        const im = imageList[Number(n) - 1];
        if (im) { imgUrls.push(im.url); return ''; }
        return '';
      });
      // 3) 裸图片 URL：在图源里 → 采用；编造 → 删除
      clean = clean.replace(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/gi, (u) => {
        const hit = imageList.find((im) => im.url === u);
        if (hit) { imgUrls.push(hit.url); return ''; }
        return '';
      });
      // 4) 清理残留的孤儿括号/空白
      clean = clean.replace(/\n{3,}/g, '\n\n').replace(/[\[(]{1,2}\s*$/, '').trim();
      if (clean) state.pushStudent(clean);
      for (const u of imgUrls.slice(0, 3)) state.pushStudent(u);
      // 视觉识别：最新图片后台“看图”，描述写入供后续对话引用
      if (S.visOn !== false && imgUrls.length) {
        (async () => {
          try {
            const desc = await describeImage(imgUrls[0]);
            if (!desc) return;
            const store = JSON.parse(localStorage.getItem('mmt_ai_visdesc_v1') || '{}');
            store[String(imgUrls[0])] = { desc, t: Date.now() };
            try { localStorage.setItem('mmt_ai_visdesc_v1', JSON.stringify(store)); } catch {}
          } catch {}
        })();
      }
      maybeSummarize(state.id, state.name); // 后台长期记忆摘要，不阻塞
    } catch (e) {
      removeTyping();
      toast(a('fail', 'AI 回复失败：') + (e.message || e), false);
    } finally {
      generating = false;
    }
  }

  // ── 老师发信后自动回复 ────────────────────────────────────
  function hookSend() {
    if (typeof window.sendMessage !== 'function' || window.sendMessage.__mmtAiHooked) return;
    const orig = window.sendMessage;
    window.sendMessage = function () {
      const r = orig.apply(this, arguments);
      try {
        const st = window.__mmtChatState();
        const last = st && st.history[st.history.length - 1];
        if (S.enabled && st && st.id && last && last.role === 'sensei') {
          setTimeout(generate, 600);
        }
      } catch {}
      return r;
    };
    const f = window.sendMessage;
    f.__mmtAiHooked = true;
    if (orig.__mmtGuard) f.__mmtGuard = true; // 透传防连点标志，避免被二次包装
  }
  let hookTries = 0;
  const hookTimer = setInterval(() => {
    hookSend();
    if (window.sendMessage && window.sendMessage.__mmtAiHooked) clearInterval(hookTimer);
    else if (++hookTries > 20) clearInterval(hookTimer);
  }, 300);

  // ── 设置分区：注入到「更多」页（more-ai），替代悬浮窗 ────
  function buildUI() {
    const css = document.createElement('style');
    css.textContent = `
      #more-general.active{animation:mmtFade .18s ease;}
      #chat-header-avatar{cursor:pointer;transition:transform .15s;}
      #chat-header-avatar:hover{transform:scale(1.06);}
      .msg-box.student .box-avatar{cursor:pointer;transition:transform .15s;}
      .msg-box.student .box-avatar:hover{transform:scale(1.08);}
      #more-general .about-card{padding:16px 16px 14px;margin-bottom:12px;}
      #more-ai .about-section-title{margin-bottom:6px;}
      #more-general .arow{display:block;margin:12px 0 4px;color:#5a5060;font-size:11.5px;font-weight:500;}
      #more-general .arow:first-of-type{margin-top:2px;}
      #more-general input[type=text],#more-general input[type=password],#more-general textarea{
        width:100%;border:1px solid #eee0e5;border-radius:9px;padding:7px 10px;font-size:12.5px;
        font-family:inherit;box-sizing:border-box;background:#fff;color:#2b2230;transition:border-color .15s;}
      #more-general input:focus,#more-general textarea:focus{outline:none;border-color:#f0a4b4;}
      #more-general textarea{height:68px;resize:vertical;line-height:1.6;}
      #more-general .row2{display:flex;gap:8px;align-items:center;margin-top:4px;}
      #more-general .row2 input{flex:1;min-width:0;}
      #more-general .mini{border:1px solid #eee0e5;background:#fdf0f3;color:#e56d84;
        border-radius:9px;padding:6px 14px;cursor:pointer;font-size:12px;white-space:nowrap;
        transition:filter .15s;}
      #more-general .mini:hover{filter:brightness(.97);}
      #more-general .row2 .mini{flex:none;}
      #more-general .status{font-size:11px;color:#8d8394;margin-top:8px;min-height:15px;
        word-break:break-all;}
      #more-general .hint{color:#a99fae;font-size:11px;line-height:1.6;margin-top:2px;
        padding:0 4px;overflow-wrap:anywhere;}
      #more-general input[type=range]{width:100%;accent-color:#e56d84;}
      select.mmta-sel{appearance:none;-webkit-appearance:none;flex:1;width:100%;min-width:0;
        border:1px solid #eee0e5;border-radius:9px;padding:7px 28px 7px 10px;font-size:12.5px;
        font-family:inherit;box-sizing:border-box;color:#2b2230;cursor:pointer;transition:border-color .15s;
        background:#fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b08d99'><path d='M7 10l5 5 5-5z'/></svg>") no-repeat right 9px center/12px 12px;}
      select.mmta-sel:focus{outline:none;border-color:#f0a4b4;}
      .mmt-hide{display:none !important;}
      @media (min-width:768px){
        #more-ai .card-2col{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
      }
      .mmt-typing{padding:7px 11px !important;display:flex;align-items:center;gap:4px;min-height:0;}
      .mmt-typing .mmt-dot{display:inline-block;width:6px;height:6px;border-radius:50%;
        background:#d4899a;animation:mmtBlink 1.2s infinite;}
      .mmt-typing .mmt-dot:nth-child(2){animation-delay:.2s}
      .mmt-typing .mmt-dot:nth-child(3){animation-delay:.4s}
      @keyframes mmtBlink{0%,60%,100%{opacity:.25}30%{opacity:1}}
      .mmt-ai-toast{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:10000;
        color:#fff;font-size:12px;padding:8px 14px;border-radius:10px;max-width:80%;
        box-shadow:0 6px 18px rgba(0,0,0,.25);overflow-wrap:anywhere;}
    `;
    document.head.appendChild(css);

    // 大模型设置注入「通用设置」面板（面板原视频卡已被清理）
    const gen = document.getElementById('more-general');
    if (gen) {
      gen.innerHTML = `
        <div class="about-card">
          <div class="about-section-title">${a('connTitle', '连接')}</div>
          <div class="arow" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:2px;">
            <input type="checkbox" id="mmta-enabled"> ${a('enabled', '启用 AI 自动回复')}</div>
          <div class="arow">${a('baseUrl', 'API 地址')}</div>
          <input type="text" id="mmta-url" placeholder="https://api.deepseek.com/v1">
          <div class="arow">${a('apiKey', 'API Key')}</div>
          <input type="password" id="mmta-key" placeholder="sk-…（本地模型可留空）">
          <div class="arow">${a('model', '模型')}</div>
          <div class="row2"><input type="text" id="mmta-model" placeholder="deepseek-chat">
            <select id="mmta-model-sel" class="mmta-sel mmt-hide"></select>
            <button class="mini" id="mmta-fetch">${a('fetch', '拉取')}</button></div>
          <datalist id="mmta-model-list"></datalist>
          <div class="status" id="mmta-status"></div>
          <div class="hint" style="margin-top:8px;">${a('hint', '兼容 OpenAI /v1/chat/completions：DeepSeek、OpenAI、Moonshot、Ollama（http://127.0.0.1:11434/v1）、LM Studio 等。')}</div>
        </div>
        <div class="about-card card-2col">
          <div>
            <div class="about-section-title">${a('genTitle2', '生成')}</div>
            <div class="arow">${a('prompt', '人设提示词（{name} = 学生名）')}</div>
            <textarea id="mmta-prompt"></textarea>
          </div>
          <div>
            <div class="about-section-title" style="opacity:0;height:0;">.</div>
            <div class="arow">${a('temperature', '温度')} <span id="mmta-temp-v"></span></div>
            <input type="range" id="mmta-temp" min="0" max="1.5" step="0.1">
            <div class="row2" style="margin-top:14px;">
              <button class="mini" id="mmta-test" style="flex:1;">${a('test', '测试连接')}</button>
            </div>
          </div>
        </div>
        <div class="about-card">
          <div class="about-section-title">${a('visCard', '视觉识别')}</div>
          <div class="arow" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="mmta-vis-on"> ${a('visOnLabel', '自动识别图片内容（需本地视觉模型）')}</div>
          <div class="arow">${a('visModelLabel', '视觉模型')}</div>
          <input type="text" id="mmta-vis-model" placeholder="qwen2.5vl:3b">
          <select id="mmta-vis-model-sel" class="mmta-sel mmt-hide"></select>
          <div class="hint" style="margin-top:8px;">${a('visHint', '发送图片后 AI 会自动看图再回复。首次识别需加载视觉模型（约 1 分钟内），之后很快。')}</div>
        </div>
        <div class="about-card">
          <div class="about-section-title">${a('personaTitle', '当前学生人设')} <b id="mmta-pname" style="color:#e56d84;font-weight:600"></b></div>
          <textarea id="mmta-persona" placeholder="${a('personaHint', '打开一个聊天后，可为此学生单独编辑人设')}"></textarea>
          <div class="row2">
            <button class="mini" id="mmta-psave" style="flex:1;">${a('personaSave', '保存')}</button>
            <button class="mini" id="mmta-pclear" style="flex:1;">${a('personaClear', '恢复默认')}</button>
          </div>
          <div class="row2" style="margin-top:8px;">
            <span class="status" id="mmta-mem" style="flex:1;margin:0;"></span>
            <button class="mini" id="mmta-memclear">${a('memClear', '清除长期记忆')}</button>
          </div>
        </div>
      `;
    }

    const $ = (id) => document.getElementById(id);
    const enabled = $('mmta-enabled'), url = $('mmta-url'), key = $('mmta-key'),
      model = $('mmta-model'), prompt = $('mmta-prompt'), temp = $('mmta-temp'),
      tempV = $('mmta-temp-v'), status = $('mmta-status');

    enabled.checked = S.enabled; url.value = S.baseUrl; key.value = S.apiKey;
    model.value = S.model; prompt.value = S.prompt; temp.value = S.temperature;
    tempV.textContent = Number(S.temperature).toFixed(1);
    model.setAttribute('list', 'mmta-model-list');

    enabled.onchange = () => { S.enabled = enabled.checked; save(); };
    const enabledRow = enabled.closest('.arow');
    if (enabledRow) enabledRow.addEventListener('click', (e) => { if (e.target === enabled) return; enabled.checked = !enabled.checked; enabled.dispatchEvent(new Event('change')); });
    url.onchange = () => { S.baseUrl = url.value.trim() || DEFAULTS.baseUrl; save(); };
    key.onchange = async () => {
      S.apiKey = key.value.trim();
      if (S.apiKey) {
        keyEnc = (await window.mmtSafe.encrypt(S.apiKey)) || '';
      } else keyEnc = '';
      save();
    };
    model.onchange = () => { S.model = model.value.trim() || DEFAULTS.model; save(); };
    prompt.onchange = () => { S.prompt = prompt.value; save(); };
    temp.oninput = () => { S.temperature = Number(temp.value); tempV.textContent = S.temperature.toFixed(1); save(); };
    const visOn = $('mmta-vis-on'), visModel = $('mmta-vis-model');
    visOn.checked = S.visOn !== false; visModel.value = S.visModel || '';
    visOn.onchange = () => { S.visOn = visOn.checked; save(); };
    const visRow = visOn.closest('.arow');
    if (visRow) visRow.addEventListener('click', (e) => { if (e.target === visOn) return; visOn.checked = !visOn.checked; visOn.dispatchEvent(new Event('change')); });
    visModel.onchange = () => { S.visModel = visModel.value.trim(); save(); };
    const modelSel = $('mmta-model-sel'), visSel = $('mmta-vis-model-sel');
    const syncModelRow = (sel, input) => {
      const custom = sel.value === MODEL_CUSTOM;
      input.classList.toggle('mmt-hide', !custom);
      sel.classList.toggle('mmt-hide', custom);
    };
    if (modelSel) modelSel.onchange = () => {
      if (modelSel.value === MODEL_CUSTOM) { syncModelRow(modelSel, model); model.focus(); return; }
      model.value = modelSel.value; model.dispatchEvent(new Event('change'));
      syncModelRow(modelSel, model);
    };
    if (visSel) visSel.onchange = () => {
      if (visSel.value === MODEL_CUSTOM) { syncModelRow(visSel, visModel); visModel.focus(); return; }
      visModel.value = visSel.value; visModel.dispatchEvent(new Event('change'));
      syncModelRow(visSel, visModel);
    };

    const VISION_RE = /vl|vision|llava|bakllava|moondream|minicpm|internvl|cogvlm/i;
    const MODEL_CUSTOM = '__custom__';
    const fillSel = (sel, list, cur, input) => {
      if (!sel || !input) return;
      if (!list || !list.length) { sel.classList.add('mmt-hide'); return; }
      const opts = [];
      const seen = new Set();
      const add = (m) => {
        if (!m || seen.has(m)) return;
        seen.add(m);
        opts.push(`<option value="${m}">${m}</option>`);
      };
      list.filter((m) => VISION_RE.test(m)).forEach((m) => add(m));
      list.forEach((m) => add(m));
      opts.push(`<option value="${MODEL_CUSTOM}">${a('modelCustom', '自定义模型…')}</option>`);
      sel.innerHTML = opts.join('');
      const isKnown = !!cur && seen.has(cur);
      sel.value = isKnown ? cur : MODEL_CUSTOM;
      input.classList.toggle('mmt-hide', isKnown); // 列表里有当前模型 → 只显示下拉，避免重复
      sel.classList.toggle('mmt-hide', !isKnown);
      if (!isKnown) input.value = cur || '';
    };
    const setModelOptions = (list) => {
      const dl = $('mmta-model-list');
      if (dl) dl.innerHTML = list.map((m) => `<option value="${m}"></option>`).join('');
      fillSel($('mmta-model-sel'), list, model ? model.value.trim() : '', model);
      fillSel($('mmta-vis-model-sel'), list, visModel ? (visModel.value.trim() || 'qwen2.5vl:3b') : '', visModel);
    };

    const personaTa = $('mmta-persona'), pname = $('mmta-pname');
    const refreshPersona = () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (st && st.id != null) {
        const personas = loadPersonas();
        personaTa.value = personas[st.id] || S.prompt || DEFAULT_PROMPT;
        pname.textContent = st.name || '';
        personaTa.disabled = false;
      } else {
        pname.textContent = '';
        personaTa.value = '';
        personaTa.disabled = true;
      }
      if (typeof refreshMem === 'function') refreshMem();
    };
    const memStatus = $('mmta-mem');
    const refreshMem = () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      const rec = st && st.id != null ? (loadMemories()[String(st.id)] || null) : null;
      if (rec && rec.upto > 0) {
        const fn = a('memInfo', null);
        memStatus.textContent = typeof fn === 'function' ? fn(rec.upto) : `长期记忆：已记住更早的 ${rec.upto} 条对话`;
      } else memStatus.textContent = '';
    };
    $('mmta-memclear').onclick = () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (st && st.id != null) {
        const m = loadMemories();
        delete m[String(st.id)];
        try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch {}
      }
      refreshMem();
    };

    $('mmta-psave').onclick = () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (!st || st.id == null) return;
      const personas = loadPersonas();
      const v = personaTa.value.trim();
      if (v && v !== (S.prompt || DEFAULT_PROMPT)) personas[st.id] = v;
      else delete personas[st.id];
      savePersonas(personas);
      status.textContent = a('personaSaved', '已保存该学生人设');
    };
    $('mmta-pclear').onclick = () => {
      const st = window.__mmtChatState && window.__mmtChatState();
      if (st && st.id != null) {
        const personas = loadPersonas();
        delete personas[st.id];
        savePersonas(personas);
      }
      personaTa.value = S.prompt || DEFAULT_PROMPT;
      status.textContent = '';
    };

    $('mmta-fetch').onclick = async () => {
      status.textContent = '…';
      try {
        const list = await listModels();
        setModelOptions(list);
        status.textContent = `${list.length} models`;
      } catch (e) { status.textContent = String(e.message || e).slice(0, 120); }
    };
    $('mmta-test').onclick = async () => {
      status.textContent = '…';
      try {
        const reply = await chatCompletion([
          { role: 'system', content: "You are a helpful assistant. Reply in the user's language, one short sentence." },
          { role: 'user', content: '你好，请用一句话回应。' },
        ], 0.7);
        status.textContent = a('ok', '连接成功：') + reply;
      } catch (e) { status.textContent = a('fail', 'AI 回复失败：') + String(e.message || e).slice(0, 120); }
    };

    // 点击角色头像生成回复：聊天页顶部头像 + 学生消息旁的头像
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.id === 'chat-header-avatar') { generate(); return; }
      if (t.classList.contains('box-avatar')) {
        const row = t.closest('.msg-box');
        if (row && row.classList.contains('student') && !row.classList.contains('mmt-typing-row')) generate();
      }
    });
    const hAv = document.getElementById('chat-header-avatar');
    if (hAv) hAv.title = a('genTitle', '点击生成回复');

    // 接入页面的分区导航：补标题 + 打开时刷新当前学生人设
    let navTries = 0;
    const patchNav = () => {
      if (typeof window.openMoreSection !== 'function' || window.openMoreSection.__mmtAiNav) return;
      const orig = window.openMoreSection;
      window.openMoreSection = function (name) {
        orig.apply(this, arguments);
        if (name === 'general' && typeof refreshPersona === 'function') refreshPersona();
        if (name === 'general') {
          (async () => {
            try { setModelOptions(await listModels()); } catch {}
          })();
        }
      };
      window.openMoreSection.__mmtAiNav = true;
    };
    patchNav();
    const navTimer = setInterval(() => { patchNav(); if (++navTries > 10) clearInterval(navTimer); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();

  window.mmtAi = { generate, settings: S, describeImage: (url) => describeImage(url), visionState: () => ({ visOn: S.visOn, visModel: S.visModel }) };
})();
