[English](#english) | [中文](#中文)

---

<a name="english"></a>

# PetFoodSmart 🐾

**Open-source pet food safety analyzer with a 500+ ingredient database.**

Scan a pet food label → get an instant A-F safety grade with every ingredient flagged.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-541_passing-brightgreen)](src/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **PetFoodSmart** is a locally-renamed fork of the open-source **ToxicPaw** project by
> [toffee-desuwa](https://github.com/toffee-desuwa/toxicpaw), adapted here for the
> French/Spanish/Dutch (EU) market. This fork has not been redeployed — the links below
> point to the original upstream project's live demo, not to this fork.

[![Hugging Face Spaces](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Spaces-blue)](https://huggingface.co/spaces/toffee-desuwa/toxicpaw)

### [Original Project — Live Demo](https://toffee-desuwa-toxicpaw.hf.space) | [Vercel Mirror](https://toxicpaw-2472095547-9349s-projects.vercel.app)

<p align="center">
  <img src="docs/images/homepage.png" alt="PetFoodSmart Homepage" width="600" />
</p>

<p align="center">
  <img src="docs/images/grade-a.png" alt="Grade A Example - Orijen" width="280" />
  <img src="docs/images/grade-f.png" alt="Grade F Example - Meow Mix" width="280" />
</p>

---

## Why PetFoodSmart?

Most pet owners can't decode ingredient labels. "Chicken by-product meal", "BHA", "menadione sodium bisulfite" — what do these mean? Is this food safe?

PetFoodSmart answers that question instantly. Point your camera at a label, and the app:

1. **Extracts** ingredients via OCR (English + Chinese labels)
2. **Matches** each ingredient against a curated 512-ingredient knowledge base
3. **Scores** the food on a 100-point scale with an A-F letter grade
4. **Explains** the result in plain language via Claude AI

No signup. No paywall. Works offline (except AI explanations).

## Features

| Feature | Description |
|---------|-------------|
| **Camera Scan** | Point, shoot, analyze — 3 taps to a grade |
| **512 Ingredients** | Curated database with safety ratings, categories, and bilingual names |
| **75 Pre-Analyzed Brands** | Orijen, Royal Canin, Acana, Ziwi Peak — 48 brands ready to browse |
| **A-F Grading** | 100-point scoring with harmful penalties, protein bonuses, filler detection |
| **Brand Rankings** | Sortable leaderboard — "which cat food is safest?" answered instantly |
| **Pet Profiles** | Breed-specific warnings (e.g., grain sensitivity for certain breeds) |
| **AI Explanations** | Claude-powered plain-language breakdown of why a food scored the way it did |
| **Scan History** | Save, compare two foods side by side |
| **Social Sharing** | Screenshot-ready result cards for social media |
| **Bilingual** | Full Chinese (中文) + English UI with language toggle |
| **PWA** | Installable, mobile-first, works as a standalone app |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (mobile-first, dark theme) |
| Font | MiSans (Xiaomi open-source) |
| OCR | Tesseract.js (client-side, eng + chi_sim) |
| AI | Claude API (ingredient explanations) |
| Data | 512 ingredients + 75 brand products (JSON) |
| Testing | Jest + React Testing Library (538 tests) |
| Deployment | Vercel / Docker (standalone output) |

## Quick Start

```bash
git clone https://github.com/toffee-desuwa/toxicpaw.git
cd petfoodsmart
npm install
npm run dev
```

Open [http://localhost:2999](http://localhost:2999). That's it — no API key required for core functionality.

### Optional: AI Explanations

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Without this, everything works — AI explanations are simply skipped.

## Architecture

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Homepage (demo-first with brand data)
│   ├── useAppState.ts          # App state machine (scan → analyze → result)
│   ├── brand/[slug]/           # 75 pre-rendered brand pages (SSG)
│   ├── ranking/                # Brand safety leaderboard
│   └── api/explain/            # Claude AI explanation endpoint
│
├── components/
│   ├── scanner/                # Camera capture + image upload + preview
│   ├── analysis/               # Grade badge, ingredient list, summary bar
│   ├── brand/                  # Brand search + brand result pages
│   ├── landing/                # Demo-first homepage
│   ├── history/                # Scan history + side-by-side comparison
│   ├── sharing/                # Social sharing card + image generation
│   ├── profile/                # Pet profile form (breed, age, conditions)
│   ├── i18n/                   # Language switcher (EN/中文)
│   └── grade/                  # Grade badge component
│
├── lib/
│   ├── knowledge/              # Ingredient database loader + fuzzy matcher
│   ├── analyzer/               # 100-point scoring engine (A-F grading)
│   ├── ocr/                    # Tesseract.js pipeline + ingredient parser
│   ├── brands/                 # Brand database loader + search
│   ├── explainer/              # Claude AI explanation generator + cache
│   ├── i18n/                   # I18nProvider, useTranslation, locale detection
│   ├── profile/                # Pet profile + breed sensitivities
│   └── history/                # localStorage-based scan persistence
│
data/
├── ingredients.json            # 512 ingredients, 17 categories, bilingual
└── brands.json                 # 75 products from 48 brands (dog + cat)
```

## Grading System

PetFoodSmart scores food on a 100-point scale:

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90–100 | Excellent — high-quality, whole-food ingredients |
| **B** | 75–89 | Good — minor concerns only |
| **C** | 60–74 | Fair — some questionable ingredients |
| **D** | 40–59 | Poor — multiple concerning ingredients |
| **F** | 0–39 | Fail — significant safety concerns |

**Scoring details:**
- Harmful ingredients: **-15 points** each (-5 extra if in the top 5 positions)
- Caution ingredients: **-5 points** each
- Protein as first ingredient: **+5 bonus**
- No protein in top 3: **-10 penalty**
- Concern categories (fillers, by-products, artificial additives): **-3 each**

## Knowledge Base

The ingredient database (`data/ingredients.json`) is the core of PetFoodSmart:

- **512 ingredients** across 17 categories
- **420 safe** / **61 caution** / **31 harmful** ratings
- Every ingredient has: name, Chinese aliases, category, safety rating, explanation
- Sources: AAFCO standards, veterinary nutrition literature
- Fuzzy matching handles OCR artifacts, hyphens, plurals, "X Supplement" patterns

The brand database (`data/brands.json`) includes **75 products** from **48 brands**:
- Premium: Orijen, Acana, Ziwi Peak, K9 Natural
- Mid-tier: Royal Canin, Hill's, Purina Pro Plan
- Budget: Meow Mix, Friskies, Pedigree
- Chinese domestic: 伯纳天纯, 网易严选, 疯狂小狗, 麦富迪, 高爷家

All ingredient lists sourced from real product packaging.

## Commands

```bash
npm run dev       # Dev server at localhost:2999
npm run build     # Production build (164 static pages)
npm test          # Run 538 tests
npm run lint      # ESLint check
```

## Contributing

**High-impact areas:**
- **Ingredient database** — add missing ingredients, improve descriptions
- **Brand coverage** — add more brands with real ingredient lists
- **Breed sensitivities** — expand breed-specific health data
- **Translations** — improve Chinese translations, add more languages
- **OCR accuracy** — better parsing for unusual label formats

## Docker

```bash
docker build -t petfoodsmart .
docker run -p 2999:2999 petfoodsmart
```

## Disclaimer

PetFoodSmart is an **algorithmic ingredient analysis tool for educational and informational purposes only**. It is not a veterinary service, regulatory assessment, or product safety certification.

- Grades and ratings are generated by automated algorithms, not by veterinary professionals
- Many flagged ingredients are FDA/AAFCO approved and safe at regulated levels
- A low grade does **not** mean a product is unsafe or unsuitable for your pet
- Always consult a licensed veterinarian before making changes to your pet's diet
- Ingredient data is sourced from AAFCO guidelines, FDA CVM guidance, and published veterinary nutrition literature

We welcome corrections. If you believe our analysis contains errors, please [open an issue](https://github.com/toffee-desuwa/toxicpaw/issues).

For full details, see [/legal](https://toxicpaw.vercel.app/legal) and [/methodology](https://toxicpaw.vercel.app/methodology).

## License

[MIT](LICENSE)

---

Built for pets. Open for everyone.

---

<a name="中文"></a>

# PetFoodSmart 🐾

**开源宠物食品安全分析器，内置 500+ 成分数据库。**

扫描宠物食品配料表 → 即时获得 A-F 安全评级，每种成分逐一标注。

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-541_passing-brightgreen)](src/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **PetFoodSmart** 是开源项目 **ToxicPaw**（作者 [toffee-desuwa](https://github.com/toffee-desuwa/toxicpaw)）
> 的本地重命名分支，本次改动面向法国/西班牙/荷兰（欧盟）市场。此分支尚未重新部署——以下链接指向
> 原始上游项目的在线演示，并非本分支。

### [原项目 · 在线体验](https://toffee-desuwa-toxicpaw.hf.space) | [Vercel 镜像](https://toxicpaw-2472095547-9349s-projects.vercel.app)

<p align="center">
  <img src="docs/images/homepage.png" alt="PetFoodSmart 首页" width="600" />
</p>

<p align="center">
  <img src="docs/images/grade-a.png" alt="A级示例 - 渴望" width="280" />
  <img src="docs/images/grade-f.png" alt="F级示例 - 喵喵拌" width="280" />
</p>

---

## 为什么选 PetFoodSmart？

大多数铲屎官看不懂配料表。"鸡肉副产品粉"、"BHA"、"亚硫酸氢钠甲萘醌" —— 这些到底是什么？这粮安全吗？

PetFoodSmart 让你秒出答案。把摄像头对准配料表，应用会：

1. **提取** 配料文字（OCR 支持中英文标签）
2. **比对** 每种成分，逐一匹配 512 种成分知识库
3. **评分** 满分 100 的评分体系，给出 A-F 等级
4. **解读** 通过 Claude AI 用大白话解释为什么这粮好或不好

无需注册，无需付费，离线也能用（AI 解读除外）。

## 功能一览

| 功能 | 说明 |
|------|------|
| **拍照扫描** | 对准、拍照、分析 —— 三步出评级 |
| **512 种成分** | 精心整理的数据库，含安全评级、分类和中英文名称 |
| **75 款预分析产品** | 渴望、皇家、爱肯拿、巅峰 —— 48 个品牌随时浏览 |
| **A-F 评级** | 百分制评分，有害成分扣分、优质蛋白加分、填充物检测 |
| **品牌排行榜** | 可排序的安全榜单 —— "哪款猫粮最安全？"一目了然 |
| **宠物档案** | 品种特异性提醒（如特定品种的谷物敏感警告） |
| **AI 解读** | Claude 驱动的白话分析，告诉你这粮为什么得了这个分 |
| **扫描历史** | 保存记录，两款粮并排对比 |
| **社交分享** | 适合截图发朋友圈的结果卡片 |
| **双语界面** | 完整的中文 + English 界面，一键切换 |
| **PWA** | 可安装到桌面，移动端优先，独立应用体验 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 + React 19 |
| 语言 | TypeScript（严格模式） |
| 样式 | Tailwind CSS v4（移动端优先，暗色主题） |
| 字体 | MiSans（小米开源字体） |
| OCR | Tesseract.js（客户端运行，eng + chi_sim） |
| AI | Claude API（成分解读生成） |
| 数据 | 512 种成分 + 75 款品牌产品（JSON） |
| 测试 | Jest + React Testing Library（538 项测试） |
| 部署 | Vercel / Docker（standalone 输出） |

## 快速开始

```bash
git clone https://github.com/toffee-desuwa/toxicpaw.git
cd petfoodsmart
npm install
npm run dev
```

打开 [http://localhost:2999](http://localhost:2999)，就这么简单 —— 核心功能无需 API Key。

### 可选：启用 AI 解读

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

不配置也没关系，所有功能正常运行，只是跳过 AI 解读。

## 项目结构

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 首页（demo-first，展示品牌数据）
│   ├── useAppState.ts          # 应用状态机（扫描 → 分析 → 结果）
│   ├── brand/[slug]/           # 75 个品牌页面（SSG 预渲染）
│   ├── ranking/                # 品牌安全排行榜
│   └── api/explain/            # Claude AI 解读接口
│
├── components/
│   ├── scanner/                # 拍照 + 上传图片 + 预览
│   ├── analysis/               # 评级徽章、成分列表、摘要栏
│   ├── brand/                  # 品牌搜索 + 品牌结果页
│   ├── landing/                # Demo-first 首页
│   ├── history/                # 扫描历史 + 并排对比
│   ├── sharing/                # 社交分享卡片 + 图片生成
│   ├── profile/                # 宠物档案表单（品种、年龄、健康状况）
│   ├── i18n/                   # 语言切换器（EN/中文）
│   └── grade/                  # 评级徽章组件
│
├── lib/
│   ├── knowledge/              # 成分数据库加载 + 模糊匹配
│   ├── analyzer/               # 百分制评分引擎（A-F 评级）
│   ├── ocr/                    # Tesseract.js 管线 + 配料解析
│   ├── brands/                 # 品牌数据库加载 + 搜索
│   ├── explainer/              # Claude AI 解读生成 + 缓存
│   ├── i18n/                   # I18nProvider、useTranslation、语言检测
│   ├── profile/                # 宠物档案 + 品种敏感性
│   └── history/                # 基于 localStorage 的扫描持久化
│
data/
├── ingredients.json            # 512 种成分，17 个分类，中英双语
└── brands.json                 # 75 款产品，来自 48 个品牌（猫粮 + 狗粮）
```

## 评分体系

PetFoodSmart 采用百分制评分：

| 等级 | 分数 | 含义 |
|------|------|------|
| **A** | 90–100 | 优秀 —— 高品质天然食材 |
| **B** | 75–89 | 良好 —— 仅有轻微问题 |
| **C** | 60–74 | 一般 —— 存在部分可疑成分 |
| **D** | 40–59 | 较差 —— 多项成分令人担忧 |
| **F** | 0–39 | 不合格 —— 存在严重安全隐患 |

**评分细则：**
- 有害成分：每项 **-15 分**（位于前 5 位的额外 -5 分）
- 警告成分：每项 **-5 分**
- 蛋白质为第一成分：**+5 加分**
- 前 3 位无蛋白质：**-10 分**
- 问题类别（填充物、副产品、人工添加剂）：每项 **-3 分**

## 成分知识库

成分数据库（`data/ingredients.json`）是 PetFoodSmart 的核心：

- **512 种成分**，涵盖 17 个分类
- **420 种安全** / **61 种警告** / **31 种有害** 评级
- 每种成分包含：名称、中文别名、分类、安全评级、详细说明
- 数据来源：AAFCO 标准、兽医营养学文献
- 模糊匹配可处理 OCR 识别偏差、连字符、复数形式、"X Supplement" 格式

品牌数据库（`data/brands.json`）收录 **48 个品牌** 的 **75 款产品**：
- 高端：渴望、爱肯拿、巅峰、K9 Natural
- 中端：皇家、希尔斯、冠能
- 经济：Meow Mix、Friskies、Pedigree
- 国产：伯纳天纯、网易严选、疯狂小狗、麦富迪、高爷家

所有配料表均来自真实产品包装。

## 常用命令

```bash
npm run dev       # 开发服务器 localhost:2999
npm run build     # 生产构建（164 个静态页面）
npm test          # 运行 538 项测试
npm run lint      # ESLint 检查
```

## 参与贡献

**高价值贡献方向：**
- **成分数据库** —— 补充缺失成分，完善描述
- **品牌覆盖** —— 添加更多品牌的真实配料表
- **品种敏感性** —— 扩展品种特异性健康数据
- **翻译** —— 优化中文翻译，支持更多语言
- **OCR 精度** —— 改善非标准标签格式的识别效果

## Docker

```bash
docker build -t petfoodsmart .
docker run -p 2999:2999 petfoodsmart
```

## 免责声明

PetFoodSmart 是一个**基于算法的成分分析工具，仅供教育和信息参考之用**。本工具不构成兽医服务、监管评估或产品安全认证。

- 评分和等级由自动化算法生成，而非兽医专业人士
- 许多被标记的成分已获 FDA/AAFCO 批准，在规定用量下是安全的
- 较低的等级**并不**意味着产品不安全或不适合您的宠物
- 在调整宠物饮食前，请务必咨询持证兽医
- 成分数据来源于 AAFCO 指南、FDA 兽医中心指导及已发表的兽医营养学文献

我们欢迎纠正。如果您认为我们的分析存在错误，请[提交 Issue](https://github.com/toffee-desuwa/toxicpaw/issues)。

详情请参阅 [法律声明](https://toxicpaw.vercel.app/legal) 和 [评分方法](https://toxicpaw.vercel.app/methodology)。

## 开源许可

[MIT](LICENSE)

---

为宠物而生，对所有人开放。
