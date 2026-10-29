# 粉碎词汇 · comminution lexicon

工业物料与粉碎设备专业词汇的一周记忆工具。正面只给中文，翻面得英文名、词根来源、化学式与物性。

在线使用：<https://3698688050-pixel.github.io/comminution-vocab/>

## 内容

70 词 = 7 天 × 10 词，四类轮转交错，每天都是「矿物 + 机器零件 + 化学式 + 指标」的混合词表：

| 分类 | 词数 | 例 |
|---|---|---|
| 物料 | 24 | 石英 quartz、方解石 calcite、碳化硅 silicon carbide |
| 部件 | 24 | 分级轮 classifier wheel、磨辊 grinding roller、溜槽 chute |
| 化学品 | 12 | SiO₂、NaOH、TiO₂、硬脂酸 stearic acid |
| 物性 | 10 | 莫氏硬度 Mohs hardness、解理 cleavage、筛余 sieve residue |

词根照实写，有争议就写争议：quartz 一般借自西斯拉夫语 *tvьrdъ、sulfur 词源未定、auger 来自「a nauger → an auger」的误拆分、kaolin 是汉语「高岭」进国际术语、camera 的「相机」义是 camera obscura 的缩略。德语 / 阿拉伯语 / 古诺斯语 / 人名地名的来源不硬套拉丁词根。

## 用法

双击 `index.html` 即可，纯静态、无构建、无网络请求（字体有本地回退）。

- 轻触卡片或 `空格` / `回车` 翻面
- `←` / `→` 换卡，`M` 标记已掌握（标记后自动跳下一张未掌握的）
- 顶部七天格切换学习日，进度格可点直达单个词
- 「词表」页全库检索中文 / 英文 / 词根 / 化学式 / 标签，点行原地展开
- 进度存 localStorage，可「重置今日」

## 文件

```
index.html              单页应用
assets/styles.css       设计系统与组件
assets/app.js           排课、翻转、进度
data/terms.js           70 词条，唯一真源
db/schema.sql           表 + 视图（SQLite 方言）
db/seed.sql             生成的种子数据
scripts/build-seed.mjs  校验词条并重生成 SQL
screens/                截图
DESIGN.md               完整设计方案
```

## 改词条

改 `data/terms.js`，然后：

```bash
node scripts/build-seed.mjs
```

脚本会拒绝空字段、重复 id、未知分类、化学品缺化学式、缺性质或缺标签的数据，并打印每天的词数分布，通过后重写 `db/seed.sql`。

## 数据库

```
term           静态词条：id, cn, en, cat, formula, props(JSON), root_*, tags(JSON), day, slot, seq
review_log     每次作答一条：term_id, day, result(known|again), flipped, at
term_progress  视图：每词最近一次结果
day_progress   视图：每天 mastered / total
```

词条与学习状态分表；`review_log` 只追加，`at + result + flipped` 已够接 SM-2 间隔重复。

## 还没做

间隔重复（接口已备好未接）、发音 / IPA、词根族视图、进度导入导出。
