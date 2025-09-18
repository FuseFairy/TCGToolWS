# 目录

- [自动化脚本指南](#自动化脚本指南-windows)
- [数据源说明](#数据说明-assets-source)

# 自动化脚本指南 (Windows)

本文档说明如何设置和使用此项目中的自动化脚本，包括数据爬取和打包。

爬虫网站: https://ws-tcg.com/cardlist/

## 直接运行

运行 `ws_crawler.exe`。**本地无需安装 Python 环境。**

```bash
# 指令: npm run crawl -- --series "系列名称" --product "产品名称"
npm run crawl -- --series "角川スニーカー文庫" --product "角川スニーカー文庫"
```

## 开发与调试

### 1. 安装项目依赖

```bash
# 创建 Python 虚拟环境
conda create -n crawler python=3.12
# 激活环境
conda activate crawler
# 安装 Python 依赖
pip install -r requirements.txt
# 安装 Playwright 浏览器
playwright install chromium
```

### 2. 运行爬虫

您可以通过 npm 或 Python 直接运行爬虫：

```bash
# 使用 npm
npm run crawl:dev -- --series "ありふれた職業で世界最強" --product "ありふれた職業で世界最強"
# 或直接使用 Python
python scripts/python/ws_crawler.py --series "ありふれた職業で世界最強" --product "ありふれた職業で世界最強"
```

## 3. 打包成exe

此命令将 Python 脚本打包为独立的 `.exe` 文件。

```bash
npm run build:crawl
```

- **输出目录**：生成的 `ws_crawler.exe` 将出现在项目根目录的 `/bin` 文件夹中。
- **提示**：如果 `bin/ws_crawler.exe` 已存在，请确保它没有运行；否则由于文件锁定，打包可能会失败。

### 错误处理

- 如果在打包时遇到 `PermissionError`，请以管理员身份运行 PowerShell 或确保可执行文件未在使用中。
- 您也可以在构建可执行文件之前检查 Python 安装，以避免错误。

# 数据说明 (`assets-source`)

此目录包含了通过自动化脚本从官网爬取的、未经处理的原始数据和资源。它们是整个应用的数据基础。

- `/card-data`: 存放卡牌的结构化数据（`.json` 文件）。
- `/card-images`: 存放卡牌的原始图片（`.png` 文件）。

> [!WARNING]
> 此目录下的文件通常由 `/scripts` 中的脚本自动生成或更新。除非你清楚地知道自己在做什么，否则不建议手动修改。

## 卡牌数据结构 (`card-data/*.json`)

每个 JSON 文件依据产品（如补充包、预组、PR卡包）和卡号分类。

### 结构示例

```json
{
  "AB/W31-121": {
    "name": "おてんば娘 ユイ",
    "product_name": "PRカード【Wサイド】",
    "type": "角色卡",
    "level": 2,
    "power": 8000,
    "cost": 1,
    "rarity": ["PR"],
    "trait": ["死", "音楽"],
    "color": "黄色",
    "soul": 1,
    "link": ["AB/W11-122", "AB/W31-123"],
    "effect": "【起】［(1)］ そのターン中、このカードのソウルを＋1。"
  }
}
```

### 字段说明

| 字段名         | 类型                   | 说明                                                                                 | 示例                           |
| :------------- | :--------------------- | :----------------------------------------------------------------------------------- | :----------------------------- |
| **`key(键)`**  | `string`               | 卡牌的标准 ID。这是卡牌的唯一标识符，移除了所有稀有度后缀（如 PR, SP, RRR）。        | `"AB/W31-121"`                 |
| `name`         | `string`               | 卡牌的全名。                                                                         | `"おてんば娘 ユイ"`            |
| `product_name` | `string`               | 该卡片所属的官方产品/分类名称。                                                      | `"PRカード【Wサイド】"`        |
| `type`         | `string`               | 卡牌类型。可能的取值为 `"-"`（未知）, `"角色卡"`, `"事件卡"`, `"高潮卡"`。           | `"角色卡"`                     |
| `level`        | `number` \| `string`   | 卡牌的等级。如果官网上未提供，则为 `"-"`。                                           | `2`                            |
| `power`        | `number` \| `string`   | 卡牌的战斗力。如果官网上未提供，则为 `"-"`。                                         | `8000`                         |
| `cost`         | `number` \| `string`   | 卡牌的费用。如果官网上未提供，则为 `"-"`。                                           | `1`                            |
| `rarity`       | `string[]`             | 一个包含该卡牌所有稀有度的列表。即使只有一种稀有度，也以列表形式存在。               | `["RR", "SP"]` 或 `["PR"]`     |
| `trait`        | `string[]` \| `string` | 卡牌的特征列表。如果官网上未提供或为 `－`，则为 `"-"`。                              | `["死", "音楽"]`               |
| `color`        | `string`               | 卡牌的颜色。可能的取值为 `"-"`（未知）, `"黄色"`, `"绿色"`, `"红色"`, `"蓝色"`。     | `"黄色"`                       |
| `soul`         | `number` \| `string`   | 卡牌的灵魂值。如果官网上未提供，则为 `"-"`。                                         | `1`                            |
| `link`         | `string[]`             | 与此卡效果文相关的其他卡牌的标准 ID 列表。由脚本自动生成，可能为空列表。             | `["AB/W11-122", "AB/W31-123"]` |
| `effect`       | `string`               | 卡牌的效果文本，保留了 HTML 中的 `<br>` 标签用于换行。如果官网上未提供，则为 `"-"`。 | `"【起】［(1)］..."`           |
