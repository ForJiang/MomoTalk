<div align="center">

# MomoTalk Desktop

**《蔚蓝档案》桃信桌面版 — AI 聊天 · 图片识别 · 角色克隆语音**

ForJiang · GPL-3.0

</div>

---

将网页版 MomoTalk(桃信)打造为开箱即用的 macOS 桌面应用,并加入完整的本地 AI 能力:

- **AI 自动回复** — 内置 Ollama(qwen2.5:7b),零配置开箱即用;支持 DeepSeek / OpenAI 等云端 API,模型下拉直选
- **原作人设** — 30 余位核心学生内置贴合原作的性格与口癖(星野的大叔腔、白子的沉默、未花的"诶嘿嘿☆"……),自动匹配无需配置;支持每学生自定义人设与长期记忆
- **图片识别** — 发送图片,AI 会先"看图"再回复(本地视觉模型 qwen2.5vl:3b)
- **角色克隆语音** — 四引擎:系统 TTS / VoiceStudio / GPT-SoVITS / RVC 变声;每位学生自动分配不同音色与音高,RVC 引擎下可为每位学生分配不同音色模型
- **四语界面** — 简体中文 / 繁體中文 / English / 日本語,学生名字同步官方译名
- **桌面体验** — 图片收发(按钮/粘贴/拖拽)、AI 回复配图、聊天长图导出、备份(自选位置)、四语、窗口置顶、TouchBar 式音量……全部本地推理,数据不出本机

## 安装

从 [Releases](https://github.com/ForJiang/MomoTalk/releases) 下载 `MomoTalk-*-arm64.dmg`(Apple Silicon),拖入 Applications 即可。

首次使用前的服务部署(聊天/视觉模型与语音服务),见仓库内 **部署指南 PDF**(菜单 文件 → 新电脑部署指南),或使用 `dist/setup/` 下的一键脚本:

- `setup-momotalk.command` — 新电脑一键部署(Ollama + 模型 + 语音服务)
- `make-migration-pack.command` — 在旧电脑生成迁移包,离线搬运全部模型与配置

## 从源码构建

```bash
git clone https://github.com/ForJiang/MomoTalk.git
cd MomoTalk
npm install          # 国内网络建议: export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm run dist         # 产出 dist/MomoTalk-*.dmg
```

## 目录结构

```
├── main.js              # Electron 主进程(本地服务/窗口/菜单/自检)
├── preload.js           # 安全桥接(语音代理/加密/图片/Shell)
├── mmt-locale.js        # 四语词典 + T() 接管 + 学生名本地化
├── voice-extension.js   # 四引擎语音(系统/VoiceStudio/GPT-SoVITS/RVC)
├── ai-extension.js      # AI 自动回复(人设库/图片识别/长期记忆)
├── www/                 # 界面快照(见 NOTICE)
├── dist/setup/          # 新电脑部署套件(一键脚本 + 迁移包工具)
└── build/               # 图标与部署指南 PDF
```

## 许可证与致谢

- 本项目新增代码以 [GPL-3.0-or-later](./LICENSE) 发布
- 基于 [zakosensei/MomoTalk](https://github.com/zakosensei/MomoTalk) 构建 —— 见 [NOTICE.md](./NOTICE.md)
- 《蔚蓝档案》相关素材版权归 NEXON Games / Yostar 所有,本项目为非商业同人作品,与官方无关

<div align="center">

**ForJiang** · [forjiang.github.io](https://forjiang.github.io)

</div>
