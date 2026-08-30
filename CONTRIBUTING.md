# Contributing to PetFoodSmart

[English](#contributing) | [中文](#贡献指南)

---

<a name="contributing"></a>

## How to Contribute

We welcome contributions! Here are the most impactful areas:

### Ingredient Database
- Add missing ingredients to `data/ingredients.json`
- Improve ingredient descriptions and safety ratings
- Add source citations

### Brand Coverage
- Add more brands with real ingredient lists to `data/brands.json`
- Verify existing brand data against current packaging

### Translations
- Improve Chinese translations in `messages/zh.json`
- Add new language support

### Bug Reports & Feature Requests
- Use [GitHub Issues](https://github.com/toffee-desuwa/toxicpaw/issues)
- Include screenshots and steps to reproduce for bugs

## Development Setup

```bash
git clone https://github.com/toffee-desuwa/toxicpaw.git
cd petfoodsmart
npm install
npm run dev    # http://localhost:2999
npm test       # Run tests
npm run build  # Production build
```

## Pull Request Guidelines

1. Fork the repo and create a feature branch
2. Make your changes with clear commit messages
3. Ensure `npm run build` passes
4. Submit a PR with a description of what changed and why

## Code of Conduct

Be respectful. We're here to help pets eat better.

---

<a name="贡献指南"></a>

## 如何贡献

欢迎贡献！以下是最有价值的贡献方向：

### 成分数据库
- 向 `data/ingredients.json` 添加缺失的成分
- 改进成分描述和安全评级
- 添加来源引用

### 品牌覆盖
- 向 `data/brands.json` 添加更多品牌的真实成分表
- 核实现有品牌数据是否与当前包装一致

### 翻译
- 改进 `messages/zh.json` 中的中文翻译
- 添加新语言支持

### Bug 报告 & 功能建议
- 使用 [GitHub Issues](https://github.com/toffee-desuwa/toxicpaw/issues)
- Bug 报告请附上截图和复现步骤

## 开发环境搭建

```bash
git clone https://github.com/toffee-desuwa/toxicpaw.git
cd petfoodsmart
npm install
npm run dev    # http://localhost:2999
npm test       # 运行测试
npm run build  # 生产构建
```

## Pull Request 规范

1. Fork 仓库并创建功能分支
2. 提交时使用清晰的 commit message
3. 确保 `npm run build` 通过
4. 提交 PR 时描述改动内容和原因

## 行为准则

互相尊重。我们的共同目标是让宠物吃得更安全。

---

Thank you for helping make pet food safer! 🐾
